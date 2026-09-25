# Développement local

## Prérequis

- Node.js ≥ 22.18 (retrait de types natif pour exécuter le TypeScript du Kernel) ; la CI utilise Node 24.
- npm (workspaces). Aucune base de données, aucun secret, aucun réseau requis pour le Kernel.

## Installation

```sh
npm ci
```

## Kernel E0 et golden Asteria

```sh
npm run foundation:typecheck     # tsc --noEmit sur kernel/contracts (+ goldens importés)
npm run foundation:test          # node --test : primitives, schémas, autorité, A1–A7, ensemble, golden
npm run golden:asteria:update    # régénère goldens/asteria depuis source.ts via le Kernel et le checker
git status --porcelain goldens/  # doit être vide si rien n'a changé
```

Modifier le golden : éditer `goldens/asteria/source.ts` (jamais les JSON générés), relancer
`golden:asteria:update`, relire le diff (contrats, preuves, `expected/report.json`), puis les tests.
`update.ts` refuse d'écrire un golden dont l'ensemble de contrats est invalide.

## Outillage du dépôt

```sh
npm run tools:test               # tests de tools/quality
npm run secrets:allowlist        # exceptions gitleaks justifiées et non expirées
npm run docs:links               # aucun lien interne mort (docs/archive exclu)
npm audit --audit-level=high     # dépendances
```

Ce sont les commandes des quatre checks requis de la CI ([`.github/workflows/README.md`](../../.github/workflows/README.md)).
