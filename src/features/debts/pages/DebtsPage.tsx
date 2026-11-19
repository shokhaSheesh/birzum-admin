import { useState } from 'react'
import { adminsStore } from '@/entities/admins/admins'
import { operatorsOf, type DebtStatus } from '@/entities/collections/debtCases'
import { merchantsStore } from '@/entities/merchants/merchants'
import { useAdmin } from '@/entities/session/session'
import { useI18n } from '@/shared/i18n/useI18n'
import { DebtCallModal, DebtStatusModal } from '../components/DebtDialogs'
import { DebtsView } from '../components/DebtsView'
import type { BoardRow } from '../lib/board'
import { birzumTarget, saveBirzumCall, toBoardRow, useDebtRows } from '../lib/rows'

/** Birzum's Qarzdorlar: one card per late nasiya. */
export function DebtsPage() {
  const { t } = useI18n()
  const admin = useAdmin()
  const [today] = useState(() => new Date())
  const rows = useDebtRows(today)
  const merchants = merchantsStore.useAll()
  const me = adminsStore.useAll().find((item) => item.name === admin?.name)
  const [moving, setMoving] = useState<{ row: BoardRow; to: DebtStatus } | null>(null)
  const [calling, setCalling] = useState<BoardRow | null>(null)
  const board = rows.map(toBoardRow)
  const othersOf = (row: BoardRow) =>
    board
      .filter(
        (item) =>
          item.personKey === row.personKey &&
          item.file.id !== row.file.id &&
          item.file.status !== 'closed',
      )
      .map((item) => ({ file: item.file, href: item.href }))

  return (
    <>
      <DebtsView
        title={t('nav.debts')}
        rows={board}
        today={today}
        groups={merchants.map((item) => ({ value: item.id, label: item.name }))}
        groupLabel={t('products.col.merchant')}
        groupAll={t('products.allMerchants')}
        operators={operatorsOf('birzum')}
        meId={me?.id}
        searchPlaceholder={t('debts.search')}
        onMove={(row, to) => setMoving({ row, to })}
        onCall={setCalling}
      />
      {moving && (
        <DebtStatusModal
          file={moving.row.file}
          target={birzumTarget(moving.row.name, moving.row.file.id)}
          to={moving.to}
          onClose={() => setMoving(null)}
        />
      )}
      {calling && (
        <DebtCallModal
          file={calling.file}
          target={birzumTarget(calling.name, calling.file.id)}
          others={othersOf(calling)}
          onSave={saveBirzumCall(calling.personKey)}
          onClose={() => setCalling(null)}
        />
      )}
    </>
  )
}
