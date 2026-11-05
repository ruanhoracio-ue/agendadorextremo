// Datas do agendador. Duas representações, e só duas:
//   - instante: ISO com fuso (o que o Zernio devolve em agendadoPara)
//   - dia: 'YYYY-MM-DD' no fuso do app (para o calendário e os filtros)
// O fuso é o configurado no app, não o do navegador: quem agenda de outra
// cidade continua vendo o horário em que o post vai ao ar para o público.

const partes = (iso, fuso) => {
  const f = new Intl.DateTimeFormat('en-CA', {
    timeZone: fuso, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  })
  const p = Object.fromEntries(f.formatToParts(new Date(iso)).map(x => [x.type, x.value]))
  return { dia: `${p.year}-${p.month}-${p.day}`, hora: `${p.hour}:${p.minute}` }
}

export const diaNoFuso = (iso, fuso) => (iso ? partes(iso, fuso).dia : null)
export const horaNoFuso = (iso, fuso) => (iso ? partes(iso, fuso).hora : '')
export const hojeNoFuso = (fuso) => partes(new Date().toISOString(), fuso).dia

// Instante -> valor de <input type="datetime-local">, no fuso do app.
export function paraCampo(iso, fuso) {
  if (!iso) return ''
  const { dia, hora } = partes(iso, fuso)
  return `${dia}T${hora}`
}

// "seg., 10 de nov., 14:00"
export function dataHoraLegivel(iso, fuso) {
  if (!iso) return ''
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: fuso, weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso))
}

// ---------- Contas com dias ('YYYY-MM-DD'), sempre em UTC para não escorregar ----------

const paraUtc = (dia) => new Date(`${dia}T00:00:00Z`)
const paraDia = (data) => data.toISOString().slice(0, 10)

export const somarDias = (dia, n) => paraDia(new Date(paraUtc(dia).getTime() + n * 86400000))
export const diasEntre = (inicio, fim) => Math.round((paraUtc(fim) - paraUtc(inicio)) / 86400000)

// Grade do mês: semanas completas de domingo a sábado cobrindo o mês.
export function gradeDoMes(ano, mes) {
  const primeiro = new Date(Date.UTC(ano, mes, 1))
  const ultimo = new Date(Date.UTC(ano, mes + 1, 0))
  const inicio = somarDias(paraDia(primeiro), -primeiro.getUTCDay())
  const fim = somarDias(paraDia(ultimo), 6 - ultimo.getUTCDay())
  const dias = []
  for (let d = inicio; d <= fim; d = somarDias(d, 1)) dias.push({ dia: d, numero: Number(d.slice(8)), doMes: Number(d.slice(5, 7)) === mes + 1 })
  return { inicio, fim, dias }
}

export const nomeDoMes = (ano, mes) => {
  const nome = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(ano, mes, 1)))
  return nome.charAt(0).toUpperCase() + nome.slice(1)
}

// "10/11" a partir de um dia
export const diaCurto = (dia) => `${dia.slice(8)}/${dia.slice(5, 7)}`

// "agora", "há 5 min", "há 3 h", "há 2 dias"; depois de uma semana, a data.
export function haQuanto(iso) {
  if (!iso) return ''
  const minutos = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (minutos < 1) return 'agora'
  if (minutos < 60) return `há ${minutos} min`
  const horas = Math.round(minutos / 60)
  if (horas < 24) return `há ${horas} h`
  const dias = Math.round(horas / 24)
  if (dias < 7) return `há ${dias} ${dias === 1 ? 'dia' : 'dias'}`
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }).format(new Date(iso))
}
