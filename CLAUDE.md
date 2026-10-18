# Working on Birzum Admin

Read `DESIGN.md` before designing a page. The rules below are the ones that are easy to forget.

## No browser-default controls

Every control the admin sees is our own component, drawn with our tokens. Never ship the browser's own look for anything, because it differs between Chrome, Safari and Windows, ignores dark mode and our fonts, and looks unfinished next to our cards.

| Need                                                     | Use                                                                              | Never                                     |
| -------------------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------- |
| Pick one of a few to many options in a form              | `SelectField`                                                                    | `<select>`                                |
| Pick several, or all, of a long list (people, merchants) | `MultiSelectField` (search, "Hammasi" checkbox, chips)                           | `<select multiple>`, a wall of checkboxes |
| Filter a table by one value                              | `FilterSelect`                                                                   | `<select>`                                |
| One period for a whole page (figures, chart and tables)  | `PeriodFilter` (Kun · Hafta · Oy · Yil · Oraliq · Butun davr, ‹ › to step)       | a date range per card                     |
| Filter by a period                                       | `DateRangePicker`                                                                | `<input type="date">`, two date inputs    |
| Pick one date in a form                                  | `DateField` (calendar popover, same calendar as the range picker)                | `<input type="date">`                     |
| Tick a row in a table, select all                        | `TableCheckbox` (with the mixed state for "some")                                | a bare `<input type="checkbox">`          |
| Agree to something, a labelled option                    | `Checkbox`                                                                       | a bare checkbox                           |
| On/off in a row or a settings card                       | `Switch`                                                                         | a checkbox                                |
| One of 2–6 short options, all visible                    | `ChoiceGrid` or radio cards                                                      | radio buttons                             |
| Number, money, phone                                     | `NumberField`, `PhoneField`                                                      | `type="number"` spinners                  |
| Upload a picture                                         | `ImageField`                                                                     | a bare file input                         |
| A table longer than 20 rows                              | `Pagination` + `usePagination` (back to page 1 when filters change)              | endless scroll, "show more"               |
| A chart                                                  | our own in `shared/ui/charts` (`LineChart`, `KpiTile`, `BarList`, `ColumnChart`) | a chart library's default look            |
| A star rating                                            | `Stars` (partial fill)                                                           | ★ characters, emoji                       |
| Confirm, explain why not                                 | `ConfirmDialog`                                                                  | `window.confirm`, `alert`                 |
| Small create or edit                                     | `Modal`                                                                          | a side drawer, a new tab                  |
| Hint on hover                                            | `title` only on icon buttons; anything longer is visible text                    | custom browser tooltips                   |

- A native element may sit underneath for accessibility (a visually hidden `input` inside `Checkbox`), but what the user sees and clicks is ours.
- Popovers (`FilterSelect`, `SelectField`, `DateRangePicker`) open under their button, close on Esc and on a click outside, and work with the keyboard: arrows to move, Enter to pick.
- A filter that is set looks set: its button turns navy-outlined and shows the chosen value, so a glance tells what the table is filtered by.
- When a new kind of control is needed, build it in `src/shared/ui` first, add it to this table, then use it.

## Other rules

- Every page uses `max-w-page` (fills the space beside the sidebar up to 1680px), so collapsing the sidebar gives the page more room. Never a narrower fixed width.
- The body background is the canvas colour; never a dark colour that shows when the page bounces.
- Pages sit on `bg-page` (light grey; black in the dark theme) with cards on `bg-canvas`. Dark is black and neutral grey like iOS, never dark blue, and actions are lime with black text. The chosen option in a segmented control is `bg-raised`, so it stays lighter than its track in dark.

