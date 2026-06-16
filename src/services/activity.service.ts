import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { Tables } from "../types/database.types";
import { queryKeys } from "./query-keys";

export type ActivityLogRow = Tables<"activity_logs">;
export type ContactChannel = "email" | "phone";

export type ActivityLogWithActor = ActivityLogRow & {
	actor: { full_name: string } | null;
};
/** @deprecated use ActivityLogWithActor */
export type ContactLog = ActivityLogWithActor;
export type RenewalContactLog = ContactLog;

// ── Metadata helpers ──────────────────────────────────────────────────────────

function meta(log: ActivityLogRow): Record<string, unknown> {
	if (
		!log.metadata ||
		typeof log.metadata !== "object" ||
		Array.isArray(log.metadata)
	)
		return {};
	return log.metadata as Record<string, unknown>;
}

export function getContactChannel(log: ActivityLogRow): ContactChannel | null {
	const channel = meta(log).channel;
	return channel === "email" || channel === "phone" ? channel : null;
}

export function getContactNotes(log: ActivityLogRow): string {
	const notes = meta(log).notes;
	return typeof notes === "string" ? notes : "";
}

/** Human-readable label for every action type stored in activity_logs. */
export function getActivityLabel(
	action: string,
	metadata: Record<string, unknown>,
): string {
	switch (action) {
		case "customer_created":
			return "Cliente creado";
		case "customer_updated": {
			if (metadata.old_status && metadata.new_status)
				return `Estado cambiado a "${metadata.new_status}"`;
			if (metadata.old_name)
				return `Nombre actualizado a "${metadata.new_name}"`;
			return "Datos del cliente actualizados";
		}
		case "contract_created":
			return `Contrato creado${metadata.provider ? ` – ${metadata.provider}` : ""}`;
		case "contract_updated": {
			if (metadata.old_status && metadata.new_status)
				return `Contrato: estado cambiado a "${metadata.new_status}"`;
			if (metadata.old_ends_at && metadata.new_ends_at)
				return "Contrato: vencimiento modificado";
			return "Contrato actualizado";
		}
		case "contract_deleted":
			return `Contrato eliminado${metadata.provider ? ` – ${metadata.provider}` : ""}`;
		case "incident_created":
			return `Incidencia abierta: ${metadata.title ?? ""}`;
		case "incident_updated": {
			if (metadata.old_status && metadata.new_status)
				return `Incidencia "${metadata.title}": estado → ${metadata.new_status}`;
			if (metadata.old_priority && metadata.new_priority)
				return `Incidencia "${metadata.title}": prioridad → ${metadata.new_priority}`;
			return `Incidencia actualizada: ${metadata.title ?? ""}`;
		}
		case "incident_deleted":
			return `Incidencia eliminada: ${metadata.title ?? ""}`;
		case "renewal_contact":
			return "Contacto de renovación";
		case "renewal_alert_sent":
			return "Alerta de renovación enviada";
		default:
			return action.replace(/_/g, " ");
	}
}

// ── Queries ───────────────────────────────────────────────────────────────────

export function useRecentActivity(limit = 10) {
	return useQuery<ActivityLogRow[]>({
		queryKey: ["activity", "recent", limit],
		queryFn: async () => {
			const { data, error } = await supabase
				.from("activity_logs")
				.select("*")
				.order("created_at", { ascending: false })
				.limit(limit);
			if (error) throw error;
			return data as ActivityLogRow[];
		},
	});
}

export function useCustomerActivity(customerId: string) {
	return useQuery<ActivityLogWithActor[]>({
		queryKey: ["activity", "customer", customerId],
		queryFn: async () => {
			const { data, error } = await supabase
				.from("activity_logs")
				.select("*, actor:profiles!activity_logs_actor_id_fkey(full_name)")
				.eq("entity_type", "customer")
				.eq("entity_id", customerId)
				.order("created_at", { ascending: false })
				.limit(100);
			if (error) throw error;
			return data as ActivityLogWithActor[];
		},
		enabled: !!customerId,
	});
}

// Alias for routes that import useActivityLogs
export const useActivityLogs = useCustomerActivity;

export function useCustomerInteractions(customerId: string | undefined) {
	return useQuery<ActivityLogWithActor[]>({
		queryKey: ["activity", "customer-interactions", customerId],
		queryFn: async () => {
			const { data, error } = await supabase
				.from("activity_logs")
				.select("*, actor:profiles!activity_logs_actor_id_fkey(full_name)")
				.eq("entity_type", "customer")
				.eq("entity_id", customerId!)
				.eq("action", "renewal_contact")
				.order("created_at", { ascending: false })
				.limit(20);

			if (error) throw error;
			return data as ActivityLogWithActor[];
		},
		enabled: !!customerId,
	});
}

export function useRenewalContacts(customerIds: string[]) {
	const ids = [...new Set(customerIds)].sort();

	return useQuery<ActivityLogWithActor[]>({
		queryKey: ["activity", "renewal-contacts", ids],
		queryFn: async () => {
			if (ids.length === 0) return [];

			const { data, error } = await supabase
				.from("activity_logs")
				.select("*, actor:profiles!activity_logs_actor_id_fkey(full_name)")
				.eq("entity_type", "customer")
				.eq("action", "renewal_contact")
				.in("entity_id", ids)
				.order("created_at", { ascending: false });

			if (error) throw error;
			return data as ActivityLogWithActor[];
		},
		enabled: ids.length > 0,
	});
}

export function useLogRenewalContact() {
	const qc = useQueryClient();

	return useMutation({
		mutationFn: async ({
			customerId,
			contractId,
			actorId,
			channel,
			notes,
		}: {
			customerId: string;
			contractId: string;
			actorId: string;
			channel: ContactChannel;
			notes: string;
		}) => {
			const { data, error } = await supabase
				.from("activity_logs")
				.insert({
					actor_id: actorId,
					entity_type: "customer",
					entity_id: customerId,
					action: "renewal_contact",
					metadata: {
						channel,
						notes: notes.trim(),
						contract_id: contractId,
					},
				} as never)
				.select()
				.single();

			if (error) throw error;
			return data as ActivityLogRow;
		},
		onSuccess: (_data, variables) => {
			void qc.invalidateQueries({ queryKey: ["activity"] });
			void qc.invalidateQueries({
				queryKey: queryKeys.customer(variables.customerId),
			});
		},
	});
}

export function useLogActivity() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async ({
			entityType,
			entityId,
			action,
			metadata = {},
		}: {
			entityType: string;
			entityId: string;
			action: string;
			metadata?: Record<string, unknown>;
		}) => {
			const { error } = await supabase.from("activity_logs").insert({
				entity_type: entityType,
				entity_id: entityId,
				action,
				metadata,
			} as never);
			if (error) throw error;
		},
		onSuccess: () => qc.invalidateQueries({ queryKey: ["activity"] }),
	});
}
