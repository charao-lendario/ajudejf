import './style.css'
import { supabase } from './supabase.js'
import {
  createIcons,
  Home, Package, Search, Utensils, Building2, HandHeart,
  PenLine, Shield, Flame, HeartPulse,
  AlertTriangle, Info, CheckCircle2, Clipboard,
  Bed, Clock, Users, Banknote, MapPin,
  Droplet, Droplets, Shirt, Baby, Coffee, Moon, Sandwich,
  Car, ChefHat, Dumbbell, Brain, Smartphone,
  Pill, Cross, PawPrint, Cake, FileText, Brush, Wheat,
  Stethoscope, Heart, Gift,
  Camera, X, QrCode, ZoomIn, Dog, ImagePlus,
} from 'lucide'

const ICONS = {
  Home, Package, Search, Utensils, Building2, HandHeart,
  PenLine, Shield, Flame, HeartPulse,
  AlertTriangle, Info, CheckCircle2, Clipboard,
  Bed, Clock, Users, Banknote, MapPin,
  Droplet, Droplets, Shirt, Baby, Coffee, Moon, Sandwich,
  Car, ChefHat, Dumbbell, Brain, Smartphone,
  Pill, Cross, PawPrint, Cake, FileText, Brush, Wheat,
  Stethoscope, Heart, Gift,
  Camera, X, QrCode, ZoomIn, Dog, ImagePlus,
}

function initIcons (root = document) {
  createIcons({ icons: ICONS, root })
}

// ── PIX LIGHTBOX (consulta) ──
window.openPixLightbox = function (url) {
  let overlay = document.getElementById('pix-lightbox')
  if (!overlay) {
    overlay = document.createElement('div')
    overlay.id = 'pix-lightbox'
    overlay.className = 'pix-lightbox-overlay'
    overlay.innerHTML = `
      <div class="pix-lightbox-content">
        <button class="pix-lightbox-close" onclick="window.closePixLightbox()">&times;</button>
        <p class="pix-lightbox-hint">Escaneie o QR Code abaixo para fazer o PIX</p>
        <img class="pix-lightbox-img" alt="QR Code PIX" />
        <button class="pix-lightbox-download" onclick="window.open(document.querySelector('.pix-lightbox-img').src, '_blank')">
          Abrir imagem em nova aba
        </button>
      </div>`
    document.body.appendChild(overlay)
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) window.closePixLightbox()
    })
  }
  overlay.querySelector('.pix-lightbox-img').src = url
  overlay.classList.add('active')
  document.body.style.overflow = 'hidden'
}

window.closePixLightbox = function () {
  const overlay = document.getElementById('pix-lightbox')
  if (overlay) {
    overlay.classList.remove('active')
    document.body.style.overflow = ''
  }
}

// ── PIX QR CODE UPLOAD ──
window.removePixImage = function (formId) {
  const fileInput = document.getElementById('pix-file-' + formId)
  const previewDiv = document.getElementById('pix-preview-' + formId)
  const uploadLabel = previewDiv.previousElementSibling
  fileInput.value = ''
  previewDiv.style.display = 'none'
  uploadLabel.style.display = 'flex'
}

function setupPixUpload (formId) {
  const fileInput = document.getElementById('pix-file-' + formId)
  if (!fileInput) return
  fileInput.addEventListener('change', function () {
    const file = this.files[0]
    if (!file) return
    if (file.size > 512000) {
      alert('A imagem deve ter no máximo 500KB.')
      this.value = ''
      return
    }
    if (!file.type.startsWith('image/')) {
      alert('Formato não suportado. Use uma imagem.')
      this.value = ''
      return
    }
    const reader = new FileReader()
    reader.onload = function (e) {
      const previewDiv = document.getElementById('pix-preview-' + formId)
      const previewImg = document.getElementById('pix-preview-img-' + formId)
      const uploadLabel = previewDiv.previousElementSibling
      previewImg.src = e.target.result
      previewDiv.style.display = 'flex'
      uploadLabel.style.display = 'none'
      initIcons(previewDiv)
    }
    reader.readAsDataURL(file)
  })
}

