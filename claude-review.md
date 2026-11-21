# Post-merge review of `main` and fixes (21/11/2026)

Prepared by Claude (orchestrator and reviewer) for the project lead. Gemini (Antigravity) wrote the code and Figma changes; Claude specified them and checked every result. This file covers the work from the request "find all unaddressed issues" after PR #1 (`feature/website`, live FE–BE) was merged into `main` at `a00711d`.

- **Branch to review:** `fix/post-merge-review`. It is based on `main` at `a00711d` and has 20 commits: code, tests, docs, and this review. It is not merged, and no PR was opened.
- **Handed to the lead:** a run on **SQL Server**, including the new migration's data step. See §6 and §7.
- **Figma:** page `Prototype` (`115:4`) was updated in place. The pages `Wireframe` and `Prototype - Khánh` were not touched.

## 1. What `main` looked like after the merge

There were no open GitHub issues and no review comments on PR #1, so the review was done by running everything and reading the merged code.

| Check on `main` (`a00711d`) | Result |
| :--- | :--- |
| Frontend lint (`npx oxlint`) | 0 warnings, 0 errors |
| Frontend unit tests (`npx vitest run`) | 68/68 |
| Frontend build (`npm run build`) | OK |
| End-to-end (`npx playwright test`, demo mode) | 46/46 |
| Backend (`dotnet test backend/Restaurant.sln`, .NET 9) | 79/79 |
| `npm audit --omit=dev` | 0 vulnerabilities |
| Every frontend API call has a backend route | yes (60 calls; alias routes `api/manager/*` → `api/admin/*`) |
| Live seed matches §10 tables, positions and the 4 Set Menus | yes |

### Issues found

| # | Issue | Where | Severity |
| :--- | :--- | :--- | :--- |
| 1 | In live mode, `/tra-cuu` shows a seated or finished booking as "Đã đặt" with a "Hủy đặt bàn này" button. The backend sets `Completed` at check-in, the frontend mapped `Completed` to `Reserved`, and the cancel then failed with "Khách đã nhận bàn…". | `OrderService.cs:149`, `services/api/index.ts`, `LookupReservationPage.tsx:277` | Bug (guest-facing) |
| 2 | Expired / refunded / forfeited / refund-rejected were worked out on the frontend by searching `cancelledReason` for Vietnamese phrases. Rewording a backend message would silently change the status shown. | `services/api/index.ts`, `RefundService.cs`, `ReservationService.cs` | Fragile |
| 3 | `Program.cs` read `Jwt:Secret` from `appsettings.json` first, and that file held a dev signing key, so `JWT_SECRET` never took effect (also against AGENTS.md "no hardcoded secrets"). Present since August. | `Program.cs:52`, `appsettings.json` | Security / config |
| 4 | `.env.development` switched to `VITE_USE_MOCK=false`, while the README and the demo guide still said demo mode was the default. `npm run dev` without the backend and SQL Server gave a broken site. | `frontend/.env.development` | Setup |
| 5 | About 300 lines translating backend responses (envelope unwrap, enum and status mapping, set prices) had no tests; every test ran in demo mode. | `services/api/index.ts`, `client.ts` | Test gap |
| 6 | Docs out of date: OPEN_QUESTIONS #10, #11 and #16 and the README called routes "mock only" that the backend now serves; `docs/api.md` lacked them; the ERD lacked `Tables.CheckoutRequestedAt` / `CurrentGuestCount`. | docs | Docs |
| 7 | The live seed added two guests who are not in §10 (PROTOTYPE_RULES §3 row 13). | `DatabaseSeeder.cs:290` | Demo data |
| 8 | The seeder only inserted missing rows, so a database seeded before 20/11 kept old table positions and prices. This is the same symptom as the owner's "I don't see the new set menus". | `DatabaseSeeder.cs` | Demo data |
| 9 | UI changes in the live FE–BE commit `364363f` were not in Figma (Quầy Pass, W1/W2, M1 thumbnails, M2 QR title, G4 invalid link). | Figma | Web ≠ Figma |
| 10 | New strings broke the copy rules (unslop): the "Cảnh báo:" prefix, an arrow in a link, and the "SĐT: … · Bàn … · 4 khách · 19:00" chain. | waitstaff pages | Copy |
| 11 | Two Word lock files (`~$…docx`) were committed, and `frontend/test-results/` was not ignored. | repo | Hygiene |
| 12 | Found while fixing open question #13 (§2): the live backend billed the **whole** set price as soon as one course was served. Demo mode billed only the served courses. | `InvoiceService.cs` | Bug (billing) |
| 13 | Found during the MariaDB live run (§5): the pre-ordered Set Menu was stored as text inside `Reservations.Note` and parsed back at check-in, although the ERD defines a `PreOrderedTastingMenuId` column. | `ReservationService.cs`, `TableService.cs` | Fragile / design drift |

