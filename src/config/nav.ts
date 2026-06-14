import {
	Building2,
	CircleAlert,
	FileArchive,
	FileText,
	Home,
	Settings,
	ShieldCheck,
	Zap,
} from "lucide-react";

export const navItems = [
	{ href: "/dashboard", label: "Dashboard", icon: Home },
	{ href: "/customers", label: "Clientes", icon: Building2 },
	{ href: "/contracts", label: "Contratos", icon: FileText },
	{ href: "/incidents", label: "Incidencias", icon: CircleAlert },
	{ href: "/renewals", label: "Renovaciones", icon: ShieldCheck },
	{ href: "/documents", label: "Documentos", icon: FileArchive },
	{ href: "/settings", label: "Ajustes", icon: Settings },
];

export const appBrand = {
	name: "Renovaciones CRM",
	description: "Panel de administración",
	icon: Zap,
};
