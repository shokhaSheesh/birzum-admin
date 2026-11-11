import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { type Faq } from '@/entities/faq/faq'
import { faqApi } from '@/entities/faq/faqApi'
import { attempt } from '@/shared/api/createRemoteStore'
import { emptyText, isComplete } from '@/shared/i18n/localized'
import { type Workspace } from '@/shared/config/workspaces'
import { useI18n } from '@/shared/i18n/useI18n'
import { toast } from '@/shared/lib/toast'
import { Button } from '@/shared/ui/Button'
import { LocalizedTextField } from '@/shared/ui/LocalizedTextField'
import { Modal } from '@/shared/ui/Modal'

type Props = {
  /** Whose app's questions. */
  app: Workspace
  /** The question to edit, or null to add one. */
  item: Faq | null
  onClose: () => void
  onDelete: (item: Faq) => void
}

/** Add or edit a question: the question and its answer, both in Uzbek and Russian. */
export function FaqModal({ app, item, onClose, onDelete }: Props) {
  const { t, tl } = useI18n()
  const [question, setQuestion] = useState(item?.question ?? emptyText())
  const [answer, setAnswer] = useState(item?.answer ?? emptyText())
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSubmitted(true)
    if (!isComplete(question) || !isComplete(answer)) return
    const clean = (v: typeof question) => ({ uz: v.uz.trim(), ru: v.ru.trim() })
    const input = {
      question: clean(question),
      answer: clean(answer),
      // A new question is shown; an edited one keeps its switch
      visible: item?.visible ?? true,
    }
    setSaving(true)
    const ok = await attempt(
      () => (item ? faqApi.update(app, item.id, input) : faqApi.create(app, input)),
      () => toast(t(item ? 'toast.saved' : 'faq.created')),
    )
    setSaving(false)
    if (ok) onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      eyebrow={t(item ? 'common.edit' : 'nav.faq')}
      title={item ? tl(item.question) : t('faq.new')}
      footer={
        <>
          {item && (
            <Button
              size="sm"
              variant="ghost"
              className="mr-auto text-danger!"
              onClick={() => onDelete(item)}
            >
              <Trash2 size={18} />
              {t('common.delete')}
            </Button>
          )}
          <Button size="sm" variant="ghost" className="ml-auto px-4!" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button size="sm" className="px-4!" loading={saving} onClick={() => void save()}>
            {t(item ? 'common.save' : 'common.add')}
          </Button>
        </>
      }
    >
      <LocalizedTextField
        label={t('faq.question')}
        placeholder={t('faq.question.placeholder')}
        value={question}
        onChange={setQuestion}
        requireBoth={submitted}
      />
      <LocalizedTextField
        label={t('faq.answer')}
        placeholder={t('faq.answer.placeholder')}
        value={answer}
        onChange={setAnswer}
        multiline
        requireBoth={submitted}
      />
    </Modal>
  )
}
