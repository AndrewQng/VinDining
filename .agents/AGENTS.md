# VinDining — Project Development Rules & Agent Execution Matrix

## 1. Project Context & Architectural Invariants

* **Product**: End-to-End Fine Dining Restaurant Management System featuring Real-time Table Reservations, Digital Display E-Menu, Waitstaff Ordering, Automated Kitchen Ticket Dispatching, Expediter Serving Confirmation, and Billing / Invoice Settlement with Deposit Deduction.
* **Architecture**: Clean Architecture / 3-Layer separated Client-Server model.
  * **Frontend**: React (SPA) + TypeScript + Vite + Tailwind CSS + TanStack Query + Zustand + SignalR Client.
  * **Backend API**: ASP.NET Core (.NET 9) Web API + CQRS Pattern (MediatR) + FluentValidation pipeline.
  * **Data & Persistence**: Microsoft SQL Server + Entity Framework Core 9 (EF Core) with DbContext abstractions and Unit of Work.
  * **Real-time Engine**: ASP.NET Core SignalR Hubs for floor plan states, automated thermal ticket printing, expediter confirmations, and staff notifications.
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

### Software Design Principles (SOLID)
* **Single Responsibility Principle (SRP)**: Each class, controller, service, handler, or React component must have one reason to change. Keep business logic, validation, data access, and UI rendering cleanly decoupled.
* **Open/Closed Principle (OCP)**: Design components and pipelines to be open for extension but closed for modification using abstractions, MediatR pipeline behaviors, and strategy patterns.
* **Liskov Substitution Principle (LSP)**: Derived classes and interface implementations must strictly honor the contracts of their base types without unexpected side effects.
* **Interface Segregation Principle (ISP)**: Create focused, client-specific interfaces rather than broad, bloated interfaces (e.g., separate read/write repositories or specific domain service contracts).
* **Dependency Inversion Principle (DIP)**: Depend upon abstractions (interfaces) rather than concrete implementations. Always use Dependency Injection across Domain, Application, Infrastructure, and API layers.

### Secrets & Environment Configuration
* **No Hardcoded Secrets**: Never commit sensitive information (database credentials, JWT secrets, payment API keys, webhook secrets, SMTP passwords) to source code or tracked config files.
* **Environment Variables (.env)**: Always store secrets in `.env` files (loaded via `DotNetEnv` in .NET backend and `import.meta.env` in Vite frontend).
* **Template Files (.env.example)**: Always maintain `.env.example` files with placeholder values for onboarding and documentation.
* **Git Protection**: Ensure `.env`, `.env.local`, and local secret files are strictly ignored in `.gitignore`.

---

## 3. Domain Model & Ubiquitous Language

* **Guest**: A customer reserving a table or dining at the restaurant. (*Avoid: Client, user, account*)
* **Reservation**: An advance booking by a Guest for a specific dining shift, table zone, and party size. (*Avoid: Booking, appointment*)
* **Deposit**: A mandatory advance payment required to confirm fine dining reservations. (*Avoid: Pre-auth, down-payment*)
* **Table**: A physical dining space with capacity, location zone, and real-time status (Available, Reserved, Occupied, Cleaning). (*Avoid: Seat, spot*)
* **MenuItem**: A regular dish or beverage available for ordering from the A La Carte menu. (*Avoid: Combo, set meal, step*)
* **Order**: The active dining order associated with an occupied Table recording selected menu items and beverages. (*Avoid: Cart, purchase*)
* **Invoice**: The final itemized settlement for an Order after dining, accounting for service charge (5%), VAT (10%), and deducting any Deposit. (*Avoid: Bill, receipt*)
* **Staff**: Internal restaurant roles (Host, Server, Chef, Manager, Admin).

---

## 4. Agent Skill Activation Protocol & In-Flight Execution Routing

### Dynamic & In-Flight Skill Evaluation Protocol
Skill selection is an active, continuous process, NOT a one-time check at the initial prompt. The agent must evaluate skills at three distinct execution gates:

1. **Initial Dispatch Gate (Turn Start)**:
   - Match user intent (in English, Vietnamese, or mixed) against the skill catalog.
2. **Post-Context Gathering Gate (Pre-Implementation)**:
   - After inspecting code, reading documentation, or diagnosing errors, the agent gains fresh situational context.
   - Before writing or modifying code, the agent MUST evaluate:
     > *"Now that I understand the actual codebase context and sub-problems, does a specialized skill (e.g. `clean-architecture`, `dotnet-backend-patterns`, `database-schema-designer`, `tdd`, `architecture-decision-records`) govern this specific step?"*
   - If a matching skill exists, activate it immediately before taking modifying actions.
3. **In-Flight Transition Gate (Sub-task Emergence)**:
   - When encountering a new sub-domain mid-execution (e.g., discovering an unindexed table query, an architectural trade-off, or an unwritten unit test), seamlessly activate the corresponding specialized skill for that sub-task rather than ad-hoc coding.