function readFileAsBase64 (file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// ── FOTO UPLOAD (ONG/Protetor e Pet Perdido) ──
window.removeFotoImage = function (formId) {
  const fileInput = document.getElementById('foto-file-' + formId)
  const previewDiv = document.getElementById('foto-preview-' + formId)
  const uploadLabel = previewDiv.previousElementSibling
  fileInput.value = ''
  previewDiv.style.display = 'none'
  uploadLabel.style.display = 'flex'
}

function setupFotoUpload (formId) {
  const fileInput = document.getElementById('foto-file-' + formId)
  if (!fileInput) return
  fileInput.addEventListener('change', function () {
    const file = this.files[0]
    if (!file) return
    if (file.size > 2097152) {
      alert('A imagem deve ter no máximo 2MB.')
      this.value = ''
      return
    }
    if (!file.type.startsWith('image/')) {
      alert('Formato não suportado. Use uma imagem.')
      this.value = ''
      return
    }
    const reader = new FileReader()
    reader.onload = function (e) {
      const previewDiv = document.getElementById('foto-preview-' + formId)
      const previewImg = document.getElementById('foto-preview-img-' + formId)
      const uploadLabel = previewDiv.previousElementSibling
      previewImg.src = e.target.result
      previewDiv.style.display = 'flex'
      uploadLabel.style.display = 'none'
      initIcons(previewDiv)
    }
    reader.readAsDataURL(file)
  })
}

// ── FOTO LIGHTBOX (consulta) ──
window.openFotoLightbox = function (url, hint) {
  let overlay = document.getElementById('foto-lightbox')
  if (!overlay) {
    overlay = document.createElement('div')
    overlay.id = 'foto-lightbox'
    overlay.className = 'pix-lightbox-overlay'
    overlay.innerHTML = `
      <div class="pix-lightbox-content" style="max-width:480px">
        <button class="pix-lightbox-close" onclick="window.closeFotoLightbox()">&times;</button>
        <p class="pix-lightbox-hint" id="foto-lightbox-hint"></p>
        <img class="pix-lightbox-img" alt="Foto" style="max-width:400px;border-color:var(--blue-main)" />
        <button class="pix-lightbox-download" onclick="window.open(document.querySelector('#foto-lightbox .pix-lightbox-img').src, '_blank')">
          Abrir imagem em nova aba
        </button>
      </div>`
    document.body.appendChild(overlay)
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) window.closeFotoLightbox()
    })
  }
  overlay.querySelector('#foto-lightbox-hint').textContent = hint || 'Foto'
  overlay.querySelector('.pix-lightbox-img').src = url
  overlay.classList.add('active')
  document.body.style.overflow = 'hidden'
}

window.closeFotoLightbox = function () {
  const overlay = document.getElementById('foto-lightbox')
  if (overlay) {
    overlay.classList.remove('active')
    document.body.style.overflow = ''
  }
}

// ── STATE ──
const state = {
  city: '',
  type: '',
  data: {},
  pendingModeration: false
}

const typeLabels = {
  abrigo:        'Abrigo',
  doacao:        'Ponto de Doação',
  desaparecido:  'Pessoa Desaparecida',
  alimentacao:   'Ponto de Alimentação',
  comunidade:    'Comunidade / Bairro',
  voluntario:    'Oferecer Ajuda',
  vaquinha:      'Vaquinha',
  doador:        'Quero Doar',
  ong_protetor:  'ONG / Protetor',
  pet_perdido:   'Pet Perdido'
}

