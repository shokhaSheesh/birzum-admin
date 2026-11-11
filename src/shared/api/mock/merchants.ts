/** The shops the sample reviews and products belong to. */
export const MERCHANTS = [
  { id: 'm-mediapark', name: 'Mediapark' },
  { id: 'm-ispace', name: 'iSpace' },
  { id: 'm-texnomart', name: 'Texnomart' },
  { id: 'm-artel', name: 'Artel Savdo' },
]

export const merchantName = (id: string) => MERCHANTS.find((m) => m.id === id)?.name ?? ''
