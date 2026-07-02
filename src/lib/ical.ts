/**
 * Minimal iCalendar (.ics) parser and generator.
 * No external dependencies — runs entirely in the browser.
 */

export interface ParsedIcalEvent {
  uid: string
  summary: string
  /** ISO datetime string (local time) */
  dtstart: string
  description?: string
}

// ── Parser ────────────────────────────────────────────────────────────────────

/**
 * Unfold RFC 5545 line continuations (CRLF or LF followed by whitespace).
 */
function unfoldLines(raw: string): string[] {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/\n[ \t]/g, '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
}

/**
 * Convert iCal datetime string to ISO local datetime.
 * Handles: 20241215T090000Z, 20241215T090000, 20241215 (all-day).
 */
function icalDateToIso(value: string): string {
  const v = value.replace('Z', '')
  if (v.includes('T')) {
    // YYYYMMDDTHHmmss
    const y = v.slice(0, 4)
    const mo = v.slice(4, 6)
    const d = v.slice(6, 8)
    const h = v.slice(9, 11)
    const mi = v.slice(11, 13)
    const s = v.slice(13, 15) || '00'
    return `${y}-${mo}-${d}T${h}:${mi}:${s}`
  }
  // All-day: YYYYMMDD → treat as 09:00
  const y = v.slice(0, 4)
  const mo = v.slice(4, 6)
  const d = v.slice(6, 8)
  return `${y}-${mo}-${d}T09:00:00`
}

/**
 * Parse a .ics file text and return an array of VEVENT objects.
 * Skips events without UID or SUMMARY (e.g. all-day holidays with no title).
 */
export function parseIcs(text: string): ParsedIcalEvent[] {
  const lines = unfoldLines(text)
  const events: ParsedIcalEvent[] = []
  let inEvent = false
  let current: Partial<ParsedIcalEvent> & { uid?: string; summary?: string; dtstart?: string } = {}

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      inEvent = true
      current = {}
      continue
    }
    if (line === 'END:VEVENT') {
      inEvent = false
      if (current.uid && current.summary && current.dtstart) {
        events.push({
          uid: current.uid,
          summary: current.summary,
          dtstart: current.dtstart,
          description: current.description,
        })
      }
      continue
    }
    if (!inEvent) continue

    // Split on first colon (value may contain colons)
    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) continue
    const prop = line.slice(0, colonIdx).toUpperCase()
    const val = line.slice(colonIdx + 1).replace(/\\n/g, '\n').replace(/\\,/g, ',').trim()

    // DTSTART may have parameters: DTSTART;TZID=Europe/Madrid:20241215T090000
    const propName = prop.split(';')[0]

    switch (propName) {
      case 'UID': current.uid = val; break
      case 'SUMMARY': current.summary = val; break
      case 'DTSTART': current.dtstart = icalDateToIso(val); break
      case 'DESCRIPTION': current.description = val || undefined; break
    }
  }

  return events
}

// ── Generator ─────────────────────────────────────────────────────────────────

function isoToIcal(iso: string): string {
  // 2024-12-15T09:00:00 → 20241215T090000
  return iso.replace(/[-:]/g, '').replace(/\.\d+/, '').slice(0, 15)
}

function escapeIcal(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

function foldLine(line: string): string {
  // RFC 5545: fold lines at 75 octets
  if (line.length <= 75) return line
  let result = ''
  while (line.length > 75) {
    result += line.slice(0, 75) + '\r\n '
    line = line.slice(75)
  }
  return result + line
}

export interface IcalExportTask {
  id: string
  title: string
  due_at: string
  description?: string | null
  ical_uid?: string | null
}

export function generateIcs(tasks: IcalExportTask[], calName = 'CRM Agenda'): string {
  const now = isoToIcal(new Date().toISOString())
  const vevents = tasks.map((t) => {
    const uid = t.ical_uid ?? `${t.id}@crm-electrico`
    const start = isoToIcal(t.due_at)
    // Default duration: 1 hour
    const endDate = new Date(new Date(t.due_at).getTime() + 60 * 60 * 1000)
    const end = isoToIcal(endDate.toISOString())
    const lines = [
      'BEGIN:VEVENT',
      foldLine(`UID:${uid}`),
      `DTSTAMP:${now}Z`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      foldLine(`SUMMARY:${escapeIcal(t.title)}`),
      ...(t.description ? [foldLine(`DESCRIPTION:${escapeIcal(t.description)}`)] : []),
      'END:VEVENT',
    ]
    return lines.join('\r\n')
  })

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CRM Electrico//ES',
    `X-WR-CALNAME:${calName}`,
    'CALSCALE:GREGORIAN',
    ...vevents,
    'END:VCALENDAR',
  ].join('\r\n') + '\r\n'
}

export function downloadIcs(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