// ── NAVIGATION ──
window.goStep = function (n) {
  document.querySelectorAll('.step').forEach(s => s.classList.remove('active'))
  document.getElementById('step-' + n).classList.add('active')
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

window.selectCity = function (city) {
  state.city = city
  document.getElementById('selected-city-label').textContent = city
  document.getElementById('ctx-city').textContent = city
  goStep(2)
}

window.selectType = function (type) {
  state.type = type
  document.getElementById('ctx-type').textContent = typeLabels[type] || type

  document.querySelectorAll('.form-type').forEach(f => f.style.display = 'none')
  const form = document.getElementById('form-' + type)
  if (form) form.style.display = 'block'

  goStep(3)
}

// ── MAPA: tipo → tabela e campos ──
const TIPO_TABELA = {
  abrigo:        'abrigos',
  doacao:        'pontos_doacao',
  desaparecido:  'desaparecidos',
  alimentacao:   'pontos_alimentacao',
  comunidade:    'comunidades',
  voluntario:    'voluntarios',
  vaquinha:      'vaquinhas',
  doador:        'doadores',
  ong_protetor:  'ongs_protetores',
  pet_perdido:   'pets_perdidos'
}

// Campos que devem virar arrays (checkboxes múltiplos)
const CAMPOS_ARRAY = new Set([
  'recursos', 'aceita', 'refeicao', 'necessidades', 'habilidade', 'oferece', 'animais_aceitos'
])

// Mapa de nomes de campo do form → coluna da tabela
const CAMPO_COLUNA = {
  refeicao:     'refeicoes',
  habilidade:   'habilidades',
  pix_tipo:     'pix_tipo',
  pix_chave:    'pix_chave',
  pix_titular:  'pix_titular',
  ultima_vez:      'ultima_vez_visto',
  saude:           'condicao_saude',
  informante_nome: 'informante_nome',
  informante_tel:  'informante_tel',
  contato_nome:    'contato_nome',
  contato_tel:     'contato_tel',
}

// Carrega cidade_id a partir do nome (cache simples)
const cidadeCache = {}
async function getCidadeId(nome) {
  if (cidadeCache[nome]) return cidadeCache[nome]
  const { data, error } = await supabase
    .from('cidades')
    .select('id')
    .eq('nome', nome)
    .single()
  if (error || !data) throw new Error(`Cidade não encontrada: ${nome}`)
  cidadeCache[nome] = data.id
  return data.id
}

// ── FORM SUBMIT ──
window.submitForm = async function (event, tipo) {
  event.preventDefault()
  const form = event.target
  const submitBtn = form.querySelector('[type="submit"]')

  const originalText = submitBtn.innerHTML
  submitBtn.innerHTML = 'Salvando...'
  submitBtn.disabled = true

  const existingError = form.querySelector('.form-error')
  if (existingError) existingError.remove()

  const PIX_SKIP = new Set(['— Não recebe PIX —', '— Não informar PIX —'])

  try {
    const cidade_id = await getCidadeId(state.city)
    const formRaw = collectFormData(form)
    state.data = formRaw

    // Monta payload limpo
    function buildPayload (base) {
      const p = { ...base }
      for (const [key, val] of Object.entries(formRaw)) {
        if (val === null || val === undefined || val === '' || PIX_SKIP.has(val)) continue
        const coluna = CAMPO_COLUNA[key] || key
        p[coluna] = CAMPOS_ARRAY.has(key)
          ? (Array.isArray(val) ? val : [val])
          : val
      }
      return p
    }

    // Lê imagem QR Code PIX se presente
    const pixFileInput = form.querySelector('input[name="pix_qrcode"]')
    const pixFile = pixFileInput && pixFileInput.files[0]
    let pixImageBase64 = null
    if (pixFile) {
      pixImageBase64 = await readFileAsBase64(pixFile)
    }

    // Detecta se precisa de moderação
    const hasPix = formRaw.pix_chave && formRaw.pix_chave.trim() !== ''
    const hasPixImage = !!pixFile
    const needsModeration = tipo === 'vaquinha' || (tipo === 'doacao' && (hasPix || hasPixImage))

    // Lê foto se presente (ONG/Protetor e Pet Perdido)
    const fotoFileInput = form.querySelector('input[name="foto"]')
    const fotoFile = fotoFileInput && fotoFileInput.files[0]
    let fotoImageBase64 = null
    if (fotoFile) {
      fotoImageBase64 = await readFileAsBase64(fotoFile)
    }

    if (needsModeration) {
      // ── Envia para API (Resend + insert pendente) ──
      const apiTipo = tipo === 'vaquinha' ? 'vaquinha' : 'doacao_pix'
      const payload = buildPayload({ cidade_id })
      const apiBody = { tipo: apiTipo, payload }
      if (pixImageBase64) apiBody.pix_qrcode_base64 = pixImageBase64

      const resp = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiBody)
      })

      if (!resp.ok) {
        const errBody = await resp.json().catch(() => ({}))
        throw new Error(errBody.error || `Erro ${resp.status} ao enviar para moderação`)
      }

      state.pendingModeration = true
    } else if (fotoImageBase64 && (tipo === 'ong_protetor' || tipo === 'pet_perdido')) {
      // ── Insert com foto via API (upload server-side) ──
      const payload = buildPayload({ cidade_id })
      const bucket = tipo === 'ong_protetor' ? 'fotos-ongs' : 'fotos-pets'
      const apiBody = { tipo: tipo, payload, foto_base64: fotoImageBase64, bucket }

      const resp = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiBody)
      })

      if (!resp.ok) {
        const errBody = await resp.json().catch(() => ({}))
        throw new Error(errBody.error || `Erro ${resp.status} ao salvar`)
      }

      state.pendingModeration = false
    } else {
      // ── Insert direto no Supabase ──
      const payload = buildPayload({ cidade_id })
      const tabela = TIPO_TABELA[tipo]
      const { error } = await supabase.from(tabela).insert(payload)
      if (error) throw error
      state.pendingModeration = false
    }

    // Atualiza mensagem do step-4 conforme moderação
    const titleEl = document.getElementById('success-title')
    const descEl  = document.getElementById('success-desc')
    if (state.pendingModeration) {
      if (titleEl) titleEl.textContent = 'Enviado para aprovação!'
      if (descEl)  descEl.textContent  = 'Seus dados foram enviados e estão aguardando moderação. A equipe será notificada por e-mail e o cadastro aparecerá em Consultar após aprovação.'
    } else {
      if (titleEl) titleEl.textContent = 'Cadastro registrado!'
      if (descEl)  descEl.textContent  = 'Seus dados foram salvos com sucesso. Compartilhe pelo WhatsApp para ampliar o alcance e facilitar a coordenação.'
    }

    const summary = buildSummary(state.city, tipo, formRaw)
    document.getElementById('summary-text').textContent = summary

    // Limpa o formulário após envio bem-sucedido
    form.reset()
    document.querySelectorAll('.pix-preview').forEach(p => { p.style.display = 'none' })
    document.querySelectorAll('.pix-upload-label').forEach(l => { l.style.display = 'flex' })
    document.querySelectorAll('.foto-preview').forEach(p => { p.style.display = 'none' })
    document.querySelectorAll('.foto-upload-label').forEach(l => { l.style.display = 'flex' })

    goStep(4)

  } catch (err) {
    submitBtn.innerHTML = originalText
    submitBtn.disabled = false
    const errEl = document.createElement('div')
    errEl.className = 'alert alert-warning form-error'
    errEl.style.marginTop = '16px'
    errEl.innerHTML = `<span><i data-lucide="alert-triangle" class="icon-sm"></i></span><span>Erro ao salvar: ${err.message}. Tente novamente.</span>`
    form.appendChild(errEl)
    initIcons(errEl)
  }
}

