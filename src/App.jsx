import { useCallback, useEffect, useMemo, useState } from 'react'
import { SquaresFour, CalendarDots, ChartLine, ChatsCircle, Plugs, Gear, SignOut } from '@phosphor-icons/react'
import { Container, Breadcrumbs, Logo, SidebarNav, ThemeToggle, Button } from './components/ui'
import { Toasts, Faixa, Carregando } from './components/app/Avisos'
import { Contexto } from './lib/contexto'
import { api } from './lib/api'
import { publica } from './lib/redes'
import { useDados } from './lib/useDados'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Calendario from './pages/Calendario'
import Inbox from './pages/Inbox'
import { Sino } from './components/app/Sino'
import Metricas from './pages/Metricas'
import Contas from './pages/Contas'
import Configuracoes from './pages/Configuracoes'

const grupos = [
  {
    items: [
      { key: 'dashboard', icon: SquaresFour, label: 'Dashboard' },
      { key: 'calendario', icon: CalendarDots, label: 'Calendário' },
      { key: 'inbox', icon: ChatsCircle, label: 'Caixa de entrada' },
      { key: 'metricas', icon: ChartLine, label: 'Métricas' },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { key: 'contas', icon: Plugs, label: 'Contas conectadas' },
      { key: 'configuracoes', icon: Gear, label: 'Configurações' },
    ],
  },
]

// Rota = caminho da URL. Pequeno o bastante para não pedir um roteador.
const caminhos = { dashboard: '/', calendario: '/calendario', inbox: '/caixa-de-entrada', metricas: '/metricas', contas: '/contas', configuracoes: '/configuracoes' }
const paginaDoCaminho = (caminho) => Object.keys(caminhos).find(k => caminhos[k] === caminho) || 'dashboard'
const rotulo = (key) => grupos.flatMap(g => g.items).find(i => i.key === key)?.label

const paginas = { dashboard: Dashboard, calendario: Calendario, inbox: Inbox, metricas: Metricas, contas: Contas, configuracoes: Configuracoes }

function usePagina() {
  const [pagina, setPagina] = useState(() => paginaDoCaminho(window.location.pathname))
  useEffect(() => {
    const voltar = () => setPagina(paginaDoCaminho(window.location.pathname))
    window.addEventListener('popstate', voltar)
    return () => window.removeEventListener('popstate', voltar)
  }, [])
  const ir = useCallback((key) => {
    window.history.pushState(null, '', caminhos[key])
    setPagina(key)
  }, [])
  return [pagina, ir]
}

export default function App() {
  const estado = useDados(() => api.estado(), [])

  // Sessão que expira no meio do uso volta para o login.
  useEffect(() => {
    const semLogin = () => estado.recarregar()
    window.addEventListener('agendador:sem-login', semLogin)
    return () => window.removeEventListener('agendador:sem-login', semLogin)
  }, [estado.recarregar])

  let tela
  if (estado.carregando && !estado.dados) {
    tela = <div className="ds-app flex min-h-screen items-center justify-center bg-canvas"><Carregando /></div>
  } else if (estado.erro) {
    tela = (
      <TelaCentral>
        <Faixa tom="erro" titulo="Não consegui abrir o app.">{estado.erro.message}</Faixa>
        <Button variant="secondary" size="field" className="mt-4" onClick={() => estado.recarregar()}>Tentar de novo</Button>
      </TelaCentral>
    )
  } else if (estado.dados.acesso === 'bloqueado') {
    tela = (
      <TelaCentral>
        <Faixa tom="alerta" titulo="Falta configurar a senha do app.">
          Este endereço é público e o app ainda não tem senha, então ele fica travado. Cadastre o secret APP_PASSWORD no Worker e recarregue a página.
        </Faixa>
      </TelaCentral>
    )
  } else if (estado.dados.acesso === 'sem-login') {
    tela = <Login aoEntrar={() => estado.recarregar()} />
  } else {
    tela = <Shell estado={estado.dados} recarregarEstado={() => estado.recarregar({ silencioso: true })} />
  }

  return (
    <>
      {/* Gradiente da marca em SVG, uma vez por página: o Logo e os ícones com
          `fill-brand-gradient` apontam para este id (DESIGN.md, A.9). */}
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <defs>
          <linearGradient id="brand-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop stopColor="#10b981" offset="0%" />
            <stop stopColor="#34d399" offset="100%" />
          </linearGradient>
        </defs>
      </svg>
      {tela}
      <Toasts />
    </>
  )
}

function TelaCentral({ children }) {
  return (
    <div className="ds-app flex min-h-screen items-center justify-center bg-canvas p-6">
      <div className="w-full max-w-md">
        <Logo className="mb-8 h-6" />
        {children}
      </div>
    </div>
  )
}

