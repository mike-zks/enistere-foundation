# Développement local

## Prérequis

- Node.js ≥ 22.18 (retrait de types natif pour exécuter le TypeScript du Kernel) ; la CI utilise Node 24.
- npm (workspaces). Aucune base de données, aucun secret, aucun réseau requis pour le Kernel.

## Installation

```sh
npm ci
```

## Kernel, CLI et golden Asteria

```sh
npm run foundation:typecheck     # tsc --noEmit sur chaque workspace (kernel/*, surfaces/*) et les goldens importés
npm run foundation:test          # node --test : contrats A1–A7, compiler (closure, IR, résolution, plan, façade), CLI, golden
npm run golden:asteria:update    # régénère goldens/asteria depuis source.ts via le Kernel et le checker
git status --porcelain goldens/  # doit être vide si rien n'a changé
```

Modifier le golden : éditer `goldens/asteria/source.ts` (jamais les JSON générés), relancer
`golden:asteria:update`, relire le diff (contrats, preuves, `expected/report.json`), puis les tests.
`update.ts` refuse d'écrire un golden dont l'ensemble de contrats est invalide.

## Compiler un ensemble de contrats (Kernel Façade)

```sh
node surfaces/cli/src/cli.ts validate goldens/asteria/contracts goldens/asteria/evidence
node surfaces/cli/src/cli.ts plan goldens/asteria/contracts goldens/asteria/evidence \
  --catalog goldens/asteria/sources/catalog.json   # PARTIAL (code 2) : 2 éléments UNSUPPORTED listés
```

Sans `--catalog`, le catalogue est vide et chaque composant est UNSUPPORTED : aucun adapter réel n'existe
avant E2. Codes de sortie : [`surfaces/cli/README.md`](../../surfaces/cli/README.md).

## Outillage du dépôt

```sh
npm run tools:test               # tests de tools/quality
npm run secrets:allowlist        # exceptions gitleaks justifiées et non expirées
npm run docs:links               # aucun lien interne mort (docs/archive exclu)
npm audit --audit-level=high     # dépendances
```

Ce sont les commandes des quatre checks requis de la CI ([`.github/workflows/README.md`](../../.github/workflows/README.md)).
