export const customerTypeLabels = {
	residential: "Residencial",
	business: "PYME / Empresa",
	community: "Comunidad",
	property_manager: "Administrador de fincas",
};

export const customerStatusLabels = {
	new: "Nuevo",
	active: "Activo",
	inactive: "Baja",
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
	incident: "Incidencia",
	pending_recovery: "Pendiente recuperar",
	cancelled: "Cancelado",
	terminated: "Baja",
};

/** Comercializadoras más comunes en el mercado eléctrico español */
export const providerOptions = [
	"Iberdrola",
	"Endesa",
	"Naturgy",
	"Repsol",
	"EDP Comercial",
	"Holaluz",
	"Octopus Energy",
	"PepeEnergy",
	"Aldro Energía",
	"Factor Energía",
	"Plenitude",
	"Acciona Energía",
	"Otra",
] as const;

/** Canales de venta / proveedores del comercial */
export const salesChannelOptions = [
	"Canal propio",
	"Colaborador externo",
	"Broker energético",
	"Referido cliente",
	"Puerta fría",
	"Teléfono",
	"Online / Web",
	"Otro",
] as const;
