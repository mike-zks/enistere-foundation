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

| Sujet | Propriétaire | Référence |
|---|---|---|
| Décomposition P1–P10 du gate E0 | Produit / Pilotage | ADR-092, CONTEXT D-1 |
| Renommage du dépôt GitHub et domaines `*.foundation.enistere.com` | Direction + plateforme | ADR-091, CONTEXT D-6 |
| Correction doc 05 §2B (Ubuntu, RabbitMQ) | Gouvernance | CONTEXT D-2, D-3 |
| Fourniture de `design-tokens.json` et des maquettes du doc 04 | Design UX UI | CONTEXT D-5 |

## Dettes identifiées (non planifiées)

Voir [`RISK_REGISTER.md`](docs/governance/RISK_REGISTER.md) et la section *Known gaps* de
[`CURRENT_STATE.md`](CURRENT_STATE.md).
