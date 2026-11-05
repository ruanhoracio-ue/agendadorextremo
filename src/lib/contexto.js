import { createContext, useContext } from 'react'

// O que toda tela precisa: estado do app (chave, fuso), contas
// conectadas e a navegação. Montado uma vez no App.
export const Contexto = createContext(null)
export const useApp = () => useContext(Contexto)