// ── COLLECT FORM DATA ──
function collectFormData(form) {
  const formData = new FormData(form)
  const data = {}
  formData.forEach((value, key) => {
    if (value instanceof File) return
    if (data[key]) {
      if (!Array.isArray(data[key])) data[key] = [data[key]]
      data[key].push(value)
    } else {
      data[key] = value
    }
  })
  return data
}

// ── BUILD SUMMARY ──
function buildSummary(city, type, data) {
  const now = new Date().toLocaleString('pt-BR')
  const lines = []
  lines.push('=== AJUDE JF — ' + (typeLabels[type] || type).toUpperCase() + ' ===')
  lines.push('📍 Cidade: ' + city)
  lines.push('📅 Data/hora: ' + now)
  lines.push('')

  const labelMap = {
    nome_local:       'Local',
    nome_pessoa:      'Nome da pessoa',
    nome_campanha:    'Nome da campanha',
    nome:             'Nome',
    responsavel:      'Responsável',
    telefone:         'Telefone/WhatsApp',
    endereco:         'Endereço',
    vagas:            'Vagas disponíveis',
    recursos:         'Recursos disponíveis',
    animais:          'Aceita animais',
    necessidades:     'Necessidades AGORA',
    nao_precisa:      'NÃO precisa',
    prioridade:       'Prioridade',
    horario:          'Horário',
    aceita:           'O que aceita',
    pix_tipo:         'Tipo da chave PIX',
    pix_chave:        'Chave PIX',
    pix_titular:      'Titular PIX',
    refeicao:         'Tipo de refeição',
    voluntarios:      'Precisa voluntários',
    capacidade:       'Capacidade',
    familias:         'Famílias afetadas',
    descricao:        'Descrição',
    ultima_vez:       'Última vez visto',
    local_visto:      'Local visto',
    saude:            'Condição de saúde',
    informante_nome:  'Informante',
    informante_tel:   'Tel. informante',
    relacao:          'Relação',
    idade:            'Idade',
    bairro:           'Bairro',
    veiculo:          'Veículo',
    habilidade:       'Habilidades',
    disponibilidade:  'Disponibilidade',
    link_vakinha:     'Link da vaquinha',
    oferece:          'O que deseja doar',
    nome_pet:         'Nome do pet',
    especie:          'Espécie',
    raca:             'Raça',
    cor:              'Cor',
    local_visto:      'Onde foi visto',
    contato_nome:     'Contato',
    contato_tel:      'Tel. contato',
    animais_aceitos:  'Animais que aceita',
    tipo:             'Tipo',
    obs:              'Observações'
  }

  for (const [key, val] of Object.entries(data)) {
    if (!val || val === '' || val === '— Não recebe PIX —') continue
    const label = labelMap[key] || key
    const value = Array.isArray(val) ? val.join(', ') : val
    lines.push('• ' + label + ': ' + value)
  }

  lines.push('')
  lines.push('Registrado em ajudejf.com.br')
  return lines.join('\n')
}

