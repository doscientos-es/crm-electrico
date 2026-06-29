import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { InsertDto, Tables, UpdateDto } from "../types/database.types";
import { queryKeys } from "./query-keys";

export type IncidentRow = Tables<"incidents">;

export type IncidentWithCustomer = IncidentRow & {
	customer: { id: string; name: string; company: string | null } | null;
};

export function useOpenIncidentsCount() {
	return useQuery<number>({
		queryKey: queryKeys.incidents({ count: true, open: true }),
		queryFn: async () => {
			const { error, count } = await supabase
				.from("incidents")
				.select("*", { count: "exact", head: true })
				.not("status", "in", '("resolved","closed")');
			if (error) throw error;
			return count ?? 0;
		},
	});
}

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

export interface AllIncidentsFilter {
	search?: string;
	status?: string;
	priority?: string;
	page?: number;
	pageSize?: number;
}

/** All incidents (global page) — server-side pagination, search, status and priority filters */
export function useAllIncidents(filter: AllIncidentsFilter = {}) {
	const { search, status, priority, page = 0, pageSize = 25 } = filter;
	return useQuery<{ data: IncidentWithCustomer[]; count: number }>({
		queryKey: queryKeys.incidents({ ...filter, global: true }),
		queryFn: async () => {
			let q = supabase
				.from("incidents")
				.select("*, customer:customers(id, name, company)", { count: "exact" })
				.order("created_at", { ascending: false });

			if (status && status !== "all") {
				q = q.eq("status", status as never);
			} else if (!status || status === "open") {
				q = q.not("status", "in", '("resolved","closed")');
			}
			// status === "all" → no additional filter

			if (priority && priority !== "all") {
				q = q.eq("priority", priority as never);
			}
			if (search) {
				q = q.ilike("title", `%${search}%`);
			}

			q = q.range(page * pageSize, (page + 1) * pageSize - 1);
			const { data, error, count } = await q;
			if (error) throw error;
			return {
				data: (data ?? []) as IncidentWithCustomer[],
				count: count ?? 0,
			};
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
