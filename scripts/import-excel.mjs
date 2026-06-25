import fs from "fs";
import XLSX from "xlsx";

const PROFILE_MAPPING = {
  "ROCIO LIEBANA SEGOVIA": "877d4b6c-3dea-4128-89ee-20113d0ad98f",
  "ANA MARIA ALVAREZ DE CIENFUEGOS": "032db1d9-3ec3-4715-8bb3-a7900ce97510",
  SEBASTIAN: "b637f3a8-6d2b-4518-a469-4831d866040a",
  "VALERIANO EDGARDO GALLARDO": "c869caba-9e35-4946-a37e-afab5e492ab7",
  Admin: "9fcc4013-ae6c-4333-af17-1ed96b598aa1",
};

const TYPE_MAPPING = {
  Particular: "residential",
  Empresa: "business",
  "Comunidad de Vecinos": "community",
};

const STATUS_MAPPING = {
  Activo: "active",
  "Activo FTR": "active",
  "En Trámite": "processing",
  "Pendiente CC": "pending_signature",
  Baja: "cancelled",
  Cancelado: "cancelled",
  Rechazado: "cancelled",
  Incidencia: "processing",
};

function excelDateToISO(serial) {
  if (!serial) return null;
  if (typeof serial === "number") {
    const date = new Date(Math.round((serial - 25569) * 86400 * 1000));
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString().split("T")[0];
  }
  // Try parsing as string
  const d = new Date(serial);
  if (!Number.isNaN(d.getTime())) {
    return d.toISOString().split("T")[0];
  }
  return null;
}

function clean(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === "string") return val.trim() || null;
  return val;
}