## 2. Owner decisions (21/11/2026)

Recorded in `docs/prototype/OPEN_QUESTIONS.md` (commit `cd22961`).

| Open question | Decision |
| :--- | :--- |
| #3 Bill button on the E-Menu | No. As ADR 0004 describes, the guest asks the waiter, who sends it from the waitstaff app (W6). |
| #5 Pre-ordered set: per guest or per table | One per guest (served × party size; deposit 30% × price × guests). |
| #12 KDS countdown for a multi-dish course ticket | The longest dish's Prep SLA, from the course start. |
| #13 Set billing when courses were not served | Served courses only: the set price is split by the dishes' à la carte prices, and unserved or cancelled courses are not billed. Demo mode and the backend must give the same total. |
| #14 "Ca phục vụ" filter in M5 | Zone filter only; no shift filter. |
| #15 Occupancy and cancellation KPI formulas | Keep the current formulas. |
| Default mode for `npm run dev` | Demo mode; live mode via an untracked `frontend/.env.development.local`. |

PROTOTYPE_RULES §6 gains the booking status "Đã nhận bàn"; §5 M5 now says "zone filter".

## 3. Fixes on `fix/post-merge-review`

| Commit | Fix | What changed | Notes for review |
| :--- | :--- | :--- | :--- |
| `98fb406` | #1 | New frontend status `CheckedIn` ("Đã nhận bàn"): types, labels, badge, mock check-in, slot and table guards, `/tra-cuu` (badge, no cancel button). | Backend `Completed` → `CheckedIn`. |
| `eaffc63` | #2 | Backend `ReservationGuestStatus.From()` computes `guestStatus` on reservation DTOs; the reason texts and markers are constants in one file and every writer uses them; the frontend uses `guestStatus` and no longer reads `cancelledReason`. | **New API field `guestStatus`.** The status is still derived from the stored reason markers on the server; a persisted column would be the durable fix but needs an EF migration (not available on this machine). |
| `385735a` | #3 | Secret order: `JWT_SECRET` env → `Jwt:Secret` config → dev default only in Development; any other environment without a secret **stops at startup**. Key removed from `appsettings.json`; placeholder in `.env.example`; test factories set a test secret. | **Set `JWT_SECRET` on every non-Development host and in CI.** |
| `7de608f` | #4 | `VITE_USE_MOCK=true`; README and `CAU_TRUC_DU_AN_DEMO.md` explain `.env.development.local`. | |
| `af1c5f7` | #5 | Normalizers moved to `services/api/normalize.ts`; `normalize.test.ts` uses backend-shaped fixtures (envelope, 423 lock, all enum mappings, `guestStatus`, set prices). | |
| `d7d6697` | #12 / OQ #13 | New orders store allocated prices on set dish lines; preview and settlement bill served dishes only; the frontend uses the backend's prices (no equal split); rounding matches JS. Legacy rows with 0-price dishes fall back to `ResolveDishUnitPrices`. | Data model: the set header line keeps the set price, **so any sum over `OrderItems` must skip header lines (`MenuItemId == null`)**. B05 (§10): 7.200.000 / 360.000 / 756.000 / 8.316.000 / 6.156.000 ₫; Course 3 cancelled: 6.329.672 / … / 5.150.772 ₫, the same in demo mode and the backend. |
| `48d4ee5` | #7, #8 | Only Nguyễn Văn An is seeded; in **Development only**, the seeder resets demo rows (tables, menu items, set menus) to the seed values on startup and logs each change; it never deletes. | Manager edits to those rows in a dev database are reset on restart. |
| `1963f27` | #6 | `docs/api.md` gains the missing routes (public tasting menus, Waitstaff reservation search, pass history, feedback token validation, plus others found by comparing every `[Http*]` attribute); README section reworded; 3 ERD `.drawio` files gain the two `Tables` columns. | The `.docx` report and the Google Doc were **not** regenerated. |
| `a8e7251` | #10 | "Đoàn N khách, bàn B chỉ có C ghế."; "Tra cứu check-in"; the phone number on its own line (new `formatPhoneNumber`); "đã phục vụ." | |
| `76b26fa` | #11 | Lock files removed; `~$*`, `test-results/` and `playwright-report/` ignored. | |
| `4f87385` | follow-up of #12 | Best sellers skip set header lines, so a set no longer counts both as its own row and in its dishes; legacy prices resolved. 2 new tests. | Other `OrderItems` sums were checked and are already safe (listed in the commit). |
| `9eaf7f6` | follow-up of #1 | `/tra-cuu` note: "Bạn đã nhận bàn nên không thể hủy trực tuyến." | |
| `603c2bc` | #13 | New column `Reservations.PreOrderedTastingMenuId` (nullable FK → `TastingMenus`, `Restrict`, indexed), as the ERD already defines it. Migration `AddReservationPreOrderedTastingMenu` with a T-SQL data step that moves the set from each `Note` marker into the column (only when that set exists) and strips the marker; `Down` writes the marker back. A set used by bookings is deactivated instead of deleted. | **Schema change.** The data step is SQL Server-only and untested (see §6). |
| `1f9b7de` | #13 | Booking creation, check-in (`TryCreatePreOrderedSetMenuOrderAsync`), `MapToDetailDto`, refunds and the seeder use the column; `Note` holds only the guest's text; every marker parser was removed. | The API is unchanged (`preOrderedTastingMenuId` / `preOrderedTastingMenuName`). The frontend needed no change. |
| `803f331` | #13 | 5 new tests: column stored with the guest note kept exactly; a note that contains marker-like text has no effect; check-in builds the set order from the column; HTTP lookup returns the fields; a set used by a booking is deactivated, not deleted; the seeder restores the column in Development. | |
| `5a703d2` | #13 | Docs: `PreOrderedSetMenuId` → `PreOrderedTastingMenuId` in `SD_UC_U1_Reservation_Deposit.puml`, `SD_UC_E6_1_CheckIn_Reservation.puml` and OPEN_QUESTIONS #5. The ERD and class diagram already had the column. | The two sequence-diagram **PNGs were not re-rendered** (PlantUML isn't installed here). |

