# ADR 0003: Kitchen Display System (KDS) and Zero-Touch Table Display Architecture

## Status

Accepted

## Context

The initial design envisioned thermal paper printers (ESC/POS) at kitchen stations and a passive e-menu display at dining tables. However, fine dining operations in Vietnam revealed several pain points:
1. **Paper Thermal Tickets**: Prone to grease damage, ink fading in humid kitchen environments, paper jams during rush hours, and lack real-time elapsed time tracking (SLA pacing) across sequential Courses (Tasting Menus).
2. **Table Communication**: Casual dining systems (iPOS, CukCuk) dump all dishes at once. Fine dining requires paced serving (*Khai vị -> Súp -> Món chính -> Tráng miệng*). Guests frequently wonder when their next course is arriving.
3. **Hygiene & Hands-Free Kitchen Operations**: Chefs handling raw food and hot cooking surfaces cannot continuously touch interactive tablet screens without risking cross-contamination and screen degradation.

## Decision

1. **Retire Thermal Paper Printing**: Replace physical kitchen printers completely with **Kitchen Display System (KDS)** tablets mounted at culinary stations (Hot Kitchen, Cold Kitchen, Bar).
2. **Hands-Free / View-Only KDS for Kitchen**: Chefs interact with KDS purely visually (hands-free). Stations show real-time cooking countdown timers and highlighted dietary/allergen notes.
3. **Expediter Station as Quality Gate**: Plated dishes are placed at the Kitchen Pass. The Expediter (Nhân viên Checkfood) performs QC inspection (temperature, plating, special notes) and presses "Served" (`Xác nhận ra món / Phục vụ`) directly on the Pass Tablet. Waitstaff receives the plated dish from the Pass and carries it to the dining table with two hands without needing to touch a tablet or press any buttons at the table.
4. **Dedicated Zero-Touch TableDisplay**: A stationary tablet mounted at each dining table displays the Table Number and listens to real-time SignalR events to flash *"Món [Tên món] đang được dọn lên!"* when Expediter confirms dishes as Served at the Pass. When the final dish of a Course is served, TableDisplay updates course progression and Waitstaff's tablet displays the prompt to fire the next course when ready (under Course Pacing & Delayed SLA warning). Furthermore, when the guest requests payment in person, Waitstaff's action on their handheld POS pushes the itemized invoice breakdown (Subtotal, 5% Service Charge, 10% VAT, Deposit deduction, Remaining balance) along with a dynamic VietQR payment code to the TableDisplay for guest review / contactless payment. Upon payment settlement confirmation on Tablet POS, TableDisplay displays a thank you message, and the table transitions to `Cleaning`.
5. **100% Passive View-Only Handheld EMenuTablet**: A separate handheld tablet is given to Guests strictly to visually explore high-definition dish photography, chef stories, ingredient provenance, and wine pairings. It has **ZERO interactive buttons** — NO "Gọi phục vụ" (Call Staff), NO "Yêu cầu tính tiền" (Request Bill), NO cart, and NO self-ordering buttons. All guest requests (order placing, special requests, bill requests) are conveyed directly to the attentive Waitstaff in person to preserve traditional high-touch fine dining service.

## Consequences

### Positive
- **Zero Consumables**: Eliminates printer hardware failures, paper roll replenishment, and ink smudging.
- **Precision Course Pacing**: Kitchen stations and Expediter track live cooking timers; front-of-house staff receive SLA pacing alerts.
- **Elevated Guest Experience**: Guests observe real-time course progress on the TableDisplay without anxiety.
- **Hygiene Protection**: Chefs do not contaminate touchscreens.

### Negative
- **Network Dependency**: Kitchen and tables depend 100% on stable local Wi-Fi and SignalR WebSocket connectivity.
- **Device Management**: Requires maintaining tablet mounts and chargers at kitchen stations and dining tables.
