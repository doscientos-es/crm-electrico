import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { InsertDto, Tables, UpdateDto } from "../types/database.types";
import { queryKeys } from "./query-keys";

export type ContractRow = Tables<"contracts">;

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
