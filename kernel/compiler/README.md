# @enistere/foundation-kernel-compiler

Kernel Façade et chaîne de compilation native (mission E1, [ADR-095](../../docs/adr/ADR-095-e1-kernel-facade.md)).

```
validate → System Closure → System IR → resolve (ResolvedSystem) → plan (ExecutionPlan)
```

| Module | Rôle |
|---|---|
| `closure.ts` | Fermeture transitive des références épinglées de la System Definition en vigueur (A1, A2, A3, A5), version du compiler et digest du catalogue ; exclut Change Requests et Evidence |
| `ir.ts` | Représentation normalisée (triée, défauts explicites, items de domaine épinglés) ; indépendante de l'ordre d'écriture ; porte les Domain IR et les bindings opérations/événements ↔ composants ; liste l'intention non réalisée (E3) |
| `domain-ir.ts` | Domain IR dérivé d'un Domain Contract : types résolus, références épinglées, facets conservées mais non interprétées (E3, [ADR-097](../../docs/adr/ADR-097-domain-ir.md)) |
| `catalog.ts` | Catalogue d'extensions **en données** (adapters de runtime, fournisseurs de capabilities) ; refuse doublons et chevauchements |
| `resolve.ts` | Préférences de runtime dans l'ordre déclaré ; repli tracé ; UNSUPPORTED explicite, jamais de fallback silencieux |
| `api-contract.ts` | Projection du Domain IR en contrat OpenAPI 3.1 partagé, par domaine et fournisseur ; autorisation = intention de domaine ; indépendant du catalogue (E5, [ADR-099](../../docs/adr/ADR-099-domain-contract-projection.md)) |
| `proof-chain.ts` | Export et vérification de la proof chain v1 par rejeu (E4, [ADR-098](../../docs/adr/ADR-098-materialization-record-and-proof-chain.md)) |
| `design.ts` | Design bindings : tokens résolus du contexte de chaque surface depuis son A9 épinglé ; indépendants du domaine (E6) |
| `policy.ts` | Évaluation des politiques d'A3 (catalogue fermé) : SATISFIED, WAIVED, VIOLATED (bloque), NOT_APPLICABLE, NOT_EVALUATED ; `expiredWaivers` (E6, [ADR-100](../../docs/adr/ADR-100-organization-policies-and-design-system.md)) |
| `plan.ts` | Plan agnostique, sans écriture : `MATERIALIZE`, `CONNECT_EXTERNAL`, `BIND_CAPABILITY`, `sharedContracts`, `ownerWork` (composants, opérations, invariants), obligations de preuve |
| `facade.ts` | `createKernelFacade()` : `validate`, `resolve`, `plan` ; résultats JSON déterministes |

Invariants prouvés par `test/compiler.test.ts` : un ensemble ou un catalogue invalide n'est jamais
résolu ; seule la System Definition en vigueur est compilée ; mêmes entrées → mêmes octets ; aucun nom
de framework dans `src/` (TA-04). Les runtimes n'existent que comme données du catalogue ; aucun adapter
réel avant l'Adapter Protocol (E2).
