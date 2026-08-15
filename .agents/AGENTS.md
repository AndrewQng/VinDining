## Godot C# Script Naming
- **Filename Match**: Every C# script attached to a node or autoload MUST contain a class name that EXACTLY matches its filename (case-sensitive). 
- If you rename a file, you must rename the class, and vice versa. Mismatches cause `can_instantiate` or "does not inherit from 'Node'" errors.

## Software Design Principles (SOLID)
- **Single Responsibility Principle (SRP)**: Each class, controller, service, handler, or React component must have one reason to change. Keep business logic, validation, data access, and UI rendering cleanly decoupled.
- **Open/Closed Principle (OCP)**: Design components and pipelines to be open for extension but closed for modification using abstractions, MediatR pipeline behaviors, and strategy patterns.
- **Liskov Substitution Principle (LSP)**: Derived classes and interface implementations must strictly honor the contracts of their base types without unexpected side effects.
- **Interface Segregation Principle (ISP)**: Create focused, client-specific interfaces rather than broad, bloated interfaces (e.g., separate read/write repositories or specific domain service contracts).
- **Dependency Inversion Principle (DIP)**: Depend upon abstractions (interfaces) rather than concrete implementations. Always use Dependency Injection across Domain, Application, Infrastructure, and API layers.

## Secrets & Environment Configuration
- **No Hardcoded Secrets**: Never commit sensitive information (database credentials, JWT secrets, payment API keys, webhook secrets, SMTP passwords) to source code or tracked config files.
- **Environment Variables (.env)**: Always store secrets in `.env` files (loaded via `DotNetEnv` in .NET backend and `import.meta.env` in Vite frontend).
- **Template Files (.env.example)**: Always maintain `.env.example` files with placeholder values for onboarding and documentation.
- **Git Protection**: Ensure `.env`, `.env.local`, and local secret files are strictly ignored in `.gitignore`.

## Agent skills

### Issue tracker

GitHub Issues using the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Canonical 5-role triage label vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout (`CONTEXT.md` and `docs/adr/` at repo root). See `docs/agents/domain.md`.
