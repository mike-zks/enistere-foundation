# @enistere/foundation-engine-materializer

Engine de la mission E2 ([ADR-096](../../docs/adr/ADR-096-adapter-protocol-v0.md)) : hôte d'extensions,
MATERIALIZE et VERIFY. Agnostique du framework : un adapter n'est atteint que par son manifest.

| Module | Rôle |
|---|---|
| `host.ts` | `loadExtensions(dir)` : découvre les `manifest.json`, les valide, charge les adapters `TRUSTED_IN_PROCESS`, dérive le catalogue |
| `materialize.ts` | `planMaterialization` (sans I/O) et `materialize` : écrit `<workspace>/<composant>/` selon `decideWrite`, avec l'inventaire `.foundation/inventory.json` ; un composant en conflit n'est pas écrit |
| `verify.ts` | `verifyWorkspace` : checks STRUCTURAL et, sur demande, TOOLCHAIN (sans shell, timeout, environnement en liste blanche) → EvidenceRecords A7 |

Tests : adapters de test dans `test/fixtures/` (serveur HTTP Node minimal, sans dépendance ni réseau).
