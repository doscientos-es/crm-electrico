import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ParsedIcalEvent } from "../lib/ical";
import { supabase } from "../lib/supabase";
import type { InsertDto, Tables, UpdateDto } from "../types/database.types";
import { queryKeys } from "./query-keys";

export type TaskRow = Tables<"tasks">;

export type TaskWithCustomer = TaskRow & {
	customer: { id: string; name: string; company: string | null } | null;
};

export function useTasks(params?: {
	month?: string;
	from?: string;
	to?: string;
}) {
	return useQuery<TaskWithCustomer[]>({
		queryKey: queryKeys.tasks(params),
		queryFn: async () => {
			let query = supabase
				.from("tasks")
				.select("*, customer:customers(id, name, company)")
				.order("due_at", { ascending: true });

			if (params?.month) {
				const start = `${params.month}-01`;
				const [year, month] = params.month.split("-").map(Number);
				const lastDay = new Date(year, month, 0).getDate();
				const end = `${params.month}-${String(lastDay).padStart(2, "0")}T23:59:59`;
				query = query.gte("due_at", start).lte("due_at", end);
			} else if (params?.from) {
				query = query.gte("due_at", params.from);
				if (params.to) query = query.lte("due_at", `${params.to}T23:59:59`);
			}

			const { data, error } = await query;
			if (error) throw error;
			return data as TaskWithCustomer[];
		},
	});
}

export function useCreateTask() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async (dto: InsertDto<"tasks">) => {
			const { data, error } = await supabase
				.from("tasks")
				.insert(dto as never)
				.select()
				.single();
			if (error) throw error;
			const task = data as TaskRow;

			if (task.customer_id) {
				const {
					data: { user },
				} = await supabase.auth.getUser();
				await supabase.from("activity_logs").insert({
					actor_id: user?.id ?? null,
					entity_type: "customer",
					entity_id: task.customer_id,
					action: "appointment_scheduled",
					metadata: {
						task_id: task.id,
						title: task.title,
						due_at: task.due_at,
						priority: task.priority,
					},
				} as never);
			}

			return task;
		},
		onSuccess: (_data, dto) => {
			void qc.invalidateQueries({ queryKey: ["tasks"] });
			if (dto.customer_id) {
				void qc.invalidateQueries({
					queryKey: ["activity", "customer", dto.customer_id],
				});
			}
		},
	});
}

export function useUpdateTask() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async ({ id, ...dto }: UpdateDto<"tasks"> & { id: string }) => {
			const { data, error } = await supabase
				.from("tasks")
				.update(dto as never)
				.eq("id", id)
				.select()
				.single();
			if (error) throw error;
			return data as TaskRow;
		},
		onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
	});
}

export function useDeleteTask() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async (id: string) => {
			const { error } = await supabase.from("tasks").delete().eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
	});
}

/**
 * Imports parsed iCal events as tasks.
 * Skips events whose ical_uid already exists in the database (idempotent reimport).
 * Returns { inserted, skipped } counts.
 */
export function useImportIcalTasks() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async ({
			events,
			assignedTo,
		}: {
			events: ParsedIcalEvent[];
			assignedTo: string | null;
		}) => {
			if (events.length === 0) return { inserted: 0, skipped: 0 };

			// Fetch existing ical_uids to avoid duplicates
			const uids = events.map((e) => e.uid);
			const { data: existing, error: fetchErr } = await supabase
				.from("tasks")
				.select("ical_uid")
				.in("ical_uid", uids);
			if (fetchErr) throw fetchErr;

			const existingUids = new Set(
				(existing ?? []).map(
					(r) => (r as unknown as { ical_uid: string }).ical_uid,
				),
			);
			const toInsert = events.filter((e) => !existingUids.has(e.uid));

			if (toInsert.length === 0) return { inserted: 0, skipped: events.length };

			const rows = toInsert.map((e) => ({
				title: e.summary,
				due_at: e.dtstart,
				description: e.description ?? null,
				ical_uid: e.uid,
				status: "pending" as const,
				priority: "medium" as const,
				assigned_to: assignedTo,
			}));

			const { error } = await supabase.from("tasks").insert(rows as never);
			if (error) throw error;

			return { inserted: toInsert.length, skipped: existingUids.size };
		},
		onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
	});
}
