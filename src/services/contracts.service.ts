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

export interface ContractsListParams {
	search?: string;
	status?: ContractStatus;
	startsFrom?: string;
	startsTo?: string;
	endsFrom?: string;
	endsTo?: string;
	page?: number;
	pageSize?: number;
}

export function useContracts(filterOrId?: string | { customerId?: string }) {
	const customerId =
		typeof filterOrId === "string" ? filterOrId : filterOrId?.customerId;
	return useQuery<ContractRow[]>({
		queryKey: queryKeys.contracts({ customerId }),
		queryFn: async () => {
			let q = supabase
				.from("contracts")
				.select("*")
				.order("created_at", { ascending: false });
			if (customerId) q = q.eq("customer_id", customerId);
			const { data, error } = await q;
			if (error) throw error;
			return data as ContractRow[];
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
			},
		],
		queryFn: async () => {
			let q = supabase
				.from("contracts")
				.select("*, customer:customers(id, name, company)", { count: "exact" })
				.order("created_at", { ascending: false })
				.range(page * pageSize, page * pageSize + pageSize - 1);

			if (status) q = q.eq("status", status);
			if (startsFrom) q = q.gte("starts_at", startsFrom);
			if (startsTo) q = q.lte("starts_at", startsTo);
			if (endsFrom) q = q.gte("ends_at", endsFrom);
			if (endsTo) q = q.lte("ends_at", endsTo);
			if (search) {
				const orFilters = [
					`cups.ilike.%${search}%`,
					`provider.ilike.%${search}%`,
					`product.ilike.%${search}%`,
				];
				const { data: matchedCustomers } = await supabase
					.from("customers")
					.select("id")
					.or(`name.ilike.%${search}%,company.ilike.%${search}%`);
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
				data: (data ?? []) as ContractWithCustomer[],
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
		onSuccess: () =>
			qc.invalidateQueries({ queryKey: ["contracts"], exact: false }),
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
		onSuccess: () =>
			qc.invalidateQueries({ queryKey: ["contracts"], exact: false }),
	});
}

/**
 * Fetches active contracts whose ends_at falls within the next `alertDays` days
 * (or is already overdue). Ordered by ends_at ASC so the most urgent appear first.
 */
export function useContractsDueForRenewal(alertDays = 60) {
	return useQuery<ContractWithCustomerInfo[]>({
		queryKey: ["contracts", "renewal", alertDays],
		queryFn: async () => {
			const alertDate = new Date();
			alertDate.setDate(alertDate.getDate() + alertDays);
			const alertDateStr = alertDate.toISOString().slice(0, 10);

			const { data, error } = await supabase
				.from("contracts")
				.select("*, customer:customers(id, name, company, assigned_to)")
				.eq("status", "active")
				.not("ends_at", "is", null)
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
					"id, ends_at, provider, product, status, customer:customers(id, name, company)",
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
	const { search, status, startsFrom, endsTo, dateFrom, dateTo } = filter;
	let q = supabase
		.from("contracts")
		.select("*, customer:customers(id, name, company, assigned_to)")
		.order("created_at", { ascending: false });
	if (search)
		q = q.or(
			`cups.ilike.%${search}%,provider.ilike.%${search}%,product.ilike.%${search}%,contract_number.ilike.%${search}%`,
		);
	if (status) q = q.eq("status", status);
	if (startsFrom) q = q.gte("starts_at", startsFrom);
	if (endsTo) q = q.lte("ends_at", endsTo);
	if (dateFrom) q = q.gte("created_at", dateFrom);
	if (dateTo) q = q.lte("created_at", dateTo);
	const { data, error } = await q;
	if (error) throw error;
	return (data ?? []) as ContractExportRow[];
}

export function useDeleteContract() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async (id: string) => {
			const { error } = await supabase.from("contracts").delete().eq("id", id);
			if (error) throw error;
		},
		onSuccess: () =>
			qc.invalidateQueries({ queryKey: ["contracts"], exact: false }),
	});
}
