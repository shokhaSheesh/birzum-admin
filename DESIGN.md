# Birzum Admin design rules

The admin shares the visual system of the Birzum mobile apps (merchant and client): the same colour tokens, Source Sans 3, the light direction with grey cards on white, navy for actions and green for highlights, `UZS` for money, and Uzbek and Russian. Where this file is silent, the mobile apps' DESIGN.md applies.

What differs is the frame: the admin is a desktop web app used all day at a large screen.

## Controls

- Never the browser's own controls: every dropdown, calendar, checkbox and dialog is ours (see the table in `CLAUDE.md`).
- **Popovers** open under their button as a white card with a soft shadow and a short slide-in, close on Esc or a click outside, and work with the arrows and Enter. Lists over eight options get a search on top. The chosen option is bold with a tick.
- **Filters** (`FilterSelect`, `DateRangePicker`) are 40px buttons with a thin border; while one is set it is outlined in navy and shows the value, so it is plain what the table is filtered by.
- **The calendar** starts weeks on Monday, names months in the interface language, outlines today, draws chosen days as navy circles and the days between as a green band. The range picker has ready periods on the left (Bugun, Kecha, Oxirgi 7 kun, Oxirgi 30 kun, Shu oy, Oʻtgan oy, Butun davr); on the calendar the first click is the start, the second the end, and it applies then. Future days cannot be picked for a filter.
- **Table checkboxes** have a mixed state in the header when only some rows are ticked.

## Layout
- **Sidebar** on the left, 256px, fixed: the logo with an "Admin" tag, then the pages in titled groups (Savdo, Hamkorlar, Katalog, Qoidalar, Aloqa, Tizim). The current page is a solid navy row; a count shows as a green pill. "Yigʻish" at the bottom collapses it to 68px of icons (the logo mark, dividers instead of group titles, a green dot instead of a count, the label on hover); the choice is remembered per browser.
- **Top bar**, 64px: global search on the left; UZ / RU, theme and the signed-in admin on the right.
- **Page**: a light grey ground, content up to 1152px wide, 32px from the sides. It starts with `PageHeader`: the title, one line about the page, and its actions on the right (the primary action is "+ Qoʻshish").
- Below 1024px the sidebar becomes a drawer opened from a menu button in the top bar. The admin must still work on a laptop at 1280px; phones are not a target.

## Sign-in
- Username and password only, in one centred card on a light grey page: the logo with an "Admin" tag above it, "Admin panelga kirish", the two fields, "Kirish", a line saying a forgotten password goes through the main admin. UZ / RU sits top right.
- A wrong login or password shows a red `Alert` above the fields.
- Every page of the panel needs a signed-in admin; the account menu in the top bar has "Chiqish".

## List pages
- `PageHeader` with the primary action, then a row of `StatCard`s with the page's key figures, then one white card holding the table: `UnderlineTabs` (status with counts) and a search field on top, then a filter row (search, `FilterSelect`s, `DateRangePicker`), the table below. A whole row is clickable and ends in `RowActions`; numbers are right-aligned.

## Form pages
- A bar fixed to the top of the page: a back arrow, "Tahrirlash" or the list's name above the title, then "Bekor qilish" and the primary action on the right. Below it the fields in `FormSection` cards on the left and a sticky column on the right with status (radio cards) and a live preview of how the record looks in the apps.

## Row actions

- Every table row ends with icon buttons (`RowActions`), so common actions don't need the detail page or modal: view (eye), edit (pencil), delete (bin, red on hover). A read-only table (Mahsulotlar) has only view. Clicking the rest of the row still opens the record.
- Delete from a row goes through the same dialog as from the detail page or modal, with the same blocking rules.

## Detail pages

- A row opens the record's detail page, not its form. Top: a back link, the logo or picture, the name with its status badge, one line of identifiers, and "Oʻchirish" (red, quiet) and "Tahrirlash" on the right.
- Then the figures as `StatCard`s, then a wide column with the record's related lists (a merchant's filials, read-only) and a 360px column of detail cards: a title and label/value rows.
- Delete always asks in a `ConfirmDialog`, saying what disappears. A merchant with active nasiyas cannot be deleted: the dialog says so and offers "Toʻxtatish" instead (or only "Tushunarli" when it is already paused). Deleting opens once the last nasiya is closed.

## Small directories (Kategoriyalar, Brendlar)

