# BACKLOG — Enistere Foundation

> Mission active et prochaine action unique (document 05 §2C, §11). Mis à jour à chaque fin de mission.

## Mission active

**Aucune.** E0 — Contract Foundation (PASS), R0-C — Repository Realignment (ADR-093) et R0-D — repartir
propre (ADR-094) sont terminées ; rapports dans [`CURRENT_STATE.md`](CURRENT_STATE.md).

## Prochaine mission unique

### E1 — Kernel Façade (horizon R0), à redéfinir

La définition du document 06 (« legacy déterministe identique ») est caduque : il n'y a plus de pipeline
historique à envelopper (ADR-094). Proposition à valider avant de lancer la mission :

- **Objectif** : une façade headless unique `validate → resolve → plan`, utilisable par CLI et tests, qui
  ne connaît que les contrats du Kernel.
- **In scope** : `validate` sur un ensemble fermé (`validateContractSet`) ; sélection de la System
  Definition en vigueur ; `resolve` natif et déterministe vers un modèle résolu (premier pas de l'IR
  d'E3) : composants, interactions, capacités de plateforme demandées, environnements, avec
  UNSUPPORTED explicite ; `plan` agnostique du framework (intentions de matérialisation, sans génération
  de code) avec digest ; CLI minimale ; golden Asteria compilé de bout en bout, sans aucune limitation
  cachée.
- **Out of scope** : génération de code et adapters (E2), Control Plane, Workbench.
- **Critères de PASS proposés** : même entrée → mêmes octets (resolve et plan) ; ensemble invalide jamais
  résolu ; toute partie non résolue listée ; aucun nom de framework dans le Kernel (TA-04).

## En attente de validation humaine

- **ARB-11 (bloquant)** : mettre à jour les checks requis du ruleset `protect-main` (`kernel`,
  `secret-scan`, `docs`, `audit`).
- ARB-08, ARB-09, ARB-12 : propositions dans
  [`docs/governance/ARBITRATIONS.md`](docs/governance/ARBITRATIONS.md).
- Pousser le tag `laboratory-final` (commit `f2590a8`) : le proxy de session refuse les tags.

## Dettes identifiées (non planifiées)

Voir [`RISK_REGISTER.md`](docs/governance/RISK_REGISTER.md) et la section *Known gaps* de
[`CURRENT_STATE.md`](CURRENT_STATE.md).
