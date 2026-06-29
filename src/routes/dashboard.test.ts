import { describe, expect, it } from "vitest";
import { contractStatusLabels } from "../config/constants";
import { dashboardContractKpis } from "./dashboard-kpis";

describe("dashboardContractKpis", () => {
	it("links one KPI to each contract status filter", () => {
		const statusTargets = dashboardContractKpis
			.map((kpi) => new URL(kpi.href, "http://localhost").searchParams.get("status"))
			.filter((status): status is string => Boolean(status))
			.sort();

		expect(statusTargets).toEqual(Object.keys(contractStatusLabels).sort());
	});

	it("keeps the total contracts KPI unfiltered", () => {
		expect(dashboardContractKpis.find((kpi) => kpi.metric === "total")?.href).toBe(
			"/contracts",
		);
	});
});
