import { describe, expect, it } from "vitest";
import {
	getContractRenewalStage,
	getDaysToContractEnd,
} from "../lib/customer-workflow";
import type { Tables } from "../types/database.types";

type Contract = Tables<"contracts">;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const base: Contract = {
	id: "c1",
	customer_id: "cust1",
	deal_id: null,
	proposal_id: null,
	contract_number: "CTR-001",
	status: "active",
	signed_at: null,
	file_path: null,
	cups: "ES0031405483930001YT0F",
	provider: "Iberdrola",
	product: "PYME Fijo",
	tariff_type: "2.0TD",
	power_kw: 5.5,
	annual_consumption_kwh: null,
	energy_price_eur: null,
	power_price_p1_eur: null,
	power_price_p2_eur: null,
	power_price_p3_eur: null,
	power_price_p4_eur: null,
	power_price_p5_eur: null,
	power_price_p6_eur: null,
	amount_eur: 1200,
	commission_eur: 120,
	commission_company_eur: 80,
	commission_commercial_eur: 40,
	starts_at: "2024-01-01",
	ends_at: null,
	notes: null,
	created_by: null,
	created_at: "2024-01-01T00:00:00Z",
	updated_at: "2024-01-01T00:00:00Z",
};

// ─── getDaysToContractEnd ────────────────────────────────────────────────────

describe("getDaysToContractEnd", () => {
	it("returns undefined when ends_at is null", () => {
		expect(getDaysToContractEnd({ ...base, ends_at: null })).toBeUndefined();
	});

	it("returns 0 on the expiry day itself", () => {
		const today = new Date("2025-06-15");
		expect(
			getDaysToContractEnd({ ...base, ends_at: "2025-06-15" }, today),
		).toBe(0);
	});

	it("returns negative when contract is overdue", () => {
		const today = new Date("2025-06-15");
		expect(
			getDaysToContractEnd({ ...base, ends_at: "2025-06-10" }, today),
		).toBe(-5);
	});

	it("returns positive when contract has not yet expired", () => {
		const today = new Date("2025-06-15");
		expect(
			getDaysToContractEnd({ ...base, ends_at: "2025-07-15" }, today),
		).toBe(30);
	});
});

// ─── getContractRenewalStage ─────────────────────────────────────────────────

describe("getContractRenewalStage", () => {
	it('returns "unscheduled" when ends_at is null', () => {
		expect(getContractRenewalStage({ ...base, ends_at: null })).toBe(
			"unscheduled",
		);
	});

	it('returns "overdue" when ends_at is in the past', () => {
		const today = new Date("2025-06-15");
		expect(
			getContractRenewalStage({ ...base, ends_at: "2025-06-01" }, today),
		).toBe("overdue");
	});

	it('returns "urgent" when ≤ 30 days remaining', () => {
		const today = new Date("2025-06-15");
		expect(
			getContractRenewalStage({ ...base, ends_at: "2025-07-10" }, today),
		).toBe("urgent");
	});

	it('returns "urgent" on expiry day (0 days)', () => {
		const today = new Date("2025-06-15");
		expect(
			getContractRenewalStage({ ...base, ends_at: "2025-06-15" }, today),
		).toBe("urgent");
	});

	it('returns "due" when > 30 days remaining', () => {
		const today = new Date("2025-06-15");
		expect(
			getContractRenewalStage({ ...base, ends_at: "2025-08-01" }, today),
		).toBe("due");
	});
});
