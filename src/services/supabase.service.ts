import { supabase } from "../lib/supabase";

export function requireSupabase() {
	if (!supabase) {
		throw new Error(
			"Supabase no esta configurado. Define VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.",
		);
	}
	return supabase;
}

export async function listRows(table: string) {
	const client = requireSupabase();
	const { data, error } = await client.from(table as never).select("*");
	if (error) throw error;
	return data;
}
