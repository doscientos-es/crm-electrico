import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { InsertDto, Tables, UpdateDto } from "../types/database.types";
import { queryKeys } from "./query-keys";

export type CustomerRow = Tables<"customers">;

interface CustomersFilter {
	search?: string;
	status?: string;
	assignedTo?: string;
	page?: number;
	pageSize?: number;
}

export function useCustomers(filter: CustomersFilter = {}) {
	const { search, status, assignedTo, page = 0, pageSize = 25 } = filter;
	return useQuery<{ data: CustomerRow[]; count: number }>({
		queryKey: queryKeys.customers(filter),
		queryFn: async () => {
			let q = supabase
				.from("customers")
				.select("*", { count: "exact" })
				.is("deleted_at", null);
			if (search)
				q = q.or(
					`name.ilike.%${search}%,company.ilike.%${search}%,email.ilike.%${search}%,city.ilike.%${search}%`,
				);
			if (status) q = q.eq("status", status as never);
			if (assignedTo) q = q.eq("assigned_to", assignedTo);
			q = q.order("name").range(page * pageSize, (page + 1) * pageSize - 1);
			const { data, error, count } = await q;
			if (error) throw error;
			return { data: data as CustomerRow[], count: count ?? 0 };
		},
	});
}

export function useCustomer(id: string | undefined) {
	return useQuery<CustomerRow>({
		queryKey: queryKeys.customer(id ?? ""),
		queryFn: async () => {
			const { data, error } = await supabase
				.from("customers")
				.select("*")
				.eq("id", id!)
				.single();
			if (error) throw error;
			return data as CustomerRow;
		},
		enabled: !!id,
	});
}

export function useCreateCustomer() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async (payload: InsertDto<"customers">) => {
			const { data, error } = await supabase
				.from("customers")
				.insert(payload as never)
				.select()
				.single();
			if (error) throw error;
			return data as CustomerRow;
		},
		onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
	});
}

export function useUpdateCustomer() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async ({
			id,
			...payload
		}: UpdateDto<"customers"> & { id: string }) => {
			const { data, error } = await supabase
				.from("customers")
				.update(payload as never)
				.eq("id", id)
				.select()
				.single();
			if (error) throw error;
			return data as CustomerRow;
		},
		onSuccess: (_d, vars) => {
			qc.invalidateQueries({ queryKey: queryKeys.customers() });
			qc.invalidateQueries({ queryKey: queryKeys.customer(vars.id) });
		},
	});
}
