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
| `goldens/asteria/` | Golden de transition Asteria (Requester Web, Internal Ops Web, Field Mobile, Authority API, Async Worker) |
| `factory/`, `starters/`, `capabilities/`, `packages/`, `contracts/`, `deployment/` | Laboratoire historique — couche de compatibilité jusqu'au cutover E10 ([ADR-091](docs/adr/ADR-091-foundation-dossier-authority-and-laboratory-status.md)) |
| `docs/` | Dossier projet 01–07, production Enistere, ADR, gouvernance, runbooks |

## Démarrage local

Prérequis : Node.js ≥ 22.18 (CI : Node 24), npm.

```sh
npm ci
npm run foundation:typecheck   # Kernel E0 + golden
npm run foundation:test        # contrats A1–A7, ensemble fermé, golden Asteria
npm run factory:test           # laboratoire (pipeline historique, conformance)
```

Détails : [`docs/runbooks/LOCAL_DEVELOPMENT.md`](docs/runbooks/LOCAL_DEVELOPMENT.md).

## Documentation de référence

- Dossier projet : documents [01 à 07](docs/README.md#dossier-projet-sources-de-vérité-cible) dans `docs/`.
- Production Enistere : [`docs/Server Prod/`](docs/Server%20Prod/README.md).
- Décisions : [`DECISIONS.md`](DECISIONS.md) et [`docs/adr/`](docs/adr/README.md).
- Feuille de route : [`ROADMAP.md`](ROADMAP.md) · mission suivante : [`BACKLOG.md`](BACKLOG.md).
- Sécurité : [`SECURITY.md`](SECURITY.md) · contributions : [`CONTRIBUTING.md`](CONTRIBUTING.md).