// ── SHARE ──
window.shareWhatsApp = function () {
  const text = document.getElementById('summary-text').textContent
  window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank')
}

window.copyText = function () {
  const text = document.getElementById('summary-text').textContent
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => alert('Texto copiado!'))
  } else {
    const el = document.createElement('textarea')
    el.value = text
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
    alert('Texto copiado!')
  }
}

window.newEntry = function () {
  document.querySelectorAll('.form-type').forEach(f => {
    f.reset()
    f.style.display = 'none'
    const err = f.querySelector('.form-error')
    if (err) err.remove()
  })
  document.querySelectorAll('.pix-preview').forEach(p => { p.style.display = 'none' })
  document.querySelectorAll('.pix-upload-label').forEach(l => { l.style.display = 'flex' })
  document.querySelectorAll('.foto-preview').forEach(p => { p.style.display = 'none' })
  document.querySelectorAll('.foto-upload-label').forEach(l => { l.style.display = 'flex' })
  state.city = ''
  state.type = ''
  state.data = {}
  state.pendingModeration = false
  goStep(1)
}

// ═══════════════════════════════════════════════════════
// VIEWS — HOME / CADASTRAR / CONSULTAR
// ═══════════════════════════════════════════════════════

window.showView = function (view) {
  document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'))
  document.getElementById('view-' + view).classList.add('active')
  window.scrollTo({ top: 0, behavior: 'smooth' })
  if (view === 'consultar') loadConsulta()
  if (view === 'cadastrar') window.goStep(1)
}

// Inicializa ícones e uploads no carregamento
initIcons()
setupPixUpload('doacao')
setupPixUpload('vaquinha')
setupFotoUpload('ong_protetor')
setupFotoUpload('pet_perdido')

// ═══════════════════════════════════════════════════════
// CONSULTA — HELPERS
// ═══════════════════════════════════════════════════════

