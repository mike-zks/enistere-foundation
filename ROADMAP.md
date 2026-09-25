# ROADMAP — Enistere Foundation

> Résumé opérationnel du [document 06 — Versions et feuille de route](docs/06%20—%20Versions%20et%20feuille%20de%20route%20—%20ENISTERE%20FOUNDATION.docx),
> qui fait autorité. Règle : **RELEASE GATE OVER CALENDAR** — la preuve autorise le passage, la date
> structure la gestion sans créer le statut. Changer l'ordre des missions ou des gates exige une
> validation humaine.

## Horizons

| Horizon | Fenêtre cible | Preuve attendue | État |
|---|---|---|---|
| R0 | sept.–nov. 2026 | Nouveau Kernel / extension / System Definition sans perdre les goldens | **En cours** — E0 livré (voir `CURRENT_STATE.md`) |
| V1 | déc. 2026–mai 2027 | Création gouvernée + premier changement contrôlé ; ≥ 2 stacks ; golden compétitif | Non démarré |
| V2 | juin 2027–fév. 2028 | Réutilisation organisationnelle sur ≥ 3 systèmes | Non démarré |
| V3 | mars 2028–fév. 2029 | Évolution, drift et brownfield | Non démarré |
| V4 | mars 2029–fév. 2030 | Enterprise / souverain / écosystème | Non démarré |
| V5 | mars 2030–août 2031 | Agents à autorité bornée | Non démarré |

## Missions du premier cycle

| Mission | Horizon | Objectif | Gate de sortie | État |
|---|---|---|---|---|
| E0 | R0 | Contract Foundation — 7 contrats A1–A7 | P1–P10 PASS ; seule suite : E1 | **Livré, PASS proposé** — P1–P10 à valider (ADR-092) |
| E1 | R0 | Kernel Façade headless | CLI/test via validate-resolve-plan ; legacy déterministe identique | Prochaine mission |
| E2 | R0 | Adapter Protocol v0 + premier wrapper | Discovery/resolve/plan/materialize/verify par manifest | — |
| E3 | R0 | System Definition → Internal IR bridge | IR déterministe ; unsupported explicite | — |
| E4 | V1 | Ownership & Evidence extraction | Owner change survit ; proof chain exportable | — |
| E5 | V1 | Domain Contract projection | Domain distinct de capability ; contrat partagé | — |
| E6 | V1 | Organization Context & Design bindings | Theme ≠ Domain ; policy bloque ou produit waiver | — |
| E7 | V1 | Day-2 Change Intelligence | Impact/diff avant apply ; Evidence périmée visible | — |
| E8 | V1 | Second Adapter substitution | Aucun `if framework` dans le Kernel | — |
| E9 | V1 | Competitive golden run | CONTINUE / SIMPLIFY / REPOSITION / STOP | — |
| E10 | Sortie V1 | Canonical cutover | Seulement si E7–E9 suffisent ; legacy → compatibilité/import | — |

## Tracks continus (document 06 §6.9)

A System Engineering Model · B Compiler & Extension · C Assurance & Lifecycle · D Experience &
Collaboration · E Design & Organization · F AI Assistance · G Platform Operations & Trust.
