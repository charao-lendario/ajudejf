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
  Camera, X, QrCode, ZoomIn,
  Instagram, Globe, Dog, Cat,
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
  Camera, X, QrCode, ZoomIn,
  Instagram, Globe, Dog, Cat,
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
      alert('A imagem deve ter no maximo 500KB.')
      this.value = ''
      return
    }
    if (!file.type.startsWith('image/')) {
      alert('Formato nao suportado. Use uma imagem.')
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

// ── STATE ──
const state = {
  city: '',
  type: '',
  data: {},
  pendingModeration: false
}

const typeLabels = {
  abrigo:          'Abrigo Pet',
  pet_perdido:     'Pet Perdido',
  adocao:          'Adocao',
  lar_temporario:  'Lar Temporario',
  doacao:          'Ponto de Doacao',
  comedouro:       'Comedouro',
  ong:             'ONG / Protetor',
  voluntario:      'Voluntario',
  vaquinha:        'Vaquinha',
  doador:          'Quero Doar'
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

// ── MAPA: tipo -> tabela e campos ──
const TIPO_TABELA = {
  abrigo:          'abrigos',
  pet_perdido:     'pets_perdidos',
  adocao:          'adocao',
  lar_temporario:  'lares_temporarios',
  doacao:          'pontos_doacao',
  comedouro:       'pontos_alimentacao',
  ong:             'ongs_protetores',
  voluntario:      'voluntarios',
  vaquinha:        'vaquinhas',
  doador:          'doadores'
}

// Campos que devem virar arrays (checkboxes multiplos)
const CAMPOS_ARRAY = new Set([
  'recursos', 'aceita', 'especies_aceitas', 'tipo_alimento',
  'atende_especies', 'habilidade', 'oferece', 'necessidades_check',
  'especies'
])

// Mapa de nomes de campo do form -> coluna da tabela
const CAMPO_COLUNA = {
  habilidade:         'habilidades',
  pix_tipo:           'pix_tipo',
  pix_chave:          'pix_chave',
  pix_titular:        'pix_titular',
  ultima_vez:         'ultima_vez_visto',
  tutor_nome:         'tutor_nome',
  tutor_tel:          'tutor_tel',
  necessidades_check: 'necessidades',
  especies:           'especies',
  tipo_alimento:      'tipo_alimento',
  atende_especies:    'atende_especies',
  frequencia:         'frequencia_reposicao',
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
  if (error || !data) throw new Error(`Cidade nao encontrada: ${nome}`)
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

  const PIX_SKIP = new Set(['— Nao recebe PIX —', '— Nao informar PIX —'])

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

    // Le imagem QR Code PIX se presente
    const pixFileInput = form.querySelector('input[name="pix_qrcode"]')
    const pixFile = pixFileInput && pixFileInput.files[0]
    let pixImageBase64 = null
    if (pixFile) {
      pixImageBase64 = await readFileAsBase64(pixFile)
    }

    // Detecta se precisa de moderacao
    const hasPix = formRaw.pix_chave && formRaw.pix_chave.trim() !== ''
    const hasPixImage = !!pixFile
    const needsModeration = tipo === 'vaquinha' || (tipo === 'doacao' && (hasPix || hasPixImage))

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
        throw new Error(errBody.error || `Erro ${resp.status} ao enviar para moderacao`)
      }

      state.pendingModeration = true
    } else {
      // ── Insert direto no Supabase ──
      const payload = buildPayload({ cidade_id })
      const tabela = TIPO_TABELA[tipo]
      const { error } = await supabase.from(tabela).insert(payload)
      if (error) throw error
      state.pendingModeration = false
    }

    // Atualiza mensagem do step-4 conforme moderacao
    const titleEl = document.getElementById('success-title')
    const descEl  = document.getElementById('success-desc')
    if (state.pendingModeration) {
      if (titleEl) titleEl.textContent = 'Enviado para aprovacao!'
      if (descEl)  descEl.textContent  = 'Seus dados foram enviados e estao aguardando moderacao. A equipe sera notificada por e-mail e o cadastro aparecera em Consultar apos aprovacao.'
    } else {
      if (titleEl) titleEl.textContent = 'Cadastro registrado!'
      if (descEl)  descEl.textContent  = 'Seus dados foram salvos com sucesso. Compartilhe pelo WhatsApp para ampliar o alcance e facilitar a coordenacao.'
    }

    const summary = buildSummary(state.city, tipo, formRaw)
    document.getElementById('summary-text').textContent = summary

    // Limpa o formulario apos envio bem-sucedido
    form.reset()
    document.querySelectorAll('.pix-preview').forEach(p => { p.style.display = 'none' })
    document.querySelectorAll('.pix-upload-label').forEach(l => { l.style.display = 'flex' })

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
  lines.push('=== AJUDEPET — ' + (typeLabels[type] || type).toUpperCase() + ' ===')
  lines.push('Cidade: ' + city)
  lines.push('Data/hora: ' + now)
  lines.push('')

  const labelMap = {
    nome_local:             'Local',
    nome_pet:               'Nome do pet',
    nome_campanha:          'Nome da campanha',
    nome:                   'Nome',
    responsavel:            'Responsavel',
    telefone:               'Telefone/WhatsApp',
    endereco:               'Endereco',
    prioridade:             'Prioridade',
    capacidade:             'Capacidade',
    especies_aceitas:       'Especies aceitas',
    aceita_resgate:         'Aceita resgate',
    veterinario_disponivel: 'Veterinario disponivel',
    necessidades:           'Necessidades',
    necessidades_check:     'Necessidades',
    recursos:               'Recursos disponiveis',
    especie:                'Especie',
    raca:                   'Raca',
    cor:                    'Cor',
    porte:                  'Porte',
    sexo:                   'Sexo',
    descricao:              'Descricao',
    ultima_vez:             'Ultima vez visto',
    local_visto:            'Local visto',
    castrado:               'Castrado',
    microchip:              'Microchip',
    tutor_nome:             'Tutor',
    tutor_tel:              'Tel. tutor',
    idade_estimada:         'Idade estimada',
    vacinado:               'Vacinado',
    necessidades_especiais: 'Necessidades especiais',
    tem_outros_animais:     'Tem outros animais',
    tem_criancas:           'Tem criancas',
    experiencia:            'Experiencia',
    tipo:                   'Tipo',
    especies:               'Especies',
    animais_atendidos:      'Animais atendidos',
    site:                   'Site',
    instagram:              'Instagram',
    cnpj:                   'CNPJ',
    horario:                'Horario',
    tipo_alimento:          'Tipo de alimento',
    atende_especies:        'Atende especies',
    frequencia:             'Frequencia de reposicao',
    precisa_voluntarios:    'Precisa voluntarios',
    aceita:                 'O que aceita',
    pix_tipo:               'Tipo da chave PIX',
    pix_chave:              'Chave PIX',
    pix_titular:            'Titular PIX',
    bairro:                 'Bairro',
    veiculo:                'Veiculo',
    habilidade:             'Habilidades',
    disponibilidade:        'Disponibilidade',
    link_vakinha:           'Link da vaquinha',
    oferece:                'O que deseja doar',
    obs:                    'Observacoes'
  }

  for (const [key, val] of Object.entries(data)) {
    if (!val || val === '' || val === '— Nao recebe PIX —' || val === '— Nao informar PIX —') continue
    const label = labelMap[key] || key
    const value = Array.isArray(val) ? val.join(', ') : val
    lines.push('- ' + label + ': ' + value)
  }

  lines.push('')
  lines.push('Registrado em ajudepet.com.br')
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

// Inicializa icones e uploads no carregamento
initIcons()
setupPixUpload('doacao')
setupPixUpload('vaquinha')

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
  const map = { Alta: 'badge-red', Media: 'badge-gold', Baixa: 'badge-green' }
  return p ? `<span class="badge ${map[p] || ''}">${esc(p)}</span>` : ''
}

