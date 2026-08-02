# Contrats canoniques

Ce répertoire contient les données contractuelles indépendantes des frameworks,
selon [`CONTRACT_ARCHITECTURE.md`](../docs/architecture/CONTRACT_ARCHITECTURE.md).

- `schemas/api-error-response.v1.schema.json` est la source canonique de
  `ApiErrorResponse` ;
- `scripts/generate-bindings.mjs` produit les représentations TypeScript, Java,
  Python et Dart suivies dans le dépôt ;
- les documents OpenAPI propres à une autorité restent des contrats de transport.
  En particulier, `packages/api-contracts/contract/openapi.json` décrit aujourd'hui
  la composition NestJS complète et ne prétend pas décrire les routes FastAPI ou
  Spring.

Commandes :

```bash
npm run contracts:generate
npm run contracts:check
```

Les fichiers générés portent un en-tête et ne doivent pas être modifiés à la main.
Le mode `--check` ne modifie rien et échoue dès qu'un binding diverge du schéma.
