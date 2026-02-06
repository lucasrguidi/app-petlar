import { redirect } from 'next/navigation'

/**
 * Redireciona para a página admin da organização padrão.
 * O middleware vai verificar se o usuário está autenticado e pertence à org.
 */
export default function AdminRedirectPage() {
  // TODO: Detectar a org do usuário logado e redirecionar
  // Por enquanto, redireciona para a org padrão
  redirect('/petlar/admin')
}
