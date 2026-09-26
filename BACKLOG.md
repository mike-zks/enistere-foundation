# BACKLOG — Enistere Foundation

> Mission active et prochaine action unique (document 05 §2C, §11). Mis à jour à chaque fin de mission.

## Mission active

**Aucune.** E0 à E6 (ADR-092 à ADR-100, avec R0-C et R0-D) sont terminées ; rapports dans
[`CURRENT_STATE.md`](CURRENT_STATE.md).

## Prochaine mission unique

### E7 — Day-2 Change Intelligence (horizon V1)

- **Objectif** : avant d'appliquer un changement, montrer son impact — ce qui change dans la
  compilation, les fichiers, les contrats partagés, les politiques — et rendre visible l'Evidence qu'il
  périme.
- **In scope** : diff de deux compilations (closure, IR, contrats d'API, bindings, politiques, plan) ;
  impact d'un Change Request (A6) calculé à partir de sa base et de sa révision proposée ; plan de
  matérialisation en « dry-run » (fichiers CREATE/UPDATE/KEEP_OWNER/CONFLICT) sans écriture ; Evidence
  périmée listée ; golden Asteria (asteria-cr-001).
- **Out of scope** : second adapter (E8), exécution automatique d'un changement, Control Plane.
- **Critères de PASS (document 06)** : impact/diff avant apply ; Evidence périmée visible.
- **À trancher avant de lancer** : l'impact calculé devient-il un contrat (enrichissement d'A6 ou record
  dédié) ou un résultat dérivé non persistant ; granularité du diff (par item ou par fichier).

## En attente de validation humaine

- Ajouter `adapters` aux checks requis du ruleset `protect-main` (ADR-096).
- ARB-08, ARB-09 : propositions dans
  [`docs/governance/ARBITRATIONS.md`](docs/governance/ARBITRATIONS.md).
- Documents 03 et 06 v1.1 : relire et accepter les modifications suivies (auteur « Claude ») dans Word.

## Dettes identifiées (non planifiées)

Voir [`RISK_REGISTER.md`](docs/governance/RISK_REGISTER.md) et la section *Known gaps* de
[`CURRENT_STATE.md`](CURRENT_STATE.md).
