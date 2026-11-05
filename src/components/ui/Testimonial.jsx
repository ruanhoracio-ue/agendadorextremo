import { useState } from 'react'
import { Check, Play, TrendUp, VideoCamera } from '@phosphor-icons/react'
import { cn } from '../../lib/cn'
import { useSpotlight } from '../../lib/useSpotlight'
import { Stars } from './primitives'
import { VideoModal } from './VideoModal'

/** Thumbnail oficial do vídeo no YouTube (maxres cai para hq no onError). */
const youtubeThumb = (videoId) => `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`

/** VerifiedBadge — selo verde de "cliente verificado". */
function VerifiedBadge() {
  return (
    <span
      className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-brand-gradient text-white"
      title="Cliente verificado"
    >
      <Check size={10} weight="bold" />
    </span>
  )
}

/** Author — foto + nome (com selo) + cargo. */
function Author({ avatar, name, role }) {
  return (
    <figcaption className="flex items-center gap-3">
      <img
        src={avatar}
        alt={`Foto de ${name}`}
        className="h-12 w-12 shrink-0 rounded-full border border-hairline object-cover"
      />
      <div>
        <div className="flex items-center gap-1.5 text-sm font-medium text-ink">
          {name}
          <VerifiedBadge />
        </div>
        <div className="mt-0.5 text-xs text-mute">{role}</div>
      </div>
    </figcaption>
  )
}

/**
 * TestimonialCard — depoimento em texto: estrelas pretas, citação e foto no rodapé.
 */
export function TestimonialCard({ quote, name, role, avatar, className }) {
  const spotlight = useSpotlight()

  return (
    <figure className={cn('premium-card flex flex-col justify-between gap-8 p-8', className)} {...spotlight}>
      <div>
        <Stars />
        <blockquote className="mt-6 text-base leading-relaxed text-body">“{quote}”</blockquote>
      </div>
      <Author avatar={avatar} name={name} role={role} />
    </figure>
  )
}

/**
 * VideoTestimonialCard — depoimento em vídeo: thumbnail com play e badge de
 * resultado no topo; corpo com estrelas, texto e autor (foto) no rodapé.
 *
 * Passe `videoId` (YouTube) para o card gerar a thumbnail e abrir o lightbox
 * sozinho; `thumbnail`/`onPlay` continuam disponíveis para casos manuais.
 * Use `quote` para uma citação literal do cliente ou `headline` para uma frase
 * de resultado em terceira pessoa (sem aspas).
 */
export function VideoTestimonialCard({
  videoId,
  thumbnail,
  avatar,
  name,
  role,
  duration,
  quote,
  headline,
  result,
  onPlay,
  className,
}) {
  const spotlight = useSpotlight()
  const [isOpen, setIsOpen] = useState(false)

  const poster = thumbnail || (videoId && youtubeThumb(videoId))
  const handlePlay = onPlay || (videoId ? () => setIsOpen(true) : undefined)

  return (
    <div className={cn('group/vid flex flex-col premium-card', className)} {...spotlight}>
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={poster}
          alt={`Depoimento em vídeo de ${name}`}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={(e) => {
            // nem todo vídeo tem maxresdefault; hqdefault sempre existe
            if (videoId && !e.currentTarget.dataset.fallback) {
              e.currentTarget.dataset.fallback = '1'
              e.currentTarget.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
            }
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent" />

        {result && (
          <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-black/5 bg-white/95 px-3 py-1 text-xs font-semibold text-neutral-900 shadow-sm backdrop-blur-md">
            <TrendUp size={14} /> {result}
          </span>
        )}

        <button
          type="button"
          onClick={handlePlay}
          aria-label={`Reproduzir depoimento de ${name}`}
          className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-neutral-900 shadow-soft transition-transform duration-200 hover:scale-105"
        >
          <Play size={26} weight="fill" className="ml-0.5" />
        </button>

        {duration && (
          <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full border border-black/5 bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-neutral-900 backdrop-blur-md">
            <VideoCamera size={12} /> {duration}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between gap-8 p-8">
        <div>
          <Stars />
          {quote ? (
            <blockquote className="mt-6 text-base leading-relaxed text-body">“{quote}”</blockquote>
          ) : (
            <p className="mt-6 text-base leading-relaxed text-body">{headline}</p>
          )}
        </div>
        <Author avatar={avatar || poster} name={name} role={role} />
      </div>

      {isOpen && (
        <VideoModal
          videoId={videoId}
          title={`Depoimento de ${name}`}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
