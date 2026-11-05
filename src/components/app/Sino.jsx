import { useEffect, useRef, useState } from 'react'
import { Bell, CheckCircle, WarningCircle, Plugs } from '@phosphor-icons/react'
import { Button } from '../ui'
import { Modal } from './Modal'
import { IconeRede, RedesDoPost } from './IconeRede'
import { useApp } from '../../lib/contexto'
import { rede, status } from '../../lib/redes'
import { dataHoraLegivel } from '../../lib/datas'

const CONFERIR_A_CADA_MS = 120000
const podeNotificar = typeof Notification !== 'undefined'

/**
 * Sino — o que pede atenção agora: posts que falharam e contas que caíram.
 * Fica no topo de toda tela, com a contagem. Com a aba aberta e a permissão
 * dada, um problema novo também vira notificação do navegador.
 */
export function Sino({ avisos }) {
  const { fuso, abrirPost, ir } = useApp()
  const [aberto, setAberto] = useState(false)
  const [permissao, setPermissao] = useState(podeNotificar ? Notification.permission : 'denied')
  const conhecidos = useRef(null)

  const posts = avisos.dados?.posts || []
  const contas = avisos.dados?.contas || []
  const total = posts.length + contas.length

  useEffect(() => {
    const t = setInterval(() => document.visibilityState === 'visible' && avisos.recarregar({ silencioso: true }), CONFERIR_A_CADA_MS)
    return () => clearInterval(t)
  }, [avisos.recarregar])

  // Notifica só o que apareceu depois da primeira leitura: abrir o app não
  // dispara uma notificação para cada problema antigo.
  useEffect(() => {
    if (!avisos.dados) return
    const ids = [...posts.map(p => `post:${p.id}`), ...contas.map(c => `conta:${c.id}`)]
    if (conhecidos.current && permissao === 'granted') {
      const novos = ids.filter(id => !conhecidos.current.has(id))
      if (novos.length) {
        new Notification('Agendador', {
          body: novos.length === 1 ? (novos[0].startsWith('post:') ? 'Um post falhou ao publicar.' : 'Uma conta precisa ser reconectada.') : `${novos.length} novos avisos.`,
        })
      }
    }
    conhecidos.current = new Set(ids)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avisos.dados])

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        aria-label={total ? `Avisos: ${total}` : 'Avisos'}
        title="Avisos"
        className="relative flex h-9 w-9 items-center justify-center rounded-md text-body transition-colors hover:bg-elevated hover:text-ink"
      >
        <Bell size={18} weight={total ? 'fill' : 'regular'} />
        {total > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold tabular-nums text-white">
            {total}
          </span>
        )}
      </button>

      <Modal aberto={aberto} aoFechar={() => setAberto(false)} titulo="Avisos">
        <div className="flex flex-col gap-5">
          {total === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <CheckCircle size={28} className="text-emerald" />
              <p className="text-label-lg text-ink">Tudo certo</p>
              <p className="text-body-sm text-mute">Nenhum post falhou nos últimos 30 dias e todas as contas estão conectadas.</p>
            </div>
          ) : (
            <ul className="flex flex-col divide-y divide-hairline rounded-md border border-hairline">
              {contas.map(c => (
                <li key={c.id} className="flex items-center gap-3 px-4 py-3">
                  <Plugs size={18} className="shrink-0 text-danger" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 text-sm font-medium text-ink"><IconeRede plataforma={c.plataforma} size={14} />{c.usuario || rede(c.plataforma).nome}</span>
                    <span className="text-caption text-mute">A rede derrubou o acesso. Posts para esta conta ficam parados.</span>
                  </span>
                  <Button variant="secondary" size="sm" onClick={() => { setAberto(false); ir('contas') }}>Reconectar</Button>
                </li>
              ))}
              {posts.map(p => (
                <li key={p.id} className="flex items-center gap-3 px-4 py-3">
                  <WarningCircle size={18} weight="fill" className="shrink-0 text-danger" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink">{p.conteudo || 'Sem legenda'}</span>
                    <span className="flex flex-wrap items-center gap-1.5 text-caption text-mute">
                      {status(p.status).rotulo} · {dataHoraLegivel(p.agendadoPara, fuso)} <RedesDoPost destinos={p.destinos} size={12} />
                    </span>
                  </span>
                  <Button variant="secondary" size="sm" onClick={() => { setAberto(false); abrirPost(p) }}>Ver</Button>
                </li>
              ))}
            </ul>
          )}

          {podeNotificar && permissao === 'default' && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-elevated px-4 py-3">
              <p className="min-w-0 flex-1 text-body-sm text-body">Quer ser avisado na hora? Com esta aba aberta, o navegador mostra uma notificação quando um post falhar.</p>
              <Button variant="secondary" size="sm" onClick={async () => setPermissao(await Notification.requestPermission())}>Ativar notificações</Button>
            </div>
          )}
        </div>
      </Modal>
    </>
  )
}
