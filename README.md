# LP Portal

An open-source LP portal being built for **emerging venture fund managers and angel investors**. The goal is a focused, affordable alternative to platforms designed for much larger funds: a clean investor experience for LPs and a practical operating workspace for GPs.

> **Project status: Phase 2 prototype.** The core product and CRM-assisted update workflows are being built and tested, but this is not yet ready for a GP to download and use with live fund or investor data.

## The product we are building

### For LPs

- A clear view of committed, called, outstanding, and distributed capital
- Estimated portfolio value and position-level look-through
- Consolidated and per-fund views for LPs invested across multiple funds
- Quarterly update archive
- Passwordless access

LP estimated value is computed from the LP's fund ownership and the fund's current company marks. It is not stored as a separate value for each LP. Updating a company mark once can therefore flow through to every affected investor view.

### For GPs

- Administration for funds, LPs, portfolio companies, positions, and team members
- A quarterly update composer with preview and publishing workflows
- Pipedrive context attached to portfolio company records
- AI-assisted update drafting governed by an editable writing style
- System and integration health views

AI-generated copy is intended to remain an editable draft. It is never meant to publish automatically or replace GP review.

## Progress

| Phase | Scope | Status |
|---|---|---|
| **P1** | Core LP experience and GP administration | Prototype complete |
| **P2** | Pipedrive workflows and AI-assisted quarterly update drafting | In progress |
| **P3** | Automated news scanning, GP approval queue, LP news feed, and audit log | Planned |
| **Release** | Production hardening, setup documentation, security review, and a supported GP deployment path | Planned |

The current repository includes the P1 product surface and active P2 work, including Pipedrive connection and sync flows, AI drafting endpoints, a configurable writing-style interface, and integration monitoring. Some screens and records still use demonstration data, and the end-to-end production workflows have not yet been completed or validated with a live fund.

## Can a GP download and use it today?

Not yet—not for real fund operations.

Developers can clone and run the prototype locally to evaluate the product direction. A GP-ready release will require, at minimum:

- Persistent, production-tested data flows throughout the application
- Complete authentication, authorization, and tenant/data-isolation verification
- Reliable email delivery and publish/retry behavior
- Finished migrations, seed/onboarding tools, and environment documentation
- Integration failure handling, rate limits, and operational monitoring
- Backup and recovery guidance
- Security and privacy review for sensitive investor and fund data
- A documented, repeatable deployment process

When those items are complete, the intended experience is that a GP can clone or download the project, connect the required services, create an initial admin and fund, import or enter portfolio data, and deploy their own instance. Until then, use only synthetic or non-sensitive test data.

## Run the prototype locally

### Prerequisites

- Node.js 22.13 or newer
- npm

```bash
git clone <repository-url>
cd LPPortal
npm install
npm run dev
```

Then open the local URL printed by the development server.

Useful checks:

```bash
npm test
npm run lint
npm run build
```

The prototype uses Vinext/Next.js, React, TypeScript, Drizzle, and Cloudflare-compatible bindings. Exact production environment variables and deployment instructions will be documented before the first GP-ready release.

## Intended operating model and cost

The project is designed to be self-hosted on modest infrastructure without per-seat software fees. Final hosting requirements and a reference monthly cost will be published after the persistence, email, AI, CRM, and scheduled-job architecture has been validated in production-like testing.

Operators will be responsible for their own infrastructure and third-party service accounts, including any email, CRM, and AI usage.

## Scope

LP Portal is deliberately aimed at small funds. It is not a fund-accounting system and currently does not attempt to provide:

- Capital-call issuance or wire tracking
- A full transaction ledger
- Waterfall, carry, or management-fee calculations
- Audit-grade reporting
- Multi-currency conversion
- A document vault, e-signature, or LP messaging system

Capital account figures are GP-maintained balances, and SAFEs without share counts are supported by modeling the fund's mark and the LP's ownership of the fund.

## Roadmap to a GP-ready release

The near-term priority is completing P2, replacing remaining demonstration behavior with persisted end-to-end workflows, and validating the quarterly update process. P3 automation follows after the core product is dependable. Packaging, onboarding, documentation, and production hardening will then turn the prototype into something a GP can responsibly download and operate.

See [the product requirements](tasks/prd-lp-portal.md) for the detailed scope and acceptance criteria.

## License

A distribution license has not yet been added. The intended open-source license and final reuse terms will be established before the first downloadable GP-ready release.
