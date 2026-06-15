import {
	Building2,
	FileArchive,
	Home,
	Settings,
	ShieldCheck,
	Zap,
} from "lucide-react";

export const navItems = [
	{
		href: "/dashboard",
		label: "Dashboard",
		icon: Home,
		description:
			"Resumen ejecutivo: KPIs, actividad reciente y estado general de la cartera.",
	},
	{
		href: "/customers",
		label: "Clientes",
		icon: Building2,
		description:
			"Gestión completa de clientes: contratos, documentos y seguimiento comercial.",
	},
	{
		href: "/renewals",
		label: "Renovaciones",
		icon: ShieldCheck,
		description:
			"Cola automática de clientes con contrato próximo a vencer (10–12 meses). Gestiona avisos y marca renovaciones.",
	},
	{
		href: "/documents",
		label: "Documentos",
		icon: FileArchive,
		description:
			"Repositorio centralizado de archivos: contratos, DNIs, propuestas y facturas de todos los clientes.",
	},
	{
		href: "/settings",
		label: "Ajustes",
		icon: Settings,
		description:
			"Configuración de la organización, usuarios, roles y preferencias de la aplicación.",
	},
];

export const appBrand = {
	name: "OPTIENERGIA CRM",
	description: "Panel de administración",
	icon: Zap,
};
