import { useState } from 'react'
import { CaretDown, CaretLeft, CaretRight } from '@phosphor-icons/react'
import { cn } from '../../lib/cn'

/**
 * SidebarNav — navegação lateral de aplicação.
 *
 * `groups`: [{ label?, items: [{ key, label, icon?, badge?, items? }] }]
 *   - `label` do grupo vira subtítulo. Caixa alta, peso forte e **sem
 *     tracking**: aqui o versalete é hierarquia, não ornamento — espaçá-lo
 *     como o eyebrow de marketing o transformaria em enfeite.
 *   - `items` dentro de um item vira submenu, que abre sozinho quando algum
 *     filho está ativo.
 *
 * `collapsed` — recolhe para a faixa de ícones. É controlado por quem usa
 * (o estado costuma ser persistido), com `onToggleCollapsed` para o botão.
 * Recolhido, o rótulo do grupo some e um item com submenu passa a expandir
 * a barra em vez de abrir a lista: submenu dentro de 64px de largura vira
 * flyout, que é outro componente e outra discussão.
 *
 * `header` aceita um nó ou uma função `({ collapsed }) => nó`, para a marca
 * poder trocar o wordmark pelo símbolo quando a barra encolhe.
 */

const itemBase =
  'group/item relative flex w-full items-center gap-3 rounded-full px-3 py-2 text-sm font-medium transition-colors'

