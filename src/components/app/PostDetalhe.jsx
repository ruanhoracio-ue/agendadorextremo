import { useState } from 'react'
import { ArrowSquareOut, FilmStrip } from '@phosphor-icons/react'
import { Badge, Button } from '../ui'
import { Modal, Confirmar } from './Modal'
import { Faixa, avisar } from './Avisos'
import { IconeRede } from './IconeRede'
import { api } from '../../lib/api'
import { useApp } from '../../lib/contexto'
import { rede, status } from '../../lib/redes'
import { dataHoraLegivel } from '../../lib/datas'

const EDITAVEIS = ['draft', 'scheduled', 'failed', 'partial', 'cancelled']

/** Detalhe de um post: o que é, onde sai, como está em cada rede e o que dá para fazer. */
export function PostDetalhe({ post, aoFechar, aoEditar, aoMudar }) {
  const { fuso } = useApp()
  const [confirmando, setConfirmando] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState(null)

  if (!post) return null
  const geral = status(post.status)

  const executar = async (acao, mensagem) => {
    setOcupado(true)
    setErro(null)
    try {
      await acao()
      avisar(mensagem)
      aoMudar()
    } catch (falha) {
      setErro(falha.message)
    } finally {
      setOcupado(false)
      setConfirmando(false)
    }
  }

  return (
    <>
      <Modal
        aberto
        aoFechar={aoFechar}
        titulo="Post"
        rodape={
          <>
            {post.status !== 'published' && (
              <Button variant="ghost" size="field" className="mr-auto text-danger!" disabled={ocupado} onClick={() => setConfirmando(true)}>Excluir</Button>
            )}
            {['failed', 'partial'].includes(post.status) && (
              <Button variant="secondary" size="field" disabled={ocupado} onClick={() => executar(() => api.tentarDeNovo(post.id), 'Nova tentativa enviada.')}>Tentar de novo</Button>
            )}
            {EDITAVEIS.includes(post.status) && <Button size="field" disabled={ocupado} onClick={() => aoEditar(post)}>Editar</Button>}
          </>
        }
      >
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone={geral.tom}>{geral.rotulo}</Badge>
            <span className="text-body-sm text-mute">
              {post.agendadoPara ? dataHoraLegivel(post.agendadoPara, fuso) : 'Sem data definida'}
            </span>
          </div>

          <p className="whitespace-pre-wrap text-body-sm text-ink">{post.conteudo || <span className="text-faint">Sem legenda.</span>}</p>

          {post.midias.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {post.midias.map((m, i) => (
                <li key={i} className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-sm border border-hairline bg-elevated text-mute" title={m.nome || undefined}>
                  {m.miniatura ? <img src={m.miniatura} alt="" className="h-full w-full object-cover" /> : <FilmStrip size={22} />}
                </li>
              ))}
            </ul>
          )}

          {post.destinos.length > 0 ? (
            <ul className="flex flex-col divide-y divide-hairline rounded-md border border-hairline">
              {post.destinos.map((d, i) => {
                const s = status(d.status)
                return (
                  <li key={i} className="flex flex-col gap-1.5 px-4 py-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <IconeRede plataforma={d.plataforma} size={18} className="text-body" />
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">
                        {rede(d.plataforma).nome}{d.usuario ? ` · ${d.usuario}` : ''}
                      </span>
                      <Badge tone={s.tom}>{s.rotulo}</Badge>
                      {d.url && (
                        <a href={d.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-emerald-deep hover:underline">
                          Ver post <ArrowSquareOut size={13} />
                        </a>
                      )}
                    </div>
                    {d.conteudo && <p className="whitespace-pre-wrap text-caption text-mute">Texto próprio desta rede: {d.conteudo}</p>}
                    {d.erro && <p className="text-caption text-danger-deep">{d.erro}</p>}
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="text-body-sm text-mute">Nenhuma conta escolhida ainda.</p>
          )}

          {erro && <Faixa tom="erro">{erro}</Faixa>}
        </div>
      </Modal>

      <Confirmar
        aberto={confirmando}
        aoFechar={() => setConfirmando(false)}
        aoConfirmar={() => executar(() => api.excluirPost(post.id), 'Post excluído.')}
        titulo="Excluir este post?"
        ocupado={ocupado}
      >
        O post sai do agendador e não será publicado. O que já foi ao ar em alguma rede continua lá.
      </Confirmar>
    </>
  )
}
