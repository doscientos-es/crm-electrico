import { z } from "zod";

// E.164-compatible: optional, allows +34 prefix, spaces/hyphens stripped, min 9 digits
const phoneRegex = /^[+]?[0-9 \-().]{9,20}$/;

export const optionalEmail = z
	.union([z.email("Introduce un email válido"), z.literal(""), z.undefined()])
	.optional();

export const optionalPhone = z
	.string()
	.regex(phoneRegex, "Introduce un teléfono válido (mín. 9 dígitos)")
	.optional()
	.or(z.literal(""));

export const positiveNumber = z.coerce
	.number()
	.min(0, "Debe ser mayor o igual que 0");

export const contactRefinement = {
	message: "Introduce al menos teléfono o email",
	path: ["phone"],
};
