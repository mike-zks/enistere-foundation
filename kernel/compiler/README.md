# @enistere/foundation-kernel-compiler

Kernel Façade et chaîne de compilation native (mission E1, [ADR-095](../../docs/adr/ADR-095-e1-kernel-facade.md)).

```
validate → System Closure → System IR → resolve (ResolvedSystem) → plan (ExecutionPlan)
```

| Module | Rôle |
|---|---|
| `closure.ts` | Fermeture transitive des références épinglées de la System Definition en vigueur (A1, A2, A3, A5), version du compiler et digest du catalogue ; exclut Change Requests et Evidence |
| `ir.ts` | Représentation normalisée (triée, défauts explicites, items de domaine épinglés) ; indépendante de l'ordre d'écriture |
| `catalog.ts` | Catalogue d'extensions **en données** (adapters de runtime, fournisseurs de capabilities) ; refuse doublons et chevauchements |
| `resolve.ts` | Préférences de runtime dans l'ordre déclaré ; repli tracé ; UNSUPPORTED explicite, jamais de fallback silencieux |
| `plan.ts` | Plan agnostique, sans écriture : `MATERIALIZE`, `CONNECT_EXTERNAL`, `BIND_CAPABILITY`, `ownerWork`, obligations de preuve |
| `facade.ts` | `createKernelFacade()` : `validate`, `resolve`, `plan` ; résultats JSON déterministes |

Invariants prouvés par `test/compiler.test.ts` : un ensemble ou un catalogue invalide n'est jamais
résolu ; seule la System Definition en vigueur est compilée ; mêmes entrées → mêmes octets ; aucun nom
de framework dans `src/` (TA-04). Les runtimes n'existent que comme données du catalogue ; aucun adapter
réel avant l'Adapter Protocol (E2).
