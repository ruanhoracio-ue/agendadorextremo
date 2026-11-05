import { useEffect, useMemo, useState } from 'react'
import { CaretLeft, CaretRight, Plus, WarningCircle, CalendarBlank, NotePencil } from '@phosphor-icons/react'
import { Badge, Button, Card, Heading, SegmentedControl, Table } from '../components/ui'
import { Faixa, Vazio, Carregando } from '../components/app/Avisos'
import { RedesDoPost } from '../components/app/IconeRede'
import { Compositor } from '../components/app/Compositor'
import { PostDetalhe } from '../components/app/PostDetalhe'
import { api } from '../lib/api'
import { useApp } from '../lib/contexto'
import { useDados } from '../lib/useDados'
import { status } from '../lib/redes'
import { diaNoFuso, horaNoFuso, hojeNoFuso, gradeDoMes, nomeDoMes, dataHoraLegivel } from '../lib/datas'
import { cn } from '../lib/cn'

const SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const VISOES = [{ value: 'mes', label: 'Mês' }, { value: 'lista', label: 'Lista' }]
const MAX_POR_DIA = 3
const ATUALIZAR_A_CADA_MS = 60000

// Ponto de estado na ficha do calendário. Nunca sozinho: a ficha também traz
// o rótulo no title e, quando falha, um ícone.
const ponto = { success: 'bg-success', info: 'bg-info', warning: 'bg-warning', danger: 'bg-danger', neutral: 'bg-faint' }

