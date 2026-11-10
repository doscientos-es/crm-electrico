import { describe, expect, it } from "vitest";
import { contractStatusLabels } from "../config/constants";
import { activeExpiredFilter } from "../features/renewals/renewal-followup";
import { dashboardContractKpis } from "./dashboard-kpis";

describe("dashboardContractKpis", () => {
	it("links contract KPIs to their filters without duplicating incidents", () => {
		const statusTargets = dashboardContractKpis
			.map((kpi) => new URL(kpi.href, "http://localhost").searchParams.get("status"))
			.filter((status): status is string => Boolean(status))
			.sort();

		expect(statusTargets).toEqual([...Object.keys(contractStatusLabels).filter((status) => status !== 'incident'), activeExpiredFilter].sort());
		expect(dashboardContractKpis.find((kpi) => kpi.metric === 'activeRenewalExpired')?.href).toBe(`/contracts?status=${activeExpiredFilter}`);
	});

	it("keeps the total contracts KPI unfiltered", () => {
		expect(dashboardContractKpis.find((kpi) => kpi.metric === "total")?.href).toBe(
			"/contracts",
		);
	});
});