function wppBtn (tel, label = 'WhatsApp') {
  if (!tel) return ''
  return `<a href="https://wa.me/${formatWpp(tel)}" target="_blank" rel="noopener" class="rc-wpp">WhatsApp: ${label}</a>`
}

function boolLabel (val) {
  if (val === true || val === 'Sim') return 'Sim'
  if (val === false || val === 'Nao') return 'Nao'
  return val || '—'
}

// ═══════════════════════════════════════════════════════
// CONSULTA — CARDS POR TABELA
// ═══════════════════════════════════════════════════════

function cardAbrigoPet (item, cidade) {
  return `
    <div class="result-card">
      <div class="rc-header">
        <div class="rc-title">${esc(item.nome_local)}</div>
        ${prioBadge(item.prioridade)}
      </div>
      <div class="rc-city"><i data-lucide="map-pin" class="icon-xs"></i> ${esc(cidade)} — ${esc(item.endereco)}</div>
      <div class="rc-body">
        ${item.capacidade ? `<div class="rc-row"><i data-lucide="users" class="icon-xs"></i> Capacidade: <strong>${esc(item.capacidade)}</strong></div>` : ''}
        ${chips(item.especies_aceitas)}
        ${item.aceita_resgate ? `<div class="rc-row"><i data-lucide="hand-heart" class="icon-xs"></i> Aceita resgate: ${esc(item.aceita_resgate)}</div>` : ''}
        ${item.veterinario_disponivel ? `<div class="rc-row"><i data-lucide="stethoscope" class="icon-xs"></i> Veterinario: ${esc(item.veterinario_disponivel)}</div>` : ''}
        ${item.necessidades ? `<div class="rc-row rc-needs"><i data-lucide="alert-triangle" class="icon-xs"></i> Precisa agora: ${esc(item.necessidades)}</div>` : ''}
        ${chips(item.recursos)}
      </div>
      ${wppBtn(item.telefone)}
    </div>`
}