> [!IMPORTANT]
> **Semantic Intent & Multilingual Support**:
> Skill activation is based strictly on **semantic intent and development objective**, never on rigid keyword matching. Developers on the team may prompt in **Vietnamese, English, or mixed technical terminology**. The agent MUST evaluate the user's underlying goal and invoke the appropriate skill regardless of prompt phrasing or language.

---

### A. Requirements Engineering & Product Management

#### 1. `prd-development`
* **Path**: `.agents/skills/prd-development/SKILL.md`
* **Core Purpose**: Orchestrates structured PRD / BRS / SRS creation: Problem Framing with evidence, Target Personas, Strategic Context, Solution Overview, Success Metrics, User Story breakdown, Out-of-Scope boundaries, and Risk mitigations.
* **When to Activate (Intent)**:
  - Drafting, structuring, or refining a Product Requirements Document (PRD), Business Requirements Specification (BRS), or Software Requirements Specification (SRS).
  - Defining the complete feature scope, constraints, and business metrics for the restaurant management system.
* **Example Intent Scenarios (EN / VI)**:
  - *EN*: "Draft the BRS document for the table reservation and deposit module."
  - *VI*: "Viết tài liệu đặc tả yêu cầu nghiệp vụ BRS / SRS cho tính năng đặt bàn và tính tiền cọc."
  - *VI*: "Soạn thảo PRD cho phân hệ Digital Display E-Menu và nhân viên gọi món tại bàn."

#### 2. `user-story-mapping`
* **Path**: `.agents/skills/user-story-mapping/SKILL.md`
* **Core Purpose**: Visualizes the user journey via 2D Story Mapping (Jeff Patton model): horizontal backbone (Activities $\rightarrow$ Steps $\rightarrow$ Tasks) and vertical release slicing (MVP vs Future).
* **When to Activate (Intent)**:
  - Mapping out end-to-end operational journeys across different roles (Guest $\rightarrow$ Host $\rightarrow$ Waiter $\rightarrow$ Chef $\rightarrow$ Manager).
  - Slicing backlogs into coherent milestone releases (MVP release vs Phase 2 enhancements).
* **Example Intent Scenarios (EN / VI)**:
  - *EN*: "Map out the full user journey from check-in to serving confirmation and bill checkout."
  - *VI*: "Lập bản đồ User Story Mapping cho quy trình từ lúc khách vào bàn đến khi Expediter xác nhận ra món và thanh toán."
  - *VI*: "Phân chia các lát cắt phát hành MVP cho đợt demo tuần 4."

#### 3. `user-story`
* **Path**: `.agents/skills/user-story/SKILL.md`
* **Core Purpose**: Formulates individual user stories in Mike Cohn format (`As a [role], I want to [action], so that [outcome]`) with testable Gherkin acceptance criteria (`Scenario`, `Given`, `When`, `Then`).
* **When to Activate (Intent)**:
  - Writing or detailing specific user stories with clear acceptance criteria for developers and QA testers.
  - Converting business rules into testable conditions (e.g. table status transitions, deposit deduction rules).
* **Example Intent Scenarios (EN / VI)**:
  - *EN*: "Write a user story with Gherkin acceptance criteria for automatic deposit deduction upon checkout."
  - *VI*: "Viết user story kèm tiêu chí nghiệm thu Gherkin cho tính năng in phiếu Bếp khi khách gửi đơn."
  - *VI*: "Đặc tả kịch bản kiểm thử (Given-When-Then) cho nghiệp vụ hủy bàn và hoàn tiền cọc."

#### 4. `planning-with-files`
* **Path**: `.agents/skills/planning-with-files/SKILL.md`
* **Core Purpose**: Maintains persistent state on disk (`task_plan.md`, `findings.md`, `progress.md`) across multi-step agent sessions to prevent context drift.
* **When to Activate (Intent)**:
  - Starting any complex multi-step analysis, design, or implementation workflow requiring 5+ actions.
* **Example Intent Scenarios (EN / VI)**:
  - *EN*: "Track our multi-step research and architecture design in persistent planning files."
  - *VI*: "Lập kế hoạch làm việc chi tiết và lưu vết tiến độ vào các file trên đĩa để không bị quên ngữ cảnh."

---

### B. System Architecture & Technical Design

#### 5. `clean-architecture`
* **Path**: `.agents/skills/clean-architecture/SKILL.md`
* **Core Purpose**: Enforces the 4-layer .NET Clean Architecture structure (`Domain` $\rightarrow$ `Application` $\rightarrow$ `Infrastructure` $\rightarrow$ `Api`), dependency inversion, rich domain entities with business behaviors, MediatR CQRS Commands/Queries, FluentValidation pipelines, and `IAppDbContext` abstractions.
* **When to Activate (Intent)**:
  - Designing backend solution structure, CQRS Commands/Queries, Domain Entities with encapsulation, or Minimal API endpoint groups.
  - Ensuring business rules remain strictly decoupled from database frameworks or UI controllers.