function esc (str) {
  if (str == null) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatWpp (tel) {
  if (!tel) return ''
  const d = tel.replace(/\D/g, '')
  return d.length >= 10 ? '55' + d.slice(-11) : d
}

function formatDate (dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

function chips (arr) {
  if (!arr || arr.length === 0) return ''
  return `<div class="rc-chips">${arr.map(v => `<span class="chip">${esc(v)}</span>`).join('')}</div>`
}

function prioBadge (p) {
  const map = { Alta: 'badge-red', Média: 'badge-gold', Baixa: 'badge-green' }
  return p ? `<span class="badge ${map[p] || ''}">${esc(p)}</span>` : ''
}

function wppBtn (tel, label = 'WhatsApp') {
  if (!tel) return ''
  return `<a href="https://wa.me/${formatWpp(tel)}" target="_blank" rel="noopener" class="rc-wpp">📱 ${label}</a>`
}

// ═══════════════════════════════════════════════════════
// CONSULTA — CARDS POR TABELA
// ═══════════════════════════════════════════════════════

function cardAbrigo (item, cidade) {
  return `
    <div class="result-card">
      <div class="rc-header">
        <div class="rc-title">${esc(item.nome_local)}</div>
        ${prioBadge(item.prioridade)}
      </div>
      <div class="rc-city"><i data-lucide="map-pin" class="icon-xs"></i> ${esc(cidade)} — ${esc(item.endereco)}</div>
      <div class="rc-body">
        ${item.vagas ? `<div class="rc-row"><i data-lucide="bed" class="icon-xs"></i> <strong>${item.vagas}</strong> vagas disponíveis</div>` : ''}
        ${item.aceita_animais ? `<div class="rc-row"><i data-lucide="paw-print" class="icon-xs"></i> Animais: ${esc(item.aceita_animais)}</div>` : ''}
        ${item.necessidades ? `<div class="rc-row rc-needs"><i data-lucide="alert-triangle" class="icon-xs"></i> Precisa agora: ${esc(item.necessidades)}</div>` : ''}
        ${chips(item.recursos)}
      </div>
      ${wppBtn(item.telefone)}
    </div>`
}

function cardDoacao (item, cidade) {
  return `
    <div class="result-card">
      <div class="rc-header">
        <div class="rc-title">${esc(item.nome_local)}</div>
      </div>
      <div class="rc-city"><i data-lucide="map-pin" class="icon-xs"></i> ${esc(cidade)} — ${esc(item.endereco)}</div>
      <div class="rc-body">
        ${item.horario ? `<div class="rc-row"><i data-lucide="clock" class="icon-xs"></i> ${esc(item.horario)}</div>` : ''}
        ${chips(item.aceita)}
        ${item.pix_chave ? `<div class="rc-row rc-pix"><i data-lucide="banknote" class="icon-xs"></i> PIX (${esc(item.pix_tipo)}): <strong>${esc(item.pix_chave)}</strong>${item.pix_titular ? ` — ${esc(item.pix_titular)}` : ''}</div>` : ''}
        ${item.pix_qrcode_url ? `<button class="rc-pix-qr-btn" onclick="window.openPixLightbox('${esc(item.pix_qrcode_url)}')"><i data-lucide="qr-code" class="icon-xs"></i> Ver QR Code PIX <i data-lucide="zoom-in" class="icon-xs"></i></button>` : ''}
      </div>
      ${wppBtn(item.telefone)}
    </div>`
}

function cardDesaparecido (item, cidade) {
  return `
    <div class="result-card result-card-urgente">
      <div class="rc-header">
        <div class="rc-title">${esc(item.nome_pessoa)}</div>
        <span class="badge badge-red">Desaparecido</span>
      </div>
      <div class="rc-city"><i data-lucide="map-pin" class="icon-xs"></i> ${esc(cidade)}</div>
      <div class="rc-body">
        ${item.idade ? `<div class="rc-row"><i data-lucide="cake" class="icon-xs"></i> ${item.idade} anos</div>` : ''}
        <div class="rc-row"><i data-lucide="file-text" class="icon-xs"></i> ${esc(item.descricao)}</div>
        ${item.ultima_vez_visto ? `<div class="rc-row"><i data-lucide="clock" class="icon-xs"></i> Última vez: ${formatDate(item.ultima_vez_visto)}${item.local_visto ? ` — ${esc(item.local_visto)}` : ''}</div>` : ''}
        ${item.condicao_saude ? `<div class="rc-row rc-needs"><i data-lucide="stethoscope" class="icon-xs"></i> Saúde: ${esc(item.condicao_saude)}</div>` : ''}
      </div>
      <div class="rc-footer-info">Informante: ${esc(item.informante_nome)}</div>
      ${wppBtn(item.informante_tel, 'Contatar informante')}
    </div>`
}

function cardAlimentacao (item, cidade) {
  return `
    <div class="result-card">
      <div class="rc-header">
        <div class="rc-title">${esc(item.nome_local)}</div>
        ${item.precisa_voluntarios === 'Sim, urgente' ? '<span class="badge badge-red">Voluntários urgente</span>' : ''}
      </div>
      <div class="rc-city"><i data-lucide="map-pin" class="icon-xs"></i> ${esc(cidade)} — ${esc(item.endereco)}</div>
      <div class="rc-body">
        ${item.horario ? `<div class="rc-row"><i data-lucide="clock" class="icon-xs"></i> ${esc(item.horario)}</div>` : ''}
        ${item.capacidade ? `<div class="rc-row"><i data-lucide="users" class="icon-xs"></i> ${esc(item.capacidade)}</div>` : ''}
        ${chips(item.refeicoes)}
        ${item.necessidades ? `<div class="rc-row rc-needs"><i data-lucide="alert-triangle" class="icon-xs"></i> Precisa: ${esc(item.necessidades)}</div>` : ''}
      </div>
      ${wppBtn(item.telefone)}
    </div>`
}

function cardComunidade (item, cidade) {
  return `
    <div class="result-card">
      <div class="rc-header">
        <div class="rc-title">${esc(item.nome_local)}</div>
        ${prioBadge(item.prioridade)}
      </div>
      <div class="rc-city"><i data-lucide="map-pin" class="icon-xs"></i> ${esc(cidade)} — ${esc(item.endereco)}</div>
      <div class="rc-body">
        ${item.familias ? `<div class="rc-row"><i data-lucide="users" class="icon-xs"></i> ~${item.familias} famílias afetadas</div>` : ''}
        ${chips(item.necessidades)}
        ${item.obs ? `<div class="rc-row">${esc(item.obs)}</div>` : ''}
      </div>
      ${wppBtn(item.telefone)}
    </div>`
}

function cardVoluntario (item, cidade) {
  return `
    <div class="result-card result-card-voluntario">
      <div class="rc-header">
        <div class="rc-title">${esc(item.nome)}</div>
        ${item.veiculo && item.veiculo !== 'Não' ? `<span class="badge badge-blue">${esc(item.veiculo)}</span>` : ''}
      </div>
      <div class="rc-city"><i data-lucide="map-pin" class="icon-xs"></i> ${esc(cidade)}${item.bairro ? ` — ${esc(item.bairro)}` : ''}</div>
      <div class="rc-body">
        ${chips(item.habilidades)}
        ${item.disponibilidade ? `<div class="rc-row"><i data-lucide="clock" class="icon-xs"></i> ${esc(item.disponibilidade)}</div>` : ''}
      </div>
      ${wppBtn(item.telefone)}
    </div>`
}

function cardVaquinha (item, cidade) {
  return `
    <div class="result-card">
      <div class="rc-header">
        <div class="rc-title">${esc(item.nome_campanha)}</div>
        <span class="badge badge-blue">Vaquinha</span>
      </div>
      <div class="rc-city"><i data-lucide="map-pin" class="icon-xs"></i> ${esc(cidade)}</div>
      <div class="rc-body">
        ${item.descricao ? `<div class="rc-row">${esc(item.descricao)}</div>` : ''}
        ${item.pix_chave ? `<div class="rc-row rc-pix"><i data-lucide="banknote" class="icon-xs"></i> PIX (${esc(item.pix_tipo)}): <strong>${esc(item.pix_chave)}</strong>${item.pix_titular ? ` — ${esc(item.pix_titular)}` : ''}</div>` : ''}
        ${item.pix_qrcode_url ? `<button class="rc-pix-qr-btn" onclick="window.openPixLightbox('${esc(item.pix_qrcode_url)}')"><i data-lucide="qr-code" class="icon-xs"></i> Ver QR Code PIX <i data-lucide="zoom-in" class="icon-xs"></i></button>` : ''}
      </div>
      <a href="${esc(item.link_vakinha)}" target="_blank" rel="noopener noreferrer" class="rc-wpp">🔗 Acessar Vaquinha</a>
      ${wppBtn(item.telefone)}
    </div>`
}

function cardDoador (item, cidade) {
  return `
    <div class="result-card result-card-voluntario">
      <div class="rc-header">
        <div class="rc-title">${esc(item.nome)}</div>
        <span class="badge badge-green">Quero Doar</span>
      </div>
      <div class="rc-city"><i data-lucide="map-pin" class="icon-xs"></i> ${esc(cidade)}${item.bairro ? ` — ${esc(item.bairro)}` : ''}</div>
      <div class="rc-body">
        ${chips(item.oferece)}
        ${item.obs ? `<div class="rc-row">${esc(item.obs)}</div>` : ''}
      </div>
      ${wppBtn(item.telefone)}
    </div>`
}

function cardOngProtetor (item, cidade) {
  const fotoHtml = item.foto_url
    ? `<div class="rc-foto-avatar" onclick="window.openFotoLightbox('${esc(item.foto_url)}', '${esc(item.nome)}')">
        <img src="${esc(item.foto_url)}" alt="${esc(item.nome)}" />
       </div>`
    : ''
  return `
    <div class="result-card result-card-ong">
      ${fotoHtml}
      <div class="rc-header">
        <div class="rc-title">${esc(item.nome)}</div>
        <span class="badge badge-blue">${esc(item.tipo)}</span>
      </div>
      <div class="rc-city"><i data-lucide="map-pin" class="icon-xs"></i> ${esc(cidade)}${item.endereco ? ` — ${esc(item.endereco)}` : ''}</div>
      <div class="rc-body">
        <div class="rc-row">${esc(item.descricao)}</div>
        ${chips(item.animais_aceitos)}
        ${item.capacidade ? `<div class="rc-row"><i data-lucide="users" class="icon-xs"></i> Capacidade: ${esc(item.capacidade)}</div>` : ''}
        ${item.necessidades ? `<div class="rc-row rc-needs"><i data-lucide="alert-triangle" class="icon-xs"></i> Precisa: ${esc(item.necessidades)}</div>` : ''}
      </div>
      ${wppBtn(item.telefone)}
    </div>`
}

function cardPetPerdido (item, cidade) {
  const fotoHtml = item.foto_url
    ? `<div class="rc-foto-pet" onclick="window.openFotoLightbox('${esc(item.foto_url)}', '${esc(item.nome_pet)}')">
        <img src="${esc(item.foto_url)}" alt="${esc(item.nome_pet)}" />
       </div>`
    : ''
  const statusBadge = item.status === 'encontrado'
    ? '<span class="badge badge-green">Encontrado</span>'
    : '<span class="badge badge-red">Perdido</span>'
  return `
    <div class="result-card result-card-pet">
      ${fotoHtml}
      <div class="rc-header">
        <div class="rc-title">${esc(item.nome_pet)}</div>
        ${statusBadge}
      </div>
      <div class="rc-city"><i data-lucide="map-pin" class="icon-xs"></i> ${esc(cidade)}${item.local_visto ? ` — ${esc(item.local_visto)}` : ''}</div>
      <div class="rc-body">
        <div class="rc-row"><i data-lucide="paw-print" class="icon-xs"></i> ${esc(item.especie)}${item.raca ? ` — ${esc(item.raca)}` : ''} — ${esc(item.cor)}</div>
        <div class="rc-row"><i data-lucide="file-text" class="icon-xs"></i> ${esc(item.descricao)}</div>
        ${item.ultima_vez_visto ? `<div class="rc-row"><i data-lucide="clock" class="icon-xs"></i> Última vez: ${formatDate(item.ultima_vez_visto)}</div>` : ''}
      </div>
      <div class="rc-footer-info">Contato: ${esc(item.contato_nome)}</div>
      ${wppBtn(item.contato_tel, 'Contatar')}
    </div>`
}

const TABELA_CONFIG = {
  abrigos:            { icon: 'home',        label: 'Abrigos',           card: cardAbrigo },
  pontos_doacao:      { icon: 'package',     label: 'Pontos de Doação',  card: cardDoacao },
  desaparecidos:      { icon: 'search',      label: 'Desaparecidos',     card: cardDesaparecido },
  pontos_alimentacao: { icon: 'utensils',    label: 'Alimentação',       card: cardAlimentacao },
  comunidades:        { icon: 'building-2',  label: 'Comunidades',       card: cardComunidade },
  voluntarios:        { icon: 'hand-heart',  label: 'Voluntários',       card: cardVoluntario },
  vaquinhas:          { icon: 'heart',       label: 'Vaquinhas',         card: cardVaquinha },
  doadores:           { icon: 'gift',        label: 'Quero Doar',        card: cardDoador },
  ongs_protetores:    { icon: 'paw-print',   label: 'ONGs / Protetores', card: cardOngProtetor },
  pets_perdidos:      { icon: 'search',      label: 'Pets Perdidos',     card: cardPetPerdido },
}

// ═══════════════════════════════════════════════════════
// CONSULTA — LOAD & RENDER
// ═══════════════════════════════════════════════════════

window.loadConsulta = async function () {
  const cityFilter = document.getElementById('filter-city').value
  const typeFilter = document.getElementById('filter-type').value
  const elLoading  = document.getElementById('consulta-loading')
  const elEmpty    = document.getElementById('consulta-empty')
  const elError    = document.getElementById('consulta-error')
  const elResults  = document.getElementById('consulta-results')

  elLoading.style.display = 'flex'
  elEmpty.style.display   = 'none'
  elError.style.display   = 'none'
  elResults.innerHTML     = ''

  try {
    const { data: cidades } = await supabase.from('cidades').select('id, nome')
    const cidadeMap = {}
    ;(cidades || []).forEach(c => { cidadeMap[c.id] = c.nome })

    const tables = typeFilter ? [typeFilter] : Object.keys(TABELA_CONFIG)
    let totalItems = 0
    let html = ''

    for (const table of tables) {
      let query = supabase.from(table).select('*').order('created_at', { ascending: false }).limit(100)

      if (cityFilter) {
        const cidadeId = (cidades || []).find(c => c.nome === cityFilter)?.id
        if (cidadeId) query = query.eq('cidade_id', cidadeId)
      }

      const { data, error: err } = await query
      if (err) throw err

      const items = data || []
      if (items.length === 0) continue

      totalItems += items.length
      const config = TABELA_CONFIG[table]
      html += `
        <div class="consulta-section">
          <div class="consulta-section-header">
            <span><i data-lucide="${config.icon}" class="icon-sm"></i> ${config.label}</span>
            <span class="consulta-section-count">${items.length}</span>
          </div>
          <div class="result-cards-grid">
            ${items.map(item => config.card(item, cidadeMap[item.cidade_id] || '—')).join('')}
          </div>
        </div>`
    }

    elLoading.style.display = 'none'

    if (totalItems === 0) {
      elEmpty.style.display = 'flex'
      return
    }

    elResults.innerHTML = html
    initIcons(elResults)

  } catch (err) {
    elLoading.style.display = 'none'
    document.getElementById('consulta-error-msg').textContent = 'Erro ao carregar dados: ' + err.message
    elError.style.display = 'flex'
  }
}
