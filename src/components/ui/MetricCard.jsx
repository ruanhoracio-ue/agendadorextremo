import { ArrowUpRight, ArrowDownRight, Minus } from '@phosphor-icons/react'
import { Card } from './Card'
import { cn } from '../../lib/cn'

/**
 * MetricCard — o quadrante de número de um painel.
 *
 * DIREÇÃO E SENTIDO SÃO COISAS DIFERENTES. A seta diz o que o número fez; a
 * cor diz se isso é bom. Um booleano só para os dois obriga a mentir num dos
 * lados: reembolso que sobe 0,4% precisa de vermelho, e com um único `up` a
 * seta acabava apontando para baixo ao lado de um `+0,4%`.
 *
 * Aqui a direção vem do sinal do próprio `delta` e o sentido vem de
 * `higherIsBetter` — é literalmente `cor = direção × subir é bom`. Métricas
 * onde cair é a boa notícia (reembolsos, cancelamentos, custo, churn) passam
 * `higherIsBetter={false}` e nada mais muda.
 *
 * `comparison` não é enfeite: um delta sem base de comparação não quer dizer
 * nada. "+12,4%" contra o quê? Se não há período nomeado para comparar, o
 * certo é não mostrar delta nenhum.
 *
 * `delta` é número (12.4, −1.8), não string: quem consome formata errado, e
 * o sinal precisa ser lido para decidir a seta.
 */
export function MetricCard({
  label,
  value,
  delta,
  higherIsBetter = true,
  comparison,
  className,
  ...props
}) {
  const temDelta = typeof delta === 'number' && Number.isFinite(delta)
  const subiu = temDelta && delta > 0
  const estavel = temDelta && delta === 0
  const bom = subiu === higherIsBetter

  const Seta = estavel ? Minus : subiu ? ArrowUpRight : ArrowDownRight
  const tom = estavel ? 'text-mute' : bom ? 'text-emerald-deep' : 'text-danger'

  /* Sinal explícito nos dois lados: sem o `+` o leitor não sabe se o número
     é o delta ou parte do valor. O menos é U+2212, não hífen — o hífen fica
     curto e alto demais ao lado de um dígito. */
  const rotuloDelta = temDelta
    ? `${subiu ? '+' : estavel ? '' : '−'}${Math.abs(delta).toLocaleString('pt-BR', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })}%`
    : null

  return (
    <Card className={className} {...props}>
      <span className="text-sm font-medium text-mute">{label}</span>

      {/* O delta fica COLADO no valor, não no canto oposto do card: ele
          qualifica esse número, e a 200px de distância vira um segundo dado
          solto que o olho precisa reassociar. */}
      <div className="mt-2 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        {/* Figuras proporcionais: `tabular-nums` daria a todo dígito a
            largura do zero e afrouxa o número em corpo grande. */}
        <span className="text-[26px] font-semibold leading-tight text-ink">{value}</span>
        {rotuloDelta && (
          <span className={cn('inline-flex items-center gap-0.5 text-[13px] font-semibold', tom)}>
            <Seta size={13} weight="bold" aria-hidden="true" />
            {rotuloDelta}
          </span>
        )}
      </div>

      {/* A base de comparação só aparece junto do delta: ela descreve o delta,
          e sozinha vira uma promessa de comparação que a tela não cumpre. */}
      {comparison && rotuloDelta && <p className="mt-1 text-caption text-faint">{comparison}</p>}
    </Card>
  )
}
