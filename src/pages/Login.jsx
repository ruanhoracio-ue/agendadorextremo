import { useState } from 'react'
import { Button, Card, Field, Input, Logo, Text } from '../components/ui'
import { Faixa } from '../components/app/Avisos'
import { api } from '../lib/api'

export default function Login({ aoEntrar }) {
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState(null)
  const [entrando, setEntrando] = useState(false)

  const entrar = async (e) => {
    e.preventDefault()
    setEntrando(true)
    setErro(null)
    try {
      await api.entrar(senha)
      aoEntrar()
    } catch (falha) {
      setErro(falha.message)
      setEntrando(false)
    }
  }

  return (
    <div className="ds-app flex min-h-screen items-center justify-center bg-canvas p-6">
      <Card as="form" onSubmit={entrar} className="w-full max-w-sm">
        <Logo variant="symbol" className="h-9 w-9" />
        <h1 className="mt-5 text-heading-md text-ink">Agendador</h1>
        <Text size="sm" tone="mute" className="mt-1">Entre com a senha do app para agendar e ver as métricas.</Text>

        <Field label="Senha" className="mt-6">
          <Input type="password" autoComplete="current-password" autoFocus required value={senha} onChange={(e) => setSenha(e.target.value)} />
        </Field>
        {erro && <Faixa tom="erro" className="mt-4">{erro}</Faixa>}

        <Button type="submit" size="field" className="mt-6 w-full" disabled={entrando || !senha}>
          {entrando ? 'Entrando…' : 'Entrar'}
        </Button>
      </Card>
    </div>
  )
}
