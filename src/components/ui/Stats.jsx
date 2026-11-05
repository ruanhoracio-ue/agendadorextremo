import { cn } from '../../lib/cn'

/**
 * Stats — grade de métricas (valor + rótulo).
 * `items`: [{ value, label }]. Variante `dark` para uso sobre fundo escuro.
 *
 * `columns` — a grade era fixa em 3, o que quebrava com qualquer outra
 * quantidade: com 2 itens as colunas ficavam estreitas e os valores quebravam
 * em duas linhas. O padrão segue 3 para não mexer na landing.
 *
 * `size` — `md` é o porte de landing. Dentro de um card de painel o valor
 * compete com a métrica principal do quadro; `sm` recolhe para apoio.
 */
const statSizes = {
  md: 'text-3xl',
  sm: 'text-xl',
}
const statColumns = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-2 sm:grid-cols-4',
}

export function Stats({ items = [], columns = 3, size = 'md', dark = false, className }) {
  return (
    <div
      className={cn(
        'grid gap-6 border-t pt-8',
        statColumns[columns] ?? statColumns[3],
        dark ? 'border-white/15' : 'border-hairline',
        className,
      )}
    >
      {items.map((item, i) => (
        <div key={i}>
          {/* `tabular-nums`: métricas quase sempre aparecem empilhadas ou lado a
              lado, e sem largura fixa de dígito elas desalinham entre si. */}
          <div
            className={cn(
              statSizes[size] ?? statSizes.md,
              /* Sem `tabular-nums`: figura tabular dá a todo dígito a largura
                 do zero e afrouxa números em corpo grande. Tabular serve a
                 coluna de tabela, onde o alinhamento vertical é o ponto. */
              'font-semibold tracking-tight',
              dark ? 'text-white' : 'text-ink',
            )}
          >
            {item.value}
          </div>
          <div className={cn('mt-1 text-sm', dark ? 'text-white/60' : 'text-mute')}>{item.label}</div>
        </div>
      ))}
    </div>
  )
}