- **How big a record is decides where it is created.** A big record (a merchant: many sections) gets its own page with the fixed `ActionBar`. A small one (a category, a brand: a few fields) opens in a centred `Modal` over the list, never a side panel. Rows open the same modal to edit.
- The modal has the fields, and at the bottom "Oʻchirish" on the left (edit only), then "Bekor qilish" and "Qoʻshish" / "Saqlash". Esc or the backdrop closes it.
- Categories: one level of subcategories. Two views, switched by a `ViewToggle` over the table: **Daraxt** (tree: a subcategory row sits under its category, indented with a corner arrow) and **Roʻyxat** (flat, A to Z, with a search and an "Asosiy kategoriya" column). Subcategories are created from the same "Kategoriya qoʻshish" modal by picking the parent. The modal starts with "Asosiy kategoriya" (none, or a top-level category; locked for a category that has subcategories), then the picture, the name in Uzbek and Russian (both required, no duplicates among siblings), and "Klient ilovasida koʻrsatish". A hidden category hides its subcategories. Order is the client app's order and is changed only in the tree view: drag a row by its six-dot handle (`GripVertical`) among its siblings; a navy line shows where it lands. Arrow keys on the handle move it too. A category's product count includes its subcategories'.
- Brands: one name for both languages, a logo (initials until uploaded), listed A to Z with a search.
- A category with subcategories, or a category or brand with products, cannot be deleted: the dialog says how many products are in it and that merchants must move them first. A category can be hidden instead.

## Read-only pages (Mahsulotlar)

- Merchants own their products, so the admin has no create, edit, hide or delete. The page description and a line on the detail page say so.
- The list: figures (total, Sotuvda, Tugagan, Yashirilgan), status tabs with counts, then a search and dropdowns for merchant, category (subcategories indented under their category; picking a category includes them) and brand. Rows show the cover, name and brand, merchant, "Category › Subcategory", price ("… dan" when variants differ), total stock and status. A row opens the detail page.
- Status: "Yashirilgan" when the merchant switched it off, else "Tugagan" when no filial has any, else "Sotuvda".
- The detail page: name and status, brand and category path; photos (thumbnails beside the main one); "Variantlar va qoldiq", a table of every variant with its price and stock in each of the merchant's filials and the total (zero greyed, a sold-out total in amber); the description in both languages; characteristics. On the right: the merchant (opens its page) and the key figures.

## Klientlar