- Small records are created and edited in a centred `Modal`; big ones (a merchant, a payout) get their own page with the fixed `ActionBar`.
- Every table row ends with `RowActions`, kept short: edit and delete. A status change (active / blocked) belongs in the edit modal, not as more row icons.
- Dropdowns (`Listbox`, so `SelectField` and `FilterSelect`) open upwards by themselves when the modal or page around them has no room below; no fake "pick one" option in the list, use `placeholder`.
- Read-only pages (Arizalar, Mahsulotlar) say so in their description and never show edit or delete.
- Every visible string goes through `t()` with both Uzbek and Russian.
- Check every page in the headless browser before saying it works; say what was not checked.
- Every action that changes data calls `logAction()` from `entities/audit/audit` right where it succeeds, next to its toast: the section key, a kind (create, update, delete, money, access), an `audit.a.*` text, the target with a link, and before → after `changes` for status, role or amounts. The Faoliyat jurnali page (`/audit`) reads it; entries are never edited or deleted.
- Tekshiruv (`/checks`): every ariza starts as `checking` (Birzum tekshirmoqda), before the merchant sees it. Final score = FlexSoft score − penalties of the warning signs; from `approveFrom` it is approved, below `rejectBelow` rejected, between (or with an "always manual" sign) an admin decides. All numbers live in `checkRules` and are edited on `/checks/rules`; never hard-code them. Approving moves a client order to `pending` and an in-shop one to `processing`.
- Tanishtiruv (`/onboarding`): intro slides per app (Birzum, Fortuna Biznes, Vodiy Taraqqiyot) — image, title and text each in both languages, order, show/hide. No phone preview (user removed it). Slides the app ships with may keep its drawn picture; new slides need an uploaded image.
- Workspaces: the panel runs Birzum and the microloan brands. The URL decides (`/fortuna/...`, `/vodiy/...`, everything else is Birzum; `shared/config/workspaces.ts`); the admin's menu (top right) switches between them, the sidebar shows that business's logo, and each has its own menu (`navOf` in `app/nav.ts`). Microloan pages take the brand as a prop and filter their store by it. Tanishtiruv opens the current business's slides only.
- Microloan Mahsulotlar (`/{brand}/products`): name, kind and who it is for in both languages, sum min/max/step, yearly rate from–to, shortest and longest term, shown in the app or not, order with the arrows. Seeded from the apps' `brand.ts`; the apps will read it from the API.
- Microloan Arizalar (`/{brand}/applications`, `/{brand}/applications/:id`): statuses review → manual (rules could not decide) → approved / counter (offer, 3 days to sign) → signed → paidOut, or declined / expired. The app's rules decide most; an admin decides only `manual` ones, from the card on the ariza's page: approve, counter-offer (smaller sum, at least the product's minimum) or decline with a reason. Each decision is logged. The 50% income limit shown there will come from Qaror qoidalari.
- Microloan Qarzlar (`/{brand}/loans`, `/{brand}/loans/:id`): read-only. Every ariza that was paid out has a loan (same number, linked both ways), plus older ones. States active, overdue, closed; the schedule is the app's annuity (`scheduleOf`, a partial early repayment lowers the payments after it, the end stays). Money moves on Toʻlovlar and Kechikkanlar, not here.
- Microloan Toʻlovlar (`/{brand}/payments`): a row opens its loan's page (no detail modal, as on Birzum's pages); the row icon shows the fiscal cheque or, on a refused charge, charges again. "Toʻlov kiritish" (here, or on a loan's page for that loan) enters a cash or bank-transfer payment via `enterPayment`: it pays the next month and ends a late one, more goes to the loan early, enough closes it. Every payment worked out from the loans (monthly, early full/partial; taken automatically at 09:00 or paid in the app) with its fiscal cheque (`FiscalReceipt`, brand STIR in `WORKSPACE_INFO`), and refused automatic charges (`loan.refused`, kept after the payment comes in). Only the newest refused charge of a loan still late can be charged again (`mlPayments` create, logged as money); success pays that month and clears the late flag.
- Microloan Arizalar, Qarzlar and Toʻlovlar use the page-wide `PeriodFilter` (Arizalar and Toʻlovlar start on this month, Qarzlar on Butun davr): the figures and the table follow it. Figures about today (Qoʻlda qaror, Portfel, Kechikkan, Hozir kechikmoqda) say "hozir" and ignore the period.
- Microloan Kechikkanlar (`/{brand}/overdue`): today's late loans (no period; figures say so), one row per loan, by age (1–7, 8–14, 15–30, 30+ days), with the overdue total (`lateOf`: every month due and unpaid), the last call and the promise (kept or broken). Row icons: call result (`LoanCallModal`) and reminder (`LoanReminderDialog`); a row opens the loan, whose page also shows the contact log. A payment that does not cover every missed month keeps the loan late from the next missed day (`overdueAfter`).
