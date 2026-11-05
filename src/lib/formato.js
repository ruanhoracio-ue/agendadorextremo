const inteiroBr = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 })
const compactoBr = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 })

export const inteiro = (n) => inteiroBr.format(Number(n) || 0)

// 1.234 fica inteiro; de 10 mil para cima vira "12,3 mil" (cabe no cartão).
export const numero = (n) => (Math.abs(Number(n) || 0) >= 10000 ? compactoBr.format(n) : inteiroBr.format(Number(n) || 0))

export const percentual = (n) => `${(Number(n) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`

export const tamanhoArquivo = (bytes) => {
  if (!bytes) return ''
  const mb = bytes / (1024 * 1024)
  return mb >= 1 ? `${mb.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`
}
