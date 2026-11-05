import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, CheckCircle, FilmStrip, Plugs, Plus, WarningCircle } from '@phosphor-icons/react'
import { Badge, Button, Card, Heading, MetricCard, SegmentedControl, Table, Text } from '../components/ui'
import { Faixa, Carregando } from '../components/app/Avisos'
import { IconeRede, RedesDoPost } from '../components/app/IconeRede'
import { GraficoColunas } from '../components/app/GraficoColunas'
import { Compositor } from '../components/app/Compositor'
import { api } from '../lib/api'
import { useApp } from '../lib/contexto'
import { useDados } from '../lib/useDados'
import { REDES, rede, status } from '../lib/redes'
import { diaNoFuso, hojeNoFuso, somarDias, dataHoraLegivel, haQuanto } from '../lib/datas'
import { inteiro, numero, percentual } from '../lib/formato'
import { cn } from '../lib/cn'

const PERIODOS = [{ value: 7, label: '7 dias' }, { value: 30, label: '30 dias' }, { value: 90, label: '90 dias' }]
const NA_FILA = ['scheduled', 'pending_approval', 'publishing']

const somar = (posts, campo) => posts.reduce((t, p) => t + (p.metricas[campo] || 0), 0)
const media = (posts, campo) => (posts.length ? somar(posts, campo) / posts.length : 0)
// Variação em %, só quando o período anterior tem base: sem ela não há delta.
const variacao = (atual, anterior) => (anterior > 0 ? ((atual - anterior) / anterior) * 100 : undefined)
const celula = (valor) => (valor ? inteiro(valor) : <span className="text-faint">—</span>)

/**
 * Dashboard — a primeira tela: o resumo de tudo o que as outras detalham.
 * Um período só (7, 30 ou 90 dias) governa indicadores, gráfico e tabelas.
 */
