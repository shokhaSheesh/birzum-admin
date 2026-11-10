import { apiGet, apiPut } from '@/shared/api/client'
import { appResource } from '@/shared/api/appResource'
import { createRemoteStore } from '@/shared/api/createRemoteStore'
import type { Workspace } from '@/shared/config/workspaces'
import type { Faq, SupportContacts } from './faq'

type ApiFaq = Omit<Faq, 'app'> & { app: Workspace; sort_order: number }
type FaqInput = Pick<Faq, 'question' | 'answer' | 'visible'>

export const faqApi = appResource<Faq, ApiFaq, FaqInput>('faq', {
  fromApi: (raw) => ({
    id: raw.id,
    app: raw.app,
    question: raw.question,
    answer: raw.answer,
    visible: raw.visible,
  }),
  toApi: (input) => ({ question: input.question, answer: input.answer, visible: input.visible }),
})

type ApiContacts = { phone: string; hours: SupportContacts['hours']; telegram: string }

/** Birzum's support contacts: one record, kept as a list of one like the other stores. */
export const contactsInfoStore = createRemoteStore<SupportContacts>(async () => {
  const raw = await apiGet<ApiContacts>('/admin/apps/birzum/contacts')
  return [{ id: 'contacts', ...raw }]
})

export async function saveSupportContacts(input: Omit<SupportContacts, 'id'>) {
  await apiPut('/admin/apps/birzum/contacts', input)
  await contactsInfoStore.reload()
}
