# VinDining Prototype — Rules for AI Agents

Applies to every agent building the Figma prototype (Gemini, Claude, others). Read fully before creating any node.

## 1. No fabrication (hard rule)

- Only design features, screens, fields, buttons, statuses, roles, and rules that are written in the source-of-truth docs (section 2).
- If something is not in the docs, **do not add it**. Leave the area out and write the question in `docs/prototype/OPEN_QUESTIONS.md` instead.
- Do not "improve" the product with industry-standard extras (loyalty points, allergy tags, tips, split bill, chat, inventory, etc.) unless a doc names them.
- Business numbers must come from the docs: 17-minute hold (15 + 2 grace), 4-hour cancellation cutoff, 5% service charge, 10% VAT on (Subtotal + service), `MAX(0, Total − Deposit)`, Course Firing at 60–70%, SLA warning at 80%, login lock after 5 failed tries for 15 minutes, deposit 30% × set price × guests or 500.000 ₫ × guests (BR-06).
- Demo content (dish names, prices, table numbers, guest names, deposit amount) may be invented **only as sample values** inside fields that the docs define. Sample data must never introduce a new field or feature.
- When two docs disagree, follow the higher-priority doc and note the conflict in `OPEN_QUESTIONS.md`. Never blend both versions.

## 2. Source of truth (highest first)

1. `docs/Diagram/BAO_CAO_PHAN_TICH_HE_THONG.md` — newest analysis report (actors, RBAC, 21 use cases, BR-01…BR-05).
2. `docs/adr/0004-retire-table-display-and-adopt-leather-folder-cashier-printing.md`
3. `CONTEXT.md` — ubiquitous language (but its allergy mentions are overridden by section 3).
4. `docs/use-cases/*.md` — extra detail only where it does not conflict with 1–3 or section 3.
5. Everything else (`01_PROJECT_PROPOSAL.md`, `02_BAO_CAO_KHAO_SAT.md`, `04_PROJECT_TECH.md`, README, backend code, `.agents/AGENTS.md` product description) is **stale** for prototype purposes.

## 3. Banned list (never design these)

Explicitly excluded by the project owner — these override any doc that mentions them:

| # | Banned | Notes |
| :--- | :--- | :--- |
| 1 | **Drinks bar** | No Bar station, no bar KDS, no bartender role, no bar ticket queue. Drinks exist only as ordinary menu items ordered by Waitstaff. |
| 2 | **Allergy anything** | No allergy tags, allergen fields, allergy alerts, allergy priority labels, allergy checks at the Pass, or allergy info on E-Menu. Order notes are plain free-text "Ghi chú" only. |

Excluded by the docs themselves (stale ideas that keep reappearing):