export default function Dashboard() {
  const { fuso, contas, estado, avisos, definirAcoes, ir, abrirPost } = useApp()
  const hoje = hojeNoFuso(fuso)
  const [dias, setDias] = useState(30)
  const [compondo, setCompondo] = useState(false)

  const inicio = somarDias(hoje, -(dias - 1))
  const inicioAnterior = somarDias(inicio, -dias)

  const metricas = useDados(() => api.metricas({ de: inicioAnterior, ate: hoje }), [inicioAnterior, hoje])
  const seguidores = useDados(() => api.seguidores(inicio, hoje), [inicio, hoje])
  const fila = useDados(() => api.posts(hoje, somarDias(hoje, 30)), [hoje])
  const conversas = useDados(() => api.conversas(), [])
  const hub = useDados(() => api.videosDoHub(), [estado.hub?.configurada], { ativo: Boolean(estado.hub?.configurada) })

  useEffect(() => {
    definirAcoes(<Button size="field" icon={<Plus size={14} weight="bold" />} onClick={() => setCompondo(true)}>Novo post</Button>)
    return () => definirAcoes(null)
  }, [definirAcoes])

  const { atuais, anteriores } = useMemo(() => {
    const todos = metricas.dados?.posts || []
    const noDia = (p) => diaNoFuso(p.publicadoEm, fuso)
    return { atuais: todos.filter(p => noDia(p) >= inicio), anteriores: todos.filter(p => noDia(p) < inicio) }
  }, [metricas.dados, inicio, fuso])

  // Visualizações somadas pelo dia em que o post foi publicado.
  const porDia = useMemo(() => {
    const mapa = {}
    for (const p of atuais) {
      const dia = diaNoFuso(p.publicadoEm, fuso)
      mapa[dia] = { views: (mapa[dia]?.views || 0) + p.metricas.views, posts: (mapa[dia]?.posts || 0) + 1 }
    }
    const serie = []
    for (let d = inicio; d <= hoje; d = somarDias(d, 1)) {
      serie.push({ data: d, valor: mapa[d]?.views || 0, detalhe: mapa[d] ? `${mapa[d].posts} ${mapa[d].posts === 1 ? 'post publicado' : 'posts publicados'}` : 'Nenhum post publicado' })
    }
    return serie
  }, [atuais, inicio, hoje, fuso])

  const porRede = useMemo(() => {
    const grupos = {}
    for (const p of atuais) (grupos[p.plataforma] ||= []).push(p)
    return Object.entries(grupos).map(([plataforma, posts]) => ({
      plataforma, posts: posts.length, views: somar(posts, 'views'), likes: somar(posts, 'likes'),
      comments: somar(posts, 'comments'), shares: somar(posts, 'shares'), engajamento: media(posts, 'engagementRate'),
    }))
  }, [atuais])

  const contasSeguidores = seguidores.dados?.contas || []
  const totalSeguidores = contasSeguidores.reduce((t, c) => t + (c.atual || 0), 0)
  const ganho = contasSeguidores.reduce((t, c) => t + (c.crescimento || 0), 0)
  const noInicio = totalSeguidores - ganho

  const agora = new Date().toISOString()
  const proximos = (fila.dados?.posts || []).filter(p => NA_FILA.includes(p.status) && p.agendadoPara >= agora)
  const naSemana = proximos.filter(p => diaNoFuso(p.agendadoPara, fuso) <= somarDias(hoje, 6)).length
  const melhores = [...atuais].sort((a, b) => b.metricas.views - a.metricas.views).slice(0, 5)

  const comparacao = `vs. ${dias} dias anteriores`
  const cartoes = [
    { label: 'Seguidores', value: seguidores.dados ? numero(totalSeguidores) : '—', delta: variacao(totalSeguidores, noInicio), comparison: `em ${dias} dias, todas as contas` },
    { label: 'Agendados para 7 dias', value: fila.dados ? inteiro(naSemana) : '—' },
    { label: 'Posts publicados', value: inteiro(atuais.length), delta: variacao(atuais.length, anteriores.length), comparison: comparacao },
    { label: 'Visualizações', value: numero(somar(atuais, 'views')), delta: variacao(somar(atuais, 'views'), somar(anteriores, 'views')), comparison: comparacao },
    { label: 'Curtidas', value: numero(somar(atuais, 'likes')), delta: variacao(somar(atuais, 'likes'), somar(anteriores, 'likes')), comparison: comparacao },
    { label: 'Comentários', value: numero(somar(atuais, 'comments')), delta: variacao(somar(atuais, 'comments'), somar(anteriores, 'comments')), comparison: comparacao },
    { label: 'Compartilhamentos', value: numero(somar(atuais, 'shares')), delta: variacao(somar(atuais, 'shares'), somar(anteriores, 'shares')), comparison: comparacao },
    { label: 'Engajamento médio', value: percentual(media(atuais, 'engagementRate')), delta: variacao(media(atuais, 'engagementRate'), media(anteriores, 'engagementRate')), comparison: comparacao },
  ]

  const postsComFalha = avisos?.posts || []
  const contasCaidas = avisos?.contas || []
  const listaConversas = conversas.dados?.conversas || []
  const naoLidas = listaConversas.reduce((t, c) => t + (c.naoLidas || 0), 0)
  const redesConectadas = [...new Set(contas.map(c => c.plataforma))]
  const videosDoHub = hub.dados?.videos || []

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <SegmentedControl ariaLabel="Período" options={PERIODOS} value={dias} onChange={setDias} />
        <Text size="sm" tone="mute">Indicadores, gráfico e tabelas consideram os últimos {dias} dias.</Text>
      </div>

      {metricas.erro && (
        <Faixa tom="erro" titulo="Não consegui carregar as métricas." acao={<Button variant="ghost" size="sm" onClick={() => metricas.recarregar()}>Tentar de novo</Button>}>
          {metricas.erro.message}
        </Faixa>
      )}

      {/* INDICADORES */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-busy={metricas.carregando}>
        {cartoes.map(c => <MetricCard key={c.label} {...c} className={metricas.carregando ? 'opacity-60' : undefined} />)}
      </section>

      {/* GRÁFICO + ATENÇÃO */}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card>
          <Titulo acao={<Atalho onClick={() => ir('metricas')}>Ver métricas</Atalho>}>Visualizações por dia de publicação</Titulo>
          <Text size="sm" tone="mute" className="mt-1">Soma das visualizações dos posts publicados em cada dia.</Text>
          <div className="mt-4">
            {metricas.carregando && !metricas.dados ? <Carregando /> : <GraficoColunas serie={porDia} rotulo="Visualizações" vazio="Nenhum post publicado neste período." />}
          </div>
        </Card>

        <Card className="flex flex-col">
          <Titulo>Precisa de atenção</Titulo>
          {postsComFalha.length + contasCaidas.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center">
              <CheckCircle size={28} className="text-emerald" />
              <p className="text-label-lg text-ink">Tudo certo</p>
              <p className="text-body-sm text-mute">Nenhum post falhou e nenhuma conta caiu.</p>
            </div>
          ) : (
            <ul className="mt-3 flex flex-col divide-y divide-hairline">
              {contasCaidas.map(c => (
                <Linha key={c.id} onClick={() => ir('contas')} icone={<Plugs size={18} className="text-danger" />} titulo={`${rede(c.plataforma).nome} · ${c.usuario || 'conta'}`} detalhe="Conta desconectada pela rede. Reconecte." />
              ))}
              {postsComFalha.slice(0, 5).map(p => (
                <Linha key={p.id} onClick={() => abrirPost(p)} icone={<WarningCircle size={18} weight="fill" className="text-danger" />} titulo={p.conteudo || 'Sem legenda'} detalhe={`${status(p.status).rotulo} · ${dataHoraLegivel(p.agendadoPara, fuso)}`} />
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* PRÓXIMOS + MELHORES */}
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <Titulo acao={<Atalho onClick={() => ir('calendario')}>Ver calendário</Atalho>}>Próximos posts</Titulo>
          {fila.erro ? <Faixa tom="erro" className="mt-3">{fila.erro.message}</Faixa>
            : fila.carregando && !fila.dados ? <Carregando />
            : proximos.length === 0 ? (
              <Nada acao={<Button variant="secondary" size="sm" onClick={() => setCompondo(true)}>Agendar um post</Button>}>Nenhum post agendado para os próximos 30 dias.</Nada>
            ) : (
              <ul className="mt-3 flex flex-col divide-y divide-hairline">
                {proximos.slice(0, 6).map(p => (
                  <Linha
                    key={p.id}
                    onClick={() => abrirPost(p)}
                    icone={<RedesDoPost destinos={p.destinos} size={16} />}
                    titulo={p.conteudo || 'Sem legenda'}
                    detalhe={dataHoraLegivel(p.agendadoPara, fuso)}
                    fim={<Badge tone={status(p.status).tom}>{status(p.status).rotulo}</Badge>}
                  />
                ))}
              </ul>
            )}
        </Card>

        <Card>
          <Titulo acao={<Atalho onClick={() => ir('metricas')}>Ver todos</Atalho>}>Melhores posts do período</Titulo>
          {metricas.carregando && !metricas.dados ? <Carregando />
            : melhores.length === 0 ? <Nada>Nenhum post publicado neste período.</Nada>
            : (
              <ul className="mt-3 flex flex-col divide-y divide-hairline">
                {melhores.map(p => (
                  <li key={p.id} className="flex items-center gap-3 py-2.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-elevated text-mute">
                      {p.miniatura ? <img src={p.miniatura} alt="" loading="lazy" className="h-full w-full object-cover" /> : <FilmStrip size={18} />}
                    </span>
                    <span className="min-w-0 flex-1">
                      {p.url
                        ? <a href={p.url} target="_blank" rel="noreferrer" className="line-clamp-1 text-sm font-medium text-ink hover:underline">{p.conteudo || 'Sem legenda'}</a>
                        : <span className="line-clamp-1 text-sm font-medium text-ink">{p.conteudo || 'Sem legenda'}</span>}
                      <span className="flex items-center gap-1.5 text-caption text-mute"><IconeRede plataforma={p.plataforma} size={12} />{inteiro(p.metricas.likes)} curtidas · {inteiro(p.metricas.comments)} comentários</span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block text-sm font-semibold tabular-nums text-ink">{numero(p.metricas.views)}</span>
                      <span className="block text-caption text-mute">visualizações</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
        </Card>
      </div>

      {/* POR REDE + SEGUIDORES */}
      <div className="grid gap-4 xl:grid-cols-2">
        {/* Tabelas em meia largura: respiro lateral menor e largura mínima, para
            as colunas não encolherem até cortar os cabeçalhos. */}
        <Card className="p-0! [&_table]:min-w-[32rem] [&_td]:px-3 [&_th]:px-3">
          <div className="px-6 pt-6"><Titulo>Desempenho por rede</Titulo></div>
          <Table
            className="mt-2"
            getRowKey={(r) => r.plataforma}
            rows={porRede}
            defaultSort={{ key: 'views', dir: 'desc' }}
            empty="Nenhum post publicado neste período."
            columns={[
              { key: 'rede', header: 'Rede', sortValue: (r) => rede(r.plataforma).nome, render: (r) => <span className="flex items-center gap-2 font-medium text-ink"><IconeRede plataforma={r.plataforma} size={15} />{rede(r.plataforma).nome}</span> },
              { key: 'posts', header: 'Posts', width: '6.25rem', align: 'right', numeric: true, sortable: true, render: (r) => inteiro(r.posts) },
              { key: 'views', header: 'Views', width: '6rem', align: 'right', numeric: true, sortable: true, render: (r) => celula(r.views) },
              { key: 'likes', header: 'Curtidas', width: '7.25rem', align: 'right', numeric: true, sortable: true, render: (r) => celula(r.likes) },
              { key: 'engajamento', header: 'Engaj.', width: '6.25rem', align: 'right', numeric: true, sortable: true, render: (r) => (r.engajamento ? percentual(r.engajamento) : <span className="text-faint">—</span>) },
            ]}
          />
        </Card>

        <Card className="p-0! [&_table]:min-w-[26rem] [&_td]:px-3 [&_th]:px-3">
          <div className="px-6 pt-6"><Titulo>Seguidores por conta</Titulo></div>
          {seguidores.erro ? <div className="p-6"><Faixa tom="erro">{seguidores.erro.message}</Faixa></div> : (
            <Table
              className="mt-2"
              getRowKey={(c) => c.contaId}
              rows={contasSeguidores}
              defaultSort={{ key: 'atual', dir: 'desc' }}
              empty="Nenhuma conta com histórico de seguidores."
              columns={[
                { key: 'conta', header: 'Conta', sortValue: (c) => c.usuario, render: (c) => <span className="flex items-center gap-2 font-medium text-ink"><IconeRede plataforma={c.plataforma} size={15} /><span className="truncate">{c.usuario}</span></span> },
                { key: 'atual', header: 'Seguidores', width: '8.25rem', align: 'right', numeric: true, sortable: true, sortValue: (c) => c.atual, render: (c) => (c.atual === null ? '—' : inteiro(c.atual)) },
                { key: 'crescimento', header: `Em ${dias} dias`, width: '8.25rem', align: 'right', numeric: true, sortable: true, sortValue: (c) => c.crescimento, render: (c) => (c.crescimento === null ? '—' : `${c.crescimento > 0 ? '+' : c.crescimento < 0 ? '−' : ''}${inteiro(Math.abs(c.crescimento))}`) },
              ]}
            />
          )}
        </Card>
      </div>

      {/* CAIXA DE ENTRADA + CONTAS + CONTENT-HUB */}
      <div className={cn('grid gap-4', estado.hub?.configurada ? 'xl:grid-cols-3' : 'xl:grid-cols-2')}>
        <Card>
          <Titulo acao={<Atalho onClick={() => ir('inbox')}>Abrir</Atalho>}>Caixa de entrada</Titulo>
          {conversas.erro ? <Faixa tom="erro" className="mt-3">{conversas.erro.message}</Faixa>
            : conversas.carregando && !conversas.dados ? <Carregando />
            : listaConversas.length === 0 ? <Nada>Nenhuma mensagem direta por enquanto.</Nada>
            : (
              <>
                <p className="mt-1 text-body-sm text-mute">{naoLidas > 0 ? `${inteiro(naoLidas)} ${naoLidas === 1 ? 'mensagem não lida' : 'mensagens não lidas'}` : 'Tudo lido'}</p>
                <ul className="mt-2 flex flex-col divide-y divide-hairline">
                  {listaConversas.slice(0, 4).map(c => (
                    <Linha key={c.id} onClick={() => ir('inbox')} icone={<IconeRede plataforma={c.plataforma} size={16} className="text-mute" />} titulo={c.nome} detalhe={c.ultima || 'Sem texto'} fim={<span className="text-caption text-faint">{haQuanto(c.atualizadaEm)}</span>} />
                  ))}
                </ul>
              </>
            )}
        </Card>

        <Card>
          <Titulo acao={<Atalho onClick={() => ir('contas')}>Gerenciar</Atalho>}>Contas conectadas</Titulo>
          {contas.length === 0 ? (
            <Nada acao={<Button variant="secondary" size="sm" onClick={() => ir('contas')}>Conectar uma conta</Button>}>Nenhuma rede conectada ainda.</Nada>
          ) : (
            <>
              <p className="mt-1 text-body-sm text-mute">
                {inteiro(contas.length)} {contas.length === 1 ? 'conta' : 'contas'} em {redesConectadas.length} {redesConectadas.length === 1 ? 'rede' : 'redes'}, de {Object.keys(REDES).length} disponíveis.
              </p>
              <ul className="mt-2 flex flex-col divide-y divide-hairline">
                {contas.slice(0, 5).map(c => (
                  <Linha
                    key={c.id}
                    onClick={() => ir('contas')}
                    icone={<IconeRede plataforma={c.plataforma} size={16} className="text-mute" />}
                    titulo={c.usuario || c.nome}
                    detalhe={c.seguidores !== null ? `${inteiro(c.seguidores)} seguidores` : rede(c.plataforma).nome}
                    fim={c.precisaReconectar ? <Badge tone="danger">Reconectar</Badge> : <Badge tone="success">Ativa</Badge>}
                  />
                ))}
              </ul>
            </>
          )}
        </Card>

        {estado.hub?.configurada && (
          <Card>
            <Titulo acao={videosDoHub.length > 0 && <Atalho onClick={() => setCompondo(true)}>Agendar</Atalho>}>Aprovados no content-hub</Titulo>
            {hub.erro ? <Faixa tom="erro" className="mt-3">{hub.erro.message}</Faixa>
              : hub.carregando && !hub.dados ? <Carregando />
              : videosDoHub.length === 0 ? <Nada>Nenhum vídeo aprovado esperando agendamento.</Nada>
              : (
                <>
                  <p className="mt-1 text-body-sm text-mute">{inteiro(videosDoHub.length)} {videosDoHub.length === 1 ? 'vídeo aprovado espera' : 'vídeos aprovados esperam'} agendamento.</p>
                  <ul className="mt-2 flex flex-col divide-y divide-hairline">
                    {videosDoHub.slice(0, 4).map(v => (
                      <Linha key={v.id} onClick={() => setCompondo(true)} icone={<FilmStrip size={16} className="text-mute" />} titulo={v.titulo} detalhe={v.categoria || 'Vídeo curto'} />
                    ))}
                  </ul>
                </>
              )}
          </Card>
        )}
      </div>

      <Compositor aberto={compondo} aoFechar={() => setCompondo(false)} aoSalvar={() => { setCompondo(false); fila.recarregar({ silencioso: true }) }} />
    </div>
  )
}

// ---------- Peças do dashboard ----------

function Titulo({ children, acao }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Heading level={4} as="h2">{children}</Heading>
      {acao}
    </div>
  )
}

function Atalho({ onClick, children }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-emerald-deep hover:underline">
      {children} <ArrowRight size={13} weight="bold" />
    </button>
  )
}

function Linha({ icone, titulo, detalhe, fim, onClick }) {
  return (
    <li>
      <button type="button" onClick={onClick} className="-mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-sm px-2 py-2.5 text-left transition-colors hover:bg-ink/[0.04]">
        <span className="flex w-10 shrink-0 justify-center text-mute">{icone}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-ink">{titulo}</span>
          <span className="block truncate text-caption text-mute">{detalhe}</span>
        </span>
        {fim}
      </button>
    </li>
  )
}

function Nada({ children, acao }) {
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <p className="text-body-sm text-mute">{children}</p>
      {acao}
    </div>
  )
}
