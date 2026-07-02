import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { ContractStatus } from "../types/database.types";
import type { InsertDto, Tables, UpdateDto } from "../types/database.types";
import { queryKeys } from "./query-keys";

export type ContractRow = Tables<"contracts">;

export type ContractWithCustomer = ContractRow & {
	customer: { id: string; name: string; company: string | null } | null;
};

export type ContractWithCustomerInfo = ContractRow & {
	customer: {
		id: string;
		name: string;
		company: string | null;
		assigned_to: string | null;
	} | null;
};

const contractColumnsWithoutCompanyCommission = [
	"id",
	"customer_id",
	"deal_id",
	"proposal_id",
	"status",
	"signed_at",
	"starts_at",
	"ends_at",
	"amount_eur",
	"file_path",
	"cups",
	"provider",
	"sales_channel",
	"product",
	"tariff_type",
	"power_kw",
	"annual_consumption_kwh",
	"energy_price_eur",
	"power_price_p1_eur",
	"power_price_p2_eur",
	"power_price_p3_eur",
	"power_price_p4_eur",
	"power_price_p5_eur",
	"power_price_p6_eur",
	"commission_eur",
	"commission_commercial_eur",
	"supply_address",
	"supply_city",
	"supply_province",
	"supply_postal_code",
	"notes",
	"created_at",
	"updated_at",
	"created_by",
].join(",");

function contractColumns(includeCompanyCommission = true) {
	return includeCompanyCommission
		? contractColumnsWithoutCompanyCommission.replace(
				"commission_commercial_eur",
				"commission_company_eur,commission_commercial_eur",
			)
		: contractColumnsWithoutCompanyCommission;
}

export interface ContractsListParams {
	search?: string;
	status?: ContractStatus;
	startsFrom?: string;
	startsTo?: string;
	endsFrom?: string;
	endsTo?: string;
	page?: number;
	pageSize?: number;
	includeCompanyCommission?: boolean;
}

function invalidateContractCustomerQueries(
	qc: ReturnType<typeof useQueryClient>,
) {
	qc.invalidateQueries({ queryKey: ["contracts"], exact: false });
	qc.invalidateQueries({ queryKey: ["customers"], exact: false });
	qc.invalidateQueries({ queryKey: ["customer"], exact: false });
	// stats query uses staleTime:0 but explicit invalidation ensures
	// dashboard refreshes immediately after any mutation in the same session
	qc.invalidateQueries({ queryKey: ["contracts", "stats"], exact: false });
}

function requireCount(
	result: { count: number | null; error: { message: string } | null },
	label: string,
) {
	if (result.error) throw result.error;
	if (result.count === null) {
		throw new Error(`No se pudo calcular el contador de contratos: ${label}`);
	}
	return result.count;
}

export function useContracts(
	filterOrId?:
		| string
		| { customerId?: string; includeCompanyCommission?: boolean },
) {
	const customerId =
		typeof filterOrId === "string" ? filterOrId : filterOrId?.customerId;
	const includeCompanyCommission =
		typeof filterOrId === "string"
			? true
			: (filterOrId?.includeCompanyCommission ?? true);
	return useQuery<ContractRow[]>({
		queryKey: queryKeys.contracts({ customerId, includeCompanyCommission }),
		queryFn: async () => {
			let q = supabase
				.from("contracts")
				.select(contractColumns(includeCompanyCommission))
				.order("created_at", { ascending: false });
			if (customerId) q = q.eq("customer_id", customerId);
			const { data, error } = await q;
			if (error) throw error;
			return data as unknown as ContractRow[];
		},
	});
}

export interface ContractStats {
	total: number;
	active: number;
	processing: number;
	pendingSignature: number;
	pendingProcessing: number;
	incident: number;
	pendingRecovery: number;
	cancelled: number;
	terminated: number;
	urgentRenewals: number;
	thisMonthEnding: number;
}

/**
 * Fetches contract counts per status directly from the server.
 * Uses staleTime: 0 to always reflect real DB state on mount.
 */
