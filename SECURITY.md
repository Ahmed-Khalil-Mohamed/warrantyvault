# Security policy for WarrantyVault

## Report privately

Use [GitHub private vulnerability reporting](https://github.com/Ahmed-Khalil-Mohamed/warrantyvault/security/advisories/new) for authentication bypasses, unauthorized data access, unsafe file operations or other security vulnerabilities. Do not open a public issue with exploit details, personal records or credentials. Include the affected version, a minimal reproduction using fictional data, impact, and any proposed mitigation. No response-time guarantee is made.

## Supported release

Security fixes target the latest published release. Older versions may require an upgrade. This is a local portfolio application, not a security-audited managed service. Local SQLite databases are not encrypted by the application. Read [architecture](docs/ARCHITECTURE.md) and [deployment](docs/DEPLOYMENT.md) before hosting it.

Dependencies are locked. Run `npm audit`, review advisories, execute the complete test suite and rebuild desktop distributions when updating Electron. Never attach databases, session cookies, passwords or private file paths to a public report.