function Shell({ estado, recarregarEstado }) {
  const [pagina, ir] = usePagina()
  const [recolhido, setRecolhido] = useState(false)
  const [acoes, setAcoes] = useState(null)
  // Pedido de uma tela para outra: "abra este post no calendário".
  const [postPedido, setPostPedido] = useState(null)
  const temChave = estado.chave.configurada

  // Contas conectadas: usadas pelo formulário de post, pelas métricas e pela
  // tela de contas, então ficam aqui em cima e não em cada tela.
  const contas = useDados(() => api.contas(), [temChave])
  // Avisos (posts que falharam, contas que caíram): lidos uma vez aqui e
  // usados pelo sino do topo e pelo dashboard.
  const avisos = useDados(() => api.avisos(), [temChave])

  const contexto = useMemo(() => ({
    estado,
    recarregarEstado,
    fuso: estado.fuso,
    contas: contas.dados?.contas || [],
    // Só as contas em que dá para publicar (o formulário e as métricas usam estas).
    contasDePost: (contas.dados?.contas || []).filter(c => publica(c.plataforma)),
    temMetricas: contas.dados?.temMetricas !== false,
    contasCarregando: contas.carregando,
    contasErro: contas.erro,
    recarregarContas: contas.recarregar,
    avisos: avisos.dados,
    ir,
    // A tela contribui com os botões do cabeçalho (ficam na linha do título).
    definirAcoes: setAcoes,
    postPedido,
    abrirPost: (post) => { setPostPedido(post); ir('calendario') },
    limparPostPedido: () => setPostPedido(null),
  }), [estado, recarregarEstado, contas.dados, contas.carregando, contas.erro, contas.recarregar, avisos.dados, ir, postPedido])

  const Pagina = paginas[pagina]

  const sair = async () => {
    await api.sair().catch(() => {})
    recarregarEstado()
  }

  return (
    <Contexto.Provider value={contexto}>
      <div className="ds-app flex min-h-screen bg-canvas">
        <SidebarNav
          className="sticky top-0 hidden h-screen lg:flex"
          groups={grupos}
          active={pagina}
          onSelect={ir}
          collapsed={recolhido}
          onToggleCollapsed={() => setRecolhido(v => !v)}
          header={({ collapsed }) => (
            <span className="flex items-center gap-2.5">
              <Logo variant="symbol" className="h-7 w-7" />
              {!collapsed && <span className="text-label-lg font-semibold text-ink">Agendador</span>}
            </span>
          )}
          footer={estado.acesso === 'logado' && (
            <button type="button" onClick={sair} className="flex w-full items-center gap-3 rounded-full px-3 py-2 text-sm font-medium text-mute transition-colors hover:bg-elevated hover:text-ink">
              <SignOut size={18} className="shrink-0" />
              {!recolhido && 'Sair'}
            </button>
          )}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-16 shrink-0 items-center gap-3 border-b border-hairline bg-surface px-6">
            {/* Em tela estreita a barra lateral some; a navegação desce para cá. */}
            <nav className="flex items-center gap-1 lg:hidden" aria-label="Navegação">
              {grupos.flatMap(g => g.items).map(({ key, icon: Icone, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => ir(key)}
                  title={label}
                  aria-label={label}
                  aria-current={pagina === key ? 'page' : undefined}
                  className={pagina === key
                    ? 'flex h-9 w-9 items-center justify-center rounded-md bg-emerald/10 text-emerald-deep'
                    : 'flex h-9 w-9 items-center justify-center rounded-md text-body transition-colors hover:bg-elevated hover:text-ink'}
                >
                  <Icone size={18} weight={pagina === key ? 'fill' : 'regular'} />
                </button>
              ))}
            </nav>
            <div className="ml-auto flex items-center gap-3">
              <Sino avisos={avisos} />
              <ThemeToggle className="h-9 w-9" />
            </div>
          </header>

          <main className="flex-1 py-8">
            <Container size="fluid">
              <Breadcrumbs items={[
                { label: 'Agendador', href: '/', onClick: (e) => { e.preventDefault(); ir('dashboard') } },
                { label: rotulo(pagina) },
              ]} />
              <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
                <h1 className="text-heading-xl text-ink">{rotulo(pagina)}</h1>
                {acoes}
              </div>

              <div className="mt-8">
                {/* Sem a chave as telas abrem vazias, para dar para conhecer o app
                    antes; o aviso diz por que não há dados e onde resolver. */}
                {!temChave && pagina !== 'configuracoes' && (
                  <Faixa
                    tom="info"
                    className="mb-6"
                    titulo="O app ainda não está ligado ao Zernio."
                    acao={<Button variant="secondary" size="sm" onClick={() => ir('configuracoes')}>Cadastrar a chave</Button>}
                  >
                    As telas estão vazias porque falta a chave da API. Dá para navegar por tudo; agendar, conectar contas e ver números só funciona depois de cadastrar a chave.
                  </Faixa>
                )}
                <Pagina key={pagina} />
              </div>
            </Container>
          </main>
        </div>
      </div>
    </Contexto.Provider>
  )
}
