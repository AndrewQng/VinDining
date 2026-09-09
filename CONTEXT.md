# Restaurant Management & Reservation Context (VinDining)

Core domain managing fine dining reservations, real-time table layout, QR self-ordering, automated kitchen ticket dispatching, serving confirmation, and invoice settlement with deposit deduction.

---

## 1. Ubiquitous Language

**Guest**:
A dining customer reserving a table online or dining in person. Guests do **not** have accounts or login credentials; they are identified purely by Contact Information (FullName, PhoneNumber, Email) tied to their specific Reservation or Table session.
_Avoid_: Client, customer, account, user

**Staff**:
Internal restaurant employees authenticated via system accounts (ASP.NET Core Identity + JWT Bearer), categorized by RBAC roles:
- **Waitstaff / Server**: Floor staff handling check-in, order creation, serving dishes to guests, and bill handover.
- **Expediter / Checkfood**: Staff stationed at the Kitchen Pass who verifies completed dishes, coordinates delivery, and marks items as served in the system.
- **Manager**: Supervisor managing menus, table layouts, shifts, reports, and exception refunds.
- **Admin**: System administrator managing user credentials, RBAC permissions, and system configurations.
_Note_: **Kitchen / Chef** is an operational station (not an interactive software actor); the kitchen receives orders via automated thermal print tickets and coordinates with Waitstaff at the Pass.

**Reservation**:
An advance table booking by a Guest for a specific date, dining shift, party size, and table category.
_Avoid_: Booking, appointment

**Deposit**:
A mandatory advance payment per table category (e.g., Standard: 300,000 VNĐ, VIP/Balcony: 500,000 VNĐ) paid via VNPAY to confirm a Reservation and prevent no-shows.
_Avoid_: Down-payment, pre-auth

**Table**:
A designated physical dining space with specific capacity, location zone, static QR code, and real-time status.
_Avoid_: Seat, spot

**Table State Lifecycle**:
- `Available` (Trống) $\rightarrow$ `LockedForPayment` (Khóa 17p chờ VNPAY) $\rightarrow$ `Reserved` (Đã thanh toán cọc) $\rightarrow$ `Occupied` (Đang phục vụ) $\rightarrow$ `Cleaning` (Chờ dọn dẹp) $\rightarrow$ `Available` (Trống).

**Reservation Status**:
- `AwaitingPayment` $\rightarrow$ `Confirmed` (Deposit paid) $\rightarrow$ `Completed` (Guest finished dining)
- Alternately, can end in `Cancelled` (Timed out after 17m or guest manually cancelled).

**MenuItem**:
A regular dish or beverage available for ordering from the A La Carte menu.
_Avoid_: Combo, set meal, step

**Order**:
The active dining order associated with an `Occupied` Table recording selected menu items.
_Avoid_: Cart, purchase

**OrderItem**:
A specific instance of a MenuItem within an Order.
**OrderItem State Lifecycle**:
- `Preparing` (Sent to kitchen printer) $\rightarrow$ `Served` (Expediter marked at the pass)
- Or `Cancelled` (Out of stock or manually voided).

**Invoice**:
The final itemized financial settlement for an Order after dining, accounting for 5% service charge, 10% VAT, and deducting the pre-paid Deposit.
_Avoid_: Bill, receipt

**PaymentMethod**:
The recorded method used to settle an Invoice balance:
- `Cash`: Cash paid at table / counter.
- `Card`: Credit / Debit card swiped via portable bank POS terminal.
- `BankTransfer`: Direct bank transfer via static VietQR code.
- `DepositCovered`: Used when the pre-paid deposit covers 100% of the bill (Amount Payable = 0 VNĐ).


---

## 2. Core Domain Invariants & Rules

1. **Scope Boundary**: 100% In-House Dining. No third-party online delivery or shipper actors.
2. **Digital Display Session (BR-02)**: Each table is equipped with a digital display (tablet) that functions as a view-only E-Menu. Guests use this display to view the available menu items. The ordering capability on this display is disabled.
3. **Waitstaff Ordering (BR-02b)**: Orders are taken and entered entirely by the Waitstaff on their portable tablet/device after guests have selected their meals from the digital display. The `Pending` order state from Guest self-ordering is eliminated.
4. **Kitchen Dispatching (BR-04)**: When Waitstaff submits the order, the system immediately dispatches automatic print commands to thermal printers at designated stations (Hot kitchen, Cold kitchen, Bar) with allergy notes prominently highlighted.
5. **Serving Confirmation (BR-04)**: When the kitchen places completed dishes on the Pass, the Expediter (Nhân viên Checkfood) verifies the order, dispatches a Waitstaff to deliver it, and taps "Mark as Served" on their tablet at the Pass to record actual serving timestamps.
6. **Reservation Lock & Refund Policy (BR-01, BR-05)**:
   - Online reservation locks table for **17 minutes** (15m VNPAY QR expiry + 2m Grace Period) awaiting VNPAY IPN. If timed out, table reverts to `Available`.
   - **Late IPN / Orphaned Payment Handling**: If IPN arrives after 17m and the table is lost, system attempts auto-reallocation to an equivalent table. If no equivalent table exists, system escalates to Manager (`Paid_TableLost`) for manual CSKH resolution.
   - Cancellation $\ge 4$ hours before shift: 100% automated refund via VNPAY.
   - Cancellation $< 4$ hours before shift: 0% refund (100% penalty for ingredients preparation).
   - Force Majeure: Manager can trigger `Manual Refund Override` from the Admin Portal.
6. **Financial Calculation Formula (BR-03)**:
   $$\text{Subtotal} = \sum (\text{Dish Price} \times \text{Quantity})$$
   $$\text{Service Charge (5\%)} = \text{Subtotal} \times 0.05$$
   $$\text{VAT (10\%)} = (\text{Subtotal} + \text{Service Charge}) \times 0.10$$
   $$\text{Amount Payable} = \max(0, (\text{Subtotal} + \text{Service Charge} + \text{VAT}) - \text{Deposit Paid})$$
   - *Note*: Deposit acts as a Minimum Spend and is non-refundable. If total is less than the deposit, Amount Payable is 0 VNĐ and no cash change is given.

---

## 3. Entity Relationships

- A **Guest** creates one or more **Reservations**, and optionally submits a **Feedback** review after dining.
- A **Reservation** holds exactly one **Deposit** transaction with advance payment details.
- A **Reservation** is assigned to exactly one **Table** for a given dining shift.
- A **Table** is physically bound to one **DigitalDisplay** device via pairing code (`BR-02`).
- An `Occupied` **Table** maintains an active **Order** initiated by a **Staff** (Waitstaff).
- An **Order** contains multiple **OrderItems**.
- An **OrderItem** represents a chosen **MenuItem** and is marked `Served` by a **Staff** (Expediter at Pass).
- A **Category** categorizes multiple **MenuItems** for structured display on the E-Menu.
- An **Order** optionally links back to a **Reservation** (nullable foreign key) to allow the **Invoice** to trace and deduct the pre-paid **Deposit**.
- An **Order** produces exactly one **Invoice** upon checkout settled by a **Staff** (Waitstaff/Cashier).
- Completing the **Invoice** transitions the **Table** from `Occupied` $\rightarrow$ `Cleaning` $\rightarrow$ `Available`.
- A **Staff** member possesses an internal account with one designated RBAC role (Waitstaff, Expediter, Manager, Admin).
