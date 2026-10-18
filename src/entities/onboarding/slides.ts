import type { Lang, LocalizedText } from '@/shared/i18n/dictionaries'
import { createStore } from '@/shared/lib/createStore'

/** The apps whose intro slides this panel manages. */
export const APPS = ['birzum', 'fortuna', 'vodiy'] as const
export type AppId = (typeof APPS)[number]

/**
 * One intro slide an app shows once, after the first sign-in. `image` is what the admin
 * uploaded, one per language (a picture may carry text); without it the app shows its own drawn picture (`builtIn`), which only the slides
 * that ship with the app have. New slides need an image.
 */
export type Slide = {
  id: string
  app: AppId
  image?: Partial<Record<Lang, string>>
  builtIn?: boolean
  title: LocalizedText
  text: LocalizedText
  visible: boolean
}

const slide = (id: string, app: AppId, title: LocalizedText, text: LocalizedText): Slide => ({
  id,
  app,
  builtIn: true,
  title,
  text,
  visible: true,
})

// The slides each app ships with; the two microloan apps share theirs. Replace with the API.
export const slidesStore = createStore<Slide>([
  slide(
    'b1',
    'birzum',
    { uz: 'Limitingizni biling', ru: 'Узнайте свой лимит' },
    {
      uz: 'Bir necha soniyada limit oling. Har bir muddat uchun oʻz limiti bor, boshlangʻich toʻlov shart emas.',
      ru: 'Получите лимит за несколько секунд. У каждого срока свой лимит, первый взнос не нужен.',
    },
  ),
  slide(
    'b2',
    'birzum',
    { uz: 'Doʻkonlardan nasiyaga xarid qiling', ru: 'Покупайте в рассрочку в магазинах' },
    {
      uz: 'Mahsulotni tanlang, savatga qoʻshing va har biri uchun qulay muddatni belgilang.',
      ru: 'Выберите товар, добавьте в корзину и укажите удобный срок для каждого.',
    },
  ),
  slide(
    'b3',
    'birzum',
    { uz: 'Toʻlovlarni ilovada qiling', ru: 'Платите прямо в приложении' },
    {
      uz: 'Toʻlov jadvali doim koʻz oldingizda. Oylik toʻlovni bir necha bosishda kartadan toʻlang.',
      ru: 'График платежей всегда под рукой. Ежемесячный платёж — в пару нажатий с карты.',
    },
  ),
  slide(
    'f1',
    'fortuna',
    { uz: 'Summa va muddatni tanlang', ru: 'Выберите сумму и срок' },
    {
      uz: 'Kalkulyatorda oylik toʻlov va qarzning toʻliq narxini darhol koʻrasiz.',
      ru: 'Калькулятор сразу покажет ежемесячный платёж и полную стоимость займа.',
    },
  ),
  slide(
    'f2',
    'fortuna',
    { uz: 'Qaror onlayn', ru: 'Решение онлайн' },
    {
      uz: 'Arizani ilovadan yuborasiz, natijasi shu yerga keladi. Filialga borish shart emas.',
      ru: 'Заявка уходит из приложения, ответ приходит сюда же. В филиал идти не нужно.',
    },
  ),
  slide(
    'f3',
    'fortuna',
    { uz: 'Pul kartangizga', ru: 'Деньги на карту' },
    {
      uz: 'Shartnomani SMS-kod bilan imzolang, pul Uzcard yoki Humo kartangizga tushadi.',
      ru: 'Подпишите договор SMS-кодом, и деньги придут на карту Uzcard или Humo.',
    },
  ),
  slide(
    'f4',
    'fortuna',
    { uz: 'Toʻlovlar nazoratda', ru: 'Платежи под контролем' },
    {
      uz: 'Jadvalni kuzating, eslatma oling va xohlasangiz muddatidan oldin toʻlang.',
      ru: 'Следите за графиком, получайте напоминания и гасите досрочно, когда удобно.',
    },
  ),
  slide(
    'v1',
    'vodiy',
    { uz: 'Summa va muddatni tanlang', ru: 'Выберите сумму и срок' },
    {
      uz: 'Kalkulyatorda oylik toʻlov va qarzning toʻliq narxini darhol koʻrasiz.',
      ru: 'Калькулятор сразу покажет ежемесячный платёж и полную стоимость займа.',
    },
  ),
  slide(
    'v2',
    'vodiy',
    { uz: 'Qaror onlayn', ru: 'Решение онлайн' },
    {
      uz: 'Arizani ilovadan yuborasiz, natijasi shu yerga keladi. Filialga borish shart emas.',
      ru: 'Заявка уходит из приложения, ответ приходит сюда же. В филиал идти не нужно.',
    },
  ),
  slide(
    'v3',
    'vodiy',
    { uz: 'Pul kartangizga', ru: 'Деньги на карту' },
    {
      uz: 'Shartnomani SMS-kod bilan imzolang, pul Uzcard yoki Humo kartangizga tushadi.',
      ru: 'Подпишите договор SMS-кодом, и деньги придут на карту Uzcard или Humo.',
    },
  ),
  slide(
    'v4',
    'vodiy',
    { uz: 'Toʻlovlar nazoratda', ru: 'Платежи под контролем' },
    {
      uz: 'Jadvalni kuzating, eslatma oling va xohlasangiz muddatidan oldin toʻlang.',
      ru: 'Следите за графиком, получайте напоминания и гасите досрочно, когда удобно.',
    },
  ),
])
