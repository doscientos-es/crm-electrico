import { z } from "zod";
import { optionalEmail, optionalPhone } from "./common";

export const customerSchema = z.object({
	name: z.string().min(1, "El nombre es obligatorio"),
	type: z.enum(["residential", "business", "community", "property_manager"]),
	status: z.enum(["new", "active", "inactive", "lost"]).default("new"),
	legal_name: z.string().optional(),
	tax_id: z.string().optional(),
	contact_name: z.string().optional(),
	email: optionalEmail,
	phone: optionalPhone,
	mailing_address: z.string().optional(),
	mailing_city: z.string().optional(),
	mailing_province: z.string().optional(),
	mailing_postal_code: z
		.string()
		.regex(/^\d{5}$/, "El código postal debe tener 5 dígitos")
		.optional()
		.or(z.literal("")),
	iban: z.string().optional(),
	assigned_to: z.string().optional(),
	products_services: z.string(),
	notes: z.string().optional(),
});

export type CustomerFormValues = z.infer<typeof customerSchema>;
