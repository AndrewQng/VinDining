# VinDining — Project Development Rules & Agent Execution Matrix

## 1. Project Context & Architectural Invariants

* **Product**: End-to-End Fine Dining Restaurant Management System featuring Real-time Table Reservations, QR Self-Ordering at Tables, Kitchen Display System (KDS) Course Firing & Order Management, and Billing / Invoice Settlement with Deposit Deduction.
* **Architecture**: Clean Architecture / 3-Layer separated Client-Server model.
  * **Frontend**: React (SPA) + TypeScript + Vite + Tailwind CSS + TanStack Query + Zustand + SignalR Client.
  * **Backend API**: ASP.NET Core (.NET 9) Web API + CQRS Pattern (MediatR) + FluentValidation pipeline.
  * **Data & Persistence**: Microsoft SQL Server + Entity Framework Core 9 (EF Core) with DbContext abstractions and Unit of Work.
  * **Real-time Engine**: ASP.NET Core SignalR Hubs for floor plan states, kitchen orders, and staff notifications.
  * **Security**: ASP.NET Core Identity + JWT Bearer Tokens + Role-based Authorization.

---

## 2. Core Engineering & Working Principles

### General Working Rules
* **Source of Truth**: Trust the source code over user prompt assumptions. Read all call sites, dependencies, and existing tests before starting any change.
* **Failure Modes**: Weigh edge cases, network disruptions, concurrency collisions, and error flows as heavily as the happy path.
* **Bug Reproduction**: Always reproduce bugs and isolate root causes before proposing or applying fixes.
* **Tool Priority**: Prioritize using native platform tools and standard libraries.

### High-Performance Coding Standards
* **Data Locality**: Store related data accessed together in close proximity in memory/storage.
* **Batching & Pre-computation**: Execute tasks in bulk and ahead of time; avoid N+1 queries or repeated lookups.
* **Parallel Execution**: Run independent operations concurrently where safe.
* **Local Caching**: Cache unchanging external or static configuration data locally rather than querying repeatedly.
* **Contiguous Storage**: Prefer flat arrays/collections of contiguous data over indirect pointer references where possible.
* **Type & Memory Efficiency**: Order struct/class fields from largest to smallest for optimal memory alignment; use minimally sized enum types; avoid strings unless required for human-readable output.
* **Lean Operations**: Eliminate unneeded operations (e.g. array shifts, unnecessary copy cycles, deep object clones).
* **State Representation**: Prefer specialized collections/queues over excessive boolean flags.

---

## 3. Domain Model & Ubiquitous Language

* **Guest**: A customer reserving a table or dining at the restaurant. (*Avoid: Client, user, account*)
* **Reservation**: An advance booking by a Guest for a specific dining shift, table zone, and party size. (*Avoid: Booking, appointment*)
* **Deposit**: A mandatory advance payment required to confirm fine dining reservations. (*Avoid: Pre-auth, down-payment*)
* **Table**: A physical dining space with capacity, location zone, and real-time status (Available, Reserved, Occupied, Cleaning). (*Avoid: Seat, spot*)
* **TastingMenu**: A multi-course curated set menu served in sequential progression. (*Avoid: Food item, combo*)
* **Course**: A sequential stage within a tasting menu (e.g., Amuse-Bouche, Appetizer, Main, Dessert). (*Avoid: Dish, step*)
* **Order**: The active dining order associated with an occupied Table recording selected tasting menus, courses, and beverages. (*Avoid: Cart, purchase*)
* **Invoice**: The final itemized settlement for an Order after dining, accounting for service charge (5%), VAT (10%), and deducting any Deposit. (*Avoid: Bill, receipt*)
* **Staff**: Internal restaurant roles (Host, Server, Chef, Manager, Admin).

---

## 4. Agent Skill Catalog & Activation Conditions

### A. Requirements Engineering & Product Management