Issue **#13**, found during the MariaDB live run (§5): the pre-ordered Set Menu was stored as text inside `Reservations.Note` (`[Set Menu đặt trước: <name> (<id>)]`) and parsed back at check-in. The ERD defines a `PreOrderedTastingMenuId` column, but the code never had one. This is the same free-text pattern as #2.

### Verification on the branch head (`5a703d2`)

| Command | Result |
| :--- | :--- |
| `cd frontend && npx oxlint` | 0 warnings, 0 errors |
| `cd frontend && npx vitest run` | 78/78 (was 68) |
| `cd frontend && npm run build` | OK |
| `cd frontend && npx playwright test` | 46/46 (demo mode; run at `9eaf7f6`, the frontend has not changed since) |
| `cd backend && dotnet test Restaurant.sln` (.NET 9) | 97/97 (was 79) |
| `dotnet ef migrations list` | `…SyncLiveFeBeSchema`, then `20261121131037_AddReservationPreOrderedTastingMenu` |
| No AI attribution in commit messages | confirmed |

## 4. Figma

### The Figma tooling was lost and rebuilt
On 19/11/2026 at about 23:40, an Antigravity config migration deleted `~/.gemini/tools/cursor-talk-to-figma-mcp`, which held the "VinDining MCP (Local)" plugin, the relay and every Figma script. Figma showed "Plugin missing".
- Gemini rebuilt it at `/home/life/tools/cursor-talk-to-figma-mcp` (its own local git repo, no remote), and the old path is now a symlink to it.
- Sources: the public `grab/cursor-talk-to-figma-mcp`, Claude's past edits to those files extracted from its session logs, and Gemini's own logs. The plugin id and name are the same as before.
- Claude checked it against the real file: it reproduced the last known results (288 screens, 0 issues; dark 96/96 and light 96/96 reachable).

