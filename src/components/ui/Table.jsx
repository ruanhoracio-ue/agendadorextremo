import { useMemo, useState } from 'react'
import { CaretUp, CaretDown, CaretUpDown } from '@phosphor-icons/react'
import { cn } from '../../lib/cn'

/**
 * Table — tabela de dados.
 *
 * Segue o idioma da biblioteca (dirigida por dados, como `Faq` e `Stats`) em
 * vez de expor um punhado de subcomponentes.
 *
 * `columns`: [{ key, header, align?, numeric?, width?, render?, renderFooter?,
 *               sortable?, sortValue? }]
 *   - `align`: 'left' (padrão) | 'right' | 'center'
 *   - `numeric`: liga `tabular-nums` — sem isso as colunas de valor dançam de
 *     uma linha para a outra, porque os dígitos têm larguras diferentes.
 *   - `render(row)`: assume a célula inteira (para badges, ações, links).
 *   - `renderFooter(footer)`: idem para a linha de total, quando ela precisa
 *     de tratamento diferente do corpo (rótulo "Total", célula vazia).
 *   - `sortable`: torna o cabeçalho clicável.
 *   - `sortValue(row)`: o valor a comparar, quando não é `row[key]`. Precisa
 *     existir sempre que `render` monta a célula a partir de outro campo —
 *     ordenar pelo que está escrito na tela, e não pelo dado, é como uma
 *     coluna de moeda acaba ordenada alfabeticamente.
 *
 * `footer`: uma linha só, no rodapé fixo (`<tfoot>`), para totais. Numa tabela
 * que soma para um número mostrado em outro lugar da tela, o total é o que
 * deixa o leitor conferir — sem ele os dois blocos só podem ser aceitos no
 * voto de confiança. Fica em `<tfoot>` e não como última `<tr>` do corpo
 * porque não é um dado da série: é o agregado dela — e, ordenando, precisa
 * ficar parado no lugar em vez de viajar para o meio da tabela.
 *
 * ORDENAÇÃO. Por padrão é interna: passe `sortable` nas colunas e pronto.
 * Passando `sort` + `onSortChange` ela vira controlada, para quando a ordem
 * precisa subir para a URL ou ir para o servidor.
 *
 * Seleção e paginação continuam de fora: cada uma traz estado e API próprios
 * e entra como camada por cima, não embutida aqui.
 */
const aligns = { left: 'text-left', right: 'text-right', center: 'text-center' }

/* Coleção pt-BR: sem isso "Ática" cai depois de "Zebra", porque a comparação
   crua de string ordena por code point. `numeric` faz "item 10" vir depois de
   "item 9" em vez de antes. */
const colacao = new Intl.Collator('pt-BR', { numeric: true, sensitivity: 'base' })

function comparar(a, b) {
  if (a == null && b == null) return 0
  if (a == null) return 1 /* vazio sempre no fim, nos dois sentidos */
  if (b == null) return -1
  if (typeof a === 'number' && typeof b === 'number') return a - b
  if (a instanceof Date && b instanceof Date) return a - b
  return colacao.compare(String(a), String(b))
}

function CabecalhoOrdenavel({ coluna, direcao, onClick, alinhamento }) {
  const ativo = Boolean(direcao)
  const Icone = !ativo ? CaretUpDown : direcao === 'asc' ? CaretUp : CaretDown

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group/sort -mx-1.5 inline-flex max-w-full items-center gap-1 rounded-sm px-1.5 py-0.5',
        'transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald',
        ativo && 'text-ink',
        /* Numa coluna à direita o ícone precisa vir antes do texto, senão ele
           encosta na borda da célula e o rótulo se afasta dos números que
           está nomeando. */
        alinhamento === 'right' && 'flex-row-reverse',
      )}
    >
      <span className="truncate">{coluna.header}</span>
      {/* Inativo, o ícone só aparece no hover e no foco: dezoito setas cinzas
          paradas no cabeçalho competem com os dados. Ativo, fica sempre. */}
      <Icone
        size={12}
        weight="bold"
        className={cn(
          'shrink-0 transition-opacity',
          ativo ? 'opacity-100' : 'opacity-0 group-hover/sort:opacity-60 group-focus-visible/sort:opacity-60',
        )}
        aria-hidden="true"
      />
    </button>
  )
}

