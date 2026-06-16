import { describe, expect, it } from "vitest";
import type { Tables } from "../types/database.types";
import {
	getDaysToRenewal,
	getRenewalAlertDate,
	getRenewalStage,
} from "./customer-workflow";

type Customer = Tables<"customers">;

const base: Customer = {
	id: "c1",
	lead_id: null,
	latitude: null,
	longitude: null,
	created_by: null,
	name: "Test",
	type: "residential",
	status: "active",
	contract_signed_at: "2023-01-01",
	renewal_date: "2024-01-01",
	renewal_alert_months: 10,
	company: null,
	legal_name: null,
	contact_name: null,
	email: null,
	phone: null,
	address: null,
	city: null,
	province: null,
	postal_code: null,
	mailing_address: null,
	mailing_city: null,
	mailing_province: null,
	mailing_postal_code: null,
	iban: null,
	dni: null,
	tax_id: null,
	notes: null,
	products_services: [],
	assigned_to: null,
	last_contact_at: null,
	created_at: "2023-01-01T00:00:00Z",
	updated_at: "2023-01-01T00:00:00Z",
	deleted_at: null,
};

// ─── getRenewalStage ────────────────────────────────────────────────────────

describe("getRenewalStage", () => {
	it('returns "closed" for lost status', () => {
		expect(getRenewalStage({ ...base, status: "lost" })).toBe("closed");
	});

	it('returns "closed" for inactive status', () => {
		expect(getRenewalStage({ ...base, status: "inactive" })).toBe("closed");
	});

	it('returns "unscheduled" when renewal_date is null', () => {
		expect(getRenewalStage({ ...base, renewal_date: null })).toBe(
			"unscheduled",
		);
	});

	it('returns "overdue" when renewal_date is in the past', () => {
		const today = new Date("2025-06-15");
		const customer = {
			...base,
			renewal_date: "2025-01-01",
			contract_signed_at: "2024-01-01",
		};
		expect(getRenewalStage(customer, today)).toBe("overdue");
	});

	it('returns "scheduled" when alert date is in the future', () => {
		// contract signed yesterday → alert date is 10 months from now → far future
		const today = new Date("2025-06-15");
		const customer = {
			...base,
			contract_signed_at: "2025-06-14",
			renewal_date: "2026-06-14",
		};
		expect(getRenewalStage(customer, today)).toBe("scheduled");
	});

	it('returns "urgent" when renewal is ≤ 30 days away and alert is in the past', () => {
		// renewal 10 days away; signed 10+ months ago so alert has passed
		const today = new Date("2025-06-15");
		const customer = {
			...base,
			contract_signed_at: "2024-08-01",
			renewal_date: "2025-06-25",
		};
		expect(getRenewalStage(customer, today)).toBe("urgent");
	});

	it('returns "due" when renewal is > 30 days away and alert is in the past', () => {
		const today = new Date("2025-06-15");
		// alert passed (signed 10m ago), renewal 45 days away
		const customer = {
			...base,
			contract_signed_at: "2024-08-01",
			renewal_date: "2025-07-30",
		};
		expect(getRenewalStage(customer, today)).toBe("due");
	});
});

// ─── getDaysToRenewal ───────────────────────────────────────────────────────

describe("getDaysToRenewal", () => {
	it("returns undefined when renewal_date is null", () => {
		expect(getDaysToRenewal({ ...base, renewal_date: null })).toBeUndefined();
	});

	it("returns 0 on the same day", () => {
		const today = new Date("2025-06-15");
		expect(
			getDaysToRenewal({ ...base, renewal_date: "2025-06-15" }, today),
		).toBe(0);
	});

	it("returns negative when overdue", () => {
		const today = new Date("2025-06-15");
		expect(
			getDaysToRenewal({ ...base, renewal_date: "2025-06-10" }, today),
		).toBe(-5);
	});

	it("returns positive when in the future", () => {
		const today = new Date("2025-06-15");
		expect(
			getDaysToRenewal({ ...base, renewal_date: "2025-07-15" }, today),
		).toBe(30);
	});
});

// ─── getRenewalAlertDate ────────────────────────────────────────────────────

describe("getRenewalAlertDate", () => {
	it("returns undefined when both dates are null", () => {
		expect(
			getRenewalAlertDate({
				...base,
				contract_signed_at: null,
				renewal_date: null,
			}),
		).toBeUndefined();
	});

	it("is 10 months after contract_signed_at by default", () => {
		const result = getRenewalAlertDate({
			...base,
			contract_signed_at: "2024-01-01",
			renewal_alert_months: 10,
		});
		expect(result?.toISOString().slice(0, 10)).toBe("2024-11-01");
	});

	it("falls back to renewal_date when contract_signed_at is null", () => {
		// alert = renewal_date + (10 - 12) months = renewal_date - 2 months
		const result = getRenewalAlertDate({
			...base,
			contract_signed_at: null,
			renewal_date: "2025-06-01",
			renewal_alert_months: 10,
		});
		expect(result?.toISOString().slice(0, 10)).toBe("2025-04-01");
	});
});
