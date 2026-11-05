// Analista da semana: lê os posts dos últimos 7 dias, compara com os 7
// anteriores e escreve, em frases, o que funcionou, o que caiu e o que repetir.
// São regras fixas sobre os números (não é IA): a mesma semana gera sempre o
// mesmo texto, e toda frase cita o número em que se apoia.
import { rede } from './redes'
import { diaNoFuso, horaNoFuso, somarDias } from './datas'
import { inteiro, numero, percentual } from './formato'

const soma = (posts, campo) => posts.reduce((t, p) => t + (p.metricas[campo] || 0), 0)
const media = (posts, campo) => (posts.length ? soma(posts, campo) / posts.length : 0)
const pct = (atual, anterior) => ((atual - anterior) / anterior) * 100
const titulo = (p) => {
  const t = (p.conteudo || 'post sem legenda').split('\n')[0].trim()
  return `"${t.length > 56 ? `${t.slice(0, 55).trimEnd()}…` : t}"`
}

const TURNOS = [
  { nome: 'de manhã', de: 5, ate: 11 },
  { nome: 'à tarde', de: 12, ate: 17 },
  { nome: 'à noite', de: 18, ate: 23 },
  { nome: 'de madrugada', de: 0, ate: 4 },
]

export function analisarSemana(posts, { hoje, fuso }) {
  const inicio = somarDias(hoje, -6)
  const inicioAnterior = somarDias(hoje, -13)
  const dia = (p) => diaNoFuso(p.publicadoEm, fuso)
  const semana = posts.filter(p => dia(p) >= inicio && dia(p) <= hoje)
  const anterior = posts.filter(p => dia(p) >= inicioAnterior && dia(p) < inicio)
  if (!semana.length && !anterior.length) return null

  const funcionou = []
  const caiu = []
  const repetir = []

  if (!semana.length) {
    caiu.push(`Nenhum post foi ao ar nesta semana. Na anterior foram ${inteiro(anterior.length)}.`)
    repetir.push(`Voltar ao ritmo da semana anterior: ${inteiro(anterior.length)} ${anterior.length === 1 ? 'post' : 'posts'}.`)
    return { inicio, funcionou, caiu, repetir }
  }

  // Volume e alcance, contra a semana anterior
  const views = soma(semana, 'views')
  const viewsAntes = soma(anterior, 'views')
  if (viewsAntes > 0) {
    const v = pct(views, viewsAntes)
    if (v >= 5) funcionou.push(`As visualizações subiram ${percentual(v)}: ${numero(views)} contra ${numero(viewsAntes)} na semana anterior.`)
    else if (v <= -5) caiu.push(`As visualizações caíram ${percentual(Math.abs(v))}: ${numero(views)} contra ${numero(viewsAntes)} na semana anterior.`)
  }
  const engajamento = media(semana, 'engagementRate')
  const engajamentoAntes = media(anterior, 'engagementRate')
  if (engajamentoAntes > 0 && Math.abs(engajamento - engajamentoAntes) >= 0.5) {
    const frase = `O engajamento médio foi de ${percentual(engajamento)}, contra ${percentual(engajamentoAntes)} na semana anterior.`
    ;(engajamento > engajamentoAntes ? funcionou : caiu).push(frase)
  }
  if (anterior.length && semana.length !== anterior.length) {
    const diferenca = Math.abs(semana.length - anterior.length)
    const frase = `Foram ${inteiro(semana.length)} ${semana.length === 1 ? 'post' : 'posts'}, ${inteiro(diferenca)} a ${semana.length > anterior.length ? 'mais' : 'menos'} que na semana anterior.`
    ;(semana.length > anterior.length ? funcionou : caiu).push(frase)
    if (semana.length < anterior.length) repetir.push(`Voltar a publicar pelo menos ${inteiro(anterior.length)} posts por semana.`)
  }

  // Melhor e pior post
  const ordenados = [...semana].sort((a, b) => b.metricas.views - a.metricas.views)
  const mediaViews = media(semana, 'views')
  const melhor = ordenados[0]
  if (melhor.metricas.views > 0) {
    const vezes = mediaViews > 0 ? melhor.metricas.views / mediaViews : 0
    const destaque = semana.length >= 3 && vezes >= 1.5
    funcionou.push(`O melhor post foi ${titulo(melhor)}, no ${rede(melhor.plataforma).nome}, com ${numero(melhor.metricas.views)} visualizações${destaque ? `, ${vezes.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} vezes a média da semana` : ''}.`)
    if (destaque) repetir.push(`Fazer outro post no tema e no formato de ${titulo(melhor)}.`)
  }
  const pior = ordenados[ordenados.length - 1]
  if (semana.length >= 4 && mediaViews > 0 && pior.metricas.views < mediaViews * 0.5) {
    caiu.push(`O mais fraco foi ${titulo(pior)}, com ${numero(pior.metricas.views)} visualizações, menos da metade da média.`)
  }

  // Redes: quem rendeu mais por post e quem mais caiu
  const porRede = (lista) => {
    const grupos = {}
    for (const p of lista) (grupos[p.plataforma] ||= []).push(p)
    return grupos
  }
  const redes = porRede(semana)
  const redesAntes = porRede(anterior)
  if (Object.keys(redes).length >= 2) {
    const [melhorRede, postsDela] = Object.entries(redes).sort((a, b) => media(b[1], 'views') - media(a[1], 'views'))[0]
    if (media(postsDela, 'views') > 0) {
      funcionou.push(`O ${rede(melhorRede).nome} teve a melhor média: ${numero(media(postsDela, 'views'))} visualizações por post.`)
      repetir.push(`Priorizar o ${rede(melhorRede).nome}, que rendeu mais por post.`)
    }
  }
  const quedas = Object.keys(redesAntes)
    .map(r => ({ r, antes: soma(redesAntes[r], 'views'), agora: soma(redes[r] || [], 'views') }))
    .filter(q => q.antes > 0 && pct(q.agora, q.antes) <= -20)
    .sort((a, b) => pct(a.agora, a.antes) - pct(b.agora, b.antes))
  if (quedas.length) {
    const q = quedas[0]
    caiu.push(`No ${rede(q.r).nome} as visualizações caíram ${percentual(Math.abs(pct(q.agora, q.antes)))} (${numero(q.agora)} contra ${numero(q.antes)}).`)
  }

  // Horário: só com pelo menos dois turnos que tenham dois posts cada
  const turnos = TURNOS
    .map(t => ({ ...t, posts: semana.filter(p => { const h = Number(horaNoFuso(p.publicadoEm, fuso).slice(0, 2)); return h >= t.de && h <= t.ate }) }))
    .filter(t => t.posts.length >= 2)
  if (turnos.length >= 2) {
    const [topo, ...resto] = turnos.sort((a, b) => media(b.posts, 'views') - media(a.posts, 'views'))
    const outros = media(resto.flatMap(t => t.posts), 'views')
    if (outros > 0 && media(topo.posts, 'views') >= outros * 1.2) {
      repetir.push(`Concentrar os posts ${topo.nome}: renderam em média ${numero(media(topo.posts, 'views'))} visualizações, contra ${numero(outros)} nos outros horários.`)
    }
  }

  return { inicio, funcionou, caiu, repetir }
}
