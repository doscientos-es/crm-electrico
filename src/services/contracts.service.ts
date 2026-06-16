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
	const { search, status, page = 0, pageSize = 25 } = params;
	return useQuery<{ data: ContractWithCustomer[]; count: number }>({
		queryKey: ["contracts", "all", { search, status, page, pageSize }],
		queryFn: async () => {
			let q = supabase
				.from("contracts")
				.select("*, customer:customers(id, name, company)", { count: "exact" })
				.order("created_at", { ascending: false })
				.range(page * pageSize, page * pageSize + pageSize - 1);

			if (status) q = q.eq("status", status);
			if (search) {
				q = q.or(
					`contract_number.ilike.%${search}%,cups.ilike.%${search}%,provider.ilike.%${search}%,product.ilike.%${search}%`,
				);
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
	contract_number: string | null;
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
					"id, contract_number, ends_at, provider, product, status, customer:customers(id, name, company)",
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
	const { dateFrom, dateTo } = filter;
	let q = supabase
		.from("contracts")
		.select("*, customer:customers(id, name, company, assigned_to)")
		.order("created_at", { ascending: false });
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