| # | Banned | Source |
| :--- | :--- | :--- |
| 3 | TableDisplay / any screen fixed at the dining table | ADR 0004 |
| 4 | Guest self-ordering from QR E-Menu (E-Menu is view-only + service requests) | Report UC-U2, ADR 0004 |
| 5 | Kitchen staff changing data on the KDS (status, Served, Remake, notes). The only controls kitchen staff may use are the page buttons (‹ Trang trước / Trang sau ›), decided by the owner on 29/10/2026 | CONTEXT.md, ADR 0003, owner |
| 6 | Kitchen paper printers (only the cashier's 80mm printer exists) | ADR 0004 |
| 7 | Guest accounts / guest login / sign-up | README "Zero Onboarding" |

Caught in review (hallucinations that actually happened — never repeat):

| # | Banned | Caught in |
| :--- | :--- | :--- |
| 8 | Spec / document codes on screen: "BR-02", "UC-U3", "ADR 0004", etc. | G2.2, C2, C2x |
| 9 | Bank names, account numbers ("STK"), or any payment-receiving details | C2p |
| 10 | Brand names for menu items (San Pellegrino, Evian, …) or for the restaurant ("VinDining Fine Dining") | C2, C2x, C2p |
| 11 | Shifts and shift labels ("Ca tối", "Đang trực ca", "Thu ngân chính", shift hours) | W1, G1.1, C1–C4, S1.C |
| 12 | Processing times not in the docs ("hoàn trong 1–3 ngày làm việc") | G2.4 |
| 13 | People not in §10 (e.g. "Lê Văn Hoàng") — reuse §10 staff names | C1, C2x |
| 14 | Changing §10 prices or dropping items so totals "work out" — line items must be the §10 order, and totals follow from them | C2, C2p |
| 15 | Status badges outside §6 ("Đang chọn", "Sẵn sàng", "Cảnh báo SLA", "Quá hạn") | G1.2, E1, K1 |
| 16 | **Emoji** anywhere in UI text or as icons (🍳 🔥 ⏱ ⚠️ ✅ 📋 🔔 …). Plain marks are fine: → ← ‹ ↗ ✓ ✕ • ● ★ ▾ | K1, E1, W1–W9, C1–C4, M1–M5 |
| 17 | Kitchen actions the system cannot know: "Bếp nhận lệnh", "Đã chế biến", "Bếp xác nhận". The kitchen never touches the system; it talks to the Điều phối, who updates it at the Pass | E1, E1b, E1c |
| 18 | Dramatic or chatty staff copy: "khẩn cấp", "ƯU TIÊN SỐ 1", "vừa kích hoạt", explanations in brackets. See §7 tone | K1, E1 |

> Add new rows here whenever a hallucination is caught in review. Each row: what was banned and why. The checker (`check-frames.ts`) scans for rows 1–2, 8–13 and 16–18 automatically.

## 4. Actors & devices (from the report)

| Actor | Device | Frame size to use |
| :--- | :--- | :--- |
| Khách hàng (Guest) | Website on phone **and** desktop (E-Menu: phone only, it is opened by QR at the table) | 390 × 844 and 1440 × 900 |
| Nhân viên Phục vụ (Waitstaff) | Smartphone, mobile web | 390 × 844 |
| Nhân viên Điều phối (Expediter) | Tablet at the Pass | 1194 × 834 (landscape) |
| Nhân viên Thu ngân (Cashier) | Desktop Web POS at the counter | 1440 × 900 |
| Quản lý (Manager) | Laptop / PC | 1440 × 900 |
| KDS Bếp (display, not an actor) | Wall screen, hands-free | 1920 × 1080 |

## 5. Screen inventory (only these)

**Guest (website: every screen in a mobile 390 and a desktop 1440 version, except G3)**
- G0 Trang chủ (website home, the guest entry point): an editorial, photo-led page meant to make people want to book (see task 12 for the section list). Header (VinDining wordmark; nav: Set Menu · Không gian · Thực đơn · Tra cứu đặt bàn; gold pill "Đặt bàn"), full-bleed hero photo, **Set Menu first** (one large photo card per §10 set), the 3-step booking explainer, the three zones, the à la carte menu with dish photos, a closing booking call-to-action, and a footer with only "© VinDining" plus nav links. Images come from `docs/prototype/images/` (AI-generated, see CREDITS.md). No address, hotline, opening hours, chef names, awards, "chuẩn sao" or landmark claims (not in the docs).
- G1 Đặt bàn & cọc (UC-U1): choose date, time, party size, zone (Sảnh chính / VIP / Ban công) → floor plan with available tables → **Chọn Set Menu đặt trước (tùy chọn)**: the §10 sets as cards + option "Gọi món tại nhà hàng"; picking a set shows "× 4 khách" and the set total, with the note that the meal is paid after dining and the deposit is deducted → contact info (main button "Giữ chỗ & đặt cọc") → 17-minute hold countdown (summary includes the chosen set) with the VNPAY deposit payment on the same step: tiles "Quét mã VietQR" / "Thẻ ngân hàng"; the VietQR tab shows the QR code (scanning it opens the VNPAY page), beneficiary, amount, transfer content and "Đã chuyển khoản xong"; the card tab shows the amount and "Thanh toán thẻ ngay"; "Hủy giao dịch" releases the hold and returns to the table step → confirmation with reservation code and the pre-ordered set. Error states: no tables (suggest other time/zone), hold expired. Coming from a G0 set card, that set is pre-selected.
  - Design (owner feedback 19/11/2026, round 2 replaces round 1 where they differ):
    - **Background**: one restaurant photo (`hero_desktop.jpg`, `hero_mobile.jpg` on phone), dimmed in dark and washed out in light, fixed to the screen. It is the same photo on every step and never changes size, zoom or position when the step or the content height changes. Choosing a Set Menu no longer changes the background.
    - **Progress line** at the top: a thin track with step dots that fills up to the current step (labels under the dots on desktop; "Bước 2/6 · Chọn bàn" over a thin bar on phone). No numbered boxes.
    - **Layout**: desktop has two columns, the current step on the left and, on the right, the **"Tóm tắt đặt bàn"** card with the **navigation directly below it** (Quay lại + the step's main button; step 1 has no Quay lại, so its main button spans the full width; the hold step has only a full-width danger button "Hủy giao dịch"). Phone: step, then summary, then navigation. Steps carry no back/next buttons of their own.
    - **Summary card**: a fixed-size photo at its top (16:9, no text on it): the chosen zone's photo, replaced by the chosen set's photo once a Set Menu is picked (short crossfade). Its rows are always present ("Chưa chọn" when empty), so the card never changes height.
    - **No movement**: choosing a date, time, party size, zone, table or set changes colours and text only. Nothing moves, resizes or reflows. Step changes do not slide.
    - **G1.1 Chọn thời gian & khu vực**: a label column and a control column, one row each:
      - Ngày: the next 7 days as tiles (weekday, day, month; "Hôm nay" / "Ngày mai" on the first two), plus a "Ngày khác" tile that opens a date picker.
      - Giờ: the 5 slots (18:00 to 20:00) as tiles showing how many fitting tables are free for that date and party size; a slot with none is disabled ("Hết bàn").
      - Số khách: chips 1 to 10.
      - Khu vực: three photo cards (zone photos) with the number of fitting free tables at the chosen time; a zone with none is disabled.
    - **G1.2 Chọn bàn**: the real floor plan of the zone.
      - A zone switch sits above the plan.
      - The room outline shows its landmarks:
        - Sảnh chính: "Cửa sổ" wall at the top, "Lối đi" between the two rows, "Lối vào" at the bottom left;
        - VIP: "Lối vào";
        - Ban công: "Lan can" at the top, "Lối vào".
      - Tables sit at their `PosX/PosY` positions (Sảnh chính is 4 × 2: B01–B04 along the window, B05–B08 across the aisle, like M2), with one chair per seat, the table number and "N ghế".
      - States:
        - free and big enough: selectable, green chairs;
        - selected: gold border and chairs;
        - "Đã có người đặt" / "Không đủ chỗ": dimmed, not selectable.
      - Legend under the plan.
      - The whole room fits on screen without scrolling (1440 × 900 and 390 × 844). On phone the plan turns to portrait (rotated with its landmarks) when that makes the tables bigger.
    - Set cards are symmetric: equal height, names on one line, price under the name, totals aligned on one baseline.
- G2 Tra cứu & hủy đặt bàn (UC-U3): reservation code + phone → details (incl. pre-ordered set) + refund policy → reason → confirm. ≥4h: 100% refund via VNPAY. <4h: warning that deposit is not refunded. Same fixed restaurant-photo background as G1 (owner feedback round 2), the form and details on a card.
- G3 QR E-Menu (UC-U2, phone only): view-only menu, **Set Menu section first**, then à la carte by course + 3 service buttons: Gọi phục vụ, Châm nước, Đổi dụng cụ. Error: invalid QR / table not checked in. Reached by scanning the table QR, not from G0.
- G4 Đánh giá (UC-U4): opened from the QR on the invoice or the link in the thank-you email/SMS. Star rating for món ăn, không gian, thái độ phục vụ + comment → thank-you.

**Staff — shared**
- S1 Đăng nhập (UC-E5): **one login page for all staff**. Username + password → the system sends each role to its own workspace: Phục vụ → W1, Điều phối → E1, Thu ngân → C1, Quản lý → M1. Error and 15-minute lock states. In the prototype the role choice is made with `Demo:` chips (one per §10 staff member) because Figma cannot read the typed username. Every workspace's Đăng xuất goes back to S1. KDS has no login (wall display).

**Waitstaff (mobile)**
- W1 Sơ đồ bàn / table list with statuses.
- W2 Check-in (UC-E6): reservation lookup by code/phone; walk-in check-in on an Available table. For a booking with a pre-ordered set, check-in shows "Set Menu đặt trước: … × 4 — Course 1 đã tự động gửi bếp": the Order and Courses are created automatically, no ordering needed. If the waiter checks a booking into a table with fewer seats than the party (e.g. VD-7K3Q, 4 khách, at B01 with 2 ghế), the check-in sheet shows the line "Đoàn 4 khách, bàn B01 chỉ có 2 ghế." in the warning colour; the backend refuses that check-in.
- W3 Tạo Order (UC-E1) — for walk-ins / guests without a pre-order (demo table B03): **Set Menu tab first**, then món lẻ grouped by Course (Khai vị, Món chính, Tráng miệng), free-text note, Gửi đơn. Out-of-stock items locked.
- W4 Cập nhật Order (UC-E2): add items/drinks, Course Firing button (Priority toggle allowed per `docs/use-cases/UC-E2`). Locked when table is PaymentPending.
- W5 Đổi bàn (UC-E5): pick an Available target table of fitting capacity.
- W6 Yêu cầu tính tiền (UC-E4): sends table to PaymentPending; error if nothing served yet.
- W7 Notifications: guest service requests (with "done" action) and "dish ready at Pass".

**Expediter (tablet)**
- E1 Quầy Pass (UC-E3): dishes per table/course, Xác nhận đi món (Served), Yêu cầu làm lại (Remake), SLA colour warning.
- E2 Lịch sử ra món (owner feedback 19/11/2026): today's dishes that went out, newest first, per table and course: items × quantity, time served, who confirmed it, and "Làm lại" with the count when a dish was remade. Filter by table. Reached from a tab on E1.

**KDS Bếp (wall screen, no buttons)**
- K1 Tickets by table/course in three lanes (Làm lại · Đang nấu · Chờ), every ticket the same size, most urgent first; Prep SLA countdown, 80%/overdue colour. When the board is full, a page bar at the bottom shows `Trang 1 / N` with two large touch buttons (‹ Trang trước / Trang sau ›; large because hands may be wet or gloved, so no swipe gestures). Each lane header shows its total and how many tickets are on later pages. The Làm lại lane is repeated on every page. K1p / K1p2 show a full kitchen on pages 1 and 2 (reached by a `Demo:` chip on K1).

**Cashier (desktop)**
- C1 Payment queue: tables in PaymentPending with alert.
- C2 Tạm tính: Subtotal, Phí phục vụ 5%, VAT 10%, Tổng cộng, − Tiền cọc, Còn phải trả = MAX(0, …); In phiếu tạm tính (80mm slip with VietQR).
- C3 Xác nhận thanh toán: method Tiền mặt / Thẻ / VietQR → official invoice print → table to Cleaning.
- C4 Check-in (cashier may also check guests in, UC-E6).

**Manager (desktop)**
- M1 Thực đơn (UC-A1): items (name, description, price, category, Prep SLA, Còn món / Tạm hết) and Set Menu (TastingMenu) create/edit/delete.
- M2 Sơ đồ bàn (UC-A2): add/remove/drag tables, seats, zones, auto QR per table (the table panel's "Xem / In mã QR" opens "Mã QR thực đơn · Bàn {n}": the printable QR card and "In mã QR"); block deleting occupied/reserved tables.
- M3 Hoàn cọc ngoại lệ (UC-A3, BR-04): cancellations are decided automatically (≥ 4 h before: 100% refund; < 4 h or no-show: deposit kept) and never need approval. This screen lists **only forfeited deposits** that the Manager may refund as an exception (force majeure): details, approve with reason / reject with reason, and a "Đã xử lý" list of past exception decisions. Never list automatic refunds or ask to approve a cancellation. The page explains the automatic policy in one line.
- M4 Tài khoản (UC-A4): create (họ tên, email, chức vụ: Phục vụ, Điều phối, Thu ngân, Quản lý), edit, reset password, lock/unlock.
- M5 Báo cáo (UC-A5): period (ngày/tuần/tháng/quý), zone filter (no shift filter, OPEN_QUESTIONS #14), revenue, guest count, occupancy rate, best sellers, cancellation rate, export Excel/PDF, empty state.

## 6. Statuses (use exactly these)

- Table: Available (Trống), Locked (Đang giữ chỗ), Reserved (Đã đặt), Occupied (Đang phục vụ), PaymentPending (Chờ thanh toán), Cleaning (Đang dọn).
- Order item: On Hold (Chờ), Cooking (Đang nấu), Served (Đã ra món), Remake (Làm lại).
- Reservation: Chờ thanh toán cọc, Reserved, Đã nhận bàn (the guests are seated: shown from check-in on, never cancellable online), Đã hủy, Hết hạn (Expired_Cancelled).

## 7. Visual style

- Dark Gold Luxury (default for guests and staff), taken from `frontend/src/index.css`:
  - Backgrounds: `#0b0c10` (bg), `#12131a` (surface), `#181a24` (card), `#1f2230` (card hover); borders `#282b3d` / `#393d56`.
  - Gold: 300 `#dfc372`, 400 `#d4a946`, 500 `#c68e27` (primary), 600 `#aa701e`.
  - Text: `#f3f4f6`.
- Light mode depends on the audience (owner decision 19/11/2026): **guest screens (G0–G4) use white + gold**, **staff screens (S1, W, E, C, M, K) use white + blue**. Never use blue on a guest screen.
  - White-gold (guest): bg `#faf8f4`, surface / card `#ffffff`, card hover `#f6f0e4`, borders `#ece3d1` / `#dccdb0`, text `#1c1a17`, muted text `#5f574a`, accent text `#8a6a1f`, gold-400 `#a8801f`, primary `#c68e27` (text on primary `#1c1a17`), primary hover `#aa701e`. Photos: the light set in `docs/prototype/images/light/`.
  - White-blue (staff): bg `#f4f7fb`, surface / card `#ffffff`, card hover `#eaf1fb`, borders `#dbe4f0` / `#c2d0e3`, text `#0f1e33`, accent text `#1d4f9c`, accent-400 `#2b62b8`, primary `#1f5fbf` (white text), primary hover `#174a96`.
- Symmetry: cards in one row have equal height; titles that may wrap are clamped to the same number of lines so prices, badges and buttons line up across the row.
- Staff desktop sidebars are as tall as the screen (viewport), never as tall as the page: the staff name and Đăng xuất stay visible at the bottom while the content scrolls.
- UI copy in Vietnamese, using the report's terms.
- **Tone: plain, neutral, informative.** Show status and numbers, not commentary: `Đang làm lại · 18:00 / 20:00`, not `Làm lại khẩn cấp · Đã chế biến 18:00 / Định mức 20:00`. No emoji (§3 row 16).
- **Copy follows the unslop-ui rules U1 to U16** (`~/.claude/skills/unslop-ui/SKILL.md`, owner request 19/11/2026):
  - no eyebrow labels over headings;
  - no subtitle under a heading unless it adds a fact;
  - no captions that explain what the screen visibly does ("Chọn bàn trên sơ đồ…", "dùng phím mũi tên…");
  - no design notes in UI text;
  - no decorative badges or icons;
  - no em dash in UI sentences (use a comma or a new sentence; "—" for an empty value is fine);
  - headings and card titles of 5 words or fewer;
  - sentence case.
  
  Keep what a person needs to act: labels, values, prices, errors, policy lines that state a rule.
- Never delete or rename existing Figma nodes you did not create in the current task.

## 8. Working protocol in Figma

- Join the channel the user gives, then `get_document_info` before any change and confirm the current page is `Wireframe v2`.
- Build one task at a time; stop and report when the task ends. A reviewer checks every task before the next prompt.
- Name every frame `<ID> — <Screen name>` (e.g. `G1.1 — Chọn thời gian`).
- End each task with a short report: frames created (IDs + node IDs), anything skipped, and any new entries for `OPEN_QUESTIONS.md`.

## 9. Prototype structure — page `Prototype` (formerly `Wireframe v2`)

- Figma file pages (Starter plan = max 3 pages, all used): `Wireframe` (138:30) and `Prototype - Khánh` (0:1) belong to a teammate — **never touch**. Ours is `Prototype` (115:4).
- On `Prototype` (115:4), top to bottom (since 04/11/2026): heading `Wireframe (Low-fi)` and the **low-fi wireframe** at y 0–21320; heading `Prototype · Tối (Dark mode)` and the **dark clickable prototype** at y 24000–45320; heading `Prototype · Sáng (Light mode)` and the **light copy** at y ≥ 47800 (white-gold for guest rows, white-blue for staff rows; flows named `… · Sáng`, dark flows `… · Tối`). Older description, offsets now differ: the wireframe is an exact greyscale copy generated by `scripts/build-variant.ts` (wire mode: no links, no Demo chips, photos shown as grey "Ảnh minh họa" boxes) plus a cover board and one yellow note per row from `wireframe_notes.json` (`scripts/finish-wireframe.ts`). Never edit the wireframe layout by hand: change the prototype, then regenerate the changed screens only (delete their wire copies, then `SRC_IDS=<ids> bun build-variant.ts <ch> wire 115:4 115:4 0 24000`; reset the flows to the 7 afterwards). Text-only fixes may be applied to both copies by script. Flow starting points stay on the 7 dark screens only. The older light copy / wireframe on `Prototype - Khánh` is stale — do not touch it.
- Old rule kept for reference: never edit the archived old wireframe frames — it is old, kept for reference, and contains banned/undocumented features (Wine Cellar, Culinary Passport, Private Dining, table-bound invoice tablet, KDS stations, merging tables, a host role). Do not copy anything from it.
- It must work as a clickable prototype: pressing **Present** in Figma lists these flow starting points, and every screen is reachable by clicking from its flow start.

| # | Flow starting point name | Device | Starts at |
| :--- | :--- | :--- | :--- |
| 1 | Khách · Website (điện thoại) | Mobile | G0 mobile → G1 / G2 mobile |
| 2 | Khách · Website (máy tính) | Desktop | G0 desktop → G1 / G2 desktop |
| 3 | Khách · Quét QR tại bàn | Mobile | G3 E-Menu |
| 4 | Khách · Đánh giá (điện thoại) | Mobile | G4 mobile (link/QR after paying) |
| 5 | Khách · Đánh giá (máy tính) | Desktop | G4 desktop (email link) |
| 6 | Nhân viên · Đăng nhập | Desktop | S1 → W / E / C / M by role |
| 7 | KDS Bếp | Wall screen | K1 |

- Waitstaff, Expediter, Cashier and Manager screens are no longer flow starts: they are reached only through S1.

- Layout: one Figma Section per flow, stacked vertically in the order above, frames left-to-right in click order, 120px gaps. Foundations sit above flow 1.
- Links: buttons/cards → `add_reaction` (NAVIGATE). Modals/popups → OVERLAY, closed with CLOSE. Every non-start screen needs a way back (back arrow → BACK, or a nav item → NAVIGATE). Links only work between top-level frames on the same page.
- Alternate and error states (hold expired, login locked, invalid QR, etc.) are separate frames reached through a **prototype-only chip**: dashed gold outline, caption text starting with `Demo:` (e.g. `Demo: Hết thời gian giữ chỗ`), placed in the frame's top-right corner. Chips are not product UI and must never look like real buttons.
### Tooling (Figma Desktop + local plugin "VinDining MCP (Local)")

- **Everything goes through the `figma` MCP**: build layers, then link them with `add_reaction`, and set entry points with `set_flow_starting_points`. Use `set_current_page` to switch to `Wireframe v2` (id `115:4`) first; `get_document_info` must then report `name: Wireframe v2`.
- If your MCP tool list lacks `list_pages`, `set_current_page`, `add_reaction`, `clear_reactions`, `set_flow_starting_points` or `get_flow_starting_points`, call them through the CLI:
  `bun /home/life/.gemini/tools/cursor-talk-to-figma-mcp/scripts/figma-cmd.ts <channel> <command> '<json params>'`
  Example: `... <channel> add_reaction '{"nodeId":"12:3","destinationId":"12:9","transition":"DISSOLVE"}'`
- `add_reaction` params: `nodeId`, `action` (NAVIGATE default, OVERLAY, SWAP, BACK, CLOSE), `destinationId` (not for BACK/CLOSE), `transition` (INSTANT default, DISSOLVE, SMART_ANIMATE, PUSH, SLIDE_IN, …), `direction`, `replace`.
- Make each clickable element its own named frame (e.g. `btn/Tiếp tục`) and link that frame — never a text layer inside it.
- **Verify** links with `get_reactions` on each frame: every expected link must show the right `destinationId`, and every flow start must appear in `get_flow_starting_points`.
- **Chrome DevTools** is for final checking only: open the file's prototype in the browser (`https://www.figma.com/proto/oWOe2jIjC3DLw9dygrfneG/VinDining?node-id=<start id with "-">`), click through each flow you built, screenshot each step, report dead ends. If the browser is not signed in, skip and say so. Never edit the design through the browser.
- Do not touch page `Wireframe` or anything outside `Wireframe v2`.

## 9b. Timeouts — never wait on a stuck tool

- **Every shell command** gets a hard limit: prefix it with `timeout 120` (checker: `timeout 300`). Example: `timeout 120 bun …/figma-cmd.ts <channel> get_node_info '{"nodeId":"1:2"}'`.
- **Every MCP / plugin call**: if it has not returned after **90 seconds**, treat it as failed — do not keep waiting. Retry it **once** through the CLI with `timeout 120`. If that also fails, skip that step, note it under SKIPPED / PROBLEMS, and continue with the next step.
- Before a long step (exports, checker, many links), write one line to `<response folder>/progress.md` with the time and what you are starting, so the reviewer can see where you are if you stall.
- Never block on interactive prompts, browser sign-in pages, or a command that waits for input — skip and report.
- If the Figma channel stops answering (two timeouts in a row), stop, write what is done so far to response.md, set status completed, and say the plugin needs reconnecting.

## 10. Shared sample data (use these exact values in every task)

Demo values only — they illustrate fields the docs define, they are not business rules.

- Restaurant "VinDining". Date "Thứ Sáu, 06/11/2026". Times 18:00, 18:30, 19:00, 19:30, 20:00.
- Guest "Nguyễn Văn An", "0901 234 567", "an.nguyen@email.com", 4 khách, 19:00, table **B05** (4 ghế, Sảnh chính), code **VD-7K3Q**, deposit **2.160.000 ₫** (30% of Set Menu Thượng Hạng × 4).
- Staff: Phục vụ "Trần Thị Mai"; Điều phối "Lê Minh Quân"; Thu ngân "Phạm Thu Hà"; Quản lý "Đỗ Hoàng Long".
- Tables (Sảnh chính): B01 2 ghế, B02 2 ghế, B03 4 ghế, B04 4 ghế, B05 4 ghế, B06 6 ghế, B07 6 ghế, B08 8 ghế. VIP: V01–V03. Ban công: C01–C04.

**Menu** (category = Course; drinks are menu items listed under Đồ uống and fired with Course 1 — OPEN_QUESTIONS #2):

| Category | Item | Price | Prep SLA |
| :--- | :--- | ---: | ---: |
| Khai vị | Súp bào ngư thượng hạng | 350.000 ₫ | 12 phút |
| Khai vị | Gỏi tôm hùm sốt chanh leo | 420.000 ₫ | 10 phút |
| Khai vị | Sò điệp Hokkaido áp chảo — **Tạm hết** | 390.000 ₫ | 12 phút |
| Món chính | Bò Wagyu A5 sốt nấm Truffle | 1.250.000 ₫ | 25 phút |
| Món chính | Cá tuyết nướng Miso mật ong | 680.000 ₫ | 20 phút |
| Tráng miệng | Bánh Soufflé sô-cô-la | 220.000 ₫ | 15 phút |
| Tráng miệng | Panna cotta chanh dây | 180.000 ₫ | 8 phút |
| Đồ uống | Nước khoáng có ga | 120.000 ₫ | — |
| Đồ uống | Vang đỏ (ly) | 450.000 ₫ | — |

**Set Menu** (TastingMenu, UC-A1; names and prices are demo values, each course uses §10 items and their Prep SLA):

| Set | Course 1 — Khai vị | Course 2 — Món chính | Course 3 — Tráng miệng | Giá trọn gói / khách |
| :--- | :--- | :--- | :--- | ---: |
| Set Menu Thượng Hạng | Súp bào ngư thượng hạng | Bò Wagyu A5 sốt nấm Truffle | Bánh Soufflé sô-cô-la | 1.800.000 ₫ |
| Set Menu Hải Sản | Gỏi tôm hùm sốt chanh leo | Cá tuyết nướng Miso mật ong | Panna cotta chanh dây | 1.250.000 ₫ |
| Set Menu Tinh Hoa | Súp bào ngư thượng hạng | Cá tuyết nướng Miso mật ong | Panna cotta chanh dây | 1.190.000 ₫ |
| Set Menu Đặc Tuyển | Gỏi tôm hùm sốt chanh leo | Bò Wagyu A5 sốt nấm Truffle | Bánh Soufflé sô-cô-la | 1.850.000 ₫ |

Set photos (owner decision 19/11/2026, 4 sets in a 2 × 2 grid): Thượng Hạng `set_thuong_hang.jpg`, Hải Sản `set_hai_san.jpg`, Tinh Hoa `dish_sup_bao_ngu.jpg`, Đặc Tuyển `dish_wagyu.jpg`.

**Deposit rule (report BR-06, decided by the project owner on 29/10/2026):** booking with a pre-ordered Set Menu → deposit = 30% × set price × guests; booking without a set ("Gọi món tại nhà hàng") → 500.000 ₫ × guests (the 2026 survey found 500.000–1.000.000 ₫ per guest in practice). Walk-ins pay no deposit. Examples: Thượng Hạng × 4 = 2.160.000 ₫; Hải Sản × 4 = 1.500.000 ₫; Tinh Hoa × 4 = 1.428.000 ₫; Đặc Tuyển × 4 = 2.220.000 ₫; no set, 4 khách = 2.000.000 ₫; no set, 2 khách = 1.000.000 ₫.

**Main story — reservation VD-7K3Q, table B05**: Nguyễn Văn An books 4 khách, pre-orders **Set Menu Thượng Hạng × 4**, pays the 2.160.000 ₫ deposit. At check-in the Order is created automatically and Course 1 goes to the kitchen; the guests just eat, pay and leave.

| Course | Items (B05) |
| :--- | :--- |
| Course 1 — Khai vị | 4× Súp bào ngư thượng hạng |
| Course 2 — Món chính | 4× Bò Wagyu A5 sốt nấm Truffle |
| Course 3 — Tráng miệng | 4× Bánh Soufflé sô-cô-la |

**Invoice B05** (all items Served; BR-02):
Set Menu Thượng Hạng × 4 = Subtotal 7.200.000 ₫ · Phí phục vụ 5% 360.000 ₫ · VAT 10% 756.000 ₫ · Tổng cộng 8.316.000 ₫ · Trừ tiền cọc −2.160.000 ₫ · **Còn phải thanh toán 6.156.000 ₫**.

**Below-deposit example, table B04** (C2x; 2 khách, booked without a set, deposit 1.000.000 ₫): Tổng cộng 277.200 ₫ − 1.000.000 ₫ → **0 ₫** (BR-02: the deposit is a minimum spend).

**Walk-in example, table B03** (2 khách, no reservation, no deposit, ordered at the table with W3) — used only on waitstaff ordering screens:

| Course | Items (B03) |
| :--- | :--- |
| Course 1 — Khai vị | 2× Gỏi tôm hùm sốt chanh leo, 2× Nước khoáng có ga |
| Course 2 — Món chính | 2× Cá tuyết nướng Miso mật ong |
| Course 3 — Tráng miệng | 2× Panna cotta chanh dây |

<!-- old B05 à la carte sample replaced 29/10/2026 -->
**(Superseded) old sample order, table B05** (Course 1 includes the drinks):

| Course | Items |
| :--- | :--- |
| Course 1 — Khai vị | 2× Súp bào ngư, 2× Gỏi tôm hùm, 2× Nước khoáng có ga |
| Course 2 — Món chính | 2× Bò Wagyu A5, 2× Cá tuyết nướng Miso |
| Course 3 — Tráng miệng | 2× Bánh Soufflé, 2× Panna cotta |

**(Superseded) old invoice — must no longer appear anywhere:**
Subtotal 6.440.000 ₫ · Phí phục vụ 5% 322.000 ₫ · VAT 10% 676.200 ₫ · Tổng cộng 7.438.200 ₫ · Trừ tiền cọc −500.000 ₫ · **Còn phải thanh toán 6.938.200 ₫**.

## 11. Layout quality (checked in every review)

- **No pure black** (`#000000`) fills anywhere. Inner containers are transparent or use the section 7 tokens.
- **Text must wrap inside its container**, never clip. Put text in an auto-layout parent and set the text's horizontal sizing to FILL (or give it a fixed width inside the frame). After building, check that no text node's right edge exceeds its parent's width.
- **No rule or spec codes in UI text** — never show "BR-04", "UC-U3", etc. on screen. Names like `G1.2` belong in layer/frame names only.
- Only the statuses in section 6 may appear as status badges. Selection is shown with a gold-500 border, not a new badge.
- Content taller than the device height: make that frame taller (keep width) so everything, including footer buttons, sits inside the frame. Nothing may sit outside its screen frame.
- **Before every report, run the checker** and include its last line. It must say `0 issue(s)`:
  `bun /home/life/.gemini/tools/cursor-talk-to-figma-mcp/scripts/check-frames.ts <channel>`
  Your own bounding-box checks have missed real overflow twice — the checker is the judge, not your self-assessment.
- No invented operational details (shift hours, refund processing times, opening hours, phone numbers of the restaurant, etc.).