function cardPetPerdido (item, cidade) {
  return `
    <div class="result-card result-card-urgente">
      <div class="rc-header">
        <div class="rc-title">${esc(item.nome_pet)}</div>
        <span class="badge badge-red">Perdido</span>
      </div>
      <div class="rc-city"><i data-lucide="map-pin" class="icon-xs"></i> ${esc(cidade)}</div>
      <div class="rc-body">
        ${item.especie ? `<div class="rc-row"><i data-lucide="paw-print" class="icon-xs"></i> ${esc(item.especie)}${item.raca ? ` — ${esc(item.raca)}` : ''}</div>` : ''}
        ${item.cor ? `<div class="rc-row">Cor: ${esc(item.cor)}</div>` : ''}
        ${item.porte ? `<div class="rc-row">Porte: ${esc(item.porte)}</div>` : ''}
        ${item.sexo ? `<div class="rc-row">Sexo: ${esc(item.sexo)}</div>` : ''}
        ${item.descricao ? `<div class="rc-row"><i data-lucide="file-text" class="icon-xs"></i> ${esc(item.descricao)}</div>` : ''}
        ${item.ultima_vez_visto ? `<div class="rc-row"><i data-lucide="clock" class="icon-xs"></i> Ultima vez: ${formatDate(item.ultima_vez_visto)}${item.local_visto ? ` — ${esc(item.local_visto)}` : ''}</div>` : ''}
        ${item.castrado ? `<div class="rc-row">Castrado: ${boolLabel(item.castrado)}</div>` : ''}
        ${item.microchip ? `<div class="rc-row">Microchip: ${boolLabel(item.microchip)}</div>` : ''}
      </div>
      ${item.tutor_nome ? `<div class="rc-footer-info">Tutor: ${esc(item.tutor_nome)}</div>` : ''}
      ${wppBtn(item.tutor_tel, 'Contatar tutor')}
    </div>`
}

function cardAdocao (item, cidade) {
  return `
    <div class="result-card result-card-adocao">
      <div class="rc-header">
        <div class="rc-title">${esc(item.nome_pet)}</div>
        <span class="badge badge-green">Para Adocao</span>
      </div>
      <div class="rc-city"><i data-lucide="map-pin" class="icon-xs"></i> ${esc(cidade)}</div>
      <div class="rc-body">
        ${item.especie ? `<div class="rc-row"><i data-lucide="paw-print" class="icon-xs"></i> ${esc(item.especie)}${item.raca ? ` — ${esc(item.raca)}` : ''}</div>` : ''}
        ${item.porte ? `<div class="rc-row">Porte: ${esc(item.porte)}</div>` : ''}
        ${item.sexo ? `<div class="rc-row">Sexo: ${esc(item.sexo)}</div>` : ''}
        ${item.idade_estimada ? `<div class="rc-row">Idade estimada: ${esc(item.idade_estimada)}</div>` : ''}
        ${item.castrado ? `<div class="rc-row">Castrado: ${boolLabel(item.castrado)}</div>` : ''}
        ${item.vacinado ? `<div class="rc-row">Vacinado: ${boolLabel(item.vacinado)}</div>` : ''}
        ${item.descricao ? `<div class="rc-row"><i data-lucide="file-text" class="icon-xs"></i> ${esc(item.descricao)}</div>` : ''}
        ${item.necessidades_especiais ? `<div class="rc-row rc-needs"><i data-lucide="alert-triangle" class="icon-xs"></i> Necessidades especiais: ${esc(item.necessidades_especiais)}</div>` : ''}
      </div>
      ${wppBtn(item.telefone)}
    </div>`
}

