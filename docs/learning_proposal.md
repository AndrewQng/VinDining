# Learning Proposal: Secrets & Sensitive Configurations Management

## Summary of Learning

The user requested that all sensitive configurations (Database connection strings, JWT Secret keys, API keys, Payment secrets, Cloud credentials) MUST be stored in `.env` files and loaded via environment variables, never hardcoded in tracked source code, and `.env` must be added to `.gitignore` with `.env.example` templates provided.

## Proposed Classification

- **Type**: Workspace Rule
- **Target File**: [.agents/AGENTS.md](file:///d:/Doanandroid/Đồ%20án%20CDTH/VinDining/.agents/AGENTS.md)

## Proposed Diff

```diff
+ ## Secrets & Environment Configuration
+ - **No Hardcoded Secrets**: Never commit sensitive information (database credentials, JWT secrets, payment API keys, webhook secrets, SMTP passwords) to source code or tracked config files.
+ - **Environment Variables (.env)**: Always store secrets in `.env` files (loaded via `DotNetEnv` in .NET backend and `import.meta.env` in Vite frontend).
+ - **Template Files (.env.example)**: Always maintain `.env.example` files with placeholder values for onboarding and documentation.
+ - **Git Protection**: Ensure `.env`, `.env.local`, and `appsettings.Development.json` containing real secrets are strictly ignored in `.gitignore`.
```
