# BACKLOG — Enistere Foundation

> Mission active et prochaine action unique (document 05 §2C, §11). Mis à jour à chaque fin de mission.

## Mission active

**Aucune.** E0 (PASS), R0-C (ADR-093), R0-D (ADR-094) et E1 — Kernel Façade (ADR-095) sont terminées ;
rapports dans [`CURRENT_STATE.md`](CURRENT_STATE.md).

## Prochaine mission unique

### E2 — Adapter Protocol v0 et premier adapter (horizon R0)

- **Objectif** : un protocole d'adapter versionné (manifest + phases DESCRIBE → VALIDATE INTENT → RESOLVE
  → PLAN → MATERIALIZE → VERIFY, document 03 §6.11) et **un** premier adapter écrit de zéro sur ce
  protocole, sans rien hériter de l'itération supprimée (ADR-094).
- **In scope** : schéma de manifest ; chargement des manifests → descripteurs du catalogue d'E1
  (`validateCatalog` reste l'unique validation) ; phase MATERIALIZE produisant des artefacts dans un
  espace de travail isolé, bornée par l'ownership du plan ; VERIFY produisant des EvidenceRecords ;
  golden Asteria : au moins le composant `authority-api` matérialisé et vérifié.
- **Out of scope** : second adapter et substitution (E8), Domain IR (E3), Control Plane, Workbench.
- **Critères de PASS (document 06)** : discovery/resolve/plan/materialize/verify par manifest ; aucune
  capability perdue ; aucun `if framework` dans le Kernel.
- **À trancher avant de lancer** : le runtime du premier adapter (le golden Asteria prévoit `nestjs`
  pour l'Authority API et l'Async Worker).

## En attente de validation humaine

- ARB-08, ARB-09 : propositions dans
  [`docs/governance/ARBITRATIONS.md`](docs/governance/ARBITRATIONS.md).
- Documents 03 et 06 v1.1 : relire et accepter les modifications suivies (auteur « Claude ») dans Word.

## Dettes identifiées (non planifiées)

Voir [`RISK_REGISTER.md`](docs/governance/RISK_REGISTER.md) et la section *Known gaps* de
[`CURRENT_STATE.md`](CURRENT_STATE.md).
