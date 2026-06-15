import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { Tables } from "../types/database.types";
import { queryKeys } from "./query-keys";

export type DocumentRow = Tables<"documents">;

export function useDocuments(filterOrId?: string | { customerId?: string }) {
	const customerId =
		typeof filterOrId === "string" ? filterOrId : filterOrId?.customerId;
	return useQuery<DocumentRow[]>({
		queryKey: queryKeys.documents({ customerId }),
		queryFn: async () => {
			let q = supabase
				.from("documents")
				.select("*")
				.order("created_at", { ascending: false });
			if (customerId) q = q.eq("customer_id", customerId);
			const { data, error } = await q;
			if (error) throw error;
			return data as DocumentRow[];
		},
	});
}

export function useUploadDocument() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async ({
			file,
			organizationId,
			customerId,
			type,
			uploadedBy,
		}: {
			file: File;
			organizationId: string;
			customerId: string;
			type: DocumentRow["type"];
			uploadedBy?: string;
		}) => {
			const bucket = "customer-documents";
			const filePath = `${organizationId}/${customerId}/${Date.now()}-${file.name}`;
			const { error: uploadError } = await supabase.storage
				.from(bucket)
				.upload(filePath, file);
			if (uploadError) throw uploadError;

			const { data, error } = await supabase
				.from("documents")
				.insert({
					customer_id: customerId,
					type,
					bucket,
					file_path: filePath,
					file_name: file.name,
					mime_type: file.type,
					size_bytes: file.size,
					uploaded_by: uploadedBy,
				} as never)
				.select()
				.single();
			if (error) throw error;
			return data as DocumentRow;
		},
		onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.documents() }),
	});
}
