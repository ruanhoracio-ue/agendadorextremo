import { useEffect, useState } from 'react'
import { BookmarkSimple, ChatCircle, FilmStrip, Heart, PaperPlaneTilt, ShareFat } from '@phosphor-icons/react'
import { Select, SegmentedControl } from '../ui'
import { Modal } from './Modal'
import { IconeRede } from './IconeRede'
import { rede } from '../../lib/redes'
import { cn } from '../../lib/cn'

// Redes em que o vídeo ocupa a tela inteira, com o texto por cima.
const TELA_CHEIA = ['tiktok', 'snapchat']

function Midia({ midia, className }) {
  if (!midia) return null
  const origem = midia.previa || midia.url
  return (
    <div className={cn('flex items-center justify-center overflow-hidden bg-elevated text-mute', className)}>
      {midia.tipo === 'video'
        ? (midia.url ? <video src={midia.url} muted playsInline preload="metadata" className="h-full w-full object-cover" /> : <FilmStrip size={32} />)
        : (origem ? <img src={origem} alt="" className="h-full w-full object-cover" /> : <FilmStrip size={32} />)}
    </div>
  )
}

/**
 * PreviaDoPost — como o post deve aparecer em cada rede escolhida. É uma
 * aproximação: serve para conferir texto, corte e ordem das mídias, não para
 * reproduzir a tela da rede pixel a pixel.
 */
export function PreviaDoPost({ aberto, aoFechar, destinos, contas, conteudo, midias, tituloYoutube }) {
  const redes = [...new Set(destinos.map(d => d.plataforma))]
  const [escolhida, setEscolhida] = useState(redes[0])
  useEffect(() => { if (aberto && !redes.includes(escolhida)) setEscolhida(redes[0]) }, [aberto, redes.join(','), escolhida]) // eslint-disable-line react-hooks/exhaustive-deps

  const destino = destinos.find(d => d.plataforma === escolhida)
  const conta = contas.find(c => c.id === destino?.contaId)
  const usuario = conta?.usuario || conta?.nome || 'sua_conta'
  const texto = destino?.conteudo || conteudo
  const primeira = midias[0]
  const story = escolhida === 'instagram' && destino?.dados?.contentType === 'story'
  const vertical = story || TELA_CHEIA.includes(escolhida) || (primeira?.tipo === 'video' && ['instagram', 'youtube', 'facebook'].includes(escolhida))
  const titulo = escolhida === 'youtube' ? (tituloYoutube?.trim() || texto.split('\n')[0] || 'Sem título') : null

  return (
    <Modal aberto={aberto} aoFechar={aoFechar} titulo="Prévia do post" tamanho="sm">
      {redes.length === 0 ? (
        <p className="py-6 text-center text-body-sm text-mute">Escolha pelo menos uma conta para ver a prévia.</p>
      ) : (
        <div className="flex flex-col items-center gap-4">
          {redes.length > 1 && (redes.length <= 3
            ? <SegmentedControl ariaLabel="Rede da prévia" options={redes.map(r => ({ value: r, label: rede(r).nome }))} value={escolhida} onChange={setEscolhida} />
            : <Select aria-label="Rede da prévia" value={escolhida} onChange={(e) => setEscolhida(e.target.value)}>{redes.map(r => <option key={r} value={r}>{rede(r).nome}</option>)}</Select>)}

          {vertical ? (
            /* TELA CHEIA: Reels, Stories, TikTok, Shorts */
            <div className="relative aspect-[9/16] w-full max-w-[17rem] overflow-hidden rounded-lg border border-hairline bg-neutral-900 text-white">
              <Midia midia={primeira} className="absolute inset-0 bg-neutral-900! text-white/50!" />
              <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 to-transparent p-3 pt-10">
                <p className="flex items-center gap-1.5 text-[13px] font-semibold"><IconeRede plataforma={escolhida} size={14} />{usuario}</p>
                {titulo && <p className="mt-1 line-clamp-2 text-[13px] font-medium">{titulo}</p>}
                {!story && !titulo && texto && <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-[12px] leading-snug text-white/90">{texto}</p>}
              </div>
              {!story && (
                <div className="absolute bottom-16 right-2 flex flex-col items-center gap-3 text-white/90" aria-hidden="true">
                  <Heart size={22} weight="fill" /><ChatCircle size={22} weight="fill" /><ShareFat size={22} weight="fill" />
                </div>
              )}
              {midias.length > 1 && <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-medium">1/{midias.length}</span>}
            </div>
          ) : (
            /* FEED: imagem, carrossel, texto */
            <div className="w-full max-w-[21rem] overflow-hidden rounded-lg border border-hairline bg-surface">
              <div className="flex items-center gap-2.5 px-3 py-2.5">
                <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-emerald/[0.08] text-ink">
                  {conta?.foto ? <img src={conta.foto} alt="" className="h-full w-full object-cover" /> : <IconeRede plataforma={escolhida} size={15} />}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{usuario}</span>
              </div>
              {titulo && <p className="px-3 pb-2 text-sm font-semibold text-ink">{titulo}</p>}
              {escolhida !== 'instagram' && texto && <p className="line-clamp-6 whitespace-pre-wrap px-3 pb-3 text-body-sm text-body">{texto}</p>}
              {primeira && (
                <div className="relative">
                  <Midia midia={primeira} className={escolhida === 'instagram' ? 'aspect-[4/5]' : 'aspect-video'} />
                  {midias.length > 1 && <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white">1/{midias.length}</span>}
                </div>
              )}
              <div className="flex items-center gap-3 px-3 py-2.5 text-ink" aria-hidden="true">
                <Heart size={20} /><ChatCircle size={20} /><PaperPlaneTilt size={20} /><BookmarkSimple size={20} className="ml-auto" />
              </div>
              {escolhida === 'instagram' && texto && (
                <p className="line-clamp-3 whitespace-pre-wrap px-3 pb-3 text-body-sm text-body"><span className="font-semibold text-ink">{usuario}</span> {texto}</p>
              )}
            </div>
          )}

          <p className="text-center text-caption text-mute">
            Prévia aproximada. {escolhida === 'youtube' ? 'No YouTube, vídeo vertical de até 3 minutos sai como Short.' : 'Cada rede corta a imagem e o texto do seu jeito.'}
          </p>
        </div>
      )}
    </Modal>
  )
}
