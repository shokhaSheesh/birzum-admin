import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { faqStore, type Faq } from '@/entities/faq/faq'
import { emptyText, isComplete } from '@/shared/i18n/localized'
import { useI18n } from '@/shared/i18n/useI18n'
import { newId } from '@/shared/lib/createStore'
import { toast } from '@/shared/lib/toast'
import { Button } from '@/shared/ui/Button'
import { LocalizedTextField } from '@/shared/ui/LocalizedTextField'
import { Modal } from '@/shared/ui/Modal'

type Props = {
  /** The question to edit, or null to add one. */
  item: Faq | null
  onClose: () => void
  onDelete: (item: Faq) => void
}

/** Add or edit a question: the question and its answer, both in Uzbek and Russian. */
export function FaqModal({ item, onClose, onDelete }: Props) {
  const { t, tl } = useI18n()
  const [question, setQuestion] = useState(item?.question ?? emptyText())
  const [answer, setAnswer] = useState(item?.answer ?? emptyText())
  const [submitted, setSubmitted] = useState(false)

  const save = () => {
    setSubmitted(true)
    if (!isComplete(question) || !isComplete(answer)) return
    const clean = (v: typeof question) => ({ uz: v.uz.trim(), ru: v.ru.trim() })
    if (item) {
      faqStore.update(item.id, { question: clean(question), answer: clean(answer) })
      toast(t('toast.saved'))
    } else {
      // New questions go to the end of the list; drag them up if they matter more
      faqStore.replaceAll([
        ...faqStore.getAll(),
        { id: newId(), question: clean(question), answer: clean(answer), visible: true },
      ])
      toast(t('faq.created'))
    }
    onClose()
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
          <Button size="sm" className="px-4!" onClick={save}>
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