* **Example Intent Scenarios (EN / VI)**:
  - *EN*: "Structure the Order creation command handler following Clean Architecture and CQRS."
  - *VI*: "Thiết kế tầng Application và Domain theo Clean Architecture cho nghiệp vụ tạo Order và điều phối Course."
  - *VI*: "Tổ chức các Command, Query và Validator trong MediatR."

#### 6. `dotnet-backend-patterns`
* **Path**: `.agents/skills/dotnet-backend-patterns/SKILL.md`
* **Core Purpose**: Implements production C#/.NET 9 patterns: async/await cancellation tokens, DI lifetimes, `IOptions<T>` configuration, `Result<T>` flow control, EF Core 9 fluent mapping, high-performance Dapper queries, and integration testing with `WebApplicationFactory`.
* **When to Activate (Intent)**:
  - Writing, reviewing, or optimizing C# code, Entity Framework Core mappings, repository queries, caching, or middleware.
* **Example Intent Scenarios (EN / VI)**:
  - *EN*: "Configure EF Core entity relations and write Dapper queries for high-speed floor plan retrieval."
  - *VI*: "Viết cấu hình EntityTypeConfiguration cho các bảng CSDL và tối ưu truy vấn EF Core 9."
  - *VI*: "Áp dụng Result pattern thay vì throw exception khi xử lý logic nghiệp vụ đặt bàn."

#### 7. `architecture-decision-records`
* **Path**: `.agents/skills/architecture-decision-records/SKILL.md`
* **Core Purpose**: Standardizes creation and governance of Architecture Decision Records (ADRs) using MADR or Y-Statement formats to capture decision drivers, options, rationale, and consequences.
* **When to Activate (Intent)**:
  - Evaluating and documenting major architectural trade-offs (e.g. SignalR WebSocket vs HTTP polling, EF Core vs Dapper, Clean Architecture vs 3-Tier).
* **Example Intent Scenarios (EN / VI)**:
  - *EN*: "Create an ADR explaining why we chose SignalR for real-time kitchen order updates."
  - *VI*: "Viết tài liệu ADR giải thích lý do lựa chọn SignalR cho điều phối lệnh in bếp và sơ đồ bàn thay vì cơ chế polling."
  - *VI*: "So sánh ưu nhược điểm kỹ thuật giữa Clean Architecture và N-Tier truyền thống."

#### 8. `openapi-spec-generation`
* **Path**: `.agents/skills/openapi-spec-generation/SKILL.md`
* **Core Purpose**: Generates and maintains OpenAPI 3.1 specifications for RESTful API contracts between frontend and backend.
* **When to Activate (Intent)**:
  - Defining API request/response schemas, DTO models, HTTP status codes, and authentication requirements before frontend/backend implementation.
* **Example Intent Scenarios (EN / VI)**:
  - *EN*: "Generate the OpenAPI specification contract for the Waitstaff ordering endpoints."
  - *VI*: "Thiết kế hợp đồng API OpenAPI / Swagger cho các endpoint đặt bàn, gọi món và xuất hóa đơn."
  - *VI*: "Đặc tả các DTO request/response và mã lỗi HTTP cho Frontend React tiêu thụ."

#### 9. `database-schema-designer`
* **Path**: `.agents/skills/database-schema-designer/SKILL.md`
* **Core Purpose**: Designs normalized relational database schemas (1NF $\rightarrow$ 2NF $\rightarrow$ 3NF) for SQL Server, foreign keys, composite indexes, and reversible EF Core migrations.
* **When to Activate (Intent)**:
  - Designing Entity Relationship Diagrams (ERD), table structures, constraint rules, or indexing strategies for SQL Server.
* **Example Intent Scenarios (EN / VI)**:
  - *EN*: "Design a normalized database schema and ERD for Tables, Reservations, Courses, and Invoices."
  - *VI*: "Thiết kế sơ đồ cơ sở dữ liệu quan hệ (ERD) và các bảng dữ liệu trên SQL Server."
  - *VI*: "Chuẩn hóa bảng CSDL sang dạng 3NF và thiết lập các khóa ngoại, chỉ mục (Index) tối ưu."

#### 10. `drawio-skill`
* **Path**: `.agents/skills/drawio-skill/SKILL.md`
* **Core Purpose**: Generates editable `.drawio` XML files and exports diagrams (Architecture, ERD, UML, C4, Sequence, Flowcharts, Cloud Topology) locally to PNG/SVG/PDF with custom styling and 10,000+ stock/branded shapes.
* **When to Activate (Intent)**:
  - Creating visual architectural blueprints, ERDs, sequence diagrams, workflow charts, or exporting `.drawio` diagrams.
