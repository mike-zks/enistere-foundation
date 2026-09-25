# Glossaire — Enistere Foundation

Termes de la cible produit, repris des documents 01, 02, 03, 05, 06 et 07 (qui font foi). Le glossaire du
laboratoire (statuts de core, profils, starters) est archivé :
[`archive/laboratory/GLOSSARY.md`](../archive/laboratory/GLOSSARY.md).

## Produit

| Terme | Définition |
|---|---|
| System Under Engineering Governance | Système dont l'intention, les décisions, les standards, les preuves, l'état réel et les changements restent suivis et gouvernés dans le temps ; unité de valeur du produit. |
| Engineering Graph | Vue traçable reliant sources, requirements, décisions, systèmes, contrats, artefacts, preuves, exceptions et changements. Sémantique produit, pas une base graphe imposée. |
| Product Capability (CAP-01…CAP-16) | Responsabilité produit stable (document 07) ; ni un microservice ni une option tarifaire. |
| Platform Capability | Fonction technique réutilisable (authentication, authorization, files…) couverte par CAP-08 ; à ne pas confondre avec une Product Capability. |
| Platform Baseline | Garanties techniques obligatoires des runtimes supportés (configuration, erreurs, logs, corrélation, observabilité, health, diagnostics, sécurité, audit technique, tests). Jamais un add-on. |
| Facet | Extension sémantique du Domain Contract (workflow, money, offline/sync, scheduling…) ; pas une capability technique. |
| Integration | Liaison gouvernée vers un produit ou service externe. |
| Extension / Adapter | Implémentation versionnée d'un point d'extension (runtime, capability, integration, design, checker, migration, observer, outil IA). |
| Solution Pack | Assemblage sectoriel (ex. GovFactory) qui configure la plateforme sans forker le Kernel. |

## Objets et états

| Terme | Définition |
|---|---|
| Desired / Resolved / Observed | Ce que l'organisation accepte vouloir / comment le compilateur l'a résolu / ce qui existe réellement. Jamais fusionnés ; le drift est leur écart explicable. |
| Requirement Baseline (A1) | Ensemble versionné et accepté d'exigences, acteurs, critères et ambiguïtés, avec provenance. |
| Decision Set (A2) | Architecture Decisions versionnées, avec alternatives, compromis et rationale. |
| Effective Organization Context (A3) | Standards effectivement applicables à un système après héritage, précédence, verrous et dérogations ; dérivé et recalculable. |
| System Definition (A4) | Desired state autoritatif du système complet. |
| Domain Contract (A5) | Contrat métier minimal : types, opérations, invariants, événements, acceptance, facets. |
| Change Request (A6) | Demande gouvernée de faire évoluer une révision exacte d'un contrat, classée SAFE_AUTOMATIC, REVIEW_REQUIRED, MIGRATION_REQUIRED, MANUAL_ONLY ou UNSUPPORTED. |
| EvidenceRecord (A7) | Preuve versionnée reliant une obligation à un checker, un environnement, un résultat et des entrées épinglées ; append-only. |
| System Closure | Instantané des versions et digests exacts utilisés pour une compilation. |
| Resolved System / Execution Plan | Résultat de la résolution ; plan explicable des opérations avant toute mutation. |
| Waiver | Exception versionnée, approuvée par un humain, limitée dans le temps et reliée à l'obligation qu'elle excepte. |
| Ownership | COMPILER_OWNED, OWNER_MANAGED, SHARED_CONTROLLED, EXTERNAL ; aucun écrasement silencieux du code owner-managed. |

## Autorité et preuve

| Terme | Définition |
|---|---|
| Classes d'autorité | OBSERVE, PROPOSE, DECIDE, COMPILE/APPLY, VERIFY. L'IA observe, propose et implémente dans un scope ; elle ne décide ni ne vérifie. |
| Niveaux de preuve | SPECIFIED, IMPLEMENTED, EXECUTABLE, CONTRACT-COMPATIBLE, CONFORMANT, VERIFIED IN PROFILE (document 02 annexe B). |
| Maturité (roadmap) | TARGET, PLANNED, IMPLEMENTED, GENERATABLE, BOOTABLE, CONFORMANT, PRODUCT_EQUIVALENT, PRODUCTION_READY (document 06 §5). |
| UNSUPPORTED / INCONCLUSIVE / UNKNOWN | États valides, jamais masqués par une génération forcée ni un fallback silencieux. |
| Stable ref | `Kind/id@revision[#item]`, épinglée par digest ; pas de « latest ». |
| Digest | sha256 de la sérialisation canonique RFC 8785 du contenu d'un contrat (hors statut de cycle de vie). |

## Pilotage

| Terme | Définition |
|---|---|
| R0, V1…V5 | Horizons de la même North Star (document 06). |
| E0…E10 | Missions techniques du premier cycle ; R0-C : mission de réalignement du dépôt (ADR-093). |
| Gate | Décision PASS / FAIL / CONTINUE / SIMPLIFY / REPOSITION ; RELEASE GATE OVER CALENDAR. |
| Golden | Scénario de référence reproductible (Asteria pour la transition). |
| Compatibility seam | Frontière temporaire entre ancien et nouveau modèle pendant une migration contrôlée. |
| Laboratoire | Dépôt historique (pipeline Blueprint → CSM, starters, capabilities) : actif de preuve et couche de compatibilité jusqu'au cutover E10. |
