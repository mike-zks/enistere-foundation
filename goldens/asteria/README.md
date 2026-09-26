# Golden Asteria — preuve de transition E0

Asteria est un système **synthétique** multi-applications de gestion de demandes d'intervention (document
01 §6.1, document 02 §6.1). Aucune personne ni organisation réelle : adresses en `.example`.

## Cinq surfaces

| Composant | Kind | Audience | Rôle |
|---|---|---|---|
| Requester Web | `web-application` | PUBLIC | Dépôt et suivi des demandes |
| Internal Ops Web | `web-application` | INTERNAL | Qualification, priorisation, affectation |
| Field Mobile | `mobile-application` | FIELD | Affectations et comptes rendus, hors ligne |
| Authority API | `api-service` | SYSTEM | Système de référence, autorisations, outbox |
| **Async Worker** | `async-worker` | SYSTEM | Notifications, escalades, analyse des pièces jointes |

L'Async Worker est le test obligatoire d'extensibilité (document 05 §8.1) : le Kernel l'accepte comme
composant de première classe, alors que le pipeline historique ne sait pas le représenter — ce que le
golden **rapporte** (UNSUPPORTED) au lieu de l'approximer.

## Scénario

1. `sources/brief.md` (brief synthétique) → A1 `asteria-requirements@1`, proposé par un assistant IA
   (confiance 0,82) et **accepté par un humain**.
2. A2 `asteria-decisions@1` (5 décisions avec alternatives), A3 `asteria-context@1` (dérivé par le Kernel :
   précédence, verrou refusant l'IdP du client, dérogation W-001 datée), A5
   `asteria-service-requests@1` (types, opérations, invariants, événements, acceptance, facets).
3. A4 `asteria@1` accepté, vérifié par le checker `asteria-golden-contract-check@0.1.0` (3 preuves).
4. Day-2 : A6 `asteria-cr-001` (REVIEW_REQUIRED, APPLIED) déplace l'analyse des pièces jointes de l'API
   vers le Worker → A4 `asteria@2` ; les 3 preuves de la révision 1 sont **invalidées** par une nouvelle
   révision (append-only) ; 3 nouvelles preuves vérifient la révision 2.
5. A6 `asteria-cr-002` : proposition IA de synchronisation pair-à-pair, classée **UNSUPPORTED**, restée
   PROPOSED — jamais acceptée par fallback.
6. Compilation (E1) : la Kernel Façade compile `asteria@2` de bout en bout (closure → IR → résolution →
   plan) contre le catalogue **synthétique** `sources/catalog.json`. Résultat **PARTIAL** : 5 composants
   planifiés (dont l'Async Worker), la base de données connectée comme composant EXTERNAL, et deux
   éléments **UNSUPPORTED** listés (object store sans adapter, capability `notifications` sans
   fournisseur). Aucun adapter réel n'existe avant E2 : rien n'est matérialisé.
7. Matérialisation (E2) : compilé contre les **extensions réelles** (`extensions/`), le système ne
   planifie que l'Authority API, réalisée par l'adapter `nestjs@0.1.0` (10 fichiers, dont un point
   d'extension owner-seeded) ; tout le reste — dont les capabilities authentication, authorization et
   files — est listé UNSUPPORTED. Le job CI `adapters` matérialise réellement ce plan, puis l'installe, le
   compile, le démarre (`/health` = 200) et l'audite.

## Fichiers

| Chemin | Nature |
|---|---|
| `source.ts` | Source d'autorat des contrats A1–A6 (aucun digest saisi à la main) |
| `harness.ts` | Checker, compilation par la Kernel Façade, construction du golden |
| `sources/brief.md`, `sources/catalog.json` | Entrées écrites à la main : brief client synthétique, catalogue d'extensions synthétique |
| `update.ts` | Régénération (`npm run golden:asteria:update`) ; refuse un ensemble invalide |
| `contracts/*.json`, `evidence/*.json` | **Générés** — 8 contrats et 9 EvidenceRecords |
| `expected/compilation.json` | **Généré** — résultat de `plan` : closure, IR, ResolvedSystem, ExecutionPlan et digests (identique à la sortie de la CLI) |
| `expected/materialization.json` | **Généré** — plan contre les extensions réelles et plans d'artefacts des adapters (chemins, ownership, digests), sans écriture de fichier |
| `test/golden-asteria.test.ts` | Égalité octet pour octet, cinq surfaces, traçabilité, Day-2, sens des dépendances entre zones |
| `expected/report.json` | **Généré** — digests, surfaces, traçabilité, changements, preuves, compilation, diagnostics |

Les tests du workspace `goldens` reconstruisent le golden et exigent une égalité **octet pour octet** avec les fichiers
commités ; l'ensemble doit être valide sans erreur ni avertissement.

## Ce que le golden n'est pas

Il ne dépend que du Kernel (`kernel/contracts`) : aucun import hors de `kernel/` et `goldens/` (vérifié par
test). Il ne matérialise aucun code : la matérialisation relève des missions suivantes (Adapter Protocol).
