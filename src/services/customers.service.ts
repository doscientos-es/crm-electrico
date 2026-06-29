import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { InsertDto, Tables, UpdateDto } from "../types/database.types";
import { queryKeys } from "./query-keys";

export type CustomerRow = Tables<"customers">;

type CustomerDocumentForDeletion = Pick<Tables<"documents">, "bucket" | "file_path">;
type DeleteCustomerRpcClient = {
	rpc: (
		fn: "delete_customer_cascade",
		args: { p_customer_id: string },
	) => PromiseLike<{ error: { message: string } | null }>;
};

interface CustomersFilter {
	search?: string;
	status?: string;
	assignedTo?: string;
	dateFrom?: string;
	dateTo?: string;
	page?: number;
	pageSize?: number;
}

export function useCustomerCount(filter: Pick<CustomersFilter, "status"> = {}) {
	const { status } = filter;
	return useQuery<number>({
		queryKey: queryKeys.customers({ count: true, status }),
		queryFn: async () => {
			let q = supabase
				.from("customers")
				.select("*", { count: "exact", head: true })
				.is("deleted_at", null);
			if (status) q = q.eq("status", status as never);
			const { error, count } = await q;
			if (error) throw error;
			return count ?? 0;
		},
	});
}

export function useCustomers(filter: CustomersFilter = {}) {
	const {
		search,
		status,
		assignedTo,
		dateFrom,
		dateTo,
		page = 0,
		pageSize = 25,
	} = filter;
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
			if (dateFrom) q = q.gte("created_at", dateFrom);
			if (dateTo) q = q.lte("created_at", dateTo);
			q = q.order("name").range(page * pageSize, (page + 1) * pageSize - 1);
			const { data, error, count } = await q;
			if (error) throw error;
			return { data: data as CustomerRow[], count: count ?? 0 };
		},
	});
}

export async function fetchAllCustomersForExport(
	filter: Omit<CustomersFilter, "page" | "pageSize">,
): Promise<CustomerRow[]> {
	const { search, status, assignedTo, dateFrom, dateTo } = filter;
	let q = supabase.from("customers").select("*").is("deleted_at", null);
	if (search)
		q = q.or(
			`name.ilike.%${search}%,company.ilike.%${search}%,email.ilike.%${search}%,city.ilike.%${search}%`,
		);
	if (status) q = q.eq("status", status as never);
	if (assignedTo) q = q.eq("assigned_to", assignedTo);
	if (dateFrom) q = q.gte("created_at", dateFrom);
	if (dateTo) q = q.lte("created_at", dateTo);
	q = q.order("name");
	const { data, error } = await q;
	if (error) throw error;
	return data as CustomerRow[];
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

async function removeCustomerDocumentFiles(
	documents: CustomerDocumentForDeletion[],
): Promise<number> {
	const filesByBucket = documents.reduce<Record<string, string[]>>((acc, doc) => {
		if (!doc.bucket || !doc.file_path) return acc;
		acc[doc.bucket] = acc[doc.bucket] ?? [];
		acc[doc.bucket].push(doc.file_path);
		return acc;
	}, {});

	let failedBuckets = 0;
	for (const [bucket, paths] of Object.entries(filesByBucket)) {
		const { error } = await supabase.storage.from(bucket).remove(paths);
		if (error) {
			failedBuckets += 1;
			console.error(`No se pudieron eliminar archivos del bucket ${bucket}`, error);
		}
	}

	return failedBuckets;
}

export function useDeleteCustomer() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async (id: string) => {
			const { data: documents, error: documentsError } = await supabase
				.from("documents")
				.select("bucket,file_path")
				.eq("customer_id", id);
			if (documentsError)
				throw new Error("No se pudieron preparar los documentos del cliente.");

			const { error } = await (
				supabase as unknown as DeleteCustomerRpcClient
			).rpc("delete_customer_cascade", { p_customer_id: id });
			if (error) throw new Error(error.message);

			const storageErrorCount = await removeCustomerDocumentFiles(
				(documents ?? []) as CustomerDocumentForDeletion[],
			);

			return { storageErrorCount };
		},
		onSuccess: (_data, id) => {
			qc.removeQueries({ queryKey: queryKeys.customer(id) });
			qc.invalidateQueries({ queryKey: ["customers"], exact: false });
			qc.invalidateQueries({ queryKey: ["contracts"], exact: false });
			qc.invalidateQueries({ queryKey: ["documents"], exact: false });
			qc.invalidateQueries({ queryKey: ["incidents"], exact: false });
			qc.invalidateQueries({ queryKey: ["tasks"], exact: false });
			qc.invalidateQueries({ queryKey: ["activity"], exact: false });
		},
	});
}