#### 1. `prd-development`
* **Path**: `.agents/skills/prd-development/SKILL.md`
* **What it does**: Orchestrates structured PRD / BRS / SRS creation: Problem Framing with evidence, Target Personas, Strategic Context, Solution Overview, Success Metrics, User Story breakdown, Out-of-Scope boundaries, and Risk mitigations.
* **Activation**: When drafting or refining product specifications, BRS, or SRS.
* **Triggers**: `"write PRD"`, `"create BRS"`, `"draft SRS"`, `"document system requirements"`, `"product specification"`.

#### 2. `user-story-mapping`
* **Path**: `.agents/skills/user-story-mapping/SKILL.md`
* **What it does**: Visualizes the user journey via 2D Story Mapping (Jeff Patton model): horizontal backbone (Activities $\rightarrow$ Steps $\rightarrow$ Tasks) and vertical release slicing (MVP vs Future).
* **Activation**: When mapping out end-to-end user workflows or slicing MVP releases.
* **Triggers**: `"story map"`, `"user journey map"`, `"map out workflow"`, `"slice MVP"`.

#### 3. `user-story`
* **Path**: `.agents/skills/user-story/SKILL.md`
* **What it does**: Formulates user stories in Mike Cohn format (`As a [role], I want to [action], so that [outcome]`) with testable Gherkin acceptance criteria (`Scenario`, `Given`, `When`, `Then`).
* **Activation**: When writing detailed user stories or acceptance criteria for backlog items.
* **Triggers**: `"write user story"`, `"create user story for X"`, `"acceptance criteria for Y"`, `"Gherkin scenarios"`.

#### 4. `planning-with-files`
* **Path**: `.agents/skills/planning-with-files/SKILL.md`
* **What it does**: Maintains persistent state on disk (`task_plan.md`, `findings.md`, `progress.md`) across multi-step agent sessions to prevent context drift.
* **Activation**: When starting any multi-step analysis, design, or implementation workflow requiring 5+ actions.
* **Triggers**: `"plan with files"`, `"track progress in files"`, `"initialize task plan"`.

---

### B. System Architecture & Technical Design

#### 5. `clean-architecture`
* **Path**: `.agents/skills/clean-architecture/SKILL.md`
* **What it does**: Enforces the 4-layer .NET Clean Architecture structure (`Domain` $\rightarrow$ `Application` $\rightarrow$ `Infrastructure` $\rightarrow$ `Api`), dependency inversion, rich domain entities with business behaviors, MediatR CQRS Commands/Queries, FluentValidation pipelines, and `IAppDbContext` abstractions.
* **Activation**: When designing backend layers, writing CQRS handlers, domain entities, or minimal API endpoints.
* **Triggers**: `"clean architecture"`, `"setup backend layers"`, `"create command handler"`, `"domain entity"`.

#### 6. `dotnet-backend-patterns`
* **Path**: `.agents/skills/dotnet-backend-patterns/SKILL.md`
* **What it does**: Implements production C#/.NET 9 patterns: async/await cancellation tokens, DI lifetimes, `IOptions<T>` configuration, `Result<T>` flow control, EF Core 9 fluent mapping, high-performance Dapper queries, and integration testing with `WebApplicationFactory`.
* **Activation**: When writing or reviewing C# backend code, repository access, caching, or middleware.
* **Triggers**: `"dotnet patterns"`, `"csharp best practices"`, `"setup EF Core repository"`, `"result pattern C#"`.

#### 7. `architecture-decision-records`
* **Path**: `.agents/skills/architecture-decision-records/SKILL.md`
* **What it does**: Standardizes creation and governance of Architecture Decision Records (ADRs) using MADR or Y-Statement formats to capture decision drivers, options, rationale, and consequences.
* **Activation**: When deciding on technical trade-offs or documenting architectural choices.
* **Triggers**: `"write an ADR"`, `"architecture decision record"`, `"why did we choose X"`, `"compare tech options"`.

