# Post-merge review follow-up & SQL Server verification (21/11/2026)

Compact handoff note following [claude-review.md](claude-review.md) on branch `fix/post-merge-review`.

## 1. Review findings & fixes applied
- **Prevented `.env` leakage in backend tests (`backend/src/API/Program.cs`)**
  - `DotNetEnv.Env.TraversePath().Load()` ran during `WebApplicationFactory` startup, injecting local `JWT_ISSUER` into the test process and breaking `AuthServiceTests.LoginAsync_WithValidPassword_ReturnsSuccessWithJwtToken` on developer machines with a `.env` file.
  - Guarded `DotNetEnv` loading with `if (!builder.Environment.IsEnvironment("Testing"))`.
- **Hardened `AddReservationPreOrderedTastingMenu` T-SQL data migration (`backend/src/API/Data/Migrations/20261121131037_AddReservationPreOrderedTastingMenu.cs`)**
  - Changed `LEFT JOIN [TastingMenus]` to `INNER JOIN [TastingMenus]` so orphan markers referencing deleted/missing sets are preserved in `Note` rather than stripped while leaving `PreOrderedTastingMenuId` null.
  - Wrapped the `ELSE` branch in `LTRIM(RTRIM(...))` to avoid trailing whitespace when the marker sat at the end of `Note`.

## 2. Verification results
| Check | Result |
| :--- | :--- |
| `cd frontend && npx oxlint` | 0 warnings, 0 errors |
| `cd frontend && npx vitest run` | 78/78 passed |
| `cd frontend && npm run build` | OK |
| `cd backend && dotnet test Restaurant.sln` | 97/97 passed (with local `.env` present) |
| SQL Server migration round-trip (`Up` → `Down` → `Up`) | Passed on isolated local SQL Server Express DB across 5 cases (prefix marker, marker-only, suffix marker, orphan set ID, plain note) |
| Remote MS SQL Server 2025 Express live check | All 9 EF Core migrations applied, `DatabaseSeeder` populated demo data, live FE (`:5173`) + BE (`:5159`) loaded 4 Set Menus and SignalR `/hubs/tables` with HTTP 200 and 0 console errors |

## 3. Remaining follow-ups (unchanged from `claude-review.md` §6)
- Re-render the two updated PlantUML sequence-diagram PNGs (`SD_UC_U1_Reservation_Deposit.png`, `SD_UC_E6_1_CheckIn_Reservation.png`).
- Optionally replace derived `guestStatus` markers with a persisted status column in a future migration.
- Keep `InvoiceService.ResolveDishUnitPrices` legacy 0-price fallback in mind if an old order ever had multiple batches of the same `TastingMenuId` (new orders store allocated unit prices directly).
