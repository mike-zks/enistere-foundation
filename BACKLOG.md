# BACKLOG — Enistere Foundation

> Mission active et prochaine action unique (document 05 §2C, §11). Mis à jour à chaque fin de mission.

## Mission active

**Aucune.** E0 (PASS), R0-C, R0-D, E1 (ADR-095) et E2 — Adapter Protocol v0 (ADR-096) sont terminées ;
rapports dans [`CURRENT_STATE.md`](CURRENT_STATE.md).

## Prochaine mission unique

### E3 — Domain IR et enrichissement de l'IR (horizon R0)

- **Objectif** : dériver du Domain Contract (A5) une représentation interne normalisée et déterministe
  (types, opérations, événements, invariants, scénarios d'acceptance) et la relier à l'IR système :
  opérations implémentées et consommées, événements publiés et souscrits, par composant.
- **In scope** : `buildDomainIR` dans `kernel/compiler` (digest, indépendance à l'ordre) ; IR système
  référençant le Domain IR ; UNSUPPORTED explicite pour ce que le Kernel ne sait pas encore représenter ;
  Domain IR transmis aux adapters dans leur contexte, sans génération de code métier (E5) ; golden Asteria.
- **Out of scope** : projection du domaine vers un runtime (E5), capabilities, Control Plane.
- **Critères de PASS (document 06)** : IR déterministe ; unsupported explicite.

## En attente de validation humaine

- Ajouter `adapters` aux checks requis du ruleset `protect-main` (ADR-096).
- ARB-08, ARB-09 : propositions dans
  [`docs/governance/ARBITRATIONS.md`](docs/governance/ARBITRATIONS.md).
- Documents 03 et 06 v1.1 : relire et accepter les modifications suivies (auteur « Claude ») dans Word.

## Dettes identifiées (non planifiées)

Voir [`RISK_REGISTER.md`](docs/governance/RISK_REGISTER.md) et la section *Known gaps* de
[`CURRENT_STATE.md`](CURRENT_STATE.md).
