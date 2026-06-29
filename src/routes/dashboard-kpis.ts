import type { ContractStats } from "../services/contracts.service";

type ContractKpiMetric = keyof Pick<
	ContractStats,
	| "total"
	| "active"
	| "processing"
	| "pendingSignature"
	| "pendingProcessing"
	| "cancelled"
	| "terminated"
>;

export type ContractKpiIcon =
	| "total"
	| "active"
	| "signature"
	| "processing"
	| "cancelled"
	| "terminated";

export const dashboardContractKpis: {
	title: string;
	metric: ContractKpiMetric;
	href: string;
	icon: ContractKpiIcon;
	highlight?: "warning" | "danger";
}[] = [
	{ title: "Contratos totales", metric: "total", icon: "total", href: "/contracts" },
	{
		title: "Contratos activos",
		metric: "active",
		icon: "active",
		href: "/contracts?status=active",
	},
	{
		title: "Pendientes de firma",
		metric: "pendingSignature",
		icon: "signature",
		href: "/contracts?status=pending_signature",
	},
	{
		title: "Pendientes de tramitar",
		metric: "pendingProcessing",
		icon: "processing",
		highlight: "warning",
		href: "/contracts?status=pending_processing",
	},
	{
		title: "En tramitación",
		metric: "processing",
		icon: "processing",
		highlight: "warning",
		href: "/contracts?status=processing",
	},
	{
		title: "Contratos cancelados",
		metric: "cancelled",
		icon: "cancelled",
		highlight: "danger",
		href: "/contracts?status=cancelled",
	},
	{
		title: "Contratos baja",
		metric: "terminated",
		icon: "terminated",
		highlight: "danger",
		href: "/contracts?status=terminated",
	},
];
