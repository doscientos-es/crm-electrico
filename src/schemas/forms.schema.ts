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
			"cancelled",
		])
		.default("pending_processing"),
	contract_number: z.string().optional(),
	cups: z.string().optional(),
	provider: z.string().optional(),
	product: z.string().optional(),
	tariff_type: z.string().optional(),
	power_kw: optionalNumber,
	annual_consumption_kwh: optionalNumber,
	energy_price_eur: optionalNumber,
	power_price_eur: optionalNumber,
	commission_eur: z.coerce.number().min(0).default(0),
	starts_at: z.string().optional(),
	ends_at: z.string().optional(),
	amount_eur: z.coerce.number().min(0).default(0),
	notes: z.string().optional(),
	file_path: z.string().optional(),
});

export type ContractFormValues = z.infer<typeof contractSchema>;
