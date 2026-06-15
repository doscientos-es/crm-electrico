import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { Tables, UpdateDto } from "../types/database.types";
import { queryKeys } from "./query-keys";

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

export function useInviteProfile() {
	return useMutation({
		mutationFn: async ({
			email,
			fullName,
			role,
		}: { email: string; fullName: string; role: string }) => {
			const { error } = await supabase.functions.invoke("invite-member", {
				body: { email, full_name: fullName, role },
			});
			if (error) throw error;
		},
	});
}
