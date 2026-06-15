import { describe, expect, it } from "vitest";
import { safeStorageFileName } from "./storage";

describe("safeStorageFileName", () => {
	it("strips diacritics", () => {
		expect(safeStorageFileName("Qué-es-doscientos.txt")).toBe(
			"Que-es-doscientos.txt",
		);
	});

	it("replaces spaces with hyphens", () => {
		expect(safeStorageFileName("mi archivo final.pdf")).toBe(
			"mi-archivo-final.pdf",
		);
	});

	it("collapses multiple invalid chars into a single hyphen", () => {
		expect(safeStorageFileName("file   !!name.pdf")).toBe("file-name.pdf");
	});

	it("preserves alphanumeric chars, dots and hyphens", () => {
		expect(safeStorageFileName("Invoice_2024-01.pdf")).toBe(
			"Invoice_2024-01.pdf",
		);
	});

	it("strips leading hyphens", () => {
		expect(safeStorageFileName("---name.txt")).toBe("name.txt");
	});

	it("strips trailing hyphens", () => {
		expect(safeStorageFileName("name---")).toBe("name");
	});

	it("handles full Spanish accented filename", () => {
		expect(safeStorageFileName("Instalación eléctrica año 2024.pdf")).toBe(
			"Instalacion-electrica-ano-2024.pdf",
		);
	});

	it("returns fallback for empty or all-special-char input", () => {
		expect(safeStorageFileName("")).toBe("archivo");
		expect(safeStorageFileName("!!!")).toBe("archivo");
	});

	it("preserves extension", () => {
		expect(safeStorageFileName("contrato.final.pdf")).toBe(
			"contrato.final.pdf",
		);
	});
});