function cardLarTemporario (item, cidade) {
  return `
    <div class="result-card result-card-voluntario">
      <div class="rc-header">
        <div class="rc-title">${esc(item.responsavel)}</div>
        <span class="badge ${item.disponivel === 'Sim' || item.disponivel === true ? 'badge-green' : 'badge-gold'}">${item.disponivel === 'Sim' || item.disponivel === true ? 'Disponivel' : 'Ocupado'}</span>
      </div>
      <div class="rc-city"><i data-lucide="map-pin" class="icon-xs"></i> ${esc(cidade)}</div>
      <div class="rc-body">
        ${chips(item.especies_aceitas)}
        ${item.capacidade ? `<div class="rc-row"><i data-lucide="users" class="icon-xs"></i> Capacidade: ${esc(item.capacidade)}</div>` : ''}
        ${item.tem_outros_animais ? `<div class="rc-row">Tem outros animais: ${boolLabel(item.tem_outros_animais)}</div>` : ''}
        ${item.tem_criancas ? `<div class="rc-row">Tem criancas: ${boolLabel(item.tem_criancas)}</div>` : ''}
        ${item.experiencia ? `<div class="rc-row">Experiencia: ${esc(item.experiencia)}</div>` : ''}
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

function cardComedouro (item, cidade) {
  return `
    <div class="result-card">
      <div class="rc-header">
        <div class="rc-title">${esc(item.nome_local)}</div>
        ${item.precisa_voluntarios === 'Sim, urgente' ? '<span class="badge badge-red">Voluntarios urgente</span>' : ''}
      </div>
      <div class="rc-city"><i data-lucide="map-pin" class="icon-xs"></i> ${esc(cidade)} — ${esc(item.endereco)}</div>
      <div class="rc-body">
        ${item.horario ? `<div class="rc-row"><i data-lucide="clock" class="icon-xs"></i> ${esc(item.horario)}</div>` : ''}
        ${chips(item.tipo_alimento)}
        ${chips(item.atende_especies)}
        ${item.frequencia_reposicao ? `<div class="rc-row">Reposicao: ${esc(item.frequencia_reposicao)}</div>` : ''}
        ${item.necessidades ? `<div class="rc-row rc-needs"><i data-lucide="alert-triangle" class="icon-xs"></i> Precisa: ${esc(item.necessidades)}</div>` : ''}
      </div>
      ${wppBtn(item.telefone)}
    </div>`
}

function cardOngProtetor (item, cidade) {
  return `
    <div class="result-card">
      <div class="rc-header">
        <div class="rc-title">${esc(item.nome_local)}</div>
        ${item.tipo ? `<span class="badge badge-blue">${esc(item.tipo)}</span>` : ''}
      </div>
      <div class="rc-city"><i data-lucide="map-pin" class="icon-xs"></i> ${esc(cidade)}</div>
      <div class="rc-body">
        ${chips(item.especies)}
        ${item.animais_atendidos ? `<div class="rc-row"><i data-lucide="paw-print" class="icon-xs"></i> Animais atendidos: ${esc(item.animais_atendidos)}</div>` : ''}
        ${item.necessidades ? `<div class="rc-row rc-needs"><i data-lucide="alert-triangle" class="icon-xs"></i> Necessidades: ${esc(item.necessidades)}</div>` : ''}
        ${item.instagram ? `<div class="rc-row"><i data-lucide="instagram" class="icon-xs"></i> <a href="https://instagram.com/${esc(item.instagram.replace('@', ''))}" target="_blank" rel="noopener">${esc(item.instagram)}</a></div>` : ''}
        ${item.site ? `<div class="rc-row"><i data-lucide="globe" class="icon-xs"></i> <a href="${esc(item.site)}" target="_blank" rel="noopener">${esc(item.site)}</a></div>` : ''}
      </div>
      ${wppBtn(item.telefone)}
    </div>`
}

function cardVoluntario (item, cidade) {
  return `
    <div class="result-card result-card-voluntario">
      <div class="rc-header">
        <div class="rc-title">${esc(item.nome)}</div>
        ${item.veiculo && item.veiculo !== 'Nao' ? `<span class="badge badge-blue">${esc(item.veiculo)}</span>` : ''}
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
      <a href="${esc(item.link_vakinha)}" target="_blank" rel="noopener noreferrer" class="rc-wpp">Acessar Vaquinha</a>
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

const TABELA_CONFIG = {
  abrigos:            { icon: 'home',        label: 'Abrigos Pet',         card: cardAbrigoPet },
  pets_perdidos:      { icon: 'search',      label: 'Pets Perdidos',       card: cardPetPerdido },
  adocao:             { icon: 'heart',        label: 'Adocao',             card: cardAdocao },
  lares_temporarios:  { icon: 'hand-heart',   label: 'Lares Temporarios',  card: cardLarTemporario },
  pontos_doacao:      { icon: 'package',      label: 'Pontos de Doacao',   card: cardDoacao },
  pontos_alimentacao: { icon: 'utensils',     label: 'Comedouros',         card: cardComedouro },
  ongs_protetores:    { icon: 'shield',       label: 'ONGs / Protetores',  card: cardOngProtetor },
  voluntarios:        { icon: 'hand-heart',   label: 'Voluntarios',        card: cardVoluntario },
  vaquinhas:          { icon: 'heart-pulse',  label: 'Vaquinhas',          card: cardVaquinha },
  doadores:           { icon: 'gift',         label: 'Quero Doar',         card: cardDoador },
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
