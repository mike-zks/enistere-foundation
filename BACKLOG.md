# BACKLOG — Enistere Foundation

> Mission active et prochaine action unique (document 05 §2C, §11). Mis à jour à chaque fin de mission.

## Mission active

**Aucune.** E0 à E3 (ADR-092 à ADR-097, avec R0-C et R0-D) sont terminées : les missions techniques de
l'horizon R0 sont livrées ; rapports dans [`CURRENT_STATE.md`](CURRENT_STATE.md).

## Prochaine mission unique

### E4 — Ownership & Evidence Extraction (horizon V1)

- **Objectif** : rendre l'ownership et les preuves durables et exportables : un changement fait par
  l'équipe propriétaire survit à toute re-matérialisation, et la chaîne de preuve (closure → plan →
  matérialisation → EvidenceRecords) est exportable et vérifiable hors du dépôt.
- **In scope** : MaterializationRecord comme record persistant et versionné ; inventaire d'ownership
  consolidé par système ; export de la proof chain (digests liés, signature ultérieure) ; golden Asteria :
  changement owner-managed préservé après une nouvelle version d'adapter.
- **Out of scope** : Evidence Graph complet et proof profiles (V1+), Control Plane.
- **Critères de PASS (document 06)** : owner change survit ; proof chain exportable.
- **À trancher avant de lancer** : format d'export de la proof chain (JSON auto-porteur ou bundle
  in-toto/SLSA) et place du record (nouveau contrat A8 ou extension d'A7).

## En attente de validation humaine

- Ajouter `adapters` aux checks requis du ruleset `protect-main` (ADR-096).
- ARB-08, ARB-09 : propositions dans
  [`docs/governance/ARBITRATIONS.md`](docs/governance/ARBITRATIONS.md).
- Documents 03 et 06 v1.1 : relire et accepter les modifications suivies (auteur « Claude ») dans Word.

## Dettes identifiées (non planifiées)

Voir [`RISK_REGISTER.md`](docs/governance/RISK_REGISTER.md) et la section *Known gaps* de
[`CURRENT_STATE.md`](CURRENT_STATE.md).
