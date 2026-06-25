// Copia de seguridad de los DATOS de la base de datos Supabase (esquema public)
// en un archivo JSON dentro de ./backups. Lanzar con: pnpm db:backup
//
// No usa Docker ni psql: se conecta directamente con el cliente "pg". El esquema
// (tablas, RLS, funciones) vive en supabase/migrations; este backup guarda los
// datos, que es lo que se pierde si algo falla. El JSON preserva los tipos.
//
// Requiere SUPABASE_DB_URL en .env (Dashboard -> Project Settings -> Database
// -> Connection string -> URI, con la contrasena, percent-encoded).

import { mkdirSync, writeFileSync } from "node:fs";
import pg from "pg";

const dbUrl = process.env.SUPABASE_DB_URL;
if (!dbUrl) {
	console.error("Falta SUPABASE_DB_URL en .env");
	process.exit(1);
}

const client = new pg.Client({
	connectionString: dbUrl,
	ssl: { rejectUnauthorized: false },
});

await client.connect();
try {
	const { rows: tableRows } = await client.query(
		`SELECT table_name FROM information_schema.tables
		 WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
		 ORDER BY table_name`,
	);
	const { rows: columnRows } = await client.query(
		`SELECT table_name, column_name, data_type FROM information_schema.columns
		 WHERE table_schema = 'public'
		 ORDER BY table_name, ordinal_position`,
	);

	const tables = {};
	let total = 0;
	for (const { table_name } of tableRows) {
		const cols = columnRows.filter((c) => c.table_name === table_name);
		const { rows } = await client.query(`SELECT * FROM "public"."${table_name}"`);
		tables[table_name] = {
			columns: cols.map((c) => c.column_name),
			jsonColumns: cols
				.filter((c) => c.data_type === "json" || c.data_type === "jsonb")
				.map((c) => c.column_name),
			rows,
		};
		total += rows.length;
		console.log(`  ${table_name}: ${rows.length} filas`);
	}

	mkdirSync("backups", { recursive: true });
	const stamp = new Date().toISOString().replace(/[:.]/g, "-");
	const outFile = `backups/backup-${stamp}.json`;
	writeFileSync(
		outFile,
		JSON.stringify({ generatedAt: new Date().toISOString(), tables }, null, 2),
	);

	console.log(
		`\nBackup creado: ${outFile} (${tableRows.length} tablas, ${total} filas)`,
	);
} catch (error) {
	console.error("Error durante el backup:", error.message);
	process.exitCode = 1;
} finally {
	await client.end();
}
