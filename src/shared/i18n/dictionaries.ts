export const LANGS = ['uz', 'ru'] as const
export type Lang = (typeof LANGS)[number]

/** Text entered once per language, e.g. a category name. */
export type LocalizedText = Record<Lang, string>

export const LANG_NAMES: Record<Lang, string> = {
  uz: 'Oʻzbekcha',
  ru: 'Русский',
}

const uz = {
  'common.clear': 'Tozalash',
  'common.search': 'Qidiruv',
  'common.menu': 'Menyu',
  'common.close': 'Yopish',
  'app.title': 'Birzum Admin',
  'navGroup.sales': 'Savdo',
  'navGroup.partners': 'Hamkorlar',
  'navGroup.catalog': 'Katalog',
  'navGroup.rules': 'Qoidalar',
  'navGroup.communication': 'Aloqa',
  'navGroup.system': 'Tizim',
  'nav.dashboard': 'Boshqaruv paneli',
  'nav.applications': 'Arizalar',
  'nav.customers': 'Klientlar',
  'nav.collections': 'Toʻlovlar va qarzlar',
  'nav.merchants': 'Merchantlar',
  'nav.payouts': 'Merchantlarga oʻtkazmalar',
  'nav.categories': 'Kategoriyalar',
  'nav.brands': 'Brendlar',
  'nav.pricing': 'Ustama va komissiya',
  'nav.scoring': 'Limit va skoring',
  'nav.support': 'Yordam chati',
  'nav.broadcasts': 'Xabarnomalar',
  'nav.faq': 'Savol-javoblar',
  'nav.documents': 'Hujjatlar',
  'nav.admins': 'Adminlar va rollar',
  'about.dashboard':
    'Butun platforma bir qarashda: savdo hajmi, faol nasiyalar, muddati oʻtgan qarz, yangi klientlar va merchantlar boʻyicha koʻrsatkichlar.',
  'about.applications':
    'Barcha merchantlarning arizalari: qidiruv, holat, merchant va filial boʻyicha filtr, ariza tafsiloti va tarixi.',
  'about.customers':
    'Klientlar roʻyxati va profili: MyID maʼlumotlari, limit, kartalar, xaridlar, toʻlovlar; bloklash.',
  'about.collections':
    'Klientlardan toʻlovlar: kunlik tushum, muddati oʻtgan qarzlar, qarzdorlar roʻyxati va ular bilan ishlash.',
  'about.merchants':
    'Merchant yaratish va tahrirlash: doʻkon nomi, logotipi, tavsifi, yuridik maʼlumotlar, filiallar, komissiya, holat.',
  'about.payouts':
    'Merchantlarga pul oʻtkazish: oʻtkazma yaratish, qaysi arizalar uchun ekanini belgilash, oʻtkazmalar tarixi.',
  'about.categories':
    'Mahsulot kategoriyalari ikki tilda, rasmi bilan. Merchantlar faqat shu roʻyxatdan tanlaydi.',
  'about.brands': 'Brendlar roʻyxati. Merchantlar faqat shu roʻyxatdan tanlaydi.',
  'about.pricing': 'Har bir muddat uchun ustama foizi va Birzum komissiyasi qanday hisoblanishi.',
  'about.scoring':
    'Limit qanday hisoblanadi: daromadga nisbatan koeffitsiyentlar, muddatlar boʻyicha ulush, amal qilish muddati.',
  'about.support':
    'Klientlarning yordam chatidagi murojaatlari: suhbatlar roʻyxati, javob berish, rasm koʻrish.',
  'about.broadcasts': 'Klientlar va merchantlarga yangilik va aksiya xabarlarini yuborish.',
  'about.faq': 'Klient ilovasidagi savol-javoblarni ikki tilda yozish va tahrirlash.',
  'about.documents':
    'Foydalanish shartlari, maxfiylik siyosati va ommaviy oferta matnlari, versiyalari bilan.',
  'about.admins': 'Admin panel foydalanuvchilari va ularning ruxsatlari.',
  'stub.title': 'Bu sahifa hali chizilmagan',
  'stub.next': 'Keyingi bosqichda dizayn qilinadi.',
  'topbar.search': 'Ariza, klient yoki merchant qidirish',
  'topbar.theme': 'Mavzuni almashtirish',
  'topbar.notifications': 'Bildirishnomalar',
  'topbar.role': 'Bosh admin',
}

export type TranslationKey = keyof typeof uz

const ru: Record<TranslationKey, string> = {
  'common.clear': 'Очистить',
  'common.search': 'Поиск',
  'common.menu': 'Меню',
  'common.close': 'Закрыть',
  'app.title': 'Birzum Admin',
  'navGroup.sales': 'Продажи',
  'navGroup.partners': 'Партнёры',
  'navGroup.catalog': 'Каталог',
  'navGroup.rules': 'Правила',
  'navGroup.communication': 'Связь',
  'navGroup.system': 'Система',
  'nav.dashboard': 'Панель управления',
  'nav.applications': 'Заявки',
  'nav.customers': 'Клиенты',
  'nav.collections': 'Платежи и долги',
  'nav.merchants': 'Мерчанты',
  'nav.payouts': 'Выплаты мерчантам',
  'nav.categories': 'Категории',
  'nav.brands': 'Бренды',
  'nav.pricing': 'Наценка и комиссия',
  'nav.scoring': 'Лимит и скоринг',
  'nav.support': 'Чат поддержки',
  'nav.broadcasts': 'Рассылки',
  'nav.faq': 'Вопросы и ответы',
  'nav.documents': 'Документы',
  'nav.admins': 'Админы и роли',
  'about.dashboard':
    'Вся платформа на одном экране: объём продаж, активные рассрочки, просроченный долг, новые клиенты и показатели по мерчантам.',
  'about.applications':
    'Заявки всех мерчантов: поиск, фильтры по статусу, мерчанту и филиалу, детали и история заявки.',
  'about.customers':
    'Список и профиль клиентов: данные MyID, лимит, карты, покупки, платежи; блокировка.',
  'about.collections':
    'Платежи клиентов: поступления за день, просроченный долг, список должников и работа с ними.',
  'about.merchants':
    'Создание и редактирование мерчантов: название, логотип, описание, юр. данные, филиалы, комиссия, статус.',
  'about.payouts': 'Выплаты мерчантам: создание перевода, привязка к заявкам, история выплат.',
  'about.categories':
    'Категории товаров на двух языках, с картинкой. Мерчанты выбирают только из них.',
  'about.brands': 'Список брендов. Мерчанты выбирают только из него.',
  'about.pricing': 'Процент наценки для каждого срока и правила комиссии Birzum.',
  'about.scoring': 'Как считается лимит: коэффициенты к доходу, доли по срокам, срок действия.',
  'about.support': 'Обращения клиентов в чат поддержки: список диалогов, ответы, просмотр фото.',
  'about.broadcasts': 'Отправка новостей и акций клиентам и мерчантам.',
  'about.faq': 'Вопросы и ответы приложения клиента на двух языках.',
  'about.documents':
    'Тексты условий использования, политики конфиденциальности и оферты, с версиями.',
  'about.admins': 'Пользователи админ-панели и их права.',
  'stub.title': 'Эта страница ещё не нарисована',
  'stub.next': 'Будет спроектирована на следующем этапе.',
  'topbar.search': 'Поиск заявки, клиента или мерчанта',
  'topbar.theme': 'Сменить тему',
  'topbar.notifications': 'Уведомления',
  'topbar.role': 'Главный админ',
}

export const dictionaries: Record<Lang, Record<TranslationKey, string>> = { uz, ru }
