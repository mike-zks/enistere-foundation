# Enistere Foundation

Enistere Foundation est une **Software System Engineering Platform** dotée d'un **Governed System
Compiler** et d'un **Evidence-Driven System Evolution Engine** : elle transforme une intention
d'ingénierie en systèmes logiciels natifs, gouvernés et vérifiables, puis maintient leur cohérence dans
le temps. Les systèmes produits restent source-owned et ne dépendent pas de Foundation pour fonctionner.

Point d'entrée : [`CONTEXT.md`](CONTEXT.md) — vision, sources de vérité, mission courante.
État réel : [`CURRENT_STATE.md`](CURRENT_STATE.md) · couverture prouvée :
[`IMPLEMENTATION_MATRIX.md`](IMPLEMENTATION_MATRIX.md) · agents et contributeurs : [`AGENTS.md`](AGENTS.md).

## Dépôt

| Dossier | Rôle |
|---|---|
| `kernel/contracts/` | Foundation Kernel — contrats A1–A7 et primitives partagées (mission E0) |
| `kernel/compiler/` | Kernel Façade — validate → System Closure → System IR → résolution → plan (mission E1) |
| `kernel/extensions/` | Adapter Protocol v0 : manifest, contrat d'adapter, règle d'ownership (mission E2) |
| `engine/materializer/` | Hôte d'extensions, MATERIALIZE, VERIFY → EvidenceRecords (mission E2) |
| `extensions/runtimes/nestjs/` | Premier Runtime Adapter (NestJS, `api-service`) |
| `surfaces/cli/` | CLI headless `enistere-foundation` (validate, resolve, plan) |
| `goldens/asteria/` | Golden de transition Asteria (Requester Web, Internal Ops Web, Field Mobile, Authority API, Async Worker) |
| `tools/quality/` | Outillage du dépôt : discipline de l'allowlist gitleaks, liens de documentation |
| `docs/` | Dossier projet 01–07, production Enistere, ADR, gouvernance, runbooks |

## Démarrage local

Prérequis : Node.js ≥ 22.18 (CI : Node 24), npm.

```sh
npm ci
npm run foundation:typecheck   # Kernel, CLI, golden
npm run foundation:test        # contrats A1–A7, compiler, CLI, golden Asteria
npm run golden:asteria:update  # régénère le golden (diff attendu vide)
```

Compiler le golden Asteria :

```sh
node surfaces/cli/src/cli.ts plan goldens/asteria/contracts goldens/asteria/evidence \
  --catalog goldens/asteria/sources/catalog.json
```

Détails : [`docs/runbooks/LOCAL_DEVELOPMENT.md`](docs/runbooks/LOCAL_DEVELOPMENT.md).

L'itération précédente du dépôt (générateur, starters, capabilities), jamais mise en production, a été
supprimée pour repartir sur une base unique ([ADR-094](docs/adr/ADR-094-clean-slate.md)) ; son dernier
état reste dans l'historique Git (commit `f2590a8`).

## Documentation de référence

- Dossier projet : documents [01 à 07](docs/README.md#dossier-projet-sources-de-vérité-cible) dans `docs/`.
- Production Enistere : [`docs/Server Prod/`](docs/Server%20Prod/README.md).
- Décisions : [`DECISIONS.md`](DECISIONS.md) et [`docs/adr/`](docs/adr/README.md).
- Feuille de route : [`ROADMAP.md`](ROADMAP.md) · mission suivante : [`BACKLOG.md`](BACKLOG.md).
- Sécurité : [`SECURITY.md`](SECURITY.md) · contributions : [`CONTRIBUTING.md`](CONTRIBUTING.md).
