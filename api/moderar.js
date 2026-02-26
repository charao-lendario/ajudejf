// Vercel Serverless Function — /api/moderar
// Processa aprovação/recusa via link do e-mail

const { createClient } = require('@supabase/supabase-js')
const crypto = require('crypto')

function makeToken (id, tipo) {
  return crypto
    .createHmac('sha256', process.env.MODERATION_SECRET)
    .update(`${id}:${tipo}`)
    .digest('hex')
}

function safeCompare (a, b) {
  try {
    const bufA = Buffer.from(a, 'hex')
    const bufB = Buffer.from(b, 'hex')
    if (bufA.length !== bufB.length) return false
    return crypto.timingSafeEqual(bufA, bufB)
  } catch {
    return false
  }
}

function page (title, emoji, color, msg, extra = '') {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${title} — Ajude JF</title>
  <style>
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f5f5;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:24px;box-sizing:border-box}
    .card{background:#fff;border-radius:16px;padding:48px 40px;text-align:center;max-width:440px;width:100%;box-shadow:0 4px 24px rgba(0,0,0,.1)}
    .emoji{font-size:72px;margin-bottom:16px}
    h1{color:${color};margin:0 0 12px;font-size:28px}
    p{color:#555;margin:0 0 24px;line-height:1.5}
    a{display:inline-block;background:#2e6da4;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600}
  </style>
</head>
<body>
  <div class="card">
    <div class="emoji">${emoji}</div>
    <h1>${title}</h1>
    <p>${msg}</p>
    ${extra}
    <a href="https://ajudejf.com.br">← Voltar ao Ajude JF</a>
  </div>
</body>
</html>`
}

module.exports = async function handler (req, res) {
  const { id, tipo, acao, token } = req.query || {}

  if (!id || !tipo || !acao || !token) {
    return res.status(400).send(page(
      'Link inválido', '⚠️', '#dc2626',
      'O link de moderação está incompleto ou foi corrompido.'
    ))
  }

  if (!['aprovar', 'recusar'].includes(acao)) {
    return res.status(400).send(page(
      'Ação inválida', '⚠️', '#dc2626',
      'A ação solicitada não é reconhecida.'
    ))
  }

  if (!['vaquinha', 'doacao_pix'].includes(tipo)) {
    return res.status(400).send(page(
      'Tipo inválido', '⚠️', '#dc2626',
      'O tipo de cadastro não é reconhecido.'
    ))
  }

  // Valida token HMAC
  const expected = makeToken(id, tipo)
  if (!safeCompare(token, expected)) {
    return res.status(403).send(page(
      'Token inválido', '🔒', '#dc2626',
      'Este link de aprovação não é válido ou foi adulterado.'
    ))
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const tabela = tipo === 'vaquinha' ? 'vaquinhas' : 'pontos_doacao'
    const status = acao === 'aprovar' ? 'aprovado' : 'recusado'

    const { error } = await supabase
      .from(tabela)
      .update({ moderation_status: status })
      .eq('id', id)

    if (error) throw new Error(error.message)

    if (acao === 'aprovar') {
      return res.status(200).send(page(
        'Cadastro aprovado!', '✅', '#16a34a',
        'O cadastro foi aprovado e já está visível em <strong>Consultar</strong> na plataforma.',
      ))
    } else {
      return res.status(200).send(page(
        'Cadastro recusado', '❌', '#dc2626',
        'O cadastro foi marcado como recusado e não aparecerá na plataforma.',
      ))
    }
  } catch (err) {
    console.error('[moderar] Erro:', err)
    return res.status(500).send(page(
      'Erro interno', '💥', '#dc2626',
      `Erro ao processar: ${err.message}`
    ))
  }
}
