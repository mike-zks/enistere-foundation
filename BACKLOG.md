# BACKLOG — Enistere Foundation

> Mission active et prochaine action unique (document 05 §2C, §11). Mis à jour à chaque fin de mission.

## Mission active

**Aucune.** E0 — Contract Foundation (PASS) et R0-C — Repository Realignment (ADR-093) sont terminées ;
rapports dans [`CURRENT_STATE.md`](CURRENT_STATE.md).

## Prochaine mission unique

### E1 — Kernel Façade (horizon R0)

- **Objectif** : une façade headless unique `validate → resolve → plan` exposée par le Kernel, utilisable
  par CLI et tests, qui lit les contrats E0 et pilote le pipeline historique au travers d'un seam explicite
  sans en changer le résultat.
- **In scope** : façade typée dans `kernel/` ; lecture d'un ensemble de contrats (`validateContractSet`) ;
  seam System Definition → Blueprint limité aux composants représentables, UNSUPPORTED explicite pour les
  autres (Async Worker) ; commande CLI minimale ; tests de non-régression prouvant que le plan historique
  est byte-identique pour les goldens existants.
- **Out of scope** : Adapter Protocol (E2), IR interne (E3), Control Plane, Workbench, suppression du
  pipeline historique, cutover.
- **Critères de PASS (document 06)** : CLI/test via validate-resolve-plan ; legacy déterministe identique.
- **Nettoyage de niveau 3 (ADR-093)** : ce que la façade enveloppe (point d'entrée CLI et composition du
  pipeline historique) est extrait vers `kernel/` avec son seam et ses preuves ; rien n'est supprimé.
- **Préalable levé** : P1–P10 validés (ARB-01).

## En attente de validation humaine

ARB-07 à ARB-10 (starters en CI, corrections du document 05, livrables du document 04, validation
d'`AGENTS.md`) : propositions dans [`docs/governance/ARBITRATIONS.md`](docs/governance/ARBITRATIONS.md).
Action de votre part décidée (ARB-04) : renommer le dépôt GitHub en `enistere-foundation`.

## Dettes identifiées (non planifiées)

Voir [`RISK_REGISTER.md`](docs/governance/RISK_REGISTER.md) et la section *Known gaps* de
[`CURRENT_STATE.md`](CURRENT_STATE.md).