export default function Calendario() {
  const { fuso, definirAcoes, postPedido, limparPostPedido } = useApp()
  const hoje = hojeNoFuso(fuso)
  const [mes, setMes] = useState({ ano: Number(hoje.slice(0, 4)), mes: Number(hoje.slice(5, 7)) - 1 })
  const [visao, setVisao] = useState(() => (window.innerWidth < 768 ? 'lista' : 'mes'))
  const [compositor, setCompositor] = useState(null) // { post? , dia? }
  const [aberto, setAberto] = useState(null) // id do post em detalhe

  const grade = useMemo(() => gradeDoMes(mes.ano, mes.mes), [mes])
  const posts = useDados(() => api.posts(grade.inicio, grade.fim), [grade.inicio, grade.fim])
  const rascunhos = useDados(() => api.rascunhos(), [])

  const lista = posts.dados?.posts || []
  const porDia = useMemo(() => {
    const mapa = {}
    for (const p of lista) (mapa[diaNoFuso(p.agendadoPara, fuso)] ||= []).push(p)
    return mapa
  }, [lista, fuso])
  const doMes = lista.filter(p => Number(diaNoFuso(p.agendadoPara, fuso)?.slice(5, 7)) === mes.mes + 1)
  const detalhe = [...lista, ...(rascunhos.dados?.posts || [])].find(p => p.id === aberto) || null

  const recarregar = () => {
    posts.recarregar({ silencioso: true })
    rascunhos.recarregar({ silencioso: true })
  }

  // Outra tela (o sino de avisos) pediu para abrir um post: vai para o mês
  // dele e abre o detalhe.
  useEffect(() => {
    if (!postPedido) return
    const dia = diaNoFuso(postPedido.agendadoPara, fuso)
    if (dia) setMes({ ano: Number(dia.slice(0, 4)), mes: Number(dia.slice(5, 7)) - 1 })
    setAberto(postPedido.id)
    limparPostPedido()
  }, [postPedido, fuso, limparPostPedido])

  // O botão principal da tela mora no cabeçalho do shell.
  useEffect(() => {
    definirAcoes(<Button size="field" icon={<Plus size={14} weight="bold" />} onClick={() => setCompositor({})}>Novo post</Button>)
    return () => definirAcoes(null)
  }, [definirAcoes])

  // Os status mudam sozinhos (agendado -> publicado), então a tela se atualiza
  // de minuto em minuto enquanto estiver visível.
  useEffect(() => {
    const t = setInterval(() => document.visibilityState === 'visible' && posts.recarregar({ silencioso: true }), ATUALIZAR_A_CADA_MS)
    return () => clearInterval(t)
  }, [posts.recarregar])

  const andar = (n) => setMes(({ ano, mes: m }) => {
    const d = new Date(Date.UTC(ano, m + n, 1))
    return { ano: d.getUTCFullYear(), mes: d.getUTCMonth() }
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => andar(-1)} aria-label="Mês anterior" className="flex h-9 w-9 items-center justify-center rounded-md text-body transition-colors hover:bg-elevated hover:text-ink"><CaretLeft size={16} /></button>
          <button type="button" onClick={() => andar(1)} aria-label="Próximo mês" className="flex h-9 w-9 items-center justify-center rounded-md text-body transition-colors hover:bg-elevated hover:text-ink"><CaretRight size={16} /></button>
        </div>
        <Heading level={4} as="h2" className="min-w-[11rem]">{nomeDoMes(mes.ano, mes.mes)}</Heading>
        <Button variant="secondary" size="sm" onClick={() => setMes({ ano: Number(hoje.slice(0, 4)), mes: Number(hoje.slice(5, 7)) - 1 })}>Hoje</Button>
        <SegmentedControl className="ml-auto" ariaLabel="Modo de exibição" options={VISOES} value={visao} onChange={setVisao} />
      </div>

      {posts.erro && (
        <Faixa tom="erro" titulo="Não consegui carregar os posts." acao={<Button variant="ghost" size="sm" onClick={() => posts.recarregar()}>Tentar de novo</Button>}>
          {posts.erro.message}
        </Faixa>
      )}

      {visao === 'mes' ? (
        <Card className="overflow-hidden p-0!">
          <div className="grid grid-cols-7 border-b border-hairline bg-elevated/50">
            {SEMANA.map(d => <div key={d} className="px-3 py-2 text-caption font-medium text-mute">{d}</div>)}
          </div>
          <div className={cn('grid grid-cols-7', posts.carregando && !posts.dados && 'opacity-50')}>
            {grade.dias.map(({ dia, numero, doMes: pertence }, i) => {
              const itens = porDia[dia] || []
              return (
                <div
                  key={dia}
                  className={cn(
                    'group/dia relative flex min-h-28 flex-col gap-1 border-hairline p-1.5',
                    i % 7 !== 6 && 'border-r',
                    i < grade.dias.length - 7 && 'border-b',
                    !pertence && 'bg-elevated/40',
                  )}
                >
                  <div className="flex items-center justify-between px-1">
                    <span className={cn(
                      'flex h-6 min-w-6 items-center justify-center rounded-full text-caption tabular-nums',
                      dia === hoje ? 'bg-emerald px-1.5 font-semibold text-white' : pertence ? 'text-body' : 'text-faint',
                    )}>
                      {numero}
                    </span>
                    {dia >= hoje && (
                      <button
                        type="button"
                        onClick={() => setCompositor({ dia })}
                        aria-label={`Novo post em ${dia.slice(8)}/${dia.slice(5, 7)}`}
                        className="flex h-6 w-6 items-center justify-center rounded-md text-mute opacity-0 transition-opacity hover:bg-elevated hover:text-ink focus-visible:opacity-100 group-hover/dia:opacity-100"
                      >
                        <Plus size={13} weight="bold" />
                      </button>
                    )}
                  </div>
                  {itens.slice(0, MAX_POR_DIA).map(p => <Ficha key={p.id} post={p} fuso={fuso} onClick={() => setAberto(p.id)} />)}
                  {itens.length > MAX_POR_DIA && (
                    <button type="button" onClick={() => setVisao('lista')} className="px-1.5 text-left text-caption font-medium text-mute hover:text-ink">
                      +{itens.length - MAX_POR_DIA} no dia
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </Card>
      ) : posts.carregando && !posts.dados ? (
        <Carregando />
      ) : doMes.length === 0 ? (
        <Vazio icone={CalendarBlank} titulo="Nenhum post neste mês" acao={<Button variant="secondary" size="field" onClick={() => setCompositor({})}>Novo post</Button>}>
          Agende o primeiro post e ele aparece aqui, com o status de cada rede.
        </Vazio>
      ) : (
        <Card className="p-0!">
          <Table
            getRowKey={(p) => p.id}
            rows={doMes}
            defaultSort={{ key: 'quando', dir: 'asc' }}
            columns={[
              { key: 'quando', header: 'Quando', sortable: true, sortValue: (p) => p.agendadoPara, render: (p) => <span className="whitespace-nowrap">{dataHoraLegivel(p.agendadoPara, fuso)}</span> },
              { key: 'conteudo', header: 'Legenda', render: (p) => <button type="button" onClick={() => setAberto(p.id)} className="line-clamp-1 w-[18rem] text-left font-medium text-ink hover:underline 2xl:w-[28rem]">{p.conteudo || 'Sem legenda'}</button> },
              { key: 'redes', header: 'Redes', render: (p) => <RedesDoPost destinos={p.destinos} size={16} /> },
              { key: 'status', header: 'Status', sortable: true, sortValue: (p) => status(p.status).rotulo, render: (p) => <Badge tone={status(p.status).tom}>{status(p.status).rotulo}</Badge> },
            ]}
          />
        </Card>
      )}

      {/* RASCUNHOS — não têm data, então não cabem na grade */}
      {(rascunhos.dados?.posts || []).length > 0 && (
        <section>
          <Heading level={4} as="h2">Rascunhos</Heading>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {rascunhos.dados.posts.map(p => (
              <li key={p.id}>
                <button type="button" onClick={() => setAberto(p.id)} className="flex w-full items-start gap-3 rounded-lg border border-hairline bg-surface p-4 text-left transition-colors hover:border-hairline-strong">
                  <NotePencil size={18} className="mt-0.5 shrink-0 text-mute" />
                  <span className="min-w-0">
                    <span className="line-clamp-2 text-sm font-medium text-ink">{p.conteudo || 'Sem legenda'}</span>
                    <RedesDoPost destinos={p.destinos} className="mt-1.5" />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Compositor
        aberto={Boolean(compositor)}
        post={compositor?.post}
        dia={compositor?.dia}
        aoFechar={() => setCompositor(null)}
        aoSalvar={() => { setCompositor(null); recarregar() }}
      />
      {!compositor && (
        <PostDetalhe
          post={detalhe}
          aoFechar={() => setAberto(null)}
          aoEditar={(post) => { setAberto(null); setCompositor({ post }) }}
          aoMudar={() => { setAberto(null); recarregar() }}
        />
      )}
    </div>
  )
}

function Ficha({ post, fuso, onClick }) {
  const s = status(post.status)
  return (
    <button
      type="button"
      onClick={onClick}
      title={`${s.rotulo} · ${post.conteudo}`}
      className="flex w-full flex-col gap-0.5 rounded-sm px-1.5 py-1 text-left transition-colors hover:bg-ink/[0.04]"
    >
      {/* Linha 1: estado, hora e redes. Linha 2: a legenda, com a largura toda. */}
      <span className="flex w-full items-center gap-1.5">
        {post.status === 'failed'
          ? <WarningCircle size={12} weight="fill" className="shrink-0 text-danger" />
          : <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', ponto[s.tom])} aria-hidden="true" />}
        <span className="text-caption tabular-nums text-mute">{horaNoFuso(post.agendadoPara, fuso)}</span>
        <RedesDoPost destinos={post.destinos} size={12} className="ml-auto" />
      </span>
      <span className="w-full truncate text-caption text-ink">{post.conteudo || 'Sem legenda'}</span>
    </button>
  )
}
