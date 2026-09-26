# @enistere/foundation-adapter-nestjs

Premier Runtime Adapter d'Enistere Foundation (mission E2, [ADR-096](../../../docs/adr/ADR-096-adapter-protocol-v0.md)),
écrit de zéro sur l'Adapter Protocol v0 ; réalise depuis E5 les contrats d'API partagés
([ADR-099](../../../docs/adr/ADR-099-domain-contract-projection.md)). Réalise les composants `api-service`
dont le runtime préféré est `nestjs`.

Projet matérialisé : NestJS 12 (ESM, TypeScript), versions exactes, `GET /health`, port par variable
d'environnement `PORT`, `Dockerfile` non-root.

Contrats partagés (`src/contract.ts`) : pour chaque contrat OpenAPI dont le composant est fournisseur,
le document du Kernel est embarqué tel quel (`contract/<contexte>.openapi.json`, servi par
`GET /contracts/<contexte>.openapi.json`) ; l'adapter en dérive les types, l'interface des handlers, le
contrôleur (entrées validées par Ajv contre les schémas du contrat → 400, erreurs déclarées → 422,
Problem Details) et le module. L'adapter ne relit jamais le Domain IR pour générer du code.

| Fichiers | Propriétaire |
|---|---|
| `src/extension/extension.module.ts`, `src/extension/<contexte>.handlers.ts` | Équipe du composant (seedés une fois ; les handlers répondent 501 jusqu'à implémentation) |
| Tout le reste | Compiler-owned |

Vérification déclarée dans [`manifest.json`](manifest.json) : `structure` (STRUCTURAL), puis `install`,
`build`, `boot` (`/health` = 200), `contract` (`scripts/contract-check.mjs` : document servi à l'identique,
400 sur entrée invalide, 501 sur opération non implémentée) et `audit` (TOOLCHAIN, job CI `adapters`).

Non couvert : capabilities (authentication, authorization, files : UNSUPPORTED listées, jamais simulées),
invariants exécutables, événements (transport), lockfile, Async Worker.