export function Table({
  columns = [],
  rows = [],
  getRowKey,
  footer,
  sort,
  onSortChange,
  defaultSort = null,
  empty = 'Nada por aqui ainda.',
  className,
}) {
  const [sortInterno, setSortInterno] = useState(defaultSort)
  const controlado = sort !== undefined
  const ordem = controlado ? sort : sortInterno

  const alternar = (coluna) => {
    /* Primeiro clique numa coluna nova: número desce, texto sobe. É o que se
       quer nos dois casos — "maior valor primeiro" e "de A a Z". */
    const inicial = coluna.numeric ? 'desc' : 'asc'
    const proxima =
      ordem?.key === coluna.key
        ? { key: coluna.key, dir: ordem.dir === 'asc' ? 'desc' : 'asc' }
        : { key: coluna.key, dir: inicial }

    if (controlado) onSortChange?.(proxima)
    else setSortInterno(proxima)
  }

  const linhas = useMemo(() => {
    if (!ordem) return rows
    const coluna = columns.find((c) => c.key === ordem.key)
    if (!coluna) return rows
    const valor = coluna.sortValue ?? ((r) => r[coluna.key])
    const sinal = ordem.dir === 'asc' ? 1 : -1
    /* Cópia antes de ordenar: `sort` é destrutivo e o array vem de fora. */
    return [...rows].sort((a, b) => sinal * comparar(valor(a), valor(b)))
  }, [rows, columns, ordem])

  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-hairline-soft">
            {columns.map((c) => {
              const direcao = ordem?.key === c.key ? ordem.dir : null
              return (
                <th
                  key={c.key}
                  scope="col"
                  style={c.width ? { width: c.width } : undefined}
                  /* `aria-sort` é o que faz um leitor de tela anunciar a
                     ordem; o ícone sozinho não diz nada a quem não vê. */
                  aria-sort={
                    !c.sortable
                      ? undefined
                      : direcao === 'asc'
                        ? 'ascending'
                        : direcao === 'desc'
                          ? 'descending'
                          : 'none'
                  }
                  /* Sem caixa alta: o cabeçalho já se distingue pelo peso, pela
                     cor e pela borda. Versalete em tabela densa só atrapalha a
                     varredura vertical e alarga a coluna sem necessidade. */
                  className={cn(
                    'px-5 py-3 text-sm font-semibold text-mute',
                    aligns[c.align ?? 'left'],
                  )}
                >
                  {c.sortable ? (
                    <CabecalhoOrdenavel
                      coluna={c}
                      direcao={direcao}
                      alinhamento={c.align}
                      onClick={() => alternar(c)}
                    />
                  ) : (
                    c.header
                  )}
                </th>
              )
            })}
          </tr>
        </thead>

        <tbody>
          {linhas.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-5 py-10 text-center text-mute">
                {empty}
              </td>
            </tr>
          )}

          {linhas.map((row, i) => (
            <tr
              key={getRowKey ? getRowKey(row, i) : i}
              className="border-b border-hairline-soft transition-colors last:border-0 hover:bg-elevated"
            >
              {columns.map((c) => (
                <td
                  key={c.key}
                  /* `font-medium`: numa tabela o dado é o conteúdo, e peso
                     regular o deixa raso demais ao lado dos rótulos. */
                  className={cn(
                    'px-5 py-3.5 font-medium text-body',
                    aligns[c.align ?? 'left'],
                    c.numeric && 'tabular-nums',
                  )}
                >
                  {c.render ? c.render(row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>

        {footer && linhas.length > 0 && (
          <tfoot>
            {/* Borda em cima e peso maior: o total se separa do corpo por
                hierarquia, não por fundo colorido — fundo aqui competiria com
                o hover das linhas. */}
            <tr className="border-t border-hairline">
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={cn(
                    'px-5 py-3.5 font-semibold text-ink',
                    aligns[c.align ?? 'left'],
                    c.numeric && 'tabular-nums',
                  )}
                >
                  {c.renderFooter ? c.renderFooter(footer) : footer[c.key]}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  )
}
