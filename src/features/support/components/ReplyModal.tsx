import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { topicsOf } from '@/entities/support/chats'
import { repliesStore, type QuickReply } from '@/entities/support/replies'
import { WORKSPACE_INFO, type Workspace } from '@/shared/config/workspaces'
import { useI18n } from '@/shared/i18n/useI18n'
import { newId } from '@/shared/lib/createStore'
import { emptyText, isComplete } from '@/shared/i18n/localized'
import { toast } from '@/shared/lib/toast'
import { Button } from '@/shared/ui/Button'
import { LocalizedTextField } from '@/shared/ui/LocalizedTextField'
import { Modal } from '@/shared/ui/Modal'
import { SelectField } from '@/shared/ui/SelectField'
import { logAction } from '@/entities/audit/audit'

type Props = {
  /** Whose answers: Birzum's or a microloan brand's. */
  app: Workspace
  /** The answer to edit, or null to create one. */
  reply: QuickReply | null
  onClose: () => void
  onDelete: (reply: QuickReply) => void
}

/** Create or edit a ready answer: its topic, a short title and the text, in both languages. */
export function ReplyModal({ app, reply, onClose, onDelete }: Props) {
  const { t, tl } = useI18n()
  const [topic, setTopic] = useState<QuickReply['topic']>(reply?.topic ?? 'any')
  const [title, setTitle] = useState(reply?.title ?? emptyText())
  const [text, setText] = useState(reply?.text ?? emptyText())
  const [submitted, setSubmitted] = useState(false)

  const ml = app !== 'birzum'
  const audit = {
    section: ml ? 'mlReplies' : 'quickReplies',
    params: ml ? { brand: WORKSPACE_INFO[app].name } : undefined,
  } as const
  const save = () => {
    setSubmitted(true)
    if (!isComplete(title) || !isComplete(text)) return
    const clean = (value: typeof title) => ({ uz: value.uz.trim(), ru: value.ru.trim() })
    if (reply) {
      repliesStore.update(reply.id, { topic, title: clean(title), text: clean(text) })
      toast(t('toast.saved'))
      logAction({
        ...audit,
        kind: 'update',
        action: ml ? 'audit.a.loanReplySaved' : 'audit.a.replySaved',
        target: tl(clean(title)),
      })
    } else {
      repliesStore.save({ id: newId(), app, topic, title: clean(title), text: clean(text) })
      toast(t('replies.created'))
      logAction({
        ...audit,
        kind: 'create',
        action: ml ? 'audit.a.loanReplyCreated' : 'audit.a.replyCreated',
        target: tl(clean(title)),
      })
    }
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      eyebrow={t(reply ? 'common.edit' : 'nav.quickReplies')}
      title={reply ? tl(reply.title) : t('replies.new')}
      footer={
        <>
          {reply && (
            <Button
              size="sm"
              variant="ghost"
              className="mr-auto text-danger!"
              onClick={() => onDelete(reply)}
            >
              <Trash2 size={18} />
              {t('common.delete')}
            </Button>
          )}
          <Button size="sm" variant="ghost" className="ml-auto px-4!" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button size="sm" className="px-4!" onClick={save}>
            {t(reply ? 'common.save' : 'common.add')}
          </Button>
        </>
      }
    >
      <SelectField
        label={t('replies.topic')}
        hint={t('replies.topic.hint')}
        options={[
          { value: 'any', label: t('replies.topic.any') },
          ...topicsOf(app).map((value) => ({ value, label: t(`support.topic.${value}`) })),
        ]}
        value={topic}
        onChange={setTopic}
      />
      <LocalizedTextField
        label={t('replies.title')}
        placeholder={t('replies.title.placeholder')}
        value={title}
        onChange={setTitle}
        requireBoth={submitted}
      />
      <LocalizedTextField
        label={t('replies.text')}
        placeholder={t('replies.text.placeholder')}
        value={text}
        onChange={setText}
        multiline
        requireBoth={submitted}
      />
    </Modal>
  )
}
