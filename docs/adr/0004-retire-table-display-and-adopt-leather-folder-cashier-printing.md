# ADR 0004: Retirement of Stationary TableDisplay in Favor of Cashier Receipt Printing and Waitstaff Smartphone Notifications

## Status

Accepted (Supercedes TableDisplay portion of ADR 0003)

## Context

In [ADR 0003](file:///d:/Doanandroid/Đồ%20án%20CDTH/VinDining/docs/adr/0003-kds-and-table-display-architecture.md), the system specified a stationary, zero-touch digital screen (`TableDisplay`) mounted at each dining table to display real-time dish serving notifications (*"Món đang được dọn lên!"*) and dynamic VietQR invoice breakdown upon checkout.

However, deeper operational, financial, and UX evaluation revealed critical real-world friction points:
1. **High Hardware & Infrastructure Costs**: Mounting industrial or PoE tablets at 30–50 dining tables requires complex under-floor cabling (Floor Boxes), expensive PoE network switches, and custom table mounting stands, inflating initial CAPEX by hundreds of millions of VNĐ.
2. **Battery Bloat & Fire Safety**: Consumer tablets (iPad, Samsung Galaxy Tab) connected to continuous 24/7 chargers suffer from battery swelling and elevated fire hazards in dining rooms.
3. **Disruption of Fine Dining Ambience**: A glowing electronic screen fixed permanently on a dining table clutters table space, distracting from candlelight, floral arrangements, and intimate guest conversation.
4. **Staff Practicality**: Waitstaff in reality utilize their own smartphones (BYOD / Mobile Web PWA) for table operations rather than company-issued tablets. Handing a server's personal smartphone to a fine dining guest to inspect a bill or scan a QR code is unprofessional and unhygienic.

## Decision

1. **Retire Stationary TableDisplay Completely**: Remove all stationary hardware screens, PoE requirements, and dedicated table-bound kiosk web views from dining tables. Dining tables remain 100% clean and free of electronic fixtures.
2. **At-Table QR Code & View-Only E-Menu**: Equip each table with an elegant, non-intrusive QR plate/stand. Guests scan the QR code on their personal smartphone (BYOD) to launch the responsive E-Menu Web App to explore food provenance, wine pairings, and submit service requests (calling waitstaff, water refill, utensil change, bill request). In strict alignment with Michelin/fine dining service standards, **order taking is exclusively performed by Waitstaff on Mobile POS** after tableside consultation. All dishes are structured into Courses and orchestrated via the **Course Firing (Hold & Fire)** pipeline.
3. **Floating Pool for EMenuTablet**: Retain handheld `EMenuTablet` devices strictly as a shared, floating pool stored at the Service Station / Host stand for guests who prefer a larger tablet display. These tablets are not permanently bound to specific tables.
4. **Pass Serving Alerts to Waitstaff Smartphone**: When the Expediter confirms a dish as `Served` at the Kitchen Pass Tablet, SignalR pushes a real-time vibration/push alert directly to the assigned Waitstaff's smartphone (*"Bàn [Số bàn]: Món [Tên món] đã sẵn sàng tại quầy Pass!"*). Waitstaff receives the plated dish from the Pass, carries it with both hands, serves the guest, and verbally introduces the dish.
5. **Physical Invoice Settlement via Cashier Thermal Receipt & Leather Folder**:
   - When a guest verbally requests the bill, Waitstaff taps *"Xuất phiếu tạm tính"* on their smartphone Mobile Web POS.
   - The backend dispatches an automated print job (ESC/POS) to the **Network Thermal Receipt Printer (80mm)** located at the Cashier / Floor Service Station.
   - The receipt slip prints the itemized subtotal, +5% Service Charge, +10% VAT, – Deposit deduction (VNPAY per `BR-03`), remaining balance, and a **dynamic VietQR payment code** printed directly at the bottom.
   - Waitstaff collects the slip, places it into a luxury leather bill folder (Sổ da kẹp bill), and presents it to the guest.
   - The guest reviews the physical receipt, scans the printed VietQR code using their mobile banking app to transfer, or places cash/credit card inside the folder.
   - Waitstaff / Cashier confirms settlement on their device, transitioning the table to `Cleaning`.

## Consequences

### Positive
- **Dramatic Cost Reduction**: Saves substantial hardware investment (no 30+ table tablets, no PoE switches, no floor trenching/cabling).
- **Elevated Dining Aesthetics**: Preserves authentic, uncluttered fine dining table settings.
- **Traditional Luxury Bill Presentation**: Retains the prestigious European fine dining ritual of the leather bill folder while providing modern contactless VietQR payment.
- **Simplified Software Architecture**: Eliminates table-specific WebSocket display channels and kiosk device pairing workflows.

### Negative
- **Consumable Reliance**: Re-introduces standard 80mm thermal receipt paper rolls at the Cashier / Service Station (though strictly for customer pre-checks/bills, while the kitchen remains 100% paperless via KDS tablets).