### Changes on page `Prototype`
- **Overlaps fixed (owner request).** There were 36 conflicts, for example G1.1 running into G2.2, G1.2s into G2.4, G3.1 into a row title, and frame name labels hitting row titles. The bands moved from ±24000 to **±30000** (wire = dark − 30000, light = dark + 30000), and the rows were re-spaced the same way in all three bands. A new `scripts/overlaps.ts` and `LAYOUT.md` are in the tooling repo.
- **Figma now matches the website:**
  - Quầy Pass (E1, E1r, E1b, E1c, E2): filter on both tabs, ticket count badge, and the multi-dish B03 ticket with "Đi món này" / "Xác nhận đi cả lượt";
  - W1 "Tra cứu check-in" link;
  - W2 result card;
  - M1 / M1s photos;
  - "Lối đi" rotated on the phone floor plans (G1.2, G1.1x).
- **New frames:** `G2.5` / `G2.5.D` "Đã nhận bàn" and `G4.1x` / `G4.1x.D` "Liên kết không hợp lệ", each reached through a "Demo:" chip.
- **Staff page titles now match the website.** Subtitles the website does not show were removed from M2, M1s, M3d, M3a, M3r, C3b and C4, and titles were given the website's wording on M1a, M1ax, M1s, M3d, M3a, M3r, M4p, C1b, C2x, C3, C3b, C4, W5b, W5f and S1y.
- **Final checks, run by Claude after the last change:**

  | Check | Result |
  | :--- | :--- |
  | Reachable, dark (`MIN_Y=24000 MAX_Y=54000 bun scripts/reach.ts qzguwelv 115:4 '^(G\|S\|W\|E\|K\|C\|M)\d'`) | 100/100 |
  | Reachable, light (`MIN_Y=54000 …`) | 100/100 |
  | Checker (`bun scripts/check-frames.ts qzguwelv '^(G\|S\|W\|E\|K\|C\|M)\d'`) | 300 frames, 0 issues |
  | Overlaps (`bun scripts/overlaps.ts qzguwelv 115:4`) | 0 conflicts |
  | Dark frames whose light copy has different text | 0 of 100 |
  | Links, dark vs light | 476 vs 476, 0 bad |

  The `DANGLING` lines reach prints for G0, G0.D, G1.2 and G1.2.D are `SCROLL_TO` links within the same frame, and are expected.
- **Process note:** during the subtitle fix, the first Gemini session resent an old report without making the change. A fresh session did it, and the first session turned out to have edited the same frames at the same time. The twin-text and overlap checks above show nothing was duplicated or left out of date.

## 5. Live run on MariaDB (21/11/2026)

There is no SQL Server on the review machine, so the branch was run against **MariaDB 11.8** in a **throwaway copy that is not committed**. That copy changes 3 lines:
- the Pomelo MySQL provider replaces `UseSqlServer`;
- `EnsureCreated` replaces `Migrate`, because the migrations are SQL Server-only.

The backend ran in Development on `:5159`, and the website ran in live mode (`VITE_USE_MOCK=false`) on `:5173`. The whole run was done twice: at `9426e67`, and again on a fresh database at `5a703d2` after the issue #13 column fix. Both runs gave the same results. On the second run:
- the website booking stored Set Menu Thượng Hạng in `PreOrderedTastingMenuId` and left `Note` empty;
- the seeded VD-7K3Q has the set in the column and only "Bàn gần cửa sổ nếu có thể" in `Note`;
- check-in built the set order from the column.

