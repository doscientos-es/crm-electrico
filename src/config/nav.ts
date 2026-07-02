import {
	AlertTriangle,
	Building2,
	CalendarDays,
	FileArchive,
	FileText,
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
		href: "/contracts",
		label: "Contratos",
		icon: FileText,
		description:
			"Listado global de todos los contratos. Busca por número, CUPS, comercializadora o producto.",
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
		href: "/incidents",
		label: "Incidencias",
		icon: AlertTriangle,
		description:
			"Incidencias abiertas de clientes: falta de factura, DNI, firma u otros problemas pendientes.",
	},
	{
		href: "/agenda",
		label: "Agenda",
		icon: CalendarDays,
		description:
			"Calendario de reuniones, renovaciones y contactos programados.",
		// enabled: false, // TODO: activar cuando el cliente pague el módulo de Agenda
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
	name: "Ahorrafácilluz CRM",
	description: "Asesoría energética",
	icon: Zap,
};
