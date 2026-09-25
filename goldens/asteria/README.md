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
3. A4 `asteria@1` accepté, vérifié par le checker `asteria-golden-contract-check@0.1.0` (4 preuves).
4. Day-2 : A6 `asteria-cr-001` (REVIEW_REQUIRED, APPLIED) déplace l'analyse des pièces jointes de l'API
   vers le Worker → A4 `asteria@2` ; les 4 preuves de la révision 1 sont **invalidées** par une nouvelle
   révision (append-only) ; 4 nouvelles preuves vérifient la révision 2.
5. A6 `asteria-cr-002` : proposition IA de synchronisation pair-à-pair, classée **UNSUPPORTED**, restée
   PROPOSED — jamais acceptée par fallback.

## Fichiers

| Chemin | Nature |
|---|---|
| `source.ts` | Source d'autorat des contrats A1–A6 (aucun digest saisi à la main) |
| `harness.ts` | Checker, sonde de compatibilité historique (lecture seule), construction du golden |
| `update.ts` | Régénération (`npm run golden:asteria:update`) ; refuse un ensemble invalide |
| `contracts/*.json`, `evidence/*.json` | **Générés** — 8 contrats et 9 EvidenceRecords |
| `expected/report.json` | **Généré** — digests, surfaces, traçabilité, changements, preuves, diagnostics |

Les tests du Kernel reconstruisent le golden et exigent une égalité **octet pour octet** avec les fichiers
commités ; l'ensemble doit être valide sans erreur ni avertissement.

## Ce que le golden n'est pas

Il ne dépend que du Kernel (`kernel/contracts`) : aucun import hors de `kernel/` et `goldens/` (vérifié par
test). Il ne matérialise aucun code : la matérialisation relève des missions suivantes (Adapter Protocol).
