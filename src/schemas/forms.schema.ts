import { z } from "zod";
import { optionalNumber } from "./common";

export const contractSchema = z.object({
	customer_id: z.string().min(1, "Este campo es obligatorio"),
	status: z
		.enum([
			"pending_processing",
			"processing",
			"pending_signature",
			"active",
			"incident",
			"pending_recovery",
			"cancelled",
			"terminated",
		])
		.default("pending_processing"),
	cups: z.string().optional(),
	provider: z.string().optional(),
	sales_channel: z.string().optional(),
	product: z.string().optional(),
	tariff_type: z.string().optional(),
	power_kw: optionalNumber,
	annual_consumption_kwh: optionalNumber,
	energy_price_eur: optionalNumber,
	power_price_p1_eur: optionalNumber,
	power_price_p2_eur: optionalNumber,
	power_price_p3_eur: optionalNumber,
	power_price_p4_eur: optionalNumber,
	power_price_p5_eur: optionalNumber,
	power_price_p6_eur: optionalNumber,
	commission_company_eur: z.coerce.number().min(0).default(0),
	commission_commercial_eur: z.coerce.number().min(0).default(0),
	supply_address: z.string().optional(),
	supply_city: z.string().optional(),
	supply_province: z.string().optional(),
	supply_postal_code: z
		.string()
		.regex(/^\d{5}$/, "El codigo postal debe tener 5 digitos")
		.optional()
		.or(z.literal("")),
	starts_at: z.string().optional(),
	ends_at: z.string().optional(),
	terminated_at: z.string().optional(),
	notes: z.string().optional(),
	file_path: z.string().optional(),
});

export type ContractFormValues = z.infer<typeof contractSchema>;
