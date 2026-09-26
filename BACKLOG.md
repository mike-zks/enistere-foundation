# BACKLOG — Enistere Foundation

> Mission active et prochaine action unique (document 05 §2C, §11). Mis à jour à chaque fin de mission.

## Mission active

**Aucune.** E0 à E4 (ADR-092 à ADR-098, avec R0-C et R0-D) sont terminées ; rapports dans
[`CURRENT_STATE.md`](CURRENT_STATE.md).

## Prochaine mission unique

### E5 — Domain Contract Projection (horizon V1)

- **Objectif** : projeter le Domain IR (E3) vers les runtimes par les adapters, sans confondre domaine et
  capability : un même Domain Contract partagé par plusieurs composants produit des artefacts cohérents.
- **In scope** : projection des types, opérations et événements du Domain IR par l'adapter NestJS
  (contrat d'API, types, squelettes owner-seeded des opérations) ; traçabilité item de domaine →
  artefact (A8) ; interprétation explicite ou UNSUPPORTED des facets ; golden Asteria.
- **Out of scope** : second adapter (E8), contexte d'organisation et design (E6), impact Day-2 (E7).
- **Critères de PASS (document 06)** : domaine distinct de capability ; contrat partagé.
- **À trancher avant de lancer** : format de projection de l'API (OpenAPI généré ou types seuls) et
  périmètre des invariants exécutables en E5.

## En attente de validation humaine

- Ajouter `adapters` aux checks requis du ruleset `protect-main` (ADR-096).
- ARB-08, ARB-09 : propositions dans
  [`docs/governance/ARBITRATIONS.md`](docs/governance/ARBITRATIONS.md).
- Documents 03 et 06 v1.1 : relire et accepter les modifications suivies (auteur « Claude ») dans Word.

## Dettes identifiées (non planifiées)

Voir [`RISK_REGISTER.md`](docs/governance/RISK_REGISTER.md) et la section *Known gaps* de
[`CURRENT_STATE.md`](CURRENT_STATE.md).
