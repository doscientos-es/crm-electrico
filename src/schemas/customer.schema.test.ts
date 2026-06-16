import { describe, expect, it } from "vitest";
import { customerSchema } from "./customer.schema";

// Minimal valid input – only truly required fields
const base = {
	name: "Empresa Test",
	type: "business" as const,
	status: "new" as const,
	products_services: "",
};

describe("customerSchema", () => {
	// ── Required fields ────────────────────────────────────────────────────────

	it("accepts a minimal valid input", () => {
		expect(customerSchema.safeParse(base).success).toBe(true);
	});

	it("rejects when name is empty", () => {
		const result = customerSchema.safeParse({ ...base, name: "" });
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0].path).toContain("name");
		}
	});

	it("rejects an invalid customer type", () => {
		const result = customerSchema.safeParse({ ...base, type: "unknown" });
		expect(result.success).toBe(false);
	});

	// ── Contact fields (all optional) ────────────────────────────────────────

	it("accepts when both email and phone are empty", () => {
		const result = customerSchema.safeParse({ ...base, email: "", phone: "" });
		expect(result.success).toBe(true);
	});

	it("accepts when only phone is provided", () => {
		const result = customerSchema.safeParse({ ...base, phone: "600123456" });
		expect(result.success).toBe(true);
	});

	it("accepts when only email is provided", () => {
		const result = customerSchema.safeParse({ ...base, email: "a@b.com" });
		expect(result.success).toBe(true);
	});

	it("rejects an invalid email format", () => {
		const result = customerSchema.safeParse({
			...base,
			email: "no-es-un-email",
		});
		expect(result.success).toBe(false);
		if (!result.success) expect(result.error.issues[0].path).toContain("email");
	});

	it("rejects an invalid phone format", () => {
		const result = customerSchema.safeParse({ ...base, phone: "123" });
		expect(result.success).toBe(false);
		if (!result.success) expect(result.error.issues[0].path).toContain("phone");
	});

	// ── assigned_to (optional) ────────────────────────────────────────────────

	it("accepts when assigned_to is absent", () => {
		expect(customerSchema.safeParse(base).success).toBe(true);
	});

	it("accepts when assigned_to is a valid uuid string", () => {
		expect(
			customerSchema.safeParse({ ...base, assigned_to: "user-uuid-1" }).success,
		).toBe(true);
	});

	// ── Mailing postal code ────────────────────────────────────────────────────

	it("accepts a valid mailing_postal_code", () => {
		expect(
			customerSchema.safeParse({ ...base, mailing_postal_code: "08001" })
				.success,
		).toBe(true);
	});

	it("rejects invalid mailing_postal_code", () => {
		const result = customerSchema.safeParse({
			...base,
			mailing_postal_code: "9999",
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0].path).toContain("mailing_postal_code");
		}
	});

	it("accepts empty mailing_postal_code (field is optional)", () => {
		expect(
			customerSchema.safeParse({ ...base, mailing_postal_code: "" }).success,
		).toBe(true);
	});

	// ── Optional mailing fields ────────────────────────────────────────────────

	it("accepts all mailing fields when provided", () => {
		const result = customerSchema.safeParse({
			...base,
			mailing_address: "Calle Mayor 1",
			mailing_city: "Sevilla",
			mailing_province: "Sevilla",
			mailing_postal_code: "41001",
		});
		expect(result.success).toBe(true);
	});

	it("accepts when mailing fields are absent", () => {
		const { ...withoutMailing } = base;
		expect(customerSchema.safeParse(withoutMailing).success).toBe(true);
	});

	// ── IBAN ──────────────────────────────────────────────────────────────────

	it("accepts a valid IBAN string", () => {
		expect(
			customerSchema.safeParse({
				...base,
				iban: "ES91 2100 0418 4502 0005 1332",
			}).success,
		).toBe(true);
	});

	it("accepts missing IBAN (optional)", () => {
		const { ...withoutIban } = base;
		expect(customerSchema.safeParse(withoutIban).success).toBe(true);
	});
});