export function useContractStats() {
	const today = new Date();
	const todayStr = today.toISOString().slice(0, 10);
	const thisMonth = today.toISOString().slice(0, 7);
	const [year, month] = thisMonth.split("-").map(Number);
	const monthEnd = `${thisMonth}-${String(new Date(year, month, 0).getDate()).padStart(2, "0")}`;
	const urgentLimit = new Date(today);
	urgentLimit.setDate(urgentLimit.getDate() + 30);
	const urgentLimitStr = urgentLimit.toISOString().slice(0, 10);

	return useQuery<ContractStats>({
		queryKey: ["contracts", "stats", todayStr, thisMonth, urgentLimitStr],
		staleTime: 0,
		queryFn: async () => {
			const [
				total,
				active,
				processing,
				pendingSignature,
				pendingProcessing,
				incident,
				pendingRecovery,
				cancelled,
				terminated,
				urgentRenewals,
				thisMonthEnding,
			] = await Promise.all([
				supabase.from("contracts").select("*", { count: "exact", head: true }),
				supabase
					.from("contracts")
					.select("*", { count: "exact", head: true })
					.eq("status", "active"),
				supabase
					.from("contracts")
					.select("*", { count: "exact", head: true })
					.eq("status", "processing"),
				supabase
					.from("contracts")
					.select("*", { count: "exact", head: true })
					.eq("status", "pending_signature"),
				supabase
					.from("contracts")
					.select("*", { count: "exact", head: true })
					.eq("status", "pending_processing"),
				supabase
					.from("contracts")
					.select("*", { count: "exact", head: true })
					.eq("status", "incident"),
				supabase
					.from("contracts")
					.select("*", { count: "exact", head: true })
					.eq("status", "pending_recovery"),
				supabase
					.from("contracts")
					.select("*", { count: "exact", head: true })
					.eq("status", "cancelled"),
				supabase
					.from("contracts")
					.select("*", { count: "exact", head: true })
					.eq("status", "terminated"),
				supabase
					.from("contracts")
					.select("*", { count: "exact", head: true })
					.eq("status", "active")
					.not("ends_at", "is", null)
					.gte("ends_at", todayStr)
					.lte("ends_at", urgentLimitStr),
				supabase
					.from("contracts")
					.select("*", { count: "exact", head: true })
					.eq("status", "active")
					.gte("ends_at", todayStr)
					.lte("ends_at", monthEnd),
			]);

			return {
				total: requireCount(total, "total"),
				active: requireCount(active, "activos"),
				processing: requireCount(processing, "en tramitación"),
				pendingSignature: requireCount(pendingSignature, "pendientes de firma"),
				pendingProcessing: requireCount(
					pendingProcessing,
					"pendientes de tramitar",
				),
				incident: requireCount(incident, "incidencias"),
				pendingRecovery: requireCount(
					pendingRecovery,
					"pendientes de recuperar",
				),
				cancelled: requireCount(cancelled, "cancelados"),
				terminated: requireCount(terminated, "baja"),
				urgentRenewals: requireCount(urgentRenewals, "urgentes"),
				thisMonthEnding: requireCount(thisMonthEnding, "vencen este mes"),
			};
		},
	});
}

export function useAllContracts(params: ContractsListParams = {}) {
	const {
		search,
		status,
		startsFrom,
		startsTo,
		endsFrom,
		endsTo,
		page = 0,
		pageSize = 25,
		includeCompanyCommission = true,
	} = params;
	return useQuery<{ data: ContractWithCustomer[]; count: number }>({
		queryKey: [
			"contracts",
			"all",
			{
				search,
				status,
				startsFrom,
				startsTo,
				endsFrom,
				endsTo,
				page,
				pageSize,
				includeCompanyCommission,
			},
		],
		queryFn: async () => {
			let q = supabase
				.from("contracts")
				.select(
					`${contractColumns(includeCompanyCommission)}, customer:customers(id, name, company)`,
					{ count: "exact" },
				)
				.order("created_at", { ascending: false })
				.range(page * pageSize, page * pageSize + pageSize - 1);

			if (status) q = q.eq("status", status);
			if (startsFrom) q = q.gte("starts_at", startsFrom);
			if (startsTo) q = q.lte("starts_at", startsTo);
			if (endsFrom) q = q.gte("ends_at", endsFrom);
			if (endsTo) q = q.lte("ends_at", endsTo);
			if (search) {
				const normalizedSearch = search.trim().replace(/\s+/g, " ");
				const orFilters = [
					`cups.ilike.%${normalizedSearch}%`,
					`provider.ilike.%${normalizedSearch}%`,
					`sales_channel.ilike.%${normalizedSearch}%`,
					`product.ilike.%${normalizedSearch}%`,
				];
				const { data: matchedCustomers } = await supabase
					.from("customers")
					.select("id")
					.or(
						`name.ilike.%${normalizedSearch}%,company.ilike.%${normalizedSearch}%`,
					);
				const customerIds = ((matchedCustomers ?? []) as { id: string }[]).map(
					(c) => c.id,
				);
				if (customerIds.length > 0) {
					orFilters.push(`customer_id.in.(${customerIds.join(",")})`);
				}
				q = q.or(orFilters.join(","));
			}

			const { data, error, count } = await q;
			if (error) throw error;
			return {
				data: (data ?? []) as unknown as ContractWithCustomer[],
				count: count ?? 0,
			};
		},
	});
}

