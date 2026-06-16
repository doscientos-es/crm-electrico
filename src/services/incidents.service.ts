import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { InsertDto, Tables, UpdateDto } from "../types/database.types";
import { queryKeys } from "./query-keys";

export type IncidentRow = Tables<"incidents">;

export type IncidentWithCustomer = IncidentRow & {
	customer: { id: string; name: string; company: string | null } | null;
};

/** Open incidents — excludes resolved & closed */
export function useIncidents(customerId?: string) {
	return useQuery<IncidentRow[]>({
		queryKey: queryKeys.incidents({ customerId }),
		queryFn: async () => {
			let q = supabase
				.from("incidents")
				.select("*")
				.not("status", "in", '("resolved","closed")')
				.order("created_at", { ascending: false });
			if (customerId) q = q.eq("customer_id", customerId);
			const { data, error } = await q;
			if (error) throw error;
			return data as IncidentRow[];
		},
	});
}

/** All incidents (for the global page, with customer join) */
export function useAllIncidents() {
	return useQuery<IncidentWithCustomer[]>({
		queryKey: queryKeys.incidents({}),
		queryFn: async () => {
			const { data, error } = await supabase
				.from("incidents")
				.select("*, customer:customers(id, name, company)")
				.not("status", "in", '("resolved","closed")')
				.order("created_at", { ascending: false });
			if (error) throw error;
			return (data ?? []) as IncidentWithCustomer[];
		},
	});
}

export function useCreateIncident() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async (payload: InsertDto<"incidents">) => {
			const { data, error } = await supabase
				.from("incidents")
				.insert(payload as never)
				.select()
				.single();
			if (error) throw error;
			return data as IncidentRow;
		},
		onSuccess: () =>
			qc.invalidateQueries({ queryKey: ["incidents"], exact: false }),
	});
}

export function useUpdateIncident() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async ({
			id,
			...payload
		}: UpdateDto<"incidents"> & { id: string }) => {
			const { data, error } = await supabase
				.from("incidents")
				.update(payload as never)
				.eq("id", id)
				.select()
				.single();
			if (error) throw error;
			return data as IncidentRow;
		},
		onSuccess: () =>
			qc.invalidateQueries({ queryKey: ["incidents"], exact: false }),
	});
}

/** Resolve an incident — sets status to "resolved" and resolved_at timestamp */
export function useResolveIncident() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async (id: string) => {
			const { error } = await supabase
				.from("incidents")
				.update({
					status: "resolved",
					resolved_at: new Date().toISOString(),
				} as never)
				.eq("id", id);
			if (error) throw error;
		},
		onSuccess: () =>
			qc.invalidateQueries({ queryKey: ["incidents"], exact: false }),
	});
}
