export const queryKeys = {
	session: ["session"] as const,
	profile: ["profile"] as const,
	organization: ["organization"] as const,
	dashboard: (organizationId: string) => ["dashboard", organizationId] as const,
	customers: (filters?: unknown) => ["customers", filters] as const,
	customer: (customerId: string) => ["customer", customerId] as const,
	customerTimeline: (customerId: string) =>
		["customer-timeline", customerId] as const,
	documents: (filters?: unknown) => ["documents", filters] as const,
	contracts: (filters?: unknown) => ["contracts", filters] as const,
	incidents: (filters?: unknown) => ["incidents", filters] as const,
	tasks: (filters?: unknown) => ["tasks", filters] as const,
};
