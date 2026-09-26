# @enistere/foundation-adapter-nestjs

Premier Runtime Adapter d'Enistere Foundation (mission E2, [ADR-096](../../../docs/adr/ADR-096-adapter-protocol-v0.md)),
écrit de zéro sur l'Adapter Protocol v0. Réalise les composants `api-service` dont le runtime préféré est
`nestjs`.

Projet matérialisé : NestJS 12 (ESM, TypeScript), versions exactes, `GET /health`, port par variable
d'environnement `PORT`, `Dockerfile` non-root. Tous les fichiers sont compiler-owned sauf
`src/extension/**` (seedé une fois, puis propriété de l'équipe du composant).

Vérification déclarée dans [`manifest.json`](manifest.json) : `structure` (STRUCTURAL), puis `install`,
`build`, `boot` (`/health` = 200) et `audit` (TOOLCHAIN, job CI `adapters`).

Non couvert : domaine (E5), capabilities (authentication, authorization, files : UNSUPPORTED listées),
lockfile, Async Worker.
