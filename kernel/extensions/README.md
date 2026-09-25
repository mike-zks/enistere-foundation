# @enistere/foundation-kernel-extensions

Contrat de l'Adapter Protocol v0 (mission E2, [ADR-096](../../docs/adr/ADR-096-adapter-protocol-v0.md)).
Aucune I/O, aucun framework.

| Module | Rôle |
|---|---|
| `schemas/adapter-manifest.v0.schema.json` | Manifest d'un Runtime Adapter : ce qu'il réalise, mode d'exécution, permissions (jamais de secret), outils, checks de vérification, point d'entrée |
| `manifest.ts` | `validateManifest` (interpréteur de schémas du Kernel) ; `catalogFromManifests` → descripteurs du catalogue E1, validés par `validateCatalog` |
| `adapter.ts` | Interface `RuntimeAdapter` ; `planArtifacts` : chemins sûrs, digests, ownership bornée par la classe du composant |
| `ownership.ts` | `decideWrite` : CREATE, UPDATE, UNCHANGED, KEEP_OWNER ou CONFLICT — aucun overwrite silencieux (FR-OWN-02) |
