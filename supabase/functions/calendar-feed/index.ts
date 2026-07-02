/**
 * Calendar Feed — GET /functions/v1/calendar-feed?token=<calendar_token>
 *
 * Returns a valid iCalendar (.ics) feed for the user identified by their
 * calendar_token. No Authorization header is needed — the token IS the secret.
 *
 * iPhone subscribes via:
 *   webcal://<supabase-functions-host>/calendar-feed?token=<uuid>
 * and auto-refreshes every few hours.
 */

import { createClient } from 'npm:@supabase/supabase-js@2.105.0'

// ── iCal helpers (duplicated here to avoid cross-function imports) ─────────────

function escapeIcal(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

function foldLine(line: string): string {
  if (line.length <= 75) return line
  let result = ''
  while (line.length > 75) {
    result += line.slice(0, 75) + '\r\n '
    line = line.slice(75)
  }
  return result + line
}

function isoToIcal(iso: string): string {
  return iso.replace(/[-:]/g, '').replace(/\.\d+/, '').slice(0, 15)
}

interface TaskRow {
  id: string
  title: string
  due_at: string
  description: string | null
  ical_uid: string | null
  status: string
  customer: { name: string } | null
}

function buildIcs(tasks: TaskRow[], calName: string): string {
  const now = isoToIcal(new Date().toISOString())

  const vevents = tasks.map((t) => {
    const uid = t.ical_uid ?? `${t.id}@crm-electrico`
    const start = isoToIcal(t.due_at)
    const endDate = new Date(new Date(t.due_at).getTime() + 60 * 60 * 1000)
    const end = isoToIcal(endDate.toISOString())
    const summary = t.customer ? `${t.title} – ${t.customer.name}` : t.title
    const lines = [
      'BEGIN:VEVENT',
      foldLine(`UID:${uid}`),
      `DTSTAMP:${now}Z`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      foldLine(`SUMMARY:${escapeIcal(summary)}`),
      ...(t.description ? [foldLine(`DESCRIPTION:${escapeIcal(t.description)}`)] : []),
      'END:VEVENT',
    ]
    return lines.join('\r\n')
  })

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CRM Electrico//ES',
    `X-WR-CALNAME:${escapeIcal(calName)}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    // Refresh hint: ask clients to refresh every 2 hours
    'X-PUBLISHED-TTL:PT2H',
    ...vevents,
    'END:VCALENDAR',
  ].join('\r\n') + '\r\n'
}

// ── Handler ───────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // Allow iPhone/calendar clients (no browser CORS needed)
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204 })
  }

  if (req.method !== 'GET') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  const url = new URL(req.url)
  const token = url.searchParams.get('token')

  if (!token) {
    return new Response('Missing token', { status: 400 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )

  // Resolve profile → organization
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('id, organization_id, full_name')
    .eq('calendar_token', token)
    .single()

  if (profileErr || !profile) {
    return new Response('Invalid token', { status: 401 })
  }

  // Fetch all non-cancelled future tasks for the organization
  const now = new Date().toISOString()
  const { data: tasks, error: tasksErr } = await supabase
    .from('tasks')
    .select('id, title, due_at, description, ical_uid, status, customer:customers(name)')
    .eq('organization_id', profile.organization_id)
    .neq('status', 'cancelled')
    .gte('due_at', now)
    .order('due_at', { ascending: true })
    .limit(500)

  if (tasksErr) {
    return new Response('Internal error', { status: 500 })
  }

  const calName = `CRM Agenda`
  const ics = buildIcs((tasks ?? []) as TaskRow[], calName)

  return new Response(ics, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="agenda-crm.ics"',
      // No caching — let iPhone decide refresh cadence via X-PUBLISHED-TTL
      'Cache-Control': 'no-cache',
    },
  })
})