- Read-only apart from blocking: MyID data comes from MyID, the limit from FlexSoft.
- The list: figures (total, with a running nasiya and how much is left, late and how much, blocked), status tabs (Faol nasiyasi bor, Qarzdor, Bloklangan, Nasiyasiz), then a search (name, phone, JSHSHIR, passport), a limit filter (bor, muddati tugagan, yoʻq) and the sign-up period. Rows: photo or initials, name and phone, JSHSHIR, limit and until when (struck through when expired), running nasiyas, what is left ("N kun kechikkan" in red when late), status; row actions view and block / unblock.
- The detail page: photo, full name, status, phone and since when, and "Bloklash" (red, quiet) or "Blokdan chiqarish". A blocked client gets a red banner with the reason, comment, when and who. Figures: limit, running nasiyas, left to pay with the next payment day, overdue. Tabs: Xaridlar (every ariza with months paid of the term; a row opens the ariza), Toʻlovlar (their payments and failed charges), Aloqalar (calls and reminders, newest first) and Kartalar; `?tab=` opens one directly. A debtor gets a red banner with the overdue sum, how many payments and how many days, and the buttons "Qoʻngʻiroq natijasi", "Eslatma yuborish" and "Kartadan yechish" (solid). "Toʻlov kiritish" sits next to Bloklash while a nasiya runs. On the right: MyID details.
- Blocking is a small modal: what blocking does, a reason (fraud suspicion, the client's request, not paying, other) and a required comment. A blocked shopper can still sign in and pay but cannot start a new nasiya. Unblocking asks first.

## Arizalar

- Read-only, like Mahsulotlar: merchants and shoppers create and move arizalar in their apps. Statuses and reject reasons are the same as in the mobile apps.
- The list: figures (this month, waiting, handed over this month, rejected share), status tabs with counts, then a search (number, client name or phone) and dropdowns for merchant, filial (enabled once a merchant is picked) and period. Rows: number and time, client and phone, merchant and filial, the first product ("+1 ta mahsulot" for more), total and term, status. The sidebar badge counts the arizalar waiting for a merchant.
- The detail page: number, status, time and where it started (client app or merchant app); a red banner with the reject reason and comment, or a grey one for a cancellation; products; nasiya terms in two columns; the change history, newest first, with who did it. On the right: the client, the merchant and filial (opens the merchant), how the goods are collected, and for a handed-over ariza whether Birzum has paid the merchant. A handed-over or closed ariza also shows its **Toʻlov jadvali**: progress bar, "4 / 12 toʻlangan · qolgan …", then every month with date, sum and Toʻlangan (with the day) / Kutilmoqda / Muddati oʻtgan. The schedule is the one the client app shows (the payout, or "Toʻlanishi kerak").
- The sample payouts are worked out from the sample arizalar, so numbers and sums agree across pages.

## Boshqaruv paneli

- One `PeriodFilter` for the whole page, default this month. Everything follows it except Portfel, which is today's state and says so.
- **Four `KpiTile`s**: Savdo hajmi (goods total of nasiyas handed over), Tushdi, Arizalar, Yangi klientlar. Each has its change against the previous period as a pill (arrow and sign, green when it went the good way, red when not) No trend lines inside the tiles: the chart below shows the trend. While the period is still running, the change compares the same days of the previous one ("oʻtgan oyning shu kunlariga"), never a half month against a whole one. With nothing to compare it says so.
- **Savdo va tushum** (`LineChart`): both money series on one axis, 2px smooth monotone lines (they never dip below zero), a faint wash under Savdo, solid hairline grid, a legend with each total. Hover or focus shows a crosshair, a ringed dot on each line and one tooltip with both values. Lines stop at now and start at the first day with data.
- **Arizalar oqimi**: Kelib tushdi → Koʻrib chiqildi → Topshirildi as bars with counts and the share of the first, then Jarayonda, Rad etildi, Bekor qilindi.
- **Merchantlar** and **Kategoriyalar** (`BarList`): ranked thin bars with the value at the end; **Muddatlar** (`ColumnChart`): handed-over nasiyas per term, count on each cap.
- **Portfel** (today, full width): the clients' remaining debt as the one hero number with a line saying what it is, a bar split into nasiyas paying on time (green) and late nasiyas (red), then four figures, each with one plain line under it: Oʻz vaqtida toʻlanmoqda, Kechikkan nasiyalar (their whole remaining debt), Shundan muddati oʻtgan (only the payments whose day has passed), Xavf ulushi (PAR) = late nasiyas ÷ all debt.

## Charts

- Our own components, our tokens. Marks carry colour; text never does. Bars and columns are at most 24px wide with a 4px rounded end; lines are 2px; gridlines are solid hairlines. Two series always get a legend. Every chart answers hover and keyboard focus with its exact figures.
- A chart over a period uses the period's bars: hours for a day, days for a week, a month or a range up to 62 days, months for a year, a longer range or all time.

## Pagination

- A table longer than 20 rows ends in `Pagination`: "1–20 / 89", rows per page (20, 50, 100), and page numbers with gaps. Changing a filter goes back to page 1. The rows-per-page list opens upwards. No totals in this bar: figures belong in the cards on top.

## Sharhlar

- Reviews come from the client app (1–5 stars and a text, after Topshirilgan) and belong to a shop and an ariza. A merchant can delete them in the merchant app; the admin still sees those.
- One `PeriodFilter` for the page. Figures: Sharhlar (and how many count in ratings), Oʻrtacha baho, Salbiy sharhlar (1–2 stars) with their share, Moderatsiya (hidden by an admin, removed by a merchant).
- **Baholar**: the average large with `Stars` (partly filled, 4,5 shows four and a half), then one bar per star count (amber, red for 1–2); a bar filters the list. **Merchantlar reytingi**: each shop's average and count, its negative ones, and an amber badge when the merchant deleted reviews; a row filters the list. Only published reviews count in any rating.
- The list is cards, not a table, because the text is the point: stars, time and status, the text, the moderation line when there is one, then the client (opens the client), the shop, the product and the ariza number (opens the ariza). Tabs: Hammasi, Salbiy sharhlar, Yashirilgan, Merchant oʻchirgan; search, merchant and star filters; pagination.
- Actions: **Yashirish** (modal: what it does, the review quoted, a reason as choice cards, a comment), **Qaytarish** for a hidden or merchant-removed review (confirm), **Oʻchirish** for good (confirm that says hiding is usually enough).

## Toʻlovlar va qarzlar

- Money in from shoppers and working with debtors. Payments are not created here: Birzum takes the monthly payment from the card on the payment day, or the shopper pays in the app (Oylik toʻlov, Muddatidan oldin, Toʻliq yopish, as in the client app's PaySheet).
- **One period for the whole page** (`PeriodFilter`) under the header: Kun · Hafta · Oy · Yil · Oraliq · Butun davr, default this month. Day to year step with ‹ ›, and "Bugun" jumps back when away from today; Oraliq opens our calendar (future days allowed, to see what is due). Every figure, the chart, the debt groups and both tables follow it; only "Toʻlov kiritish" in the header does not.
- Figures for the period: Tushdi, Yigʻish darajasi (of the payments due in the period up to today, how much came in; "—" when none was due), Muddati oʻtgan (late payments whose day is in the period) with the number of debtors, Kutilmoqda (still due in the period from today on).
- **Tushum**: bars over the period: hours for a day, days for a week, month or a range up to 62 days, months for a year, a longer range or all time (which runs to the last payment still due). What came in is solid green; what is still due sits on top in pale green with a green outline. A bar's figures show on hover or focus; the bar holding now is bold under the axis. Our own HTML bars, no chart library.
- **Kechikish muddati**: overdue debt split by how late (1–7, 8–14, 15–30, 30+ days), as one stacked bar of red shades plus a row per group with its name, debtors and sum, so colour is never the only cue. A row filters the debtors table.
- **Qarzdorlar** tab: search, how late, merchant, and contact state (not contacted, promised, promise broken). Rows: client, overdue sum and how many payments, days late (amber up to 7, red after), what is left in all, the last contact and the promised date (red with "Vaʼda buzilgan" once passed). Row actions: open the client on its Aloqalar tab, Qoʻngʻiroq natijasi, Eslatma yuborish, Kartadan yechish.
- **Qoʻngʻiroq natijasi** is a small modal: the result as four choice cards (promised to pay, no answer, refused, wrong number), the promised day (required with a promise, today or later) and a comment. **Eslatma yuborish** is a confirm showing the exact SMS and app text.
- **Kartadan yechish** (modal): the shopper's cards as radio cards with the scheme logo, the sum (starts at the overdue sum, at most the rest of the late nasiyas), and "Yechish: 5 238 333 UZS". It waits for the bank, then shows either a big green tick with the sum, or a red alert with the bank's reason and lets the admin pick another card. Money goes to the late months first, oldest nasiya first; a failed try is recorded among the payments too.
- **Toʻlov kiritish** (modal, from the header or the client page): client (unless opened from one), ariza, three quick sums to fill the amount (overdue, monthly, the whole rest), Naqd pul or Bank oʻtkazmasi, sum, day (not in the future), the receipt or payment order number (required) and a comment. A sum that covers the rest says the nasiya will close, and closing it moves the ariza to "Nasiya yopilgan".
- **Toʻlovlar** tab: every payment and failed card charge, newest first, filtered by search (name, phone, ariza number), kind, state, merchant and method. Rows: time, client, ariza and merchant, kind, how it was paid (the card with "Avtomatik yechildi", "Ilovada toʻladi" or "Admin yechdi", or Naqd pul / Bank oʻtkazmasi with the document number, plus the admin's name), sum (struck through when the charge failed), and Tushdi or Yechilmadi with the reason. The footer shows the count and the sum that came in.
- How late someone is comes from the schedule and the payments, never a stored number, so Klientlar, the client page, the ariza schedule and this page always agree.

## Payouts (Merchantlarga oʻtkazmalar)

- Birzum pays merchants the full financed sum of each handed-over sale (no commission). A sale is owed until a payout covers it.
- The list page: figures (owed, Jarayonda, paid this month, last payout), then two tabs. **Toʻlanishi kerak**: one row per merchant still owed, with its schedule (weekly on Tuesday, monthly on the 5th), how many arizalar, the oldest one, the next payout day ("Kechikkan" in red when an ariza should already have been paid) and the sum; a row opens a new payout for that merchant. **Oʻtkazmalar**: every payout with reference, merchant, date, arizalar, sum and state, filtered by search, merchant and state; "Oʻtkazildi" sits in the row actions of one still in progress.
- Creating a payout is a full page (it picks from a list): merchant (only those owed, with the sum), an optional note, then the owed arizalar with checkboxes, all ticked to start with. A sticky summary shows the merchant, the total for the ticked arizalar, today's date and the bank details the money goes to.
- A payout is created "Jarayonda" and marked "Oʻtkazildi" by hand once the bank has sent it (with a confirm); there is no bank integration for now.
- The merchant's detail page has a second tab, "Oʻtkazmalar": what is owed now (with "Oʻtkazma yaratish") and its payouts. While in progress it can be cancelled, which puts its arizalar back among what is owed. A paid payout cannot change.

## Settings pages (Ustama)

- The same `ActionBar` fixed on top as a form, with the group as its eyebrow. "Bekor qilish" and "Saqlash" stay disabled until something changes; then "N ta oʻzgarish saqlanmagan" shows beside them.
- Values edited in place in a table (percent inputs, a `Switch` per row, a bin to remove), checked as you type. "+ Muddat qoʻshish" adds a row whose month count is editable until saved. Ustama rules: one rate for every merchant and category; 0–300%; terms 1–60 months, no duplicates; a longer term never cheaper than a shorter open one; at least one term open.
- A sticky preview on the right shows the result of the unsaved values: what a shopper pays. A note says new rates apply to new arizalar only. Every save is kept in "Oʻzgarishlar tarixi" with date, admin and each change.
- A failed save marks every bad field in red and shows a red toast; nothing is saved.

## Pages to come
Each sidebar entry starts as a placeholder (`StubPage`) naming what the page will hold, and is replaced as it gets designed.
