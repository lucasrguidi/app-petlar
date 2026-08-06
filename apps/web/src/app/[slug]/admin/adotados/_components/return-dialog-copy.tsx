import {
  ADOPTION_RETENTION_DAYS,
  isPastRetentionWindow,
} from '@app-petlar/api/lib/retention-window'
import { RotateCcw, TriangleAlert } from 'lucide-react'

import type { ConfirmDialogProps } from '@/components/ui/confirm-dialog'
import type { LucideIcon } from 'lucide-react'

type ReturnDialogCopy = Pick<
  ConfirmDialogProps,
  'variant' | 'icon' | 'title' | 'description' | 'note' | 'actionLabel'
> & { icon: LucideIcon }

/**
 * The dialog must match what `adoptions.returnToAvailable` actually does.
 *
 * Past the retention window the losing applications have already been purged
 * and the return also clears the adopter's, so the cat goes back to the public
 * list with no candidates at all — that is irreversible and has to be stated.
 */
export function getReturnDialogCopy(
  catName: string,
  adoptionDate: string | undefined
): ReturnDialogCopy {
  const title = `Devolver ${catName} para disponíveis?`

  if (adoptionDate && isPastRetentionWindow(adoptionDate)) {
    return {
      variant: 'destructive',
      icon: TriangleAlert,
      title,
      description: (
        <>
          Esta adoção tem mais de {ADOPTION_RETENTION_DAYS} dias. Além do
          registro da adoção e do termo assinado,{' '}
          <strong>
            todas as candidaturas e mídias deste gato serão apagadas
            permanentemente
          </strong>
          .
        </>
      ),
      note: `${catName} voltará a aparecer como disponível na página pública, sem nenhum interessado. Esta ação não pode ser desfeita.`,
      actionLabel: 'Devolver e zerar candidaturas',
    }
  }

  return {
    variant: 'warning',
    icon: RotateCcw,
    title,
    description:
      'O registro desta adoção e o termo assinado serão apagados. O perfil do gato e todas as candidaturas permanecerão no sistema.',
    note: 'O gato voltará a aparecer como disponível na página pública.',
    actionLabel: 'Devolver para disponíveis',
  }
}
