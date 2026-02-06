import { redirect } from 'next/navigation'

/**
 * Redireciona para a página de login da organização padrão.
 * No futuro, pode mostrar uma lista de orgs ou pedir o slug.
 */
export default function LoginRedirectPage() {
  // TODO: Mostrar página para inserir slug da org ou listar orgs
  // Por enquanto, redireciona para a org padrão
  redirect('/petlar/login')
}
