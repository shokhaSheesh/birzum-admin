import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { logAction } from '@/entities/audit/audit'
import {
  branchesStore,
  REGIONS,
  type Branch,
  type Region,
} from '@/entities/microloans/brandContacts'
import { brandPath, WORKSPACE_INFO, type Brand } from '@/shared/config/workspaces'
import { useI18n } from '@/shared/i18n/useI18n'
import { newId } from '@/shared/lib/createStore'
import { PHONE_DIGITS } from '@/shared/lib/phone'
import { toast } from '@/shared/lib/toast'
import { Button } from '@/shared/ui/Button'
import { Modal } from '@/shared/ui/Modal'
import { PhoneField } from '@/shared/ui/PhoneField'
import { SelectField } from '@/shared/ui/SelectField'
import { TextField } from '@/shared/ui/TextField'

type Props = {
  brand: Brand
  /** The branch to edit, or null to add one. */
  branch: Branch | null
  onClose: () => void
  onDelete: (branch: Branch) => void
}

/** Add or edit a branch: its region, the address as the app shows it, and its phone. */
export function BranchModal({ brand, branch, onClose, onDelete }: Props) {
  const { t } = useI18n()
  const [region, setRegion] = useState<Region>(branch?.region ?? 'fergana')
  const [address, setAddress] = useState(branch?.address ?? '')
  const [phone, setPhone] = useState(branch?.phone ?? '')
  const [submitted, setSubmitted] = useState(false)
  const errors = {
    address: address.trim().length < 5 ? t('error.required') : undefined,
    phone: phone && phone.length !== PHONE_DIGITS ? t('mlContacts.error.phone') : undefined,
  }

  const save = () => {
    setSubmitted(true)
    if (errors.address || errors.phone) return
    const record = { region, address: address.trim(), phone: phone || undefined }
    if (branch) branchesStore.update(branch.id, record)
    else branchesStore.save({ id: newId(), brand, ...record })
    toast(t(branch ? 'toast.saved' : 'mlContacts.branch.added'))
    logAction({
      section: 'mlContacts',
      kind: branch ? 'update' : 'create',
      action: branch ? 'audit.a.loanBranchSaved' : 'audit.a.loanBranchAdded',
      params: { brand: WORKSPACE_INFO[brand].name },
      target: record.address,
      href: brandPath(brand, 'contacts'),
    })
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      eyebrow={t('mlContacts.branches')}
      title={branch ? branch.address : t('mlContacts.branch.new')}
      footer={
        <>
          {branch && (
            <Button
              size="sm"
              variant="ghost"
              className="mr-auto text-danger!"
              onClick={() => onDelete(branch)}
            >
              <Trash2 size={18} />
              {t('common.delete')}
            </Button>
          )}
          <Button size="sm" variant="ghost" className="ml-auto px-4!" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button size="sm" className="px-4!" onClick={save}>
            {t(branch ? 'common.save' : 'common.add')}
          </Button>
        </>
      }
    >
      <SelectField
        label={t('mlContacts.region')}
        options={REGIONS.map((value) => ({ value, label: t(`region.${value}`) }))}
        value={region}
        onChange={setRegion}
      />
      <TextField
        label={t('mlContacts.address')}
        placeholder={t('mlContacts.address.placeholder')}
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        hint={t('mlContacts.address.hint')}
        error={submitted ? errors.address : undefined}
      />
      <PhoneField
        label={t('mlContacts.branch.phone')}
        value={phone}
        onChange={setPhone}
        hint={t('mlContacts.optional')}
        error={submitted ? errors.phone : undefined}
      />
    </Modal>
  )
}
