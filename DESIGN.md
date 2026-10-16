# Birzum Admin design rules

The admin shares the visual system of the Birzum mobile apps (merchant and client): the same colour tokens, Source Sans 3, the light direction with grey cards on white, navy for actions and green for highlights, `UZS` for money, and Uzbek and Russian. Where this file is silent, the mobile apps' DESIGN.md applies.

What differs is the frame: the admin is a desktop web app used all day at a large screen.

## Layout
- **Sidebar** on the left, 256px, fixed: the logo with an "Admin" tag, then the pages in titled groups (Savdo, Hamkorlar, Katalog, Qoidalar, Aloqa, Tizim). The current page is a solid navy row; a count shows as a green pill.
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
- A back link and the title, then the fields in `FormSection` cards on the left and a sticky column on the right with status (radio cards), a live preview of how the record looks in the apps, and its figures. The save bar is fixed at the bottom: "Bekor qilish" and the primary action.
- A failed save marks every bad field in red and shows a red toast; nothing is saved.

## Pages to come
Each sidebar entry starts as a placeholder (`StubPage`) naming what the page will hold, and is replaced as it gets designed.