async function run() {
  const wbC = XLSX.readFile("temp/clientes.xlsx");
  const dataC = XLSX.utils
    .sheet_to_json(wbC.Sheets[wbC.SheetNames[0]], { header: 1 })
    .slice(2);

  const customers = dataC
    .map((row) => ({
      external_id: row[0],
      tax_id: clean(row[1]),
      name: clean(row[2]) || "Sin nombre",
      type: TYPE_MAPPING[row[3]] || "business",
      phone: clean(row[4]),
      email: clean(row[5]),
      assigned_to: PROFILE_MAPPING[row[6]] || null,
      notes: clean(row[7]),
      address: clean(row[8]),
      iban: clean(row[9]),
      created_at: excelDateToISO(row[10]) || new Date().toISOString(),
    }))
    .filter((c) => c.tax_id || c.name);

  const wbK = XLSX.readFile("temp/contratos.xlsx");
  const dataK = XLSX.utils
    .sheet_to_json(wbK.Sheets[wbK.SheetNames[0]], { header: 1 })
    .slice(2);

  const contracts = dataK.map((row) => {
    const rawStatus = clean(row[10]);
    const bajaDate = excelDateToISO(row[7]);
    return {
      external_id: row[0],
      provider: clean(row[3]),
      signed_at: excelDateToISO(row[4]),
      starts_at: excelDateToISO(row[6]),
      tariff_type: clean(row[8]),
      power_kw: Number.parseFloat(row[9]) || null,
      status: STATUS_MAPPING[rawStatus] || "pending_processing",
      terminated_at: rawStatus === "Baja" ? bajaDate : null,
      notes: rawStatus === "Incidencia" ? "Estado original: Incidencia" : null,
      ends_at: excelDateToISO(row[13]),
      cups: clean(row[14]),
      tax_id: clean(row[15]),
      product: clean(row[16]),
      annual_consumption_kwh: Number.parseFloat(row[18]) || null,
      supply_address: clean(row[21]),
      supply_postal_code: clean(row[22]),
      supply_city: clean(row[23]),
      supply_province: clean(row[24]),
    };
  });

  // Identify missing customers for contracts
  const existingTaxIds = new Set(
    customers.map((c) => (c.tax_id ? String(c.tax_id).toUpperCase() : null)).filter(Boolean)
  );
  const missingTaxIds = new Set();
  contracts.forEach((k) => {
    if (k.tax_id && !existingTaxIds.has(String(k.tax_id).toUpperCase())) {
      missingTaxIds.add(String(k.tax_id).toUpperCase());
    }
  });

  if (missingTaxIds.size > 0) {
    console.log(
      `Adding ${missingTaxIds.size} placeholder customers for contracts with missing tax_id: ${Array.from(
        missingTaxIds
      ).join(", ")}`
    );
    missingTaxIds.forEach((tid) => {
      customers.push({
        external_id: `MISC-${tid}`,
        tax_id: tid,
        name: `Placeholder (${tid})`,
        type: "business",
        phone: null,
        email: null,
        assigned_to: null,
        notes: "Imported automatically - customer missing from clients file",
        address: null,
        iban: null,
        created_at: new Date().toISOString(),
      });
    });
  }

  // Generate SQL for customers
  let sql = "BEGIN;\n";

  sql +=
    "CREATE TEMP TABLE customer_import (external_id text, tax_id text, name text, type text, phone text, email text, assigned_to uuid, notes text, address text, iban text, created_at timestamptz);\n";

  const custValues = customers
    .map(
      (c) =>
        `('${c.external_id.toString().replace(/'/g, "''")}', ${c.tax_id ? `'${c.tax_id.toString().replace(/'/g, "''")}'` : "NULL"
        }, '${c.name.toString().replace(/'/g, "''")}', '${c.type}', ${c.phone ? `'${c.phone.toString().replace(/'/g, "''")}'` : "NULL"
        }, ${c.email ? `'${c.email.toString().replace(/'/g, "''")}'` : "NULL"}, ${c.assigned_to ? `'${c.assigned_to}'` : "NULL"
        }, ${c.notes ? `'${c.notes.toString().replace(/'/g, "''")}'` : "NULL"}, ${c.address ? `'${c.address.toString().replace(/'/g, "''")}'` : "NULL"
        }, ${c.iban ? `'${c.iban.toString().replace(/'/g, "''")}'` : "NULL"}, '${c.created_at
        }')`,
    )
    .join(",\n");

  sql += `INSERT INTO customer_import VALUES \n${custValues};\n`;

  sql += `
    WITH inserted_customers AS (
      INSERT INTO public.customers (tax_id, name, type, phone, email, assigned_to, notes, address, iban, created_at, status)
      SELECT tax_id, name, type::customer_type, phone, email, assigned_to, notes, address, iban, created_at, 'active'::customer_status
      FROM customer_import
      RETURNING id, tax_id
    )
    SELECT * INTO TEMP customer_mapping FROM inserted_customers;
  `;

  // Now contracts
  sql +=
    "CREATE TEMP TABLE contract_import (external_id text, tax_id text, provider text, signed_at timestamptz, starts_at date, tariff_type text, power_kw numeric, status text, terminated_at date, notes text, ends_at date, cups text, product text, annual_consumption_kwh numeric, supply_address text, supply_postal_code text, supply_city text, supply_province text);\n";

  const contValues = contracts
    .map(
      (k) =>
        `('${k.external_id.toString().replace(/'/g, "''")}', ${k.tax_id ? `'${k.tax_id.toString().replace(/'/g, "''")}'` : "NULL"
        }, ${k.provider ? `'${k.provider.toString().replace(/'/g, "''")}'` : "NULL"
        }, ${k.signed_at ? `'${k.signed_at}'` : "NULL"}, ${k.starts_at ? `'${k.starts_at}'` : "NULL"
        }, ${k.tariff_type ? `'${k.tariff_type.toString().replace(/'/g, "''")}'` : "NULL"
        }, ${k.power_kw || "NULL"}, '${k.status}', ${k.terminated_at ? `'${k.terminated_at}'` : "NULL"
        }, ${k.notes ? `'${k.notes.toString().replace(/'/g, "''")}'` : "NULL"}, ${k.ends_at ? `'${k.ends_at}'` : "NULL"
        }, ${k.cups ? `'${k.cups.toString().replace(/'/g, "''")}'` : "NULL"}, ${k.product ? `'${k.product.toString().replace(/'/g, "''")}'` : "NULL"
        }, ${k.annual_consumption_kwh || "NULL"}, ${k.supply_address ? `'${k.supply_address.toString().replace(/'/g, "''")}'` : "NULL"
        }, ${k.supply_postal_code ? `'${k.supply_postal_code.toString().replace(/'/g, "''")}'` : "NULL"
        }, ${k.supply_city ? `'${k.supply_city.toString().replace(/'/g, "''")}'` : "NULL"
        }, ${k.supply_province ? `'${k.supply_province.toString().replace(/'/g, "''")}'` : "NULL"
        })`,
    )
    .join(",\n");

  sql += `INSERT INTO contract_import VALUES \n${contValues};\n`;

  sql += `
    INSERT INTO public.contracts (customer_id, provider, signed_at, starts_at, ends_at, tariff_type, power_kw, status, terminated_at, notes, cups, product, annual_consumption_kwh, supply_address, supply_postal_code, supply_city, supply_province, created_at)
    SELECT
      m.id,
      ci.provider,
      ci.signed_at,
      ci.starts_at,
      ci.ends_at,
      ci.tariff_type,
      ci.power_kw,
      ci.status,
      ci.terminated_at,
      ci.notes,
      ci.cups,
      ci.product,
      ci.annual_consumption_kwh,
      ci.supply_address,
      ci.supply_postal_code,
      ci.supply_city,
      ci.supply_province,
      now()
    FROM contract_import ci
    JOIN customer_mapping m ON m.tax_id = ci.tax_id;
  `;

  sql += "COMMIT;";

  fs.writeFileSync("temp/import.sql", sql);
  console.log("SQL generated in temp/import.sql");
}

run();

