import type { Brand } from '@/shared/config/workspaces'
import type { LocalizedText } from '@/shared/i18n/dictionaries'
import { createStore } from '@/shared/lib/createStore'

/** Uzbekistan's regions, in the order a branch list is grouped by. */
export const REGIONS = [
  'tashkentCity',
  'tashkent',
  'andijan',
  'fergana',
  'namangan',
  'samarkand',
  'bukhara',
  'jizzakh',
  'kashkadarya',
  'navoi',
  'surkhandarya',
  'syrdarya',
  'khorezm',
  'karakalpakstan',
] as const
export type Region = (typeof REGIONS)[number]

/**
 * How a brand's app users reach it, shown in the app's Kontaktlar: the phones (the first is the
 * main line), email, socials, website, head office and hours.
 */
export type BrandContacts = {
  id: Brand
  /** Nine digits after +998 each. */
  phones: string[]
  email: string
  website: string
  telegram?: string
  instagram?: string
  address: LocalizedText
  hours: LocalizedText
}

/** One branch, under its region in the app; borrowers pay cash and get help there. */
export type Branch = {
  id: string
  brand: Brand
  region: Region
  address: string
  phone?: string
}

// What the brands' sites list today. Replace with the API.
export const brandContactsStore = createStore<BrandContacts>([
  {
    id: 'fortuna',
    phones: ['732444000', '558084000'],
    email: 'info@fortunabiznes.uz',
    website: 'fortunabiznes.uz',
    telegram: 'fortunabiznes_mmt',
    instagram: 'fortunabiznes.mko',
    address: {
      uz: 'Fargʻona viloyati, Fargʻona shahri, B. Margʻinoniy koʻchasi, 12-uy',
      ru: 'Ферганская область, г. Фергана, ул. Б. Маргиноний, 12',
    },
    hours: { uz: 'Dushanba–shanba, 9:00–18:00', ru: 'Пн–сб, 9:00–18:00' },
  },
  {
    id: 'vodiy',
    phones: ['735291434'],
    email: 'vodiymko@mail.ru',
    website: 'vodiytaraqqiyot.uz',
    address: {
      uz: 'Fargʻona viloyati, Buvayda tumani, Yangiqoʻrgʻon MFY, Yangiqoʻrgʻon koʻchasi, 2-uy',
      ru: 'Ферганская область, Бувайдинский район, МСГ Янгикурган, ул. Янгикурган, 2',
    },
    hours: { uz: 'Dushanba–juma, 9:00–18:00', ru: 'Пн–пт, 9:00–18:00' },
  },
])

const list = (brand: Brand, rows: [Region, string, string?][]): Branch[] =>
  rows.map(([region, address, phone], i) => ({
    id: `${brand}-br${i + 1}`,
    brand,
    region,
    address,
    phone,
  }))

export const branchesStore = createStore<Branch>([
  ...list('fortuna', [
    ['fergana', 'Margʻilon sh., B. Margʻiloniy koʻchasi, 97-b', '732534000'],
    ['fergana', 'Rishton t., B. Roshidoniy koʻchasi, 195 A', '558014111'],
    ['samarkand', 'Samarqand sh., Narpay koʻchasi, 77-uy', '557024000'],
    ['bukhara', 'Buxoro sh., I. Karimov shoh koʻchasi, 328-uy', '553034000'],
    ['andijan', 'Andijon sh., A. Temur shoh koʻchasi, 44-B', '782980040'],
    ['khorezm', 'Urganch t., Farxod koʻchasi, 33/75-uy', '556010040'],
    ['jizzakh', 'Jizzax sh., Sh. Rashidov koʻchasi', '788884400'],
    ['karakalpakstan', 'Nukus sh., Ernazar Alakoz koʻchasi, 83-uy', '551050030'],
  ]),
  ...list('vodiy', [
    ['fergana', 'Buvayda t., Yangiqoʻrgʻon koʻchasi, 2-uy', '735291434'],
    ['fergana', 'Bagʻdod t., Orzu koʻchasi, 11-uy', '558081010'],
    ['andijan', 'Andijon t., Oltin vodiy koʻchasi, 18-uy', '950061155'],
    ['andijan', 'Paxtaobod t., A. Temur koʻchasi', '552023000'],
    ['namangan', 'Chust t., Birlik MFY, Chustiy koʻchasi', '953024040'],
    ['namangan', 'Toʻraqoʻrgʻon t., Namangan koʻchasi, 7-uy', '552551010'],
    ['namangan', 'Norin t., Xaqqulobod sh., Oʻzbekiston koʻchasi, 87-uy', '552541010'],
    ['tashkent', 'Nurafshon sh., Toshkent yoʻli koʻchasi, 178-uy', '559002200'],
    ['tashkent', 'Chirchiq sh., A. Navoiy shoh koʻchasi, 225-uy', '559031000'],
    ['kashkadarya', 'Qarshi sh., I. Karimov koʻchasi, 289-uy', '554011010'],
    ['kashkadarya', 'Shahrisabz sh., Ipak yoʻli koʻchasi, 309-uy', '554041010'],
    ['kashkadarya', 'Koson t., Mustaqillik shoh koʻchasi', '554031010'],
    ['kashkadarya', 'Chiroqchi t., Mustaqillik koʻchasi, 20-uy', '554011000'],
    ['kashkadarya', 'Gʻuzor t., Oʻzbekiston koʻchasi, 51-uy', '554020010'],
    ['kashkadarya', 'Koʻkdala t., Yangichorbogʻ koʻchasi, 2-A uy', '554052020'],
    ['navoi', 'Navoiy sh., A. Navoiy koʻchasi, 22-uy', '553511100'],
    ['surkhandarya', 'Jarqoʻrgʻon t., Surxon sohili MFY, Oʻzbekiston koʻchasi', '951551000'],
    ['surkhandarya', 'Shoʻrchi t., Mustaqillik koʻchasi, 77a-uy', '554511000'],
    ['surkhandarya', 'Angor sh., At-Termiziy koʻchasi, 9-uy', '554521010'],
    ['surkhandarya', 'Uzun t., Oʻzbekiston koʻchasi, 104-uy', '554524040'],
  ]),
])
