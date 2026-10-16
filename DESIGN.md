# Birzum Admin design rules

The admin shares the visual system of the Birzum mobile apps (merchant and client): the same colour tokens, Source Sans 3, the light direction with grey cards on white, navy for actions and green for highlights, `UZS` for money, and Uzbek and Russian. Where this file is silent, the mobile apps' DESIGN.md applies.

What differs is the frame: the admin is a desktop web app used all day at a large screen.

## Layout
- **Sidebar** on the left, 256px, fixed: the logo with an "Admin" tag, then the pages in titled groups (Savdo, Hamkorlar, Katalog, Qoidalar, Aloqa, Tizim). The current page is a solid navy row; a count shows as a green pill. "Yigʻish" at the bottom collapses it to 68px of icons (the logo mark, dividers instead of group titles, a green dot instead of a count, the label on hover); the choice is remembered per browser.
- **Top bar**, 64px: global search on the left; UZ / RU, theme, notifications and the signed-in admin on the right.
- **Page**: a light grey ground, content up to 1152px wide, 32px from the sides. It starts with `PageHeader`: the title, one line about the page, and its actions on the right (the primary action is "+ Qoʻshish").
- Below 1024px the sidebar becomes a drawer opened from a menu button in the top bar. The admin must still work on a laptop at 1280px; phones are not a target.

## Sign-in
- Username and password only. The form sits on the left half (logo and UZ / RU on top, "Admin panelga kirish", the two fields, "Kirish", a line saying a forgotten password goes through the main admin); the right half is a navy brand panel with a few floating cards hinting at the panel.
- A wrong login or password shows a red `Alert` above the fields. Below 1024px the brand panel is hidden.
- Every page of the panel needs a signed-in admin; the account menu in the top bar has "Chiqish".

## List pages
- `PageHeader` with the primary action, then a row of `StatCard`s with the page's key figures, then one white card holding the table: `UnderlineTabs` (status with counts) and a search field on top, the table below. A whole row is clickable and ends in a chevron; numbers are right-aligned.

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

## Arizalar

- Read-only, like Mahsulotlar: merchants and shoppers create and move arizalar in their apps. Statuses and reject reasons are the same as in the mobile apps.
- The list: figures (this month, waiting, handed over this month, rejected share), status tabs with counts, then a search (number, client name or phone) and dropdowns for merchant, filial (enabled once a merchant is picked) and period. Rows: number and time, client and phone, merchant and filial, the first product ("+1 ta mahsulot" for more), total and term, status. The sidebar badge counts the arizalar waiting for a merchant.
- The detail page: number, status, time and where it started (client app or merchant app); a red banner with the reject reason and comment, or a grey one for a cancellation; products; nasiya terms in two columns; the change history, newest first, with who did it. On the right: the client, the merchant and filial (opens the merchant), how the goods are collected, and for a handed-over ariza whether Birzum has paid the merchant (the payout, or "Toʻlanishi kerak").
- The sample payouts are worked out from the sample arizalar, so numbers and sums agree across pages.

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
