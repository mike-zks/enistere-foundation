# BACKLOG — Enistere Foundation

> Mission active et prochaine action unique (document 05 §2C, §11). Mis à jour à chaque fin de mission.

## Mission active

**Aucune.** E0 à E5 (ADR-092 à ADR-099, avec R0-C et R0-D) sont terminées ; rapports dans
[`CURRENT_STATE.md`](CURRENT_STATE.md).

## Prochaine mission unique

### E6 — Organization Context & Design bindings (horizon V1)

- **Objectif** : appliquer le contexte d'organisation effectif (A3 : Entity Profile, Policy Packs,
  précédence, verrous, dérogations) à la compilation, et relier la gouvernance de design aux surfaces, sans
  confondre thème et domaine.
- **In scope** : évaluation des politiques d'A3 à la résolution et au plan (blocage explicite ou waiver
  tracé) ; design bindings des surfaces (tokens, thème) distincts du contrat de domaine ; golden Asteria
  (verrou refusant l'IdP du client, dérogation W-001 datée).
- **Out of scope** : Day-2 change (E7), second adapter (E8), Workbench.
- **Critères de PASS (document 06)** : theme ≠ domain ; une policy bloque ou produit un waiver.
- **À trancher avant de lancer** : forme des règles de politique évaluables (langage de règles ou
  prédicats déclaratifs fermés) et source des design tokens (D-5 : `design-tokens.json` et mockups
  absents du dépôt).

## En attente de validation humaine

- Ajouter `adapters` aux checks requis du ruleset `protect-main` (ADR-096).
- ARB-08, ARB-09 : propositions dans
  [`docs/governance/ARBITRATIONS.md`](docs/governance/ARBITRATIONS.md).
- Documents 03 et 06 v1.1 : relire et accepter les modifications suivies (auteur « Claude ») dans Word.

## Dettes identifiées (non planifiées)

Voir [`RISK_REGISTER.md`](docs/governance/RISK_REGISTER.md) et la section *Known gaps* de
[`CURRENT_STATE.md`](CURRENT_STATE.md).