| Step | How | Result |
| :--- | :--- | :--- |
| Schema and seed | backend start | 20 tables created; §10 tables with the 4 × 2 Sảnh chính positions, 4 Set Menus at §10 prices, only Nguyễn Văn An as a guest |
| Book Set Menu Thượng Hạng × 4 at B06 | website (Playwright) | the home page lists 4 sets from the API; the set step shows 7.200.000 ₫ and a 2.160.000 ₫ deposit; the hold screen shows 2.160.000 ₫; the VNPAY sandbox confirms; "Đặt bàn thành công" |
| Check in at B06 | API as `mai.tt` | the set order is created automatically; `guestStatus` = `CheckedIn` |
| `/tra-cuu` after check-in | website | "Đã nhận bàn", no cancel button, "Bạn đã nhận bàn nên không thể hủy trực tuyến." |
| Fire and serve Courses 1–3 | API as `mai.tt` / `quan.lm` | OK |
| Bill (all served) | API as `ha.pt` | 7.200.000 / 360.000 / 756.000 / **8.316.000 ₫**, deposit −2.160.000 → **6.156.000 ₫** (exactly §10); dish lines at 346.155 / 1.236.263 / 217.582 ₫ per guest; settled in cash |
| Second booking with Course 3 cancelled (C03) | API | **6.329.672 / 316.484 / 664.616 / 7.310.772 ₫ → 5.150.772 ₫**, the same as demo mode (owner decision OQ #13) |
| Cashier bill screen for C03 | website as `ha.pt` | shows the same five amounts |
| Best sellers (today) | API as `long.dh` | dish rows only, no Set Menu row |
| Paid booking, then cancel ≥ 4 h ahead | API + website | "Đã đặt" with the cancel button; after cancelling, "Đã hủy · đã hoàn cọc"; the deposit is `Refunded` with 750.000 ₫ (30% × 1.250.000 × 2) |
| Browser console / HTTP errors during the UI steps | Playwright | none |

## 6. Not verified, and known gaps
- **SQL Server is handed to the lead (owner's decision).** The live runs used MariaDB with `EnsureCreated`, so nothing has run the migrations on SQL Server yet. That covers `SyncLiveFeBeSchema` and the new `AddReservationPreOrderedTastingMenu`, including its T-SQL data step and `Down`. Steps are in §7.
- **`guestStatus` still comes from reason markers.** It is derived from the cancellation-reason markers, now constants in one place; there is no status column for it. A follow-up migration could add one, like issue #13 did for the set.
- **Two sequence-diagram PNGs are out of date.** `docs/Diagram/puml/sequences/SD_UC_U1_Reservation_Deposit.png` and `SD_UC_E6_1_CheckIn_Reservation.png` still show `PreOrderedSetMenuId`; their `.puml` files are fixed. Re-render them with PlantUML.
- **Best sellers on the backend count only paid orders;** demo mode also counts dishes already served on open tables. This was already the case before this branch and was left as is.
- **Not in Figma, because no frame shows these states:** the M2 QR modal (no such frame) and the check-in capacity warning (the §10 story never exceeds capacity).
- **The Figma tooling is local only.** `/home/life/tools/cursor-talk-to-figma-mcp` has no remote. Pushing it somewhere private would protect it from another loss. The relay channel changes whenever the plugin reconnects (it is now `qzguwelv`).
- **Not touched:** the `.docx` report and the Google Doc (API list, ERD and the OQ #13 billing rule), and the Jira statuses (20 of 21 backend tasks are still not Done although the code is complete; see `docs/jira-backend-local-list.md`).

## 7. How to review
```bash
git fetch origin && git checkout fix/post-merge-review
cd frontend && npm ci && npx oxlint && npx vitest run && npm run build && npx playwright test
cd ../backend && dotnet test Restaurant.sln
```

**On SQL Server (not done here):**
1. **Migrate an old database.** Take a database created by `main` (`a00711d`), so its set bookings still carry the `Note` marker; for example, run `main`'s backend once on an empty database and make one booking with a set. Then start this branch's backend, which applies `AddReservationPreOrderedTastingMenu`. Check:
   ```sql
   SELECT BookingCode, PreOrderedTastingMenuId, Note FROM Reservations;
   ```
   Every set booking should have the column filled and no `[Set Menu đặt trước: …]` left in `Note`; VD-7K3Q should keep "Bàn gần cửa sổ nếu có thể".
2. **Test `Down`.** Run `dotnet ef database update SyncLiveFeBeSchema`; the markers should come back. Then update to the latest migration again.
3. **Run the live flow from §5** on SQL Server: book a set, check in, bill, look it up on `/tra-cuu`, and cancel a booking with a refund.
Read first: `backend/src/API/Data/Migrations/20261121131037_AddReservationPreOrderedTastingMenu.cs`, `backend/src/API/Services/ReservationGuestStatus.cs`, `InvoiceService.cs` (`ResolveDishUnitPrices`, `CalculateBillableSubtotal`, `SettleInvoiceAsync`), `JwtTokenService.cs` (`ResolveSecret`), `Data/DatabaseSeeder.cs` (Development sync), `frontend/src/services/api/normalize.ts`, and `frontend/src/pages/guest/LookupReservationPage.tsx`.
