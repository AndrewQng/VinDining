# Restaurant Management & Reservation Context

Core domain managing fine dining reservations, table seating layout, tasting menu ordering, and billing operations.

## Language

**Guest**:
A customer reserving a table or dining at the restaurant.
_Avoid_: Client, user, account

**Reservation**:
An advance booking by a Guest for a specific dining shift, table category, and party size.
_Avoid_: Booking, appointment

**Table**:
A designated physical dining space with a specific capacity, location zone, and real-time status.
_Avoid_: Seat, spot

**TastingMenu**:
A multi-course curated set menu served in sequential progression.
_Avoid_: Food item, combo

**Course**:
A sequential stage within a tasting menu (e.g., Amuse-Bouche, Appetizer, Main, Dessert).
_Avoid_: Dish, step

**Order**:
The active dining order associated with an occupied table recording selected tasting menus and beverages.
_Avoid_: Cart, purchase

**Deposit**:
A mandatory advance payment required to confirm high-value fine dining reservations.
_Avoid_: Pre-auth, down-payment

**Invoice**:
The final itemized settlement for an Order after dining, accounting for service charge, VAT, and deducting any Deposit.
_Avoid_: Bill, receipt

## Relationships

- A **Guest** creates one or more **Reservations**
- A **Reservation** holds exactly one **Deposit**
- A **Reservation** is assigned to one or more **Tables**
- An active dining session on a **Table** produces an **Order**
- A **TastingMenu** consists of multiple **Courses**
- An **Order** produces exactly one **Invoice** upon checkout

## Example dialogue

> **Dev:** "When a **Guest** books a table for 4 with a 7-course **TastingMenu**, is the **Order** created immediately?"
> **Domain expert:** "No — the **Reservation** is confirmed upon **Deposit** payment. The actual **Order** is opened when the **Guest** checks in and the **Table** status changes to Occupied."

## Flagged ambiguities

- "user" was used to mean both **Guest** and internal **Staff** — resolved: **Guest** represents the dining customer, while **Staff** (Host, Server, Chef, Manager) represents internal users.
