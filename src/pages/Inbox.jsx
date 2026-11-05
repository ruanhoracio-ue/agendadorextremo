import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowSquareOut, ChatsCircle, ChatCircleDots, Heart, PaperPlaneRight, X } from '@phosphor-icons/react'
import { Button, Card, SegmentedControl } from '../components/ui'
import { Faixa, Carregando, avisar } from '../components/app/Avisos'
import { IconeRede } from '../components/app/IconeRede'
import { classeCampo } from '../components/app/campos'
import { api } from '../lib/api'
import { useDados } from '../lib/useDados'
import { rede } from '../lib/redes'
import { haQuanto } from '../lib/datas'
import { inteiro } from '../lib/formato'
import { cn } from '../lib/cn'

const ABAS = [{ value: 'comentarios', label: 'Comentários' }, { value: 'mensagens', label: 'Mensagens' }]
const painel = 'flex h-[calc(100vh-17rem)] min-h-[26rem] flex-col overflow-hidden p-0!'

/**
 * Caixa de entrada — comentários dos posts e mensagens diretas de todas as
 * contas, com resposta daqui mesmo. À esquerda a lista, à direita a conversa.
 */
export default function Inbox() {
  const [aba, setAba] = useState('comentarios')
  return (
    <div className="flex flex-col gap-5">
      <SegmentedControl ariaLabel="Tipo de conversa" options={ABAS} value={aba} onChange={setAba} className="self-start" />
      {aba === 'comentarios' ? <Comentarios /> : <Mensagens />}
    </div>
  )
}

// ---------- Peças comuns ----------

function Avatar({ foto, nome, className }) {
  return (
    <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-emerald/[0.08] text-label-md font-semibold text-ink', className)}>
      {foto ? <img src={foto} alt="" loading="lazy" className="h-full w-full object-cover" /> : (nome || '?').trim().charAt(0).toUpperCase()}
    </span>
  )
}

function Falhas({ falhas }) {
  if (!falhas?.length) return null
  return (
    <Faixa tom="alerta" titulo="Algumas contas não responderam.">
      {falhas.map((f, i) => <p key={i}>{rede(f.plataforma).nome}{f.usuario ? ` (${f.usuario})` : ''}: {f.erro}</p>)}
    </Faixa>
  )
}

function DuasColunas({ lista, conversa, temSelecao }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[22rem_minmax(0,1fr)]">
      {/* Em tela estreita só cabe uma coluna: a lista some quando há conversa aberta. */}
      <Card className={cn(painel, temSelecao && 'hidden lg:flex')}>{lista}</Card>
      <Card className={cn(painel, !temSelecao && 'hidden lg:flex')}>{conversa}</Card>
    </div>
  )
}

function SemSelecao({ icone: Icone, children }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <Icone size={28} className="text-faint" />
      <p className="max-w-xs text-body-sm text-mute">{children}</p>
    </div>
  )
}

function Voltar({ onClick }) {
  return (
    <button type="button" onClick={onClick} aria-label="Voltar para a lista" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-mute transition-colors hover:bg-elevated hover:text-ink lg:hidden">
      <ArrowLeft size={16} />
    </button>
  )
}

function Resposta({ placeholder, contexto, aoCancelarContexto, aoEnviar }) {
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)

  const enviar = async () => {
    if (!texto.trim() || enviando) return
    setEnviando(true)
    try {
      await aoEnviar(texto.trim())
      setTexto('')
    } catch (falha) {
      avisar(falha.message, 'erro')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="border-t border-hairline p-3">
      {contexto && (
        <p className="mb-2 flex items-center gap-2 text-caption text-mute">
          <span className="min-w-0 flex-1 truncate">{contexto}</span>
          <button type="button" onClick={aoCancelarContexto} aria-label="Cancelar resposta a este comentário" className="text-mute hover:text-ink"><X size={12} /></button>
        </p>
      )}
      <div className="flex items-end gap-2">
        <textarea
          rows={2}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          /* Enter quebra linha; enviar é no botão ou com Ctrl/Cmd+Enter. A
             resposta vai a público, então não sai por um Enter distraído. */
          onKeyDown={(e) => (e.metaKey || e.ctrlKey) && e.key === 'Enter' && enviar()}
          placeholder={placeholder}
          className={cn(classeCampo, 'resize-none py-2 leading-relaxed')}
        />
        <Button size="field" disabled={enviando || !texto.trim()} onClick={enviar} icon={<PaperPlaneRight size={14} weight="bold" />}>
          {enviando ? 'Enviando…' : 'Enviar'}
        </Button>
      </div>
    </div>
  )
}

// ---------- Comentários ----------