export function useCreateContract() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async (payload: InsertDto<"contracts">) => {
			const { data, error } = await supabase
				.from("contracts")
				.insert(payload as never)
				.select()
				.single();
			if (error) throw error;
			return data as ContractRow;
		},
		onSuccess: () => invalidateContractCustomerQueries(qc),
	});
}

export function useUpdateContract() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async ({
			id,
			...payload
		}: UpdateDto<"contracts"> & { id: string }) => {
			const { data, error } = await supabase
				.from("contracts")
				.update(payload as never)
				.eq("id", id)
				.select()
				.single();
			if (error) throw error;
			return data as ContractRow;
		},
		onSuccess: () => invalidateContractCustomerQueries(qc),
	});
}

/**
 * Fetches active contracts whose ends_at falls from today through the next
 * `alertDays` days. Ordered by ends_at ASC so the closest renewals appear first.
 */
export function useContractsDueForRenewal(alertDays = 60) {
	const today = new Date();
	const todayStr = today.toISOString().slice(0, 10);
	const alertDate = new Date(today);
	alertDate.setDate(alertDate.getDate() + alertDays);
	const alertDateStr = alertDate.toISOString().slice(0, 10);

	return useQuery<ContractWithCustomerInfo[]>({
		queryKey: ["contracts", "renewal", alertDays, todayStr],
		queryFn: async () => {
			const { data, error } = await supabase
				.from("contracts")
				.select("*, customer:customers(id, name, company, assigned_to)")
				.eq("status", "active")
				.not("ends_at", "is", null)
				.gte("ends_at", todayStr)
				.lte("ends_at", alertDateStr)
				.order("ends_at", { ascending: true });

			if (error) throw error;
			return (data ?? []) as ContractWithCustomerInfo[];
		},
	});
}

export type ContractForCalendar = {
	id: string;
	ends_at: string;
	provider: string | null;
	sales_channel: string | null;
	product: string | null;
	status: ContractStatus;
	customer: { id: string; name: string; company: string | null } | null;
};

export function useContractsByMonth(month: string) {
	return useQuery<ContractForCalendar[]>({
		queryKey: ["contracts", "calendar", month],
		queryFn: async () => {
			const [year, m] = month.split("-").map(Number);
			const start = `${month}-01`;
			const lastDay = new Date(year, m, 0).getDate();
			const end = `${month}-${String(lastDay).padStart(2, "0")}`;
			const { data, error } = await supabase
				.from("contracts")
				.select(
					"id, ends_at, provider, sales_channel, product, status, customer:customers(id, name, company)",
				)
				.not("ends_at", "is", null)
				.gte("ends_at", start)
				.lte("ends_at", end)
				.order("ends_at", { ascending: true });
			if (error) throw error;
			return (data ?? []) as ContractForCalendar[];
		},
		enabled: !!month,
	});
}

export interface ContractsExportFilter {
	search?: string;
	status?: ContractStatus;
	startsFrom?: string;
	endsTo?: string;
	dateFrom?: string;
	dateTo?: string;
	includeCompanyCommission?: boolean;
}

export type ContractExportRow = ContractRow & {
	customer: {
		id: string;
		name: string;
		company: string | null;
		assigned_to: string | null;
	} | null;
};

export async function fetchAllContractsForExport(
	filter: ContractsExportFilter = {},
): Promise<ContractExportRow[]> {
	const {
		search,
		status,
		startsFrom,
		endsTo,
		dateFrom,
		dateTo,
		includeCompanyCommission = true,
	} = filter;
	let q = supabase
		.from("contracts")
		.select(
			`${contractColumns(includeCompanyCommission)}, customer:customers(id, name, company, assigned_to)`,
		)
		.order("created_at", { ascending: false });
	if (search) {
		const normalizedSearch = search.trim().replace(/\s+/g, " ");
		q = q.or(
			`cups.ilike.%${normalizedSearch}%,provider.ilike.%${normalizedSearch}%,sales_channel.ilike.%${normalizedSearch}%,product.ilike.%${normalizedSearch}%`,
		);
	}
	if (status) q = q.eq("status", status);
	if (startsFrom) q = q.gte("starts_at", startsFrom);
	if (endsTo) q = q.lte("ends_at", endsTo);
	if (dateFrom) q = q.gte("created_at", dateFrom);
	if (dateTo) q = q.lte("created_at", dateTo);
	const { data, error } = await q;
	if (error) throw error;
	return (data ?? []) as unknown as ContractExportRow[];
}

export function useDeleteContract() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async (id: string) => {
			const { error } = await supabase.from("contracts").delete().eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => invalidateContractCustomerQueries(qc),
	});
}
