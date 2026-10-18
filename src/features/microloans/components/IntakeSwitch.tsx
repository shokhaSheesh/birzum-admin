import { PauseCircle } from 'lucide-react'
import { useState } from 'react'
import { logAction } from '@/entities/audit/audit'
import { intakeStore } from '@/entities/microloans/intake'
import { useAdmin } from '@/entities/session/session'
import { brandPath, WORKSPACE_INFO, type Brand } from '@/shared/config/workspaces'
import { isComplete } from '@/shared/i18n/localized'
import { useI18n } from '@/shared/i18n/useI18n'
import { formatDateTime } from '@/shared/lib/format'
import { toast } from '@/shared/lib/toast'
import { Button } from '@/shared/ui/Button'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { LocalizedTextField } from '@/shared/ui/LocalizedTextField'
import { Modal } from '@/shared/ui/Modal'
import { Switch } from '@/shared/ui/Switch'

/** The "Arizalar qabuli" switch for the page header: pausing asks for the line the app shows. */
export function IntakeSwitch({ brand }: { brand: Brand }) {
  const { t } = useI18n()
  const admin = useAdmin()
  const intake = intakeStore.useAll().find((item) => item.id === brand)!
  const [pausing, setPausing] = useState(false)
  const [opening, setOpening] = useState(false)
  const [message, setMessage] = useState(intake.message)
  const [submitted, setSubmitted] = useState(false)

  const change = (open: boolean, text = intake.message) => {
    intakeStore.update(brand, { open, message: text, since: new Date(), by: admin?.name ?? '—' })
    logAction({
      section: 'mlApplications',
      kind: 'update',
      action: open ? 'audit.a.loanIntakeOpened' : 'audit.a.loanIntakePaused',
      params: { brand: WORKSPACE_INFO[brand].name },
      href: brandPath(brand, 'applications'),
    })
    toast(t(open ? 'mlIntake.opened' : 'mlIntake.paused'))
  }

  return (
    <>
      <label className="flex h-12 cursor-pointer items-center gap-3 rounded-control border border-line bg-canvas px-4">
        <span className="text-sm font-semibold">{t('mlIntake.label')}</span>
        <Switch
          checked={intake.open}
          onChange={(on) => {
            if (on) setOpening(true)
            else {
              setMessage(intake.message)
              setSubmitted(false)
              setPausing(true)
            }
          }}
          label={t('mlIntake.label')}
        />
      </label>

      {pausing && (
        <Modal
          open
          onClose={() => setPausing(false)}
          eyebrow={WORKSPACE_INFO[brand].name}
          title={t('mlIntake.pause.title')}
          footer={
            <>
              <Button
                size="sm"
                variant="ghost"
                className="ml-auto px-4!"
                onClick={() => setPausing(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button
                size="sm"
                className="bg-danger! px-4!"
                onClick={() => {
                  setSubmitted(true)
                  if (!isComplete(message)) return
                  change(false, { uz: message.uz.trim(), ru: message.ru.trim() })
                  setPausing(false)
                }}
              >
                {t('mlIntake.pause')}
              </Button>
            </>
          }
        >
          <p className="text-sm text-ink-muted">{t('mlIntake.pause.hint')}</p>
          <LocalizedTextField
            label={t('mlIntake.message')}
            value={message}
            onChange={setMessage}
            multiline
            requireBoth={submitted}
          />
        </Modal>
      )}
      <ConfirmDialog
        open={opening}
        onClose={() => setOpening(false)}
        tone="primary"
        title={t('mlIntake.open.title')}
        confirmLabel={t('mlIntake.open')}
        onConfirm={() => {
          change(true)
          setOpening(false)
        }}
      >
        <p>{t('mlIntake.open.message')}</p>
      </ConfirmDialog>
    </>
  )
}

/** While intake is paused: since when, by whom, and what the app says. */
export function IntakeBanner({ brand }: { brand: Brand }) {
  const { t, tl } = useI18n()
  const intake = intakeStore.useAll().find((item) => item.id === brand)!
  if (intake.open) return null
  return (
    <div className="flex items-start gap-3 rounded-card border border-warning/30 bg-warning-soft p-4">
      <PauseCircle size={22} className="mt-0.5 shrink-0 text-warning" />
      <div className="flex min-w-0 flex-col gap-1">
        <p className="font-semibold">
          {t('mlIntake.banner', {
            date: intake.since ? formatDateTime(intake.since) : '—',
            name: intake.by ?? '—',
          })}
        </p>
        <p className="text-sm text-ink-muted">
          {t('mlIntake.banner.app')} «{tl(intake.message)}»
        </p>
      </div>
    </div>
  )
}
