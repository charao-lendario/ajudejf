// Vercel Serverless Function — /api/notify
// Insere cadastro pendente + envia e-mail de moderação via Resend

const { createClient } = require('@supabase/supabase-js')
const { Resend } = require('resend')
const crypto = require('crypto')

const ADMINS = ['lucascharao17@gmail.com', 'agenciagrowia@gmail.com']
const APP_URL = process.env.APP_URL || 'https://ajudejf.com.br'

function makeToken (id, tipo) {
  return crypto
    .createHmac('sha256', process.env.MODERATION_SECRET)
    .update(`${id}:${tipo}`)
    .digest('hex')
}

function makeLink (id, tipo, acao) {
  const token = makeToken(id, tipo)
  return `${APP_URL}/api/moderar?id=${id}&tipo=${tipo}&acao=${acao}&token=${token}`
}

function buildHtml (tipo, data, id) {
  const tipoLabel = tipo === 'vaquinha' ? 'Vaquinha' : 'Ponto de Doação com PIX'

  const skipValues = new Set(['', null, undefined, '— Não recebe PIX —', '— Não informar PIX —'])
  const rows = Object.entries(data)
    .filter(([, v]) => !skipValues.has(v) && v !== '')
    .map(([k, v]) => {
      const val = Array.isArray(v) ? v.join(', ') : String(v)
      return `<tr>
        <td style="padding:6px 12px;font-weight:600;color:#555;border-bottom:1px solid #eee;white-space:nowrap">${k}</td>
        <td style="padding:6px 12px;border-bottom:1px solid #eee">${val}</td>
      </tr>`
    })
    .join('')

  const aprovar = makeLink(id, tipo, 'aprovar')
  const recusar = makeLink(id, tipo, 'recusar')

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"/></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f5f5;padding:24px;margin:0">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.1)">
    <div style="background:#1a3a5c;padding:20px 24px;color:#fff">
      <div style="font-size:13px;opacity:.8;margin-bottom:4px">AJUDE JF — Moderação</div>
      <div style="font-size:20px;font-weight:700">⚠️ Nova ${tipoLabel} aguarda aprovação</div>
    </div>
    <div style="padding:24px">
      <p style="margin:0 0 16px;color:#444">Um novo cadastro do tipo <strong>${tipoLabel}</strong> foi enviado e aguarda sua revisão:</p>
      <table style="border-collapse:collapse;width:100%;background:#f9f9f9;border-radius:8px;overflow:hidden;margin-bottom:24px">
        <tbody>${rows}</tbody>
      </table>
      <div style="margin-bottom:24px;display:flex;gap:12px">
        <a href="${aprovar}"
          style="display:inline-block;background:#16a34a;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:16px;font-weight:700;margin-right:12px">
          ✅ APROVAR
        </a>
        <a href="${recusar}"
          style="display:inline-block;background:#dc2626;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:16px;font-weight:700">
          ❌ RECUSAR
        </a>
      </div>
      <p style="font-size:12px;color:#999;margin:0">ID: ${id}<br>Os botões acima agem imediatamente. Após processar, o cadastro será atualizado automaticamente.</p>
    </div>
  </div>
</body>
</html>`
}

module.exports = async function handler (req, res) {
  // CORS para desenvolvimento local
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { tipo, payload } = req.body || {}

    if (!tipo || !payload) {
      return res.status(400).json({ error: 'tipo e payload são obrigatórios' })
    }
    if (!['vaquinha', 'doacao_pix'].includes(tipo)) {
      return res.status(400).json({ error: 'Tipo inválido' })
    }

    // Cria cliente com service role (bypassa RLS)
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const tabela = tipo === 'vaquinha' ? 'vaquinhas' : 'pontos_doacao'
    const insertPayload = { ...payload, moderation_status: 'pendente' }

    const { data: inserted, error: dbErr } = await supabase
      .from(tabela)
      .insert(insertPayload)
      .select('id')
      .single()

    if (dbErr) throw new Error(`DB: ${dbErr.message}`)

    const id = inserted.id

    // Envia e-mail via Resend
    const resend = new Resend(process.env.RESEND_API_KEY)
    const tipoLabel = tipo === 'vaquinha' ? 'Vaquinha' : 'Ponto de Doação com PIX'
    const nome = payload.nome_campanha || payload.nome_local || 'Sem nome'

    await resend.emails.send({
      from: 'Ajude JF <noreply@ajudejf.com.br>',
      to: ADMINS,
      subject: `[Ajude JF] Moderar ${tipoLabel}: ${nome}`,
      html: buildHtml(tipo, payload, id),
    })

    return res.status(200).json({ ok: true, id })
  } catch (err) {
    console.error('[notify] Erro:', err)
    return res.status(500).json({ error: err.message })
  }
}
