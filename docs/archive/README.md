# Archives

Documents **non autoritaires**, conservés comme preuves historiques
([ADR-091](../adr/ADR-091-foundation-dossier-authority-and-laboratory-status.md)). Ils ont été déplacés
sans modification de fond le 2026-09-25 (ADR-091, ADR-093 pour R0-C, puis ADR-094 pour R0-D). Le code de
l'itération précédente a été supprimé (ADR-094 ; dernier état au commit `f2590a8`) : les liens des
documents archivés vers ce code sont morts et ne sont pas réécrits. Le contrôle des liens ignore
`archive/`.

| Chemin | Ancien emplacement | Remplacé par |
|---|---|---|
| [`laboratory/MANDAT.md`](laboratory/MANDAT.md) | `MANDAT.md` | Dossier 01–07, [`AGENTS.md`](../../AGENTS.md), ADR-091 |
| `laboratory/project-status/` | `docs/project-status/` | [`CURRENT_STATE.md`](../../CURRENT_STATE.md), [`IMPLEMENTATION_MATRIX.md`](../../IMPLEMENTATION_MATRIX.md), [`BACKLOG.md`](../../BACKLOG.md) |
| `laboratory/roadmap/` | `docs/roadmap/` | Document 06, [`ROADMAP.md`](../../ROADMAP.md) |
| `laboratory/strategy/` | `docs/strategy/` | Documents 01, 02 et 07 |
| `laboratory/audits/` | `docs/audits/` | Préflight et gap analysis du rapport E0 ([`CURRENT_STATE.md`](../../CURRENT_STATE.md)) |
| `laboratory/ai-prompts/`, `laboratory/ai-runtime/` | `factory/ai/prompts/`, registre et script de validation, `AI_PROMPT_GOVERNANCE.md`, `AI_CORE_USAGE_RUNBOOK.md` | AI Gateway / Agent Runtime cible (CAP-11) |
| `laboratory/deployment/` | `deployment/staging/`, `deployment/docs/` | [`docs/Server Prod/`](../Server%20Prod/README.md), [`PRODUCTION_READINESS.md`](../governance/PRODUCTION_READINESS.md), [`runbooks/`](../runbooks/README.md) (ADR-093) |
| `laboratory/factory-templates/` | `factory/templates/` | Gabarit ADR de [`docs/adr/README.md`](../adr/README.md) |
| `laboratory/examples/reference-systems/` | `docs/examples/reference-systems/` | Golden [`goldens/asteria/`](../../goldens/asteria/README.md) |
| `laboratory/adr/` | `docs/adr/ADR-001` → `ADR-090` (sauf ADR-073), `ADR_BACKLOG.md` | [`docs/adr/`](../adr/README.md), ADR-091 et suivants (ADR-094) |
| `laboratory/specifications/`, `laboratory/architecture/`, `laboratory/checklists/`, `laboratory/guides/`, `laboratory/project-factory/` | `docs/…` du même nom | Dossier 01–07, [`kernel/contracts`](../../kernel/contracts/README.md), [`.github/workflows/README.md`](../../.github/workflows/README.md) (ADR-094) |
| `laboratory/GLOSSARY.md`, `laboratory/onboarding/` | `docs/glossary/`, `docs/onboarding/` | [`GLOSSARY.md`](../glossary/GLOSSARY.md), [`ONBOARDING.md`](../onboarding/ONBOARDING.md) |

Les audits restent utiles comme preuves des écarts mesurés du laboratoire (juillet–août 2026) ; leurs
conclusions ne valent pas état courant.
