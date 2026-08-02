# @enistere/api-contracts

> **Binding TypeScript des contrats Enistere.** Les modèles neutres proviennent de `contracts/` ;
> les types d'opérations HTTP décrivent encore la composition NestJS complète pendant la migration
> ADR-088. Aucune logique Auth ni dépendance de framework UI.
> **Distribué en tarball GitHub Release** (version `0.1.0`, tag `packages-api-typescript-v0.1.0`).

## Rôle

Cible TypeScript des contrats Enistere : modèles neutres, `paths`, `components`, `operations` et
helpers. Consommé par [`@enistere/api-client-fetch`](../api-client-fetch) et les applications
TypeScript qui en ont réellement besoin.

## Source

[`contract/openapi.json`](contract/openapi.json) est un snapshot local de la surface **NestJS
composée** (base + auth + rbac + files), jamais une URL de production. Il n'est pas la source
polyglotte des routes Spring ou FastAPI. Les schémas neutres vivent sous [`../../contracts`](../../contracts/README.md) ;
`ApiErrorResponse` en est la première tranche. Les fichiers sous `src/generated/` sont générés et
ne doivent jamais être édités à la main.

## Commandes

```bash
npm run generate         # (ré)génère src/generated/schema.ts (déterministe)
npm run generate:check   # échoue (RC=1) si l'artefact suivi diverge du contrat (génère en temp, compare, nettoie)
npm run typecheck        # TypeScript strict
npm run build            # émet dist/ (types + index)
npm run test             # vérifie 14 opérations, formes, absence de champs sensibles
npm run pack:dry-run     # vérifie le contenu distribuable sans publier
```

## Imports

```ts
import type {
  paths, components, operations,        // types bruts openapi-typescript
  ApiPaths, ApiOperations, ApiComponents, ApiSchemas,
  SchemaOf, ApiErrorResponse,
  OperationJsonRequestBody, OperationJsonResponse,
} from '@enistere/api-contracts';

type File = SchemaOf<'PublicStoredFileDto'>;          // { size: string; category: 'IMAGE' | ...; ... }
type LoginBody = OperationJsonRequestBody<'auth_login'>;
type LoginOk = OperationJsonResponse<'auth_login', 200>;
```

## Garanties

- **Types-only** : l'`index.js` émis est quasi vide et `sideEffects: false`.
- **Déterministe** : deux générations produisent un fichier identique ; `generate:check` détecte toute
  divergence contrat↔types.
- **Sans fuite** : aucun modèle Prisma, secret ni champ interne dans les types générés.
- **Limite explicite** : les opérations HTTP restent celles du transport NestJS jusqu'à la composition
  neutre décidée par ADR-088.

## Versionnement

`0.1.0` (pré-1.0). Un changement cassant du binding (renommage d'`operationId`, suppression de champ,
etc.) entraîne une montée de version coordonnée avec ses consommateurs.
La détection de breaking changes (oasdiff) relèvera de la CI (ADR-013), hors de ce package.

Distribution cible décidée : **GitHub Packages npm registry** pour le scope `@enistere/*`, avec repli
gouverné par artefacts **GitHub Release** (`npm pack` tarballs). La première distribution utilise le
repli GitHub Release :

```bash
npm install \
  https://github.com/mike-zks/enistere-os-foundation/releases/download/packages-api-typescript-v0.1.0/enistere-api-contracts-0.1.0.tgz
```

Pour consommer le client Fetch, installer les deux tarballs dans la même commande afin de satisfaire la
dépendance `@enistere/api-contracts@0.1.0`.

En environnement restreint où le cache npm utilisateur est en lecture seule, exécuter le dry-run avec un
cache temporaire :

```bash
npm_config_cache=/tmp/enistere-npm-cache npm run pack:dry-run --workspace=@enistere/api-contracts
```

## Interdiction

Ne pas modifier `src/generated/schema.ts` à la main. Toute évolution passe par le contrat + `npm run
generate`. La publication GitHub Packages npm registry reste différée ; la distribution actuelle est le
tarball GitHub Release.
