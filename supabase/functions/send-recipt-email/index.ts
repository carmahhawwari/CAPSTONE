// Sends an Inklings receipt as an email via Resend.
// POST body: { recipientEmail: string, senderName: string, message: string }
// Env vars (Project Settings → Edge Functions → Secrets):
//   RESEND_API_KEY  (required, re_… string)
//   RESEND_FROM     (optional; defaults to "Inklings <onboarding@resend.dev>")

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  let body: { recipientEmail?: string; senderName?: string; message?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  const { recipientEmail, senderName, message } = body
  if (!recipientEmail || !senderName || !message) {
    return json({ error: 'recipientEmail, senderName, and message are required' }, 400)
  }

  const apiKey = Deno.env.get('RESEND_API_KEY')
  if (!apiKey) return json({ error: 'RESEND_API_KEY not set on the function' }, 500)

  const from = Deno.env.get('RESEND_FROM') ?? 'Inklings <onboarding@resend.dev>'

  const dateStr = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const subject = `📬 ${senderName} sent you an Inklings`
  const text = `📬 ${senderName} sent you an Inklings:\n\n${message}\n\n— ${senderName}`

  const html = `<!doctype html>
<html><body style="margin:0;padding:32px 16px;background:#ece8df;font-family:Georgia,serif;color:#1a1a1a;">
  <div style="max-width:420px;margin:0 auto;background:#fbf6e6;border:1px solid #969696;padding:0;">
    <div style="border-bottom:2px solid #1a1a1a;padding:16px;text-align:center;font-size:18px;">${escapeHtml(dateStr)}</div>
    <div style="padding:16px;border-bottom:2px solid #1a1a1a;font-size:14px;font-weight:bold;">From: ${escapeHtml(senderName)}</div>
    <div style="padding:16px;font-size:14px;line-height:1.5;white-space:pre-wrap;">${escapeHtml(message)}</div>
    <div style="padding:16px;border-top:2px solid #1a1a1a;font-size:14px;">
      Love,<br/>${escapeHtml(senderName)}
    </div>
  </div>
  <p style="max-width:420px;margin:16px auto 0;font-size:11px;color:#787878;text-align:center;">
    You're receiving this because someone sent you a personal note via Inklings.
  </p>
</body></html>`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [recipientEmail],
      subject,
      html,
      text,
    }),
  })

  if (!res.ok) {
    const detail = await res.text()
    return json({ error: 'Resend send failed', status: res.status, detail }, 502)
  }

  const data = await res.json()
  return json({ ok: true, id: data.id })
})