#### 8. `openapi-spec-generation`
* **Path**: `.agents/skills/openapi-spec-generation/SKILL.md`
* **What it does**: Generates and maintains OpenAPI 3.1 specifications for RESTful API contracts between frontend and backend.
* **Activation**: When defining or documenting API contracts, Swagger endpoints, request/response schemas, or error formats.
* **Triggers**: `"generate openapi spec"`, `"design API contract"`, `"swagger specification"`.

#### 9. `database-schema-designer`
* **Path**: `.agents/skills/database-schema-designer/SKILL.md`
* **What it does**: Designs normalized relational database schemas (1NF $\rightarrow$ 2NF $\rightarrow$ 3NF) for SQL Server, foreign keys, composite indexes, and reversible EF Core migrations.
* **Activation**: When designing database tables, ERD diagrams, indexes, or relationships.
* **Triggers**: `"design database schema"`, `"create ERD"`, `"table structure"`, `"database normalization"`.

---

### C. Task Breakdown, Sprint Planning & Code Quality

#### 10. `planning-and-task-breakdown`
* **Path**: `.agents/skills/planning-and-task-breakdown/SKILL.md`
* **What it does**: Decomposes specs into atomic vertical engineering slices with acceptance criteria, verification commands, and dependency ordering.
* **Activation**: When breaking down sprint tasks or milestone goals (`tasks/todo.md`).
* **Triggers**: `"break down tasks"`, `"plan sprint"`, `"task list"`, `"decompose work"`.

#### 11. `tdd`
* **Path**: `.agents/skills/tdd/SKILL.md`
* **What it does**: Drives test-driven development (Red-Green-Refactor) with deep module design, interface boundaries, and unit/integration testing.
* **Activation**: When building new features or bug fixes test-first.
* **Triggers**: `"tdd"`, `"write tests first"`, `"red-green-refactor"`.

#### 12. `grill-me` & `grill-with-docs`
* **Path**: `.agents/skills/grill-me/SKILL.md` & `.agents/skills/grill-with-docs/SKILL.md`
* **What it does**: Conducts an interview to stress-test designs, identify unstated assumptions, and generate documentation.
* **Activation**: When validating a plan or design before implementation.
* **Triggers**: `"grill me"`, `"stress test my plan"`, `"interview me on design"`.

#### 13. `improve-codebase-architecture`
* **Path**: `.agents/skills/improve-codebase-architecture/SKILL.md`
* **What it does**: Scans codebase for deepening opportunities, module seams, and architectural improvements.
* **Activation**: When reviewing architecture quality across the repository.
* **Triggers**: `"improve architecture"`, `"review codebase structure"`, `"find module seams"`.

---

## 5. Phase-by-Phase Execution Guide

| Project Phase | Focus & Deliverables | Primary Skills to Invoke |
| :--- | :--- | :--- |
| **Weeks 1–2 (Proposal + Analysis)** | BRS, SRS (draft), Business Rules, User Stories, Scope definition | `prd-development`<br>`user-story-mapping`<br>`user-story`<br>`planning-with-files` |
| **Weeks 3–4 (Design & Architecture)** | Architecture blueprints, ADRs, Domain Model, ERD/Database Schema, OpenAPI Specs | `clean-architecture`<br>`architecture-decision-records`<br>`database-schema-designer`<br>`openapi-spec-generation`<br>`dotnet-backend-patterns` |
| **Weeks 5–6 (Setup & Scaffolding)** | Solution layout, MediatR CQRS pipeline, EF Core setup, React Vite setup | `clean-architecture`<br>`planning-and-task-breakdown`<br>`dotnet-backend-patterns` |
| **Weeks 7–8 (Coding & Feature Delivery)** | Table QR Self-Ordering, KDS SignalR, Billing & Payment | `dotnet-backend-patterns`<br>`tdd`<br>`planning-with-files` |
| **Weeks 9–10 (Polish & Verification)** | End-to-end testing, bug fixes, demo preparation | `improve-codebase-architecture`<br>`diagnose` |