function Comentarios() {
  const posts = useDados(() => api.postsComentados(), [])
  const [escolhido, setEscolhido] = useState(null)
  const lista = posts.dados?.posts || []
  const post = lista.find(p => p.id === escolhido) || null

  return (
    <>
      <Falhas falhas={posts.dados?.falhas} />
      {posts.erro && <Faixa tom="erro" titulo="Não consegui carregar os comentários.">{posts.erro.message}</Faixa>}
      <DuasColunas
        temSelecao={Boolean(post)}
        lista={
          posts.carregando && !posts.dados ? <Carregando /> : lista.length === 0 ? (
            <SemSelecao icone={ChatCircleDots}>Nenhum post com comentários. O Zernio atualiza esta lista a cada 10 minutos.</SemSelecao>
          ) : (
            <ul className="flex-1 divide-y divide-hairline overflow-y-auto">
              {lista.map(p => (
                <li key={p.id}>
                  <button type="button" onClick={() => setEscolhido(p.id)} aria-current={p.id === escolhido ? 'true' : undefined} className={cn('flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-elevated', p.id === escolhido && 'bg-emerald/10')}>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-elevated text-mute">
                      {p.imagem ? <img src={p.imagem} alt="" loading="lazy" className="h-full w-full object-cover" /> : <IconeRede plataforma={p.plataforma} size={18} />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-2 text-sm font-medium text-ink">{p.conteudo || 'Post sem legenda'}</span>
                      <span className="mt-1 flex items-center gap-1.5 text-caption text-mute">
                        <IconeRede plataforma={p.plataforma} size={12} />
                        {inteiro(p.comentarios)} {p.comentarios === 1 ? 'comentário' : 'comentários'} · {haQuanto(p.criadoEm)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )
        }
        conversa={post ? <Fio key={post.id} post={post} aoVoltar={() => setEscolhido(null)} /> : <SemSelecao icone={ChatCircleDots}>Escolha um post para ler e responder os comentários.</SemSelecao>}
      />
    </>
  )
}

function Fio({ post, aoVoltar }) {
  const fio = useDados(() => api.comentarios(post.id, post.contaId), [post.id])
  const [alvo, setAlvo] = useState(null) // comentário sendo respondido
  const comentarios = fio.dados?.comentarios || []

  const responder = async (texto) => {
    await api.responderComentario(post.id, { contaId: post.contaId, texto, comentarioId: alvo?.id }, crypto.randomUUID())
    avisar('Resposta publicada.')
    setAlvo(null)
    await fio.recarregar({ silencioso: true })
  }

  return (
    <>
      <div className="flex items-center gap-3 border-b border-hairline px-4 py-3">
        <Voltar onClick={aoVoltar} />
        <span className="min-w-0 flex-1">
          <span className="line-clamp-1 text-sm font-medium text-ink">{post.conteudo || 'Post sem legenda'}</span>
          <span className="flex items-center gap-1.5 text-caption text-mute"><IconeRede plataforma={post.plataforma} size={12} />{post.usuario || rede(post.plataforma).nome}</span>
        </span>
        {post.link && <a href={post.link} target="_blank" rel="noreferrer" aria-label="Abrir o post na rede" className="flex h-8 w-8 items-center justify-center rounded-md text-mute transition-colors hover:bg-elevated hover:text-ink"><ArrowSquareOut size={15} /></a>}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {fio.erro ? <Faixa tom="erro">{fio.erro.message}</Faixa>
          : fio.carregando && !fio.dados ? <Carregando />
          : comentarios.length === 0 ? <p className="py-8 text-center text-body-sm text-mute">Sem comentários visíveis neste post.</p>
          : (
            <ul className="flex flex-col gap-5">
              {comentarios.map(c => (
                <li key={c.id}>
                  <Comentario comentario={c} aoResponder={() => setAlvo(c)} />
                  {c.respostas.length > 0 && (
                    <ul className="ml-12 mt-4 flex flex-col gap-4 border-l border-hairline pl-4">
                      {c.respostas.map(r => <li key={r.id}><Comentario comentario={r} /></li>)}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}
      </div>

      <Resposta
        placeholder={alvo ? `Responder a ${alvo.autor.nome}` : 'Comentar no post'}
        contexto={alvo && `Respondendo a ${alvo.autor.nome}: ${alvo.texto}`}
        aoCancelarContexto={() => setAlvo(null)}
        aoEnviar={responder}
      />
    </>
  )
}

function Comentario({ comentario: c, aoResponder }) {
  return (
    <div className="flex items-start gap-3">
      <Avatar foto={c.autor.foto} nome={c.autor.nome} />
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
          <span className="font-semibold text-ink">{c.autor.nome}</span>
          {c.autor.dono && <span className="text-caption font-medium text-emerald-deep">sua conta</span>}
          <span className="text-caption text-faint">{haQuanto(c.criadoEm)}</span>
        </p>
        <p className="mt-0.5 whitespace-pre-wrap break-words text-body-sm text-body">{c.texto}</p>
        <p className="mt-1.5 flex items-center gap-4 text-caption text-mute">
          {c.curtidas > 0 && <span className="inline-flex items-center gap-1"><Heart size={12} />{inteiro(c.curtidas)}</span>}
          {aoResponder && c.podeResponder && <button type="button" onClick={aoResponder} className="font-medium text-mute transition-colors hover:text-ink">Responder</button>}
        </p>
      </div>
    </div>
  )
}

// ---------- Mensagens diretas ----------

function Mensagens() {
  const conversas = useDados(() => api.conversas(), [])
  const [escolhida, setEscolhida] = useState(null)
  const lista = conversas.dados?.conversas || []
  const conversa = lista.find(c => c.id === escolhida) || null

  return (
    <>
      <Falhas falhas={conversas.dados?.falhas} />
      {conversas.erro && <Faixa tom="erro" titulo="Não consegui carregar as mensagens.">{conversas.erro.message}</Faixa>}
      <DuasColunas
        temSelecao={Boolean(conversa)}
        lista={
          conversas.carregando && !conversas.dados ? <Carregando /> : lista.length === 0 ? (
            <SemSelecao icone={ChatsCircle}>Nenhuma conversa. As mensagens diretas das contas conectadas aparecem aqui.</SemSelecao>
          ) : (
            <ul className="flex-1 divide-y divide-hairline overflow-y-auto">
              {lista.map(c => (
                <li key={c.id}>
                  <button type="button" onClick={() => setEscolhida(c.id)} aria-current={c.id === escolhida ? 'true' : undefined} className={cn('flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-elevated', c.id === escolhida && 'bg-emerald/10')}>
                    <Avatar foto={c.foto} nome={c.nome} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline gap-2">
                        <span className={cn('min-w-0 flex-1 truncate text-sm text-ink', c.naoLidas ? 'font-semibold' : 'font-medium')}>{c.nome}</span>
                        <span className="shrink-0 text-caption text-faint">{haQuanto(c.atualizadaEm)}</span>
                      </span>
                      <span className="flex items-center gap-1.5 text-caption text-mute">
                        <IconeRede plataforma={c.plataforma} size={12} />
                        <span className="min-w-0 flex-1 truncate">{c.ultima || 'Sem texto'}</span>
                        {c.naoLidas > 0 && <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald px-1 text-[10px] font-semibold tabular-nums text-white" aria-label={`${c.naoLidas} não lidas`}>{c.naoLidas}</span>}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )
        }
        conversa={conversa
          ? <Conversa key={conversa.id} conversa={conversa} aoVoltar={() => setEscolhida(null)} aoEnviar={() => conversas.recarregar({ silencioso: true })} />
          : <SemSelecao icone={ChatsCircle}>Escolha uma conversa para ler e responder.</SemSelecao>}
      />
    </>
  )
}

function Conversa({ conversa, aoVoltar, aoEnviar }) {
  const historico = useDados(() => api.mensagens(conversa.id, conversa.contaId), [conversa.id])
  const mensagens = historico.dados?.mensagens || []
  const fim = useRef(null)

  // Abre (e permanece) na mensagem mais recente.
  useEffect(() => { fim.current?.scrollIntoView({ block: 'end' }) }, [mensagens.length])

  const enviar = async (texto) => {
    await api.enviarMensagem(conversa.id, { contaId: conversa.contaId, texto })
    await historico.recarregar({ silencioso: true })
    aoEnviar()
  }

  return (
    <>
      <div className="flex items-center gap-3 border-b border-hairline px-4 py-3">
        <Voltar onClick={aoVoltar} />
        <Avatar foto={conversa.foto} nome={conversa.nome} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-ink">{conversa.nome}</span>
          <span className="flex items-center gap-1.5 text-caption text-mute"><IconeRede plataforma={conversa.plataforma} size={12} />{conversa.usuario || rede(conversa.plataforma).nome}</span>
        </span>
        {conversa.link && <a href={conversa.link} target="_blank" rel="noreferrer" aria-label="Abrir a conversa na rede" className="flex h-8 w-8 items-center justify-center rounded-md text-mute transition-colors hover:bg-elevated hover:text-ink"><ArrowSquareOut size={15} /></a>}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {historico.erro ? <Faixa tom="erro">{historico.erro.message}</Faixa>
          : historico.carregando && !historico.dados ? <Carregando />
          : (
            <ul className="flex flex-col gap-2">
              {mensagens.map(m => (
                <li key={m.id} className={cn('flex flex-col', m.enviada ? 'items-end' : 'items-start')}>
                  <div className={cn('max-w-[80%] rounded-lg px-3 py-2 text-body-sm', m.enviada ? 'bg-emerald/10 text-ink' : 'bg-elevated text-ink')}>
                    {m.apagada ? <span className="text-faint">Mensagem apagada</span> : <span className="whitespace-pre-wrap break-words">{m.texto}</span>}
                    {m.anexos.map((a, i) => (
                      a.url && <a key={i} href={a.url} target="_blank" rel="noreferrer" className="mt-1 block font-medium text-emerald-deep hover:underline">{a.nome || 'Abrir anexo'}</a>
                    ))}
                  </div>
                  <span className="mt-0.5 px-1 text-[11px] text-faint">{haQuanto(m.criadaEm)}</span>
                </li>
              ))}
              <li ref={fim} />
            </ul>
          )}
      </div>

      <Resposta placeholder={`Mensagem para ${conversa.nome}`} aoEnviar={enviar} />
    </>
  )
}
