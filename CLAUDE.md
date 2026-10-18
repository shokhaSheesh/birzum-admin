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
- Workspaces: the panel runs Birzum and the microloan brands. The URL decides (`/fortuna/...`, `/vodiy/...`, everything else is Birzum; `shared/config/workspaces.ts`); the switch at the top of the sidebar opens another one, and each has its own menu (`navOf` in `app/nav.ts`). Microloan pages take the brand as a prop and filter their store by it. Tanishtiruv opens the current business's slides only.
- Microloan Mahsulotlar (`/{brand}/products`): name, kind and who it is for in both languages, sum min/max/step, yearly rate from–to, shortest and longest term, shown in the app or not, order with the arrows. Seeded from the apps' `brand.ts`; the apps will read it from the API.