* **Example Intent Scenarios (EN / VI)**:
  - *EN*: "Generate a Draw.io architecture diagram for the microservices and SignalR flow."
  - *VI*: "Vẽ sơ đồ kiến trúc hệ thống dạng Draw.io và xuất file PNG/SVG."
  - *VI*: "Tạo sơ đồ luồng dữ liệu KDS và sơ đồ cơ sở dữ liệu Draw.io."

---

### C. Task Breakdown, Sprint Planning & Code Quality

#### 11. `planning-and-task-breakdown`
* **Path**: `.agents/skills/planning-and-task-breakdown/SKILL.md`
* **Core Purpose**: Decomposes specs into atomic vertical engineering slices with acceptance criteria, verification commands, and dependency ordering.
* **When to Activate (Intent)**:
  - Breaking down sprint milestones into actionable developer tasks with dependency ordering and verification steps.
* **Example Intent Scenarios (EN / VI)**:
  - *EN*: "Break down the Week 3-4 design deliverables into atomic developer tasks."
  - *VI*: "Chia nhỏ kế hoạch triển khai tuần 3 thành các đầu việc kỹ thuật cụ thể cho từng thành viên."
  - *VI*: "Lập danh sách task chi tiết kèm tiêu chí hoàn thành (Definition of Done)."

#### 12. `tdd`
* **Path**: `.agents/skills/tdd/SKILL.md`
* **Core Purpose**: Drives test-driven development (Red-Green-Refactor) with deep module design, interface boundaries, and unit/integration testing.
* **When to Activate (Intent)**:
  - Implementing domain business logic, payment calculation, or complex validations test-first.
* **Example Intent Scenarios (EN / VI)**:
  - *EN*: "Write tests first for the invoice total calculation and deposit deduction algorithm."
  - *VI*: "Áp dụng TDD để viết unit test cho hàm tính toán hóa đơn và cấn trừ tiền cọc trước khi viết code xử lý."

#### 13. `grill-me` & `grill-with-docs`
* **Path**: `.agents/skills/grill-me/SKILL.md` & `.agents/skills/grill-with-docs/SKILL.md`
* **Core Purpose**: Conducts an interview to stress-test designs, identify unstated assumptions, and generate documentation.
* **When to Activate (Intent)**:
  - Stress-testing architectural plans or business workflows before committing to development.
* **Example Intent Scenarios (EN / VI)**:
  - *EN*: "Grill me on our real-time table concurrency and reservation locking model."
  - *VI*: "Chất vấn và phản biện thiết kế luồng xử lý tranh chấp bàn ăn khi nhiều khách đặt cùng lúc."

#### 14. `improve-codebase-architecture`
* **Path**: `.agents/skills/improve-codebase-architecture/SKILL.md`
* **Core Purpose**: Scans codebase for deepening opportunities, module seams, and architectural improvements.
* **When to Activate (Intent)**:
  - Auditing repository health, module coupling, and Clean Architecture layer boundary integrity.
* **Example Intent Scenarios (EN / VI)**:
  - *EN*: "Audit our .NET solution for unintended layer dependencies or leaky abstractions."
  - *VI*: "Kiểm tra toàn bộ mã nguồn xem có vi phạm quy tắc phân tầng Clean Architecture hay không."

---

## 5. Phase-by-Phase Execution Guide

| Project Phase | Focus & Deliverables | Primary Skills to Invoke |
| :--- | :--- | :--- |
| **Weeks 1–2 (Proposal + Analysis)** | BRS, SRS (draft), Business Rules, User Stories, Scope definition | `prd-development`<br>`user-story-mapping`<br>`user-story`<br>`planning-with-files` |
| **Weeks 3–4 (Design & Architecture)** | Architecture blueprints, ADRs, Domain Model, ERD/Database Schema, OpenAPI Specs, Visual Diagrams | `clean-architecture`<br>`architecture-decision-records`<br>`database-schema-designer`<br>`openapi-spec-generation`<br>`drawio-skill`<br>`dotnet-backend-patterns` |
| **Weeks 5–6 (Setup & Scaffolding)** | Solution layout, MediatR CQRS pipeline, EF Core setup, React Vite setup | `clean-architecture`<br>`planning-and-task-breakdown`<br>`dotnet-backend-patterns` |
| **Weeks 7–8 (Coding & Feature Delivery)** | Waitstaff Ordering, Automated Thermal Printing, Billing & Payment | `dotnet-backend-patterns`<br>`tdd`<br>`planning-with-files` |
| **Weeks 9–10 (Polish & Verification)** | End-to-end testing, bug fixes, demo preparation | `improve-codebase-architecture`<br>`diagnose` |
