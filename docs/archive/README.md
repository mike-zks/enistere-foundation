# Archives

Documents **non autoritaires**, conservés comme preuves historiques
([ADR-091](../adr/ADR-091-foundation-dossier-authority-and-laboratory-status.md)). Ils ont été déplacés
sans modification de fond le 2026-09-25 (ADR-091, puis ADR-093 pour la mission R0-C) ; seuls leurs liens
relatifs ont été réécrits.

| Chemin | Ancien emplacement | Remplacé par |
|---|---|---|
| [`laboratory/MANDAT.md`](laboratory/MANDAT.md) | `MANDAT.md` | Dossier 01–07, [`AGENTS.md`](../../AGENTS.md), ADR-091 |
| `laboratory/project-status/` (sauf `PROFILE_MATRIX.md`, relogé dans [`docs/project-factory/`](../project-factory/PROFILE_MATRIX.md) car contrôlé par les tests du registre de profils) | `docs/project-status/` | [`CURRENT_STATE.md`](../../CURRENT_STATE.md), [`IMPLEMENTATION_MATRIX.md`](../../IMPLEMENTATION_MATRIX.md), [`BACKLOG.md`](../../BACKLOG.md) |
| `laboratory/roadmap/` | `docs/roadmap/` | Document 06, [`ROADMAP.md`](../../ROADMAP.md) |
| `laboratory/strategy/` | `docs/strategy/` | Documents 01, 02 et 07 |
| `laboratory/audits/` | `docs/audits/` | Préflight et gap analysis du rapport E0 ([`CURRENT_STATE.md`](../../CURRENT_STATE.md)) |
| `laboratory/ai-prompts/`, `laboratory/ai-runtime/` | `factory/ai/prompts/`, registre et script de validation, `AI_PROMPT_GOVERNANCE.md`, `AI_CORE_USAGE_RUNBOOK.md` | AI Gateway / Agent Runtime cible (CAP-11) ; primitives conservées dans `factory/ai/runtime` (ADR-093) |
| `laboratory/deployment/` | `deployment/staging/`, `deployment/docs/` | [`docs/Server Prod/`](../Server%20Prod/README.md), [`PRODUCTION_READINESS.md`](../governance/PRODUCTION_READINESS.md), [`runbooks/`](../runbooks/README.md) (ADR-093) |
| `laboratory/factory-templates/` | `factory/templates/` | Gabarit ADR de [`docs/adr/README.md`](../adr/README.md) |
| `laboratory/examples/reference-systems/` | `docs/examples/reference-systems/` | Golden [`goldens/asteria/`](../../goldens/asteria/README.md) |
| `laboratory/GLOSSARY.md`, `laboratory/onboarding/` | `docs/glossary/`, `docs/onboarding/` | [`GLOSSARY.md`](../glossary/GLOSSARY.md), [`ONBOARDING.md`](../onboarding/ONBOARDING.md) |

Les audits restent utiles comme preuves des écarts mesurés du laboratoire (juillet–août 2026) ; leurs
conclusions ne valent pas état courant.
