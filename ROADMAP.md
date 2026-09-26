# ROADMAP — Enistere Foundation

> Résumé opérationnel du [document 06 — Versions et feuille de route](docs/06%20—%20Versions%20et%20feuille%20de%20route%20—%20ENISTERE%20FOUNDATION.docx) (v1.1, septembre 2026 : ADR-094/095 intégrés, modifications suivies à accepter),
> qui fait autorité. Règle : **RELEASE GATE OVER CALENDAR** — la preuve autorise le passage, la date
> structure la gestion sans créer le statut. Changer l'ordre des missions ou des gates exige une
> validation humaine.

## Horizons

| Horizon | Fenêtre cible | Preuve attendue | État |
|---|---|---|---|
| R0 | sept.–nov. 2026 | Nouveau Kernel / extension / System Definition ; golden Asteria préservé | **En cours** — E0, R0-C, R0-D, E1, E2 et E3 livrés : gates techniques de R0 franchis (voir `CURRENT_STATE.md`) |
| V1 | déc. 2026–mai 2027 | Création gouvernée + premier changement contrôlé ; ≥ 2 stacks ; golden compétitif | **En cours** — E4, E5 et E6 livrés |
| V2 | juin 2027–fév. 2028 | Réutilisation organisationnelle sur ≥ 3 systèmes | Non démarré |
| V3 | mars 2028–fév. 2029 | Évolution, drift et brownfield | Non démarré |
| V4 | mars 2029–fév. 2030 | Enterprise / souverain / écosystème | Non démarré |
| V5 | mars 2030–août 2031 | Agents à autorité bornée | Non démarré |

## Missions du premier cycle

| Mission | Horizon | Objectif | Gate de sortie | État |
|---|---|---|---|---|
| E0 | R0 | Contract Foundation — 7 contrats A1–A7 | P1–P10 PASS ; seule suite : E1 | **PASS** (P1–P10 validés, ADR-093) |
| R0-C | R0 | Repository Realignment — niveaux 1 et 2 (ADR-093) | Laboratoire vert, rien de prouvé supprimé, dépôt sans actif mort ni non conforme | **Livré** |
| R0-D | R0 | Repartir propre : suppression de l'itération précédente (ADR-094) | Kernel seul, une implémentation par concept, CI minimale verte | **Livré** (CI verte sous réserve du ruleset, ARB-11) |
| E1 | R0 | Kernel Façade headless (chaîne native, ADR-095) | CLI/test via validate-resolve-plan ; mêmes entrées → mêmes octets ; UNSUPPORTED explicite ; aucun framework dans le Kernel | **Livré** |
| E2 | R0 | Adapter Protocol v0 + premier adapter (écrit de zéro, ADR-094) ; manifests → catalogue (ADR-095) | Discovery/resolve/plan/materialize/verify par manifest ; aucune capability perdue | **Livré** (ADR-096 ; NestJS, Authority API, BOOTABLE) |
| E3 | R0 | Domain IR et enrichissement de l'IR (pont de base livré par E1, ADR-095) | IR déterministe ; unsupported explicite | **Livré** (ADR-097) |
| E4 | V1 | Ownership & Evidence extraction | Owner change survit ; proof chain exportable | **Livré** (ADR-098 ; A8, proof chain v1) |
| E5 | V1 | Domain Contract projection | Domain distinct de capability ; contrat partagé | **Livré** (ADR-099 ; contrat OpenAPI partagé) |
| E6 | V1 | Organization Context & Design bindings | Theme ≠ Domain ; policy bloque ou produit waiver | **Livré** (ADR-100 ; politiques évaluées, A9) |
| E7 | V1 | Day-2 Change Intelligence | Impact/diff avant apply ; Evidence périmée visible | Prochaine mission |
| E8 | V1 | Second Adapter substitution | Aucun `if framework` dans le Kernel | — |
| E9 | V1 | Competitive golden run | CONTINUE / SIMPLIFY / REPOSITION / STOP | — |
| E10 | Sortie V1 | Canonical cutover | Seulement si E7–E9 suffisent ; aucun legacy à basculer (ADR-094, document 06 v1.1) | — |

## Tracks continus (document 06 §6.9)

A System Engineering Model · B Compiler & Extension · C Assurance & Lifecycle · D Experience &
Collaboration · E Design & Organization · F AI Assistance · G Platform Operations & Trust.
