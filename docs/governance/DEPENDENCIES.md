# Dépendances critiques

Registre des dépendances dont la défaillance ou l'évolution affecte le produit (document 05 §2D).
Politique d'ajout : [`DEPENDENCY_POLICY.md`](DEPENDENCY_POLICY.md).

## Runtimes et outillage

| Dépendance | Version | Utilisée par | Criticité | Remarque |
|---|---|---|---|---|
| Node.js | ≥ 22.18 (CI : 24) | Kernel (exécution TypeScript native), laboratoire, CI | Haute | Type stripping requis par `kernel/contracts` |
| npm workspaces | npm 10/11 | Monorepo | Haute | Lockfile `package-lock.json` versionné |
| TypeScript | ^5.9.3 | Typage du Kernel et des goldens (`tsc --noEmit`) | Moyenne | Aucune émission de build en E0 |
| Ajv | ^8.20.0 | Validation structurelle des contrats A1–A7 (seule dépendance d'exécution du Kernel) | Haute | Draft 2020-12, mode strict |
| JDK / Python / Dart / Flutter / Maven | selon starters | Laboratoire (Spring, FastAPI, Flutter...) | Moyenne | Hors Kernel |

## Contrats externes

| Standard | Usage |
|---|---|
| JSON Schema draft 2020-12 | Schémas des contrats A1–A7 |
| RFC 8785 (JCS) + SHA-256 | Sérialisation canonique et digests |
| RFC 6901 (JSON Pointer) | Chemins des diagnostics et des changements A6 |
| RFC 3339 | Horodatages des contrats |
| OpenAPI 3, Protobuf/gRPC, CloudEvents, OCI, CycloneDX/SPDX | Cible (document 03 §6.12) — non utilisés en E0 |

## Services partagés de la plateforme Enistere

Définis par [`docs/Server Prod/`](../Server%20Prod/ARCHITECTURE.md) ; aucun n'est consommé par Foundation
à ce jour.

| Service | Rôle attendu pour Foundation | Statut |
|---|---|---|
| Traefik + Cloudflare (DNS, WAF, TLS, Access) | Entrée HTTP/HTTPS unique | Non utilisé |
| Keycloak commun (`auth.enistere.com`, un realm par projet) | OIDC du Control Plane et du Workbench | Non utilisé ; realm `foundation` à créer |
| PostgreSQL partagé (`enistere_data`) | Store transactionnel du Control Plane | Non utilisé |
| Redis partagé | Cache non autoritatif | Non utilisé |
| Cloudflare R2 (S3) | Bundles signés, artefacts du registry, exports d'Evidence | Non utilisé |
| Restic → Backblaze B2 | Sauvegarde | Non utilisé |
| Prometheus, Grafana, Loki, Uptime Kuma | Observabilité | Non utilisé |
| RabbitMQ partagé | Mentionné par le document 05 ; absent de l'architecture de production | Non disponible — ADR requis |
