# ADR 0001: Segregation of Real-Time Traffic using Multiple SignalR Hubs

## Status

Accepted

## Context

The VinDining system requires real-time push capabilities for two distinct subdomains:
1. **Table Management**: Broadcasting table state changes (Available, Reserved, Occupied, Cleaning, LockedForPayment) to the digital layout viewed by the Host and Waitstaff.
2. **Kitchen Dispatching**: Pushing thermal printing triggers and order state updates to the Expediter (Nhân viên Checkfood) stationed at the kitchen pass.

We needed to decide whether to multiplex all real-time events through a single unified SignalR Hub (e.g., `RestaurantHub`) or to segregate them into specific Hubs (e.g., `TableHub` and `KitchenHub`).

## Decision

We will use **Multiple Segregated SignalR Hubs** (`TableHub`, `KitchenHub`, etc.) instead of a single god hub.

## Rationale

1. **Traffic Isolation**: Table state changes are frequent and broadcasted to multiple tablets in the dining room. Kitchen updates (dish completions, new tickets) only matter to the Expediter and specific Waitstaff. A single hub would require complex Group management to avoid flooding the Expediter's tablet with irrelevant table updates.
2. **Security & Authorization**: Different hubs allow for clean, class-level `[Authorize(Roles="Waitstaff,Manager")]` vs `[Authorize(Roles="Expediter,Manager")]` attributes, reducing the risk of unauthorized role invocation.
3. **Frontend Modularity**: The React frontend (using Zustand/React Query) can initialize distinct connection singletons specifically for the components that need them (e.g., the `FloorMap` component connects to `TableHub`, the `KDS` component connects to `KitchenHub`), leading to better decoupling.

## Consequences

- **Positive**: Improved network efficiency by reducing broadcast noise. Better separation of concerns in both API and Client code.
- **Negative**: The frontend might need to maintain multiple WebSocket connections if a single device acts as both Host and Expediter. However, given the physical separation of roles (Host at front desk, Expediter at kitchen pass), this is an acceptable trade-off.
