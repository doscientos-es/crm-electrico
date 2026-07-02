import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { Tables, UpdateDto } from "../types/database.types";
import { queryKeys } from "./query-keys";

const SUPABASE_FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_URL as string;

export type ProfileRow = Tables<"profiles">;

export function useProfiles() {
	return useQuery<ProfileRow[]>({
		queryKey: queryKeys.profile,
		queryFn: async () => {
			const { data, error } = await supabase
				.from("profiles")
				.select("*")
				.order("full_name");
			if (error) throw error;
			return data as ProfileRow[];
		},
	});
}

export function useProfile(id: string) {
	return useQuery<ProfileRow>({
		queryKey: [...queryKeys.profile, id],
		queryFn: async () => {
			const { data, error } = await supabase
				.from("profiles")
				.select("*")
				.eq("id", id)
				.single();
			if (error) throw error;
			return data as ProfileRow;
		},
		enabled: !!id,
	});
}

export function useUpdateProfile() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async ({
			id,
			...payload
		}: UpdateDto<"profiles"> & { id: string }) => {
			const { data, error } = await supabase
				.from("profiles")
				.update(payload as never)
				.eq("id", id)
				.select()
				.single();
			if (error) throw error;
			return data as ProfileRow;
		},
		onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.profile }),
	});
}

export function useDeleteProfile() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async (id: string) => {
			const { error } = await supabase.from("profiles").delete().eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.profile }),
	});
}

export function useCreateMember() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async ({
			email,
			fullName,
			role,
			phone,
			password,
		}: {
			email: string;
			fullName: string;
			role: string;
			phone?: string;
			password: string;
		}) => {
			const { error } = await supabase.functions.invoke("create-member", {
				body: { email, full_name: fullName, role, phone, password },
			});
			if (error) {
				// FunctionsHttpError carries the response body in error.context
				const ctx = (error as { context?: Response }).context;
				if (ctx) {
					try {
						const body = await ctx.json();
						throw new Error(body?.error ?? error.message);
					} catch (parseErr) {
						if (parseErr instanceof Error && parseErr !== error) throw parseErr;
					}
				}
				throw error;
			}
		},
		onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.profile }),
	});
}

/**
 * Returns the webcal:// subscription URL for the current user.
 * If the profile doesn't have a calendar_token yet, generates one on first call.
 */
export function useCalendarFeedUrl(profileId: string | undefined) {
	const qc = useQueryClient();
	return useQuery<string | null>({
		queryKey: [...queryKeys.profile, profileId, "calendar-token"],
		enabled: !!profileId,
		queryFn: async () => {
			// `enabled` guards profileId being defined; cast once to avoid non-null assertions
			const id = profileId as string;

			const { data, error } = await supabase
				.from("profiles")
				.select("calendar_token")
				.eq("id", id)
				.single();

			if (error) throw error;

			let token = (data as unknown as { calendar_token: string | null })
				.calendar_token;

			// Generate a token if missing (e.g. profiles created before the migration)
			if (!token) {
				const newToken = crypto.randomUUID();
				await supabase
					.from("profiles")
					.update({ calendar_token: newToken } as never)
					.eq("id", id);
				token = newToken;
				void qc.invalidateQueries({ queryKey: queryKeys.profile });
			}

			// Build the webcal:// URL — replace https:// with webcal://
			const functionsBase = SUPABASE_FUNCTIONS_URL.replace(
				/^https?:\/\//,
				"webcal://",
			);
			return `${functionsBase}/functions/v1/calendar-feed?token=${token}`;
		},
		staleTime: Number.POSITIVE_INFINITY, // token never changes unless explicitly rotated
	});
}
