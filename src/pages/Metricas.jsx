import { useMemo, useState } from 'react'
import { ChartLine, FilmStrip } from '@phosphor-icons/react'
import { Badge, Button, Card, DateRangeField, Heading, MetricCard, SegmentedControl, Select, Table, Text } from '../components/ui'
import { Faixa, Vazio, Carregando } from '../components/app/Avisos'
import { IconeRede } from '../components/app/IconeRede'
import { GraficoLinha } from '../components/app/GraficoLinha'
import { api } from '../lib/api'
import { useApp } from '../lib/contexto'
import { useDados } from '../lib/useDados'
import { rede } from '../lib/redes'
import { diaNoFuso, hojeNoFuso, somarDias, diasEntre, diaCurto } from '../lib/datas'
import { inteiro, numero, percentual } from '../lib/formato'

const PRESETS = [{ value: 7, label: '7 dias' }, { value: 30, label: '30 dias' }, { value: 90, label: '90 dias' }]
const ORIGENS = [{ value: 'todos', label: 'Todos' }, { value: 'app', label: 'Pelo agendador' }, { value: 'externo', label: 'Direto na rede' }]
// O período anterior entra no mesmo pedido, e o Zernio aceita no máximo 366
// dias por consulta: 180 de janela + 180 de comparação cabem com folga.
const MAX_DIAS = 180
const CONTAGENS = ['views', 'likes', 'comments', 'shares', 'saves']
// Largura de cada coluna de número: o rótulo mais o ícone de ordenação.
const LARGURAS = { views: '6rem', likes: '7.25rem', comments: '7.25rem', shares: '7.5rem', saves: '6.25rem' }

const somar = (posts, campo) => posts.reduce((t, p) => t + (p.metricas[campo] || 0), 0)
const media = (posts, campo) => (posts.length ? somar(posts, campo) / posts.length : 0)
// Variação em %, só quando o período anterior tem base: sem ela não há delta.
const variacao = (atual, anterior) => (anterior > 0 ? ((atual - anterior) / anterior) * 100 : undefined)

// Zero vira travessão: uma coluna de "0" repetido é ruído, não dado.
const celula = (valor) => (valor ? inteiro(valor) : <span className="text-faint">—</span>)

