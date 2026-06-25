// Restaura un backup JSON (generado por db-backup.mjs) en la base de datos
// Supabase. Lanzar con:
//   pnpm db:restore                       -> usa el backup mas reciente de ./backups
//   pnpm db:restore backups/backup-X.json -> usa el archivo indicado
//
// ATENCION: VACIA (TRUNCATE) las tablas del esquema public y reinserta los datos
// del backup. Sobrescribe el contenido actual. Pensado para recuperacion ante
// fallos. Requiere SUPABASE_DB_URL en .env y la dependencia "pg".

import { readFileSync, readdirSync } from "node:fs";
import pg from "pg";

const dbUrl = process.env.SUPABASE_DB_URL;
if (!dbUrl) {
	console.error("Falta SUPABASE_DB_URL en .env");
	process.exit(1);
}

let file = process.argv[2];
if (!file) {
	const files = readdirSync("backups")
		.filter((f) => f.startsWith("backup-") && f.endsWith(".json"))
		.sort();
	if (files.length === 0) {
		console.error("No hay backups en ./backups");
		process.exit(1);
	}
	file = `backups/${files[files.length - 1]}`;
}

const backup = JSON.parse(readFileSync(file, "utf8"));
const tableNames = Object.keys(backup.tables ?? {});
if (tableNames.length === 0) {
	console.error("El backup no contiene tablas.");
	process.exit(1);
}

const qIdent = (s) => `"${s.replace(/"/g, '""')}"`;
const client = new pg.Client({
	connectionString: dbUrl,
	ssl: { rejectUnauthorized: false },
});

console.log(`Restaurando desde: ${file}`);
await client.connect();
try {
	await client.query("BEGIN");
	// Desactiva triggers/constraints FK para no depender del orden de insercion.
	await client.query("SET session_replication_role = replica");

	const list = tableNames.map((t) => `"public".${qIdent(t)}`).join(", ");
	await client.query(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`);

	for (const table of tableNames) {
		const { columns, jsonColumns, rows } = backup.tables[table];
		if (!rows || rows.length === 0) continue;
		const jsonSet = new Set(jsonColumns ?? []);
		const colSql = columns.map(qIdent).join(", ");
		const maxRows = Math.max(1, Math.floor(60000 / columns.length));

		for (let i = 0; i < rows.length; i += maxRows) {
			const batch = rows.slice(i, i + maxRows);
			const values = [];
			const tuples = batch.map((row) => {
				const placeholders = columns.map((col) => {
					let v = row[col];
					if (v !== null && v !== undefined && jsonSet.has(col)) {
						v = JSON.stringify(v);
					} else if (v && typeof v === "object" && !Array.isArray(v)) {
						v = JSON.stringify(v);
					}
					values.push(v ?? null);
					return `$${values.length}`;
				});
				return `(${placeholders.join(", ")})`;
			});
			await client.query(
				`INSERT INTO "public".${qIdent(table)} (${colSql}) VALUES ${tuples.join(", ")}`,
				values,
			);
		}
		console.log(`  ${table}: ${rows.length} filas`);
	}

	await client.query("SET session_replication_role = DEFAULT");
	await client.query("COMMIT");
	console.log("Restauracion completada.");
} catch (error) {
	await client.query("ROLLBACK").catch(() => { });
	console.error("Error durante la restauracion:", error.message);
	process.exitCode = 1;
} finally {
	await client.end();
}
