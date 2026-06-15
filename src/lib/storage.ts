import { supabase } from "./supabase";

export const storageBuckets = {
	invoices: {
		bucket: "invoices",
		maxBytes: 10 * 1024 * 1024,
		accept: "application/pdf",
	},
	proposals: {
		bucket: "proposals",
		maxBytes: 10 * 1024 * 1024,
		accept: "application/pdf",
	},
	contracts: {
		bucket: "contracts",
		maxBytes: 15 * 1024 * 1024,
		accept: "application/pdf",
	},
	customerDocuments: {
		bucket: "customer-documents",
		maxBytes: 15 * 1024 * 1024,
		accept: "application/pdf,image/jpeg,image/png,image/webp",
	},
	installationPhotos: {
		bucket: "installation-photos",
		maxBytes: 8 * 1024 * 1024,
		accept: "image/jpeg,image/png,image/webp",
	},
};

export function buildStoragePath(
	organizationId: string,
	customerId: string,
	entityId: string,
	fileName: string,
) {
	const safeName = fileName.toLowerCase().replace(/[^a-z0-9.]+/g, "-");
	return `${organizationId}/${customerId}/${entityId}/${safeName}`;
}

export function isPdfDocument(fileName?: string, mimeType?: string) {
	return (
		mimeType === "application/pdf" ||
		fileName?.toLowerCase().endsWith(".pdf") ||
		false
	);
}

export function getStoragePublicUrl(bucket: string, filePath: string) {
	if (/^https?:\/\//i.test(filePath)) {
		return filePath;
	}

	return supabase.storage.from(bucket).getPublicUrl(filePath).data.publicUrl;
}

export async function getStorageSignedUrl(
	bucket: string,
	filePath: string,
	expiresIn = 3600,
): Promise<string> {
	if (/^https?:\/\//i.test(filePath)) return filePath;
	const { data, error } = await supabase.storage
		.from(bucket)
		.createSignedUrl(filePath, expiresIn);
	if (error) throw error;
	return data.signedUrl;
}
