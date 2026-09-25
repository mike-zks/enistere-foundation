# Source officielle de vérité

Adoptée par [ADR-091](../adr/ADR-091-foundation-dossier-authority-and-laboratory-status.md), conformément au
document 05 §2.

## Deux questions, deux autorités

- **La cible produit** est définie par le dossier projet (documents 01 à 07 dans `docs/`).
- **L'état d'implémentation** est défini par le dépôt réel : branche principale, code, contrats, tests,
  CI, ADR et preuves d'exécution. Une mention « terminé », « supporté » ou « conforme » n'a aucune
  autorité sans preuve correspondante.

## Ordre d'autorité en cas de conflit

1. Décisions explicites les plus récentes des documents 01 à 04 (01 : décisions structurantes ; 02 :
   obligations produit et critères d'acceptation ; 03 : traduction technique ; 04 : parcours et surfaces).
   Le document 06 fait autorité sur la séquence E0–E10 et les gates, le 07 sur CAP-01…CAP-16, le 05 sur la
   méthode de reprise.
2. Documentation de production Enistere ([`../Server Prod/`](../Server%20Prod/README.md)) pour toute
   contrainte touchant la plateforme partagée.
3. ADR validés ([`../adr/`](../adr/README.md)).
4. Code existant.

## Règles

- Si le code contredit la cible : documenter l'écart, mesurer l'impact, proposer une convergence ; ne pas
  réécrire la cible.
- Si une documentation historique contredit le code : le code fait foi pour l'implémentation.
- Une nouvelle contrainte qui remet en cause une décision cible produit une proposition d'ADR, jamais un
  fait accompli.
- Aucune contradiction n'est résolue silencieusement : elle est inscrite dans
  [`CONTEXT.md`](../../CONTEXT.md) et [`DECISIONS.md`](../../DECISIONS.md) avec une proposition.

## Fichiers vivants

[`CONTEXT.md`](../../CONTEXT.md), [`CURRENT_STATE.md`](../../CURRENT_STATE.md),
[`IMPLEMENTATION_MATRIX.md`](../../IMPLEMENTATION_MATRIX.md), [`DECISIONS.md`](../../DECISIONS.md),
[`BACKLOG.md`](../../BACKLOG.md), [`RISK_REGISTER.md`](RISK_REGISTER.md).

## Itération précédente

Supprimée par l'ADR-094 (dernier état au commit `f2590a8`). Ses spécifications, son architecture et ses
ADR 001–090 (sauf ADR-073) sont archivés dans [`docs/archive/`](../archive/README.md) et n'ont plus
d'autorité. Observability et Technical Audit restent des invariants de plateforme, pas des capabilities
(documents 01 §4.7 et 07 §4.2).

## Politiques opérationnelles

Subordonnées à cette hiérarchie : [`DEPENDENCY_POLICY.md`](DEPENDENCY_POLICY.md),
[`ENGINEERING_STANDARDS.md`](ENGINEERING_STANDARDS.md), [`GIT_STRATEGY.md`](GIT_STRATEGY.md),
[`AI_SECURITY_AUTHORIZATION.md`](AI_SECURITY_AUTHORIZATION.md),
[`ARCHITECTURE_GOVERNANCE.md`](ARCHITECTURE_GOVERNANCE.md), [`DEFINITION_OF_READY.md`](DEFINITION_OF_READY.md),
[`DEFINITION_OF_DONE.md`](DEFINITION_OF_DONE.md), [`PRODUCTION_READINESS.md`](PRODUCTION_READINESS.md).

## Documents non autoritaires

Archives ([`../archive/`](../archive/README.md)), rapports historiques, notes de session, prompts IA,
conversations, tickets non adoptés.
