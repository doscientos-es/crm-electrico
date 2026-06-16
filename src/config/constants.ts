export const customerTypeLabels = {
	residential: "Residencial",
	business: "PYME / Empresa",
	community: "Comunidad",
	property_manager: "Administrador de fincas",
};

export const customerStatusLabels = {
	new: "Nuevo",
	active: "Activo",
	renewal_due: "Renovacion pendiente",
	renewed: "Renovado",
	inactive: "Baja",
	lost: "Perdido",
};

export const incidentStatusLabels = {
	open: "Abierta",
	in_progress: "En progreso",
	resolved: "Resuelta",
	closed: "Cerrada",
};

export const incidentPriorityLabels = {
	low: "Baja",
	medium: "Media",
	high: "Alta",
	urgent: "Urgente",
};

export const incidentTypeOptions = [
	{ value: "missing_invoice", label: "Falta factura" },
	{ value: "missing_dni", label: "Falta DNI" },
	{ value: "missing_documentation", label: "Falta documentación" },
	{ value: "client_not_signing", label: "Cliente no firma" },
	{ value: "billing_error", label: "Error en facturación" },
	{ value: "contract_issue", label: "Problema con contrato" },
	{ value: "other", label: "Otro" },
] as const;

export const contractStatusLabels = {
	pending_processing: "Pendiente de tramitar",
	processing: "En tramitación",
	pending_signature: "Pendiente de firma",
	active: "Activo",
	cancelled: "Cancelado",
	terminated: "Baja",
	incident: "Incidencia",
};
