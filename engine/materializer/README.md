# @enistere/foundation-engine-materializer

Engine des missions E2 et E4 ([ADR-096](../../docs/adr/ADR-096-adapter-protocol-v0.md),
[ADR-098](../../docs/adr/ADR-098-materialization-record-and-proof-chain.md)) : hôte d'extensions,
MATERIALIZE et VERIFY. Agnostique du framework : un adapter n'est atteint que par son manifest.

| Module | Rôle |
|---|---|
| `host.ts` | `loadExtensions(dir)` : découvre les `manifest.json`, les valide, charge les adapters `TRUSTED_IN_PROCESS`, dérive le catalogue |
| `materialize.ts` | `planMaterialization` (sans I/O) et `materialize` : écrit `<workspace>/<composant>/` selon `decideWrite`, et enregistre un **MaterializationRecord (A8)** par composant dans `.foundation/records/` (révision n+1, la précédente passe SUPERSEDED) ; le dernier A8 est l'unique inventaire de propriété ; un composant en conflit n'est pas écrit (record CONFLICT retourné, non stocké) ; un plan reposant sur un waiver expiré à `executedAt` n'est pas appliqué (E6) ; instant `executedAt` injecté |
| `verify.ts` | `verifyWorkspace` : checks STRUCTURAL et, sur demande, TOOLCHAIN (sans shell, timeout, environnement en liste blanche) → EvidenceRecords A7 citant l'A8 vérifié dans `inputs` |

Tests : adapters de test dans `test/fixtures/` (serveur HTTP Node minimal, sans dépendance ni réseau).
