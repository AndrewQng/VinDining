# Prototype — Open Questions

Things the docs don't settle. Agents add rows here instead of guessing. The project owner answers them.

| # | Question | Docs in conflict | Default until answered |
| :--- | :--- | :--- | :--- |
| 1 | Does the KDS split into stations (Bếp nóng / Bếp lạnh)? Older docs list "Bếp nóng, Bếp lạnh, Bar"; Bar is banned, and the report names no stations. | `04_PROJECT_TECH.md`, `01_PROJECT_PROPOSAL.md` vs report | One KDS Bếp screen, no stations |
| 2 | Which Course do drinks belong to? CONTEXT.md puts all drinks in Course 1; backend has a separate `Beverage` course type. | `CONTEXT.md` vs `CourseType.cs` | Drinks listed under Khai vị (Course 1) |
| 3 | Does the E-Menu have a "request bill" button? ADR 0004 lists it; the report's UC-U2 lists only 3 buttons. | ADR 0004 vs report UC-U2 | No bill button (report wins) |
| 4 | Is there a separate Admin role, or is Admin the Manager? Report UC-A4 says "Quản trị viên / Quản lý"; RBAC table has only Manager. | Report UC-A4 vs RBAC table | Manager screens only |
| 5 | Is a pre-ordered Set Menu one per guest or one per table? The booking stores a single `PreOrderedTastingMenuId`. | UC-U1 / UC-E6 (no quantity field) | One set for the booking, served × party size |
| 6 | Set Menu names and package prices are not in the docs (only "giá trọn gói" is). | UC-A1 | Demo values in rules §10 (Thượng Hạng 1.800.000 ₫, Hải Sản 1.250.000 ₫) |
| 7 | Can guests pre-order à la carte items when booking, or only a Set Menu? | UC-U1 says Set Menu only | Set Menu only |
| 8 | How should the KDS handle more tickets than fit on screen? | No doc covers KDS overflow | Answered below: page buttons |
| 9 | Should the deposit rule (30% of the set, or 500.000 ₫ per guest) be added to the analysis report as a business rule? | Report BR-02 / BR-04 give no amount | Answered below: added as BR-06 |
| 10 | Guests need a public list of Set Menus (home page, booking, QR menu); docs/api.md only has the Manager-only GET /api/manager/tasting-menus. | docs/api.md vs UC-U1 / UC-U2 | Website calls a public GET /api/menu/tasting-menus (mock only until the backend adds it) |
| 11 | Waitstaff W2 check-in supports looking up a reservation by booking code or phone number; docs/api.md lists GET /api/reservations as Cashier/Manager only. | docs/api.md vs UC-E6 / W2 | Website allows Waitstaff on GET /api/reservations?search=... (mock until backend extends role access) |
| 12 | How is the SLA of a course ticket with several dishes measured on the KDS? | Report UC-S4 (per dish) | Ticket deadline = longest Prep SLA among its dishes, from the course start |
| 13 | How is a pre-ordered Set Menu billed when some of its courses were not served? | Report BR-02 (Subtotal = served dishes) has no rule for sets | Bill only the served courses, split by their à la carte prices |
| 14 | UC-A5 lists a "ca phục vụ" filter, but no doc defines the shifts. | Report UC-A5 vs PROTOTYPE_RULES §3 row 11 | Zone filter only until the shifts are defined |
| 15 | Occupancy rate and cancellation rate KPI formulas are not specified in the report. | UC-A5 vs BR-01..BR-06 | Occupancy = occupied table-slots / (active tables × days × seatings per evening), where seatings per evening (2) is derived from booking slots 18:00–20:00 and DurationMinutes (120); Cancellation rate = cancelled reservations / all reservations in the period |
| 16 | The Pass needs a history of dishes that went out (owner feedback); docs/api.md has no route for it. | docs/api.md vs owner feedback 19/11/2026 | Website calls GET /api/orders/pass/history (mock only until the backend adds it) |

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

## Answers from the project owner (21/11/2026)

| # | Answer | Effect |
| :--- | :--- | :--- |
| 3 | No bill button on the E-Menu. As ADR 0004 describes, the guest asks the waiter, and the waiter sends the request from the waitstaff app (W6 "Yêu cầu tính tiền"). | As built; question closed |
| 5 | One Set Menu per guest | As built: served × party size, deposit 30% × set price × guests |
| 12 | Longest dish | As built: one countdown per course ticket, the longest Prep SLA among its dishes, from the course start |
| 13 | Served courses only | A pre-ordered set is billed as the sum of its served courses, the set price split by the dishes' à la carte prices; unserved or cancelled courses are not billed. Mock and live backend must give the same total |
| 14 | Zone filter only | No shift filter in M5 |
| 15 | Keep the formulas above | As built |

## Resolved by the backend (20/11/2026)

The live backend now serves the routes that #10, #11 and #16 called "mock only": `GET /api/menu/tasting-menus` (public), `GET /api/reservations?search=…` (Waitstaff allowed) and `GET /api/orders/pass/history` (Expediter, Manager).
