import type { AppRole } from "../types/database.types";

const writeRoles: AppRole[] = ["owner", "admin", "sales"];
const techRoles: AppRole[] = ["owner", "admin", "technician"];

export function canViewAllCustomers(role: AppRole) {
	return role === "owner" || role === "admin";
}

export function canDownloadPdf(role: AppRole) {
	return role === "owner" || role === "admin";
}

export function can(role: AppRole, action: string) {
	if (role === "owner") return true;
	if (action === "settings:write") return role === "admin";
	if (action === "customers:view-all") return canViewAllCustomers(role);
	if (action.startsWith("installation:")) return techRoles.includes(role);
	if (action.endsWith(":read")) return true;
	if (action.endsWith(":write")) return writeRoles.includes(role);
	return role !== "viewer";
}
