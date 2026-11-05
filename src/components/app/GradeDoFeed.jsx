import { useEffect, useState } from 'react'
import { FilmStrip, InstagramLogo } from '@phosphor-icons/react'
import { Select } from '../ui'
import { Modal } from './Modal'
import { Faixa, Carregando } from './Avisos'
import { api } from '../../lib/api'
import { useApp } from '../../lib/contexto'
import { useDados } from '../../lib/useDados'
import { hojeNoFuso, somarDias, diaNoFuso, diaCurto } from '../../lib/datas'

const NA_FILA = ['scheduled', 'pending_approval', 'publishing']
const MAXIMO = 18

/**
 * GradeDoFeed — como a grade do perfil do Instagram vai ficar: no topo o que
 * está agendado (do mais distante para o mais próximo, que é a ordem em que a
 * grade vai ficar depois de tudo publicado) e, abaixo, o que já foi ao ar.
 * Stories não entram: não aparecem na grade.
 */
export function GradeDoFeed({ aberto, aoFechar }) {
  const { contasDePost, fuso } = useApp()
  const contas = contasDePost.filter(c => c.plataforma === 'instagram')
  const [contaId, setContaId] = useState('')
  const conta = contas.find(c => c.id === contaId) || contas[0]
  const hoje = hojeNoFuso(fuso)

  useEffect(() => { if (aberto && !contas.some(c => c.id === contaId)) setContaId(contas[0]?.id || '') }, [aberto, contas, contaId])

  const ativo = aberto && Boolean(conta)
  const fila = useDados(() => api.posts(hoje, somarDias(hoje, 60)), [ativo, hoje], { ativo })
  const publicados = useDados(() => api.metricas({ de: somarDias(hoje, -90), ate: hoje, conta: conta?.id }), [ativo, conta?.id, hoje], { ativo })

  const agora = new Date().toISOString()
  const agendados = (fila.dados?.posts || [])
    .filter(p => NA_FILA.includes(p.status) && p.agendadoPara >= agora)
    .filter(p => p.destinos.some(d => d.contaId === conta?.id && d.dados?.contentType !== 'story'))
    .sort((a, b) => b.agendadoPara.localeCompare(a.agendadoPara))
    .map(p => ({ id: p.id, imagem: p.midias[0]?.tipo === 'image' ? p.midias[0].url : null, video: p.midias[0]?.tipo === 'video' ? p.midias[0].url : null, rotulo: `Agendado ${diaCurto(diaNoFuso(p.agendadoPara, fuso))}`, legenda: p.conteudo }))
  const noAr = (publicados.dados?.posts || [])
    .filter(p => p.plataforma === 'instagram')
    .map(p => ({ id: p.id, imagem: p.miniatura, video: null, rotulo: null, legenda: p.conteudo }))
  const grade = [...agendados, ...noAr].slice(0, MAXIMO)
  const carregando = (fila.carregando && !fila.dados) || (publicados.carregando && !publicados.dados)
  const erro = fila.erro || publicados.erro

  return (
    <Modal aberto={aberto} aoFechar={aoFechar} titulo="Prévia do feed do Instagram" tamanho="sm">
      {contas.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <InstagramLogo size={28} className="text-faint" />
          <p className="text-body-sm text-mute">Conecte uma conta do Instagram para ver a grade do perfil.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {contas.length > 1 && (
            <Select aria-label="Conta do Instagram" value={conta.id} onChange={(e) => setContaId(e.target.value)}>
              {contas.map(c => <option key={c.id} value={c.id}>{c.usuario}</option>)}
            </Select>
          )}
          {erro ? <Faixa tom="erro">{erro.message}</Faixa>
            : carregando ? <Carregando />
            : grade.length === 0 ? <p className="py-8 text-center text-body-sm text-mute">Nada agendado nem publicado nos últimos 90 dias nesta conta.</p>
            : (
              <>
                <p className="text-caption text-mute">
                  {agendados.length > 0 ? `${agendados.length} ${agendados.length === 1 ? 'post agendado aparece' : 'posts agendados aparecem'} no topo, na ordem em que a grade vai ficar.` : 'Nenhum post agendado: a grade mostra só o que já foi ao ar.'}
                </p>
                <ul className="grid grid-cols-3 gap-0.5 overflow-hidden rounded-md">
                  {grade.map(item => (
                    <li key={item.id} title={item.legenda || undefined} className="relative flex aspect-[4/5] items-center justify-center overflow-hidden bg-elevated text-mute">
                      {item.imagem ? <img src={item.imagem} alt="" loading="lazy" className="h-full w-full object-cover" />
                        : item.video ? <video src={item.video} muted playsInline preload="metadata" className="h-full w-full object-cover" />
                        : <FilmStrip size={22} />}
                      {item.rotulo && <span className="absolute inset-x-0 bottom-0 bg-black/65 px-1.5 py-1 text-center text-[10px] font-medium text-white">{item.rotulo}</span>}
                    </li>
                  ))}
                </ul>
              </>
            )}
        </div>
      )}
    </Modal>
  )
}
