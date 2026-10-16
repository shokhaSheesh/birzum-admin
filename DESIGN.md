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

## Detail pages

- A row opens the record's detail page, not its form. Top: a back link, the logo or picture, the name with its status badge, one line of identifiers, and "Oʻchirish" (red, quiet) and "Tahrirlash" on the right.
- Then the figures as `StatCard`s, then a wide column with the record's related lists (a merchant's filials, read-only) and a 360px column of detail cards: a title and label/value rows.
- Delete always asks in a `ConfirmDialog`, saying what disappears. A merchant with active nasiyas cannot be deleted: the dialog says so and offers "Toʻxtatish" instead (or only "Tushunarli" when it is already paused). Deleting opens once the last nasiya is closed.

## Small directories (Kategoriyalar, Brendlar)

- **How big a record is decides where it is created.** A big record (a merchant: many sections) gets its own page with the fixed `ActionBar`. A small one (a category, a brand: a few fields) opens in a centred `Modal` over the list, never a side panel. Rows open the same modal to edit.
- The modal has the fields, and at the bottom "Oʻchirish" on the left (edit only), then "Bekor qilish" and "Qoʻshish" / "Saqlash". Esc or the backdrop closes it.
- Categories: one level of subcategories. A subcategory row sits under its category, indented with a corner arrow; each category row has "+ Subkategoriya". The modal starts with "Asosiy kategoriya" (none, or a top-level category; locked for a category that has subcategories), then the picture, the name in Uzbek and Russian (both required, no duplicates among siblings), and "Klient ilovasida koʻrsatish". A hidden category hides its subcategories. Order is the client app's order; the arrows move a row among its siblings. A category's product count includes its subcategories'.
- Brands: one name for both languages, a logo (initials until uploaded), listed A to Z with a search.
- A category with subcategories, or a category or brand with products, cannot be deleted: the dialog says how many products are in it and that merchants must move them first. A category can be hidden instead.

## Read-only pages (Mahsulotlar)

- Merchants own their products, so the admin has no create, edit, hide or delete. The page description and a line on the detail page say so.
- The list: figures (total, Sotuvda, Tugagan, Yashirilgan), status tabs with counts, then a search and dropdowns for merchant, category (subcategories indented under their category; picking a category includes them) and brand. Rows show the cover, name and brand, merchant, "Category › Subcategory", price ("… dan" when variants differ), total stock and status. A row opens the detail page.
- Status: "Yashirilgan" when the merchant switched it off, else "Tugagan" when no filial has any, else "Sotuvda".
- The detail page: name and status, brand and category path; photos (thumbnails beside the main one); "Variantlar va qoldiq", a table of every variant with its price and stock in each of the merchant's filials and the total (zero greyed, a sold-out total in amber); the description in both languages; characteristics. On the right: the merchant (opens its page) and the key figures.

## Settings pages (Ustama)

- The same `ActionBar` fixed on top as a form, with the group as its eyebrow. "Bekor qilish" and "Saqlash" stay disabled until something changes; then "N ta oʻzgarish saqlanmagan" shows beside them.
- Values edited in place in a table (percent inputs, a `Switch` per row, a bin to remove), checked as you type. "+ Muddat qoʻshish" adds a row whose month count is editable until saved. Ustama rules: one rate for every merchant and category; 0–300%; terms 1–60 months, no duplicates; a longer term never cheaper than a shorter open one; at least one term open.
- A sticky preview on the right shows the result of the unsaved values: what a shopper pays. A note says new rates apply to new arizalar only. Every save is kept in "Oʻzgarishlar tarixi" with date, admin and each change.
- A failed save marks every bad field in red and shows a red toast; nothing is saved.

## Pages to come
Each sidebar entry starts as a placeholder (`StubPage`) naming what the page will hold, and is replaced as it gets designed.