function NavItem({ item, active, collapsed, depth = 0, onSelect, onExpandRequest }) {
  const hasChildren = Array.isArray(item.items) && item.items.length > 0
  const childActive = hasChildren && item.items.some((c) => c.key === active)
  const [open, setOpen] = useState(childActive)

  /* O grupo abre sozinho quando um filho passa a ser o ativo — inclusive
     quando a navegação veio de fora do menu (trilha, busca, link no
     conteúdo). Só `useState(childActive)` não bastava: aquilo é valor
     inicial, lido uma vez na montagem, e depois a barra ficava mostrando
     um grupo fechado com a página aberta dentro dele.

     Ajuste durante a renderização em vez de efeito: o React reexecuta o
     componente antes de pintar, então a lista já sai aberta no mesmo quadro.
     Guardar o valor anterior é o que mantém o toggle manual funcionando —
     sem isso o grupo se recusaria a fechar enquanto o filho estivesse ativo. */
  const [childActiveAnterior, setChildActiveAnterior] = useState(childActive)
  if (childActive !== childActiveAnterior) {
    setChildActiveAnterior(childActive)
    if (childActive) setOpen(true)
  }

  const Icon = item.icon
  const isActive = item.key === active

  const handle = () => {
    if (hasChildren) {
      if (collapsed) return onExpandRequest?.()
      return setOpen((v) => !v)
    }
    onSelect?.(item.key)
  }

  return (
    <div>
      <button
        type="button"
        onClick={handle}
        title={collapsed ? item.label : undefined}
        aria-current={isActive ? 'page' : undefined}
        aria-expanded={hasChildren && !collapsed ? open : undefined}
        className={cn(
          itemBase,
          collapsed && 'justify-center px-0',
          depth > 0 && !collapsed && 'pl-11 text-[13px]',
          isActive || (childActive && !open)
            ? 'bg-emerald/10 text-emerald-deep'
            : depth > 0
              ? /* Submenu um degrau atrás do pai: subordinado pela cor, não só
                   pelo recuo. */
                'text-mute hover:bg-elevated hover:text-ink'
              : 'text-body hover:bg-elevated hover:text-ink',
        )}
      >
        {Icon && <Icon size={18} weight={isActive ? 'fill' : 'regular'} className="shrink-0" />}
        {!collapsed && <span className="truncate">{item.label}</span>}
        {!collapsed && item.badge && (
          <span className="ml-auto rounded-full bg-elevated px-2 py-0.5 text-[11px] font-semibold tabular-nums text-mute">
            {item.badge}
          </span>
        )}
        {!collapsed && hasChildren && (
          <CaretDown
            size={13}
            weight="bold"
            className={cn('ml-auto shrink-0 transition-transform', open && 'rotate-180')}
          />
        )}
      </button>

      {hasChildren && !collapsed && (
        /* grid-rows 1fr/0fr anima a altura sem precisar medir o conteúdo —
           mesmo recurso que o Faq usa no acordeão. */
        <div className={cn('grid transition-all duration-300 ease-out-soft', open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
          <div className="overflow-hidden">
            <div className="mt-1 flex flex-col gap-0.5">
              {item.items.map((child) => (
                <NavItem
                  key={child.key}
                  item={child}
                  active={active}
                  collapsed={collapsed}
                  depth={depth + 1}
                  onSelect={onSelect}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function SidebarNav({
  groups = [],
  active,
  onSelect,
  collapsed = false,
  onToggleCollapsed,
  header,
  footer,
  className,
}) {
  return (
    <aside
      className={cn(
        'group relative flex shrink-0 flex-col border-r border-hairline bg-surface transition-[width] duration-300 ease-out-soft',
        collapsed ? 'w-16' : 'w-64',
        className,
      )}
    >
      {/* O gatilho fica montado na própria borda, metade para dentro e metade
          para fora. Dentro do cabeçalho ele disputava espaço com a marca; aqui
          não ocupa área útil nenhuma e o alvo continua confortável.

          Só aparece no hover da barra: é um controle de uso raro e, visível o
          tempo todo, virava um ponto solto grudado na borda. `focus-visible`
          traz ele de volta para quem navega por teclado — do contrário o botão
          seria alcançável pelo Tab mas invisível. */}
      {onToggleCollapsed && (
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          title={collapsed ? 'Expandir menu' : 'Recolher menu'}
          /* top-5 centraliza o botão de 24px na faixa de 64px do cabeçalho,
             alinhando-o à marca e à busca do outro lado da borda. */
          className="absolute -right-3 top-5 z-raised flex h-6 w-6 items-center justify-center rounded-full border border-hairline bg-surface text-mute opacity-0 shadow-xs transition-[opacity,color,border-color] duration-200 hover:border-emerald/40 hover:text-emerald-deep focus-visible:opacity-100 group-hover:opacity-100"
        >
          {collapsed ? <CaretRight size={12} weight="bold" /> : <CaretLeft size={12} weight="bold" />}
        </button>
      )}

      {/* Sem borda inferior: a barra é uma peça só. A linha separava a marca do
          menu e cortava a coluna em dois blocos que não são hierarquia
          nenhuma — a separação real é com o conteúdo, à direita. */}
      <div className={cn('flex h-16 items-center', collapsed ? 'justify-center px-2' : 'px-5')}>
        {typeof header === 'function' ? header({ collapsed }) : header}
      </div>

      <nav className={cn('flex flex-1 flex-col gap-5 overflow-y-auto py-4', collapsed ? 'px-2' : 'px-3')}>
        {groups.map((group, i) => (
          <div key={group.label ?? i} className="flex flex-col gap-0.5">
            {/* Subtítulo do grupo: caixa alta, negrito, tracking normal, em
                `mute`. A barra tem três camadas e cada uma se separa por um
                recurso diferente — o subtítulo pela caixa alta e pelo peso, o
                item pela cor mais firme (`body`), o submenu por tamanho, recuo
                e cor mais leve. Levar o subtítulo até `ink` deixava tudo preto
                e era justamente a distinção entre as camadas que se perdia. */}
            {group.label && !collapsed && (
              <span className="mb-1.5 px-3 text-[11px] font-bold uppercase tracking-normal text-mute">
                {group.label}
              </span>
            )}
            {/* Recolhido, o rótulo vira um filete — mantém a separação visual
                entre grupos sem texto para mostrar. */}
            {group.label && collapsed && i > 0 && <span className="mx-2 mb-2 h-px bg-hairline" />}
            {group.items.map((item) => (
              <NavItem
                key={item.key}
                item={item}
                active={active}
                collapsed={collapsed}
                onSelect={onSelect}
                onExpandRequest={onToggleCollapsed}
              />
            ))}
          </div>
        ))}
      </nav>

      {footer && (
        <div className={cn('border-t border-hairline py-3', collapsed ? 'px-2' : 'px-3')}>{footer}</div>
      )}
    </aside>
  )
}
