# BACKLOG — Enistere Foundation

> Mission active et prochaine action unique (document 05 §2C, §11). Mis à jour à chaque fin de mission.

## Mission active

**Aucune.** E0 — Contract Foundation est terminée (rapport : [`CURRENT_STATE.md`](CURRENT_STATE.md)).

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
- **Préalable** : validation humaine de la décomposition P1–P10 proposée dans
  [ADR-092](docs/adr/ADR-092-e0-contract-foundation.md) (non bloquante pour le préflight E1).

## En attente de validation humaine

Registre détaillé avec options et recommandations :
[`docs/governance/ARBITRATIONS.md`](docs/governance/ARBITRATIONS.md) (ARB-01 à ARB-10). Le point
structurant est ARB-02 : insérer une mission **R0-C — Repository Realignment** (retrait/archivage des
actifs morts ou non conformes, alignement du nommage) avant E1. Tant qu'il n'est pas tranché, la
prochaine mission reste E1, conformément au document 06.

## Dettes identifiées (non planifiées)

Voir [`RISK_REGISTER.md`](docs/governance/RISK_REGISTER.md) et la section *Known gaps* de
[`CURRENT_STATE.md`](CURRENT_STATE.md).
