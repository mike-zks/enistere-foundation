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

## Laboratoire (couche de compatibilité)

```sh
npm run factory:test             # pipeline historique, conformance, parité, fitness functions
npm run contracts:check          # bindings polyglottes à jour
npm run design:check             # contrat design à jour
npm run typecheck && npm test    # packages api-contracts / api-client-fetch
node factory/quality/scripts/docs-link-check.mjs   # liens de la documentation
```

Les starters (NestJS, Spring, FastAPI, Next.js, Angular, React Native, Flutter) ont leurs propres
prérequis ; voir leur README.
