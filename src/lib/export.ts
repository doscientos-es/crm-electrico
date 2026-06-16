type CsvValue = string | number | boolean | null | undefined

type CsvRow = Record<string, CsvValue>

function escapeCsvCell(value: CsvValue): string {
  const str = value == null ? '' : String(value)
  // Quote if contains delimiter, quotes, or newlines
  if (str.includes(';') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function exportToCSV(rows: CsvRow[], filename: string): void {
  if (!rows.length) return

  const headers = Object.keys(rows[0])
  const lines = [
    headers.join(';'),
    ...rows.map((row) => headers.map((h) => escapeCsvCell(row[h])).join(';')),
  ]

  // UTF-8 BOM so Excel opens with correct encoding
  const bom = '\uFEFF'
  const blob = new Blob([bom + lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
