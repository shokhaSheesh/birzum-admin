import { useState } from 'react'
import { adminsStore } from '@/entities/admins/admins'
import { operatorsOf, type DebtStatus } from '@/entities/collections/debtCases'
import { loanProductsStore } from '@/entities/microloans/products'
import { useAdmin } from '@/entities/session/session'
import type { Brand } from '@/shared/config/workspaces'
import { useI18n } from '@/shared/i18n/useI18n'
import { DebtCallModal, DebtStatusModal } from '@/features/debts/components/DebtDialogs'
import { DebtsView } from '@/features/debts/components/DebtsView'
import type { BoardRow } from '@/features/debts/lib/board'
import { loanTarget, peopleOf, saveLoanCall, toLoanBoardRow, useLoanDebtRows } from './rows'

/**
 * Fortuna's or Vodiy's Qarzdorlar: one card per late loan, the same board as Birzum's. The call
 * form also asks who picked up: the borrower or one of their contacts.
 */
export function LoanDebtsPage({ brand }: { brand: Brand }) {
  const { t } = useI18n()
  const admin = useAdmin()
  const [today] = useState(() => new Date())
  const rows = useLoanDebtRows(brand, today)
  const products = loanProductsStore.useAll().filter((item) => item.brand === brand)
  const me = adminsStore.useAll().find((item) => item.name === admin?.name)
  const [moving, setMoving] = useState<{ row: BoardRow; to: DebtStatus } | null>(null)
  const [calling, setCalling] = useState<BoardRow | null>(null)
  const board = rows.map((row) => toLoanBoardRow(brand, row))
  const callingRow = calling && rows.find((row) => row.file.id === calling.file.id)

  return (
    <>
      <DebtsView
        title={t('nav.debts')}
        rows={board}
        today={today}
        groups={products.map((item) => ({ value: item.id, label: item.name }))}
        groupLabel={t('planFact.col.product')}
        groupAll={t('planFact.allProducts')}
        operators={operatorsOf(brand)}
        meId={me?.id}
        searchPlaceholder={t('debts.searchLoan')}
        onMove={(row, to) => setMoving({ row, to })}
        onCall={setCalling}
      />
      {moving && (
        <DebtStatusModal
          file={moving.row.file}
          target={loanTarget(brand, moving.row.name, moving.row.file.id)}
          to={moving.to}
          onClose={() => setMoving(null)}
        />
      )}
      {calling && callingRow && (
        <DebtCallModal
          file={calling.file}
          target={loanTarget(brand, calling.name, calling.file.id)}
          others={board
            .filter(
              (item) =>
                item.personKey === calling.personKey &&
                item.file.id !== calling.file.id &&
                item.file.status !== 'closed',
            )
            .map((item) => ({ file: item.file, href: item.href }))}
          people={peopleOf(callingRow, t('debts.whom.borrower'), (r) => t(`relation.${r}`))}
          onSave={saveLoanCall}
          onClose={() => setCalling(null)}
        />
      )}
    </>
  )
}
