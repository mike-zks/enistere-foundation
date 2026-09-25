# Definition of Done

Une mission (E0 … E10) est terminée lorsque :

- le périmètre IN/OUT OF SCOPE annoncé est respecté ;
- le code compile et le typage passe ;
- les tests applicables passent ; tout test non exécuté est marqué **NOT RUN** avec sa raison ;
- les goldens et la conformance applicables passent, sans suppression de golden ni de migration ;
- la sécurité est traitée (secrets hors dépôt, dépendances auditées, aucun échec masqué) ;
- les migrations sont testées ; aucun chemin UNSUPPORTED n'est contourné par un fallback silencieux ;
- aucune nouvelle source de vérité concurrente n'est créée ;
- `CURRENT_STATE.md`, `IMPLEMENTATION_MATRIX.md` (avec preuve), `DECISIONS.md`, les ADR, `BACKLOG.md`
  et `CHANGELOG.md` sont à jour ;
- aucune documentation contradictoire ne reste active ;
- les preuves sont reproductibles et le rapport de mission (document 05 §11) propose une seule prochaine
  action.

## Croisement avec les gates

| Gate | Condition de Done supplémentaire | Référence |
|---|---|---|
| E0 | Contrats versionnés, testés, sérialisés de manière déterministe, reliés aux diagnostics, utilisables dans le golden Asteria sans source concurrente ; P1–P10 (proposés) | Document 05 §8.1, ADR-092 |
| E1 | CLI/test via validate-resolve-plan ; pipeline historique déterministe identique | Document 06 §6.8 |
| E2 | Discovery/resolve/plan/materialize/verify par manifest ; aucune capability perdue | Document 06 §6.8 |
| E3 | IR déterministe ; unsupported explicite | Document 06 §6.8 |
| E4–E8 | Owner change préservé, proof chain exportable, Domain ≠ capability, Theme ≠ Domain, impact avant apply, aucun `if framework` dans le Kernel | Document 06 §6.8 |
| E9 | Décision CONTINUE / SIMPLIFY / REPOSITION / STOP sur critères figés | Document 06 §6.8 |
| E10 | Cutover seulement si E7–E9 suffisent | Document 06 §6.8 |
| Mise en production | Tous les critères de [`PRODUCTION_READINESS.md`](PRODUCTION_READINESS.md) | Document 05 §2B, `docs/Server Prod/` |

Niveaux de preuve admissibles (document 02 annexe B, document 06 §5) : SPECIFIED, IMPLEMENTED,
EXECUTABLE, CONTRACT-COMPATIBLE, CONFORMANT, VERIFIED IN PROFILE ; une capacité n'est jamais qualifiée
au-delà de ses preuves.