export default function Metricas() {
  const { fuso, contasDePost: contas, temMetricas } = useApp()
  const hoje = hojeNoFuso(fuso)
  // O intervalo é a fonte da verdade; os presets são só atalhos para ele.
  const [intervalo, setIntervalo] = useState({ inicio: somarDias(hoje, -29), fim: hoje })
  const [contaId, setContaId] = useState('')
  const [origem, setOrigem] = useState('todos')

  const dias = diasEntre(intervalo.inicio, intervalo.fim) + 1
  const valido = intervalo.inicio && intervalo.fim && dias >= 1
  const preset = intervalo.fim === hoje ? PRESETS.find(p => p.value === dias)?.value : undefined
  const inicioAnterior = valido ? somarDias(intervalo.inicio, -dias) : null

  const metricas = useDados(
    () => api.metricas({ de: inicioAnterior, ate: intervalo.fim, conta: contaId, origem }),
    [inicioAnterior, intervalo.fim, contaId, origem],
    { ativo: Boolean(valido) },
  )
  const seguidores = useDados(() => api.seguidores(intervalo.inicio, intervalo.fim), [intervalo.inicio, intervalo.fim], { ativo: Boolean(valido) })

  const { atuais, anteriores } = useMemo(() => {
    const todos = metricas.dados?.posts || []
    const noDia = (p) => diaNoFuso(p.publicadoEm, fuso)
    return {
      atuais: todos.filter(p => noDia(p) >= intervalo.inicio && noDia(p) <= intervalo.fim),
      anteriores: todos.filter(p => noDia(p) < intervalo.inicio),
    }
  }, [metricas.dados, intervalo, fuso])

  const comparacao = `vs. ${dias} ${dias === 1 ? 'dia anterior' : 'dias anteriores'}`
  const cartoes = [
    { label: 'Posts publicados', value: inteiro(atuais.length), delta: variacao(atuais.length, anteriores.length) },
    { label: 'Visualizações', value: numero(somar(atuais, 'views')), delta: variacao(somar(atuais, 'views'), somar(anteriores, 'views')) },
    { label: 'Curtidas', value: numero(somar(atuais, 'likes')), delta: variacao(somar(atuais, 'likes'), somar(anteriores, 'likes')) },
    { label: 'Comentários', value: numero(somar(atuais, 'comments')), delta: variacao(somar(atuais, 'comments'), somar(anteriores, 'comments')) },
    { label: 'Compartilhamentos', value: numero(somar(atuais, 'shares')), delta: variacao(somar(atuais, 'shares'), somar(anteriores, 'shares')) },
    { label: 'Engajamento médio', value: percentual(media(atuais, 'engagementRate')), delta: variacao(media(atuais, 'engagementRate'), media(anteriores, 'engagementRate')) },
  ]

  const totais = Object.fromEntries(CONTAGENS.map(c => [c, somar(atuais, c)]))
  const contasDoGrafico = (seguidores.dados?.contas || []).filter(c => !contaId || c.contaId === contaId)
  const semAcesso = !temMetricas || [402, 403].includes(metricas.erro?.status) || [402, 403].includes(seguidores.erro?.status)

  if (semAcesso) {
    return (
      <Vazio icone={ChartLine} titulo="Sua conta do Zernio não tem acesso às métricas">
        O Zernio informou que o plano atual não inclui analytics. Nos planos por uso ele já vem incluso; em planos antigos é um adicional. Confira em zernio.com, no painel, em Billing.
      </Vazio>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      {/* FILTROS — uma linha só, acima de tudo o que eles afetam */}
      <div className="flex flex-wrap items-center gap-3">
        <SegmentedControl
          ariaLabel="Período"
          options={PRESETS}
          value={preset}
          onChange={(n) => setIntervalo({ inicio: somarDias(hoje, -(n - 1)), fim: hoje })}
        />
        <DateRangeField value={intervalo} onChange={setIntervalo} min={somarDias(hoje, -(MAX_DIAS - 1))} max={hoje} ariaLabel="Período das métricas" />
        <div className="w-56">
          <Select aria-label="Conta" value={contaId} onChange={(e) => setContaId(e.target.value)}>
            <option value="">Todas as contas</option>
            {contas.map(c => <option key={c.id} value={c.id}>{rede(c.plataforma).nome} · {c.usuario}</option>)}
          </Select>
        </div>
        <SegmentedControl ariaLabel="Origem do post" options={ORIGENS} value={origem} onChange={setOrigem} />
      </div>

      {metricas.erro && (
        <Faixa tom="erro" titulo="Não consegui carregar as métricas dos posts." acao={<Button variant="ghost" size="sm" onClick={() => metricas.recarregar()}>Tentar de novo</Button>}>
          {metricas.erro.message}
        </Faixa>
      )}
      {metricas.dados?.cortado && (
        <Faixa tom="alerta">O período tem mais posts do que cabe em uma consulta; os números abaixo consideram os 300 mais recentes. Encurte o período para ver tudo.</Faixa>
      )}

      {/* INDICADORES */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-busy={metricas.carregando}>
        {cartoes.map(c => <MetricCard key={c.label} {...c} comparison={comparacao} className={metricas.carregando ? 'opacity-60' : undefined} />)}
      </section>

      {/* SEGUIDORES — um gráfico por conta: as grandezas são diferentes demais
          para dividir o mesmo eixo */}
      <section>
        <Heading level={4} as="h2">Seguidores</Heading>
        <Text size="sm" tone="mute" className="mt-1">Contagem diária de cada conta no período. O Zernio atualiza uma vez por dia.</Text>

        {seguidores.erro ? (
          <Faixa tom="erro" className="mt-4" titulo="Não consegui carregar os seguidores.">{seguidores.erro.message}</Faixa>
        ) : seguidores.carregando && !seguidores.dados ? (
          <Carregando />
        ) : contasDoGrafico.length === 0 ? (
          <Text size="sm" tone="mute" className="mt-4">Nenhuma conta com histórico de seguidores neste período.</Text>
        ) : (
          <>
            <div className="mt-4 grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
              {contasDoGrafico.map(c => (
                <Card key={c.contaId}>
                  <p className="flex items-center gap-2 text-sm font-medium text-mute">
                    <IconeRede plataforma={c.plataforma} size={16} />
                    <span className="truncate">{rede(c.plataforma).nome} · {c.usuario}</span>
                  </p>
                  <p className="mt-2 text-[26px] font-semibold leading-tight text-ink">{c.atual === null ? '—' : inteiro(c.atual)}</p>
                  <div className="mt-3">
                    <GraficoLinha serie={c.serie.map(p => ({ data: p.data, valor: p.seguidores }))} />
                  </div>
                </Card>
              ))}
            </div>
            {/* A mesma leitura em tabela: o gráfico nunca é a única forma de ver o dado. */}
            <Card className="mt-4 p-0!">
              <Table
                getRowKey={(c) => c.contaId}
                rows={contasDoGrafico}
                columns={[
                  { key: 'conta', header: 'Conta', sortValue: (c) => c.usuario, render: (c) => <span className="flex items-center gap-2 font-medium text-ink"><IconeRede plataforma={c.plataforma} size={15} />{c.usuario}</span> },
                  { key: 'inicio', header: `Em ${diaCurto(intervalo.inicio)}`, align: 'right', numeric: true, render: (c) => (c.serie[0] ? inteiro(c.serie[0].seguidores) : '—') },
                  { key: 'atual', header: `Em ${diaCurto(intervalo.fim)}`, align: 'right', numeric: true, sortable: true, sortValue: (c) => c.atual, render: (c) => (c.atual === null ? '—' : inteiro(c.atual)) },
                  { key: 'crescimento', header: 'Variação', align: 'right', numeric: true, sortable: true, sortValue: (c) => c.crescimento, render: (c) => (c.crescimento === null ? '—' : `${c.crescimento > 0 ? '+' : c.crescimento < 0 ? '−' : ''}${inteiro(Math.abs(c.crescimento))}`) },
                ]}
              />
            </Card>
          </>
        )}
      </section>

      {/* POSTS */}
      <section>
        <Heading level={4} as="h2">Posts do período</Heading>
        {metricas.carregando && !metricas.dados ? (
          <Carregando />
        ) : atuais.length === 0 ? (
          <Vazio icone={ChartLine} titulo="Nenhum post publicado neste período" className="mt-4">
            Mude o período ou a conta. Posts feitos direto na rede também entram aqui, depois que o Zernio sincroniza a conta.
          </Vazio>
        ) : (
          /* Oito colunas: a tabela ganha um respiro lateral menor que o padrão e
             uma largura mínima. Abaixo dela o cartão rola de lado em vez de
             espremer as colunas até cortar os cabeçalhos. */
          <Card className="mt-4 p-0! [&_table]:min-w-[64rem] [&_td]:px-3 [&_th]:px-3">
            <Table
              getRowKey={(p) => p.id}
              rows={atuais}
              defaultSort={{ key: 'views', dir: 'desc' }}
              footer={totais}
              columns={[
                {
                  key: 'post', header: 'Post', sortValue: (p) => p.conteudo,
                  renderFooter: () => <span className="font-semibold text-ink">Total de {inteiro(atuais.length)} posts</span>,
                  render: (p) => (
                    /* Largura fixa: com legenda longa a coluna pediria a largura do
                       texto inteiro e espremeria as colunas de número. */
                    <span className="flex w-[16rem] items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-elevated text-mute">
                        {p.miniatura ? <img src={p.miniatura} alt="" loading="lazy" className="h-full w-full object-cover" /> : <FilmStrip size={18} />}
                      </span>
                      <span className="min-w-0">
                        {p.url ? (
                          <a href={p.url} target="_blank" rel="noreferrer" title="Abrir o post na rede" className="line-clamp-1 font-medium text-ink hover:underline">{p.conteudo || 'Sem legenda'}</a>
                        ) : (
                          <span className="line-clamp-1 font-medium text-ink">{p.conteudo || 'Sem legenda'}</span>
                        )}
                        <span className="mt-0.5 flex items-center gap-1.5 text-caption text-mute">
                          <IconeRede plataforma={p.plataforma} size={13} />
                          {p.usuario || rede(p.plataforma).nome}
                          {p.externo && <Badge tone="neutral" className="px-1.5! py-0!">Direto na rede</Badge>}
                        </span>
                      </span>
                    </span>
                  ),
                },
                { key: 'publicadoEm', header: 'Data', width: '5.5rem', sortable: true, sortValue: (p) => p.publicadoEm, renderFooter: () => null, render: (p) => <span className="whitespace-nowrap">{diaCurto(diaNoFuso(p.publicadoEm, fuso))}</span> },
                /* Rótulos curtos e largura fixa nas colunas de número: a coluna
                   encolhe até o tamanho do dado e um cabeçalho longo sai cortado. */
                ...[['views', 'Views'], ['likes', 'Curtidas'], ['comments', 'Coment.'], ['shares', 'Compart.'], ['saves', 'Salvos']].map(([campo, header]) => ({
                  key: campo, header, width: LARGURAS[campo], align: 'right', numeric: true, sortable: true,
                  sortValue: (p) => p.metricas[campo],
                  render: (p) => celula(p.metricas[campo]),
                  renderFooter: (t) => <span className="font-semibold text-ink">{celula(t[campo])}</span>,
                })),
                { key: 'engajamento', header: 'Engaj.', width: '6.25rem', align: 'right', numeric: true, sortable: true, sortValue: (p) => p.metricas.engagementRate, renderFooter: () => null, render: (p) => (p.metricas.engagementRate ? percentual(p.metricas.engagementRate) : <span className="text-faint">—</span>) },
              ]}
            />
          </Card>
        )}
      </section>
    </div>
  )
}
