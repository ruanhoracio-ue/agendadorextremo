import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * useDados — carrega dados do servidor e guarda { dados, erro, carregando }.
 *
 * `buscar` roda de novo quando `deps` mudam. `recarregar()` refaz sob demanda
 * (depois de salvar algo). Resposta de um pedido antigo que chega depois de um
 * novo é descartada: sem isso, trocar de mês rápido mostrava o mês errado.
 */
export function useDados(buscar, deps, { ativo = true } = {}) {
  const [estado, setEstado] = useState({ dados: null, erro: null, carregando: ativo })
  const vez = useRef(0)

  const carregar = useCallback(async ({ silencioso = false } = {}) => {
    const minhaVez = ++vez.current
    if (!silencioso) setEstado(e => ({ ...e, carregando: true, erro: null }))
    try {
      const dados = await buscar()
      if (minhaVez === vez.current) setEstado({ dados, erro: null, carregando: false })
    } catch (erro) {
      // Atualização silenciosa que falha mantém o que já estava na tela.
      if (minhaVez === vez.current) setEstado(e => (silencioso && e.dados ? e : { dados: null, erro, carregando: false }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    if (ativo) carregar()
  }, [carregar, ativo])

  return { ...estado, recarregar: carregar }
}
