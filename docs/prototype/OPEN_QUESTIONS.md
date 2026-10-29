# Prototype — Open Questions

Things the docs don't settle. Agents add rows here instead of guessing. The project owner answers them.

| # | Question | Docs in conflict | Default until answered |
| :--- | :--- | :--- | :--- |
| 1 | Does the KDS split into stations (Bếp nóng / Bếp lạnh)? Older docs list "Bếp nóng, Bếp lạnh, Bar"; Bar is banned, and the report names no stations. | `04_PROJECT_TECH.md`, `01_PROJECT_PROPOSAL.md` vs report | One KDS Bếp screen, no stations |
| 2 | Which Course do drinks belong to? CONTEXT.md puts all drinks in Course 1; backend has a separate `Beverage` course type. | `CONTEXT.md` vs `CourseType.cs` | Drinks listed under Khai vị (Course 1) |
| 3 | Does the E-Menu have a "request bill" button? ADR 0004 lists it; the report's UC-U2 lists only 3 buttons. | ADR 0004 vs report UC-U2 | No bill button (report wins) |
| 4 | Is there a separate Admin role, or is Admin the Manager? Report UC-A4 says "Quản trị viên / Quản lý"; RBAC table has only Manager. | Report UC-A4 vs RBAC table | Manager screens only |
| 5 | Is a pre-ordered Set Menu one per guest or one per table? The booking stores a single `PreOrderedSetMenuId`. | UC-U1 / UC-E6 (no quantity field) | One set for the booking, served × party size |
| 6 | Set Menu names and package prices are not in the docs (only "giá trọn gói" is). | UC-A1 | Demo values in rules §10 (Thượng Hạng 1.800.000 ₫, Hải Sản 1.250.000 ₫) |
| 7 | Can guests pre-order à la carte items when booking, or only a Set Menu? | UC-U1 says Set Menu only | Set Menu only |
| 8 | How should the KDS handle more tickets than fit on screen? | No doc covers KDS overflow | Answered below: page buttons |
| 9 | Should the deposit rule (30% of the set, or 500.000 ₫ per guest) be added to the analysis report as a business rule? | Report BR-02 / BR-04 give no amount | Answered below: added as BR-06 |

## Answers from the project lead (29/10/2026)

| # | Answer | Effect on prototype |
| :--- | :--- | :--- |
| 1 | No stations ("Bỏ hết") | One KDS Bếp screen, as built |
| 2 | OK: drinks go with Course 1 | As built |
| 3 | Undecided, team to discuss | Keep the 3 documented buttons (no bill button) until decided |
| 4 | Admin and Manager are one role | Manager screens only, as built |
| 5 | Only one Set Menu per booking | One set choice per reservation, as built (served × party size; confirm if it should be a single portion) |
| 6 | Demo names and prices are fine | As built |
| 7 | Only Set Menu can be pre-ordered | As built |

## Owner decisions (29/10/2026, later)

| Topic | Decision | Effect on prototype |
| :--- | :--- | :--- |
| Deposit amount | With a pre-ordered set: 30% × set price × guests. Without a set: 500.000 ₫ × guests | All deposit figures updated; B05 story deposit 2.160.000 ₫, bill 6.156.000 ₫ |
| Copy tone | Plain and informative, no emoji | Emoji removed from every screen; E1/K1 wording simplified |
| KDS overflow (#8) | Kitchen staff may touch the screen to change pages, but never change data | Page bar with ‹ Trang trước / Trang sau › on K1, K1b, K1p, K1p2. This overrides "hands-free" in CONTEXT.md / ADR 0003 for page navigation only |
| Deposit in the report (#9) | Yes | Added BR-06 to `BAO_CAO_PHAN_TICH_HE_THONG.md` §2.4; UC-U1 step 4 refers to it |
