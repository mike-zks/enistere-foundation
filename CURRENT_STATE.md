# CURRENT STATE

> État réel du dépôt (document 05 §2E) — jamais une intention. Mis à jour obligatoirement en fin de mission.

| Champ | Valeur |
|---|---|
| Commit / branche | Base `56c8113` (`main`, fusion de la PR #251) ; travail sur `claude/hopeful-wozniak-z6g3wd` (missions E0 puis R0-C au-dessus de la base) |
| Date | 2026-09-25 |
| Missions | E0 — Contract Foundation ; R0-C — Repository Realignment (horizon R0) |
| Résultat | E0 **PASS** (gate document 05 §8.1 et P1–P10 validés, ADR-093) ; R0-C **PASS** (niveaux 1–2 réalisés, laboratoire vert) |

## Completed

- Package `kernel/contracts` (`@enistere/foundation-kernel-contracts`) : sept contrats A1–A7 publiés en
  JSON Schema 2020-12 (`schemas/v1alpha1/`), registre unique, validation structurelle (Ajv strict) et
  sémantique, primitives partagées (apiVersion + seam de migration, références stables épinglées,
  provenance, acceptance/status par classe d'état, diagnostics à codes stables et classes d'échec,
  digest sha256/JCS), validation d'ensemble fermé, dérivation reproductible de A3, cohérence et
  classification de A6, péremption et historique append-only de A7.
- Golden Asteria (`goldens/asteria/`) : cinq surfaces dont l'Async Worker ; 8 contrats et 12
  EvidenceRecords générés depuis `source.ts` par le Kernel et le checker `asteria-golden-contract-check@0.1.0` ;
  scénario Day-2 (CR-001 appliqué, preuves invalidées puis revérifiées) et proposition IA UNSUPPORTED
  (CR-002) ; sonde en lecture seule du pipeline historique.
- CI : job `kernel-contracts` (typecheck, tests, régénération du golden sans diff).
- Réalignement du dépôt (ADR-091) : pilotage du laboratoire archivé sans suppression
  (`docs/archive/laboratory/`), fichiers de gouvernance du document 05 §2D créés, source de vérité
  réécrite, gabarits PR/issue alignés, package racine renommé `enistere-foundation`.
- R0-C (ADR-093), niveau 1 : archivage des prompts IA du laboratoire, de leur registre (12 références
  mortes), de leur gouvernance et de leur guide ; de `factory/templates/` ; des exemples de profils
  `docs/examples/reference-systems/` ; glossaire et onboarding remplacés par des versions Foundation ;
  « Enistere OS » retiré de la documentation active (ADR historiques et CHANGELOG inchangés).
- R0-C, niveau 2 : `deployment/staging/` et `deployment/docs/` archivés (non conformes à Server Prod) ;
  publication GHCR suspendue (`registry-ci.yml` en PR uniquement, lecture seule) ;
  `DEPLOYMENT_SPECIFICATION.md` subordonnée à la production Enistere.

## In progress

Aucun.

## Blocked

Aucun. Arbitrages encore ouverts, non bloquants pour E1 : ARB-07 à ARB-10
([`ARBITRATIONS.md`](docs/governance/ARBITRATIONS.md)). Action attendue du responsable : renommer le dépôt
GitHub en `enistere-foundation` (ARB-04).

## Tests (exécutés le 2026-09-25 ; relancés intégralement après R0-C avec les mêmes résultats)

| Commande | Résultat |
|---|---|
| `npm run foundation:typecheck` | OK (0 erreur) |
| `npm run foundation:test` | 56/56 PASS |
| `npm run golden:asteria:update` puis `git status --porcelain goldens/` | Aucun écart ; ensemble 20 contrats, 0 erreur, 0 avertissement |
| Mutation manuelle (règle IA-DECIDE désactivée ; contrôle de digest désactivé) | Chaque mutation fait échouer la suite ; code restauré |
| `npm run factory:test` | 554/554 PASS (identique à la baseline) |
| `npm run factory:capability-conformance` · `npm run factory:baseline-gap` | OK ; rapports committés inchangés |
| `node factory/quality/scripts/fitness-functions.mjs` | passed, 0 finding |
| `npm test` · `npm run typecheck` · `contracts:check` · `design:check` · `generate:check` | OK |
| `node factory/quality/scripts/docs-link-check.mjs` (défaut + fichiers racine, kernel, goldens) | OK |
| `node factory/quality/scripts/audit-check.mjs . --targets nestjs,nextjs` | 0 advisory non couvert |
| `node factory/quality/scripts/secret-allowlist-check.mjs` | OK |
| gitleaks 8.30.1 (binaire épinglé, checksum vérifié), historique complet (`--log-opts=--all`) | 128 commits, **no leaks found** |

**NOT RUN** : builds/lint/tests `ui-kit` et `web-nextjs`, workflows runtime (`api-runtime-ci`,
`web-angular-ci`, `web-e2e-ci`, `factory-golden-runtime`, `registry-ci`) — non touchés par la mission,
couverts par la CI de la PR ; aucun déploiement (aucun service déployable).

## Known gaps

- Pas de Kernel Façade : aucun chemin `validate → resolve → plan` ne consomme encore les contrats (E1).
- Pas d'IR interne ni de System Closure : le pipeline Blueprint → CSM reste le seul chemin de génération (E3, E10).
- Pas d'Adapter Protocol ; runtimes et capabilities codés dans le catalogue du laboratoire (E2).
- Entity Profile, Policy Pack, Design System, Approval Policy : références externes seulement (E6).
- Évidence : pas d'Evidence Graph ni d'export de proof chain (E4) ; pas de calcul d'impact (E7).
- Pipeline historique : l'Async Worker n'y est pas représentable (UNSUPPORTED, prouvé par le golden).
- Aucun Control Plane, Workbench, Worker d'exécution, Registry ni AI Gateway.
- `deployment/` du laboratoire non aligné sur la production Enistere (R-07).
- Divergences documentaires D-2 à D-5 ([`CONTEXT.md`](CONTEXT.md)).
- 8 liens relatifs cassés **préexistants** dans les README de `starters/nextjs` (présents à la baseline
  `56c8113`, hors périmètre du contrôleur de liens) — R-14 ; le 9e (index des workflows) est corrigé.
- Niveau 3 du nettoyage (structure cible `extensions/`, `engine/`) : à faire mission par mission (E1 → E3).

## Decisions

ADR-091 (autorité du dossier, laboratoire en compatibilité, archivage), ADR-092 (Contract Foundation),
ADR-093 (P1–P10 validés, mission R0-C, nommage) — voir [`DECISIONS.md`](DECISIONS.md).

## Next single action

**E1 — Kernel Façade** ([`BACKLOG.md`](BACKLOG.md)).

---

## Rapport de mission E0 (document 05 §11, gabarit Annexe A §16)

- **Mission** : E0 — Contract Foundation.
- **Date** : 2026-09-25.
- **Branch / HEAD** : `claude/hopeful-wozniak-z6g3wd`, base `56c8113`.
- **Objectif** : introduire les contrats de première classe A1–A7 et leurs primitives partagées, prouvés
  par le golden Asteria (cinq surfaces dont l'Async Worker), sans cutover ni source de vérité concurrente.
- **Scope** : contrats, schémas, modèles, fixtures, tests, golden, CI ; réalignement documentaire du
  dépôt (demande explicite du responsable).
- **Out of scope** : cutover, suppression des modèles historiques, Control Plane, Workbench, refonte CLI,
  brownfield, agents avancés, migration globale des runtimes, déploiement.
- **État initial** : dépôt propre sur `56c8113` ; laboratoire vert (554 tests factory) ; aucune PR ni
  issue ouverte ; aucun des sept contrats cible ; pas d'Asteria ; gouvernance sous `MANDAT.md` contraire
  au dossier.
- **Changements réalisés** : voir *Completed*.
- **Fichiers / packages touchés** : `kernel/contracts/**` (nouveau), `goldens/**` (nouveau),
  `package.json`, `package-lock.json` (+ workspace), `.github/workflows/ci.yml`, gabarits `.github/`,
  `factory/test/profiles.test.mjs` (chemin de `PROFILE_MATRIX.md` uniquement), documentation de
  gouvernance et `docs/**` (archivage, liens, ADR-044/045/046 annotés, ADR-091/092).
- **Contrats impactés** : A1–A7 créés (v1alpha1). Aucun contrat du laboratoire modifié.
- **Migrations** : aucune donnée à migrer ; seam de migration livré avec une chaîne vide.
- **Tests exécutés / résultats** : voir *Tests*.
- **Preuves** : `goldens/asteria/expected/report.json` (digests, surfaces, traçabilité, preuves) ;
  EvidenceRecords `goldens/asteria/evidence/` ; tests `kernel/contracts/test/`.
- **Risques résiduels** : R-01 (double source avant E1/E3), R-02 (gate P1–P10), R-03 (statut hors
  digest), R-07 (déploiement du laboratoire) — [`RISK_REGISTER.md`](docs/governance/RISK_REGISTER.md).
- **Décisions** : ADR-091, ADR-092 ; décomposition P1–P10 validée ensuite (ADR-093).
- **Documentation** : README, CONTEXT, AGENTS, ROADMAP, BACKLOG, CURRENT_STATE, IMPLEMENTATION_MATRIX,
  DECISIONS, SECURITY, CONTRIBUTING, CHANGELOG ; `docs/README.md`, `SOURCE_OF_TRUTH.md`,
  `DEFINITION_OF_DONE.md`, `PRODUCTION_READINESS.md`, `RISK_REGISTER.md`, `DEPENDENCIES.md`, runbooks,
  registre ADR, archives.
- **Statut** : PASS (gate document 05 §8.1, P1–P10 validés).
- **Prochaine action unique** : E1 — Kernel Façade.

---

## Rapport de mission R0-C — Repository Realignment (document 05 §11, Annexe A §16)

- **Mission** : R0-C — Repository Realignment (insérée entre E0 et E1 par ADR-093).
- **Date** : 2026-09-25.
- **Branch / HEAD** : `claude/hopeful-wozniak-z6g3wd`, après les commits E0.
- **Objectif** : orienter le dépôt vers la vision Foundation sans perdre de preuve : retirer ce qui est mort,
  trompeur ou non conforme à la production Enistere.
- **Scope** : niveaux 1 et 2 d'ARB-03 ; nommage actif (ARB-04).
- **Out of scope** : restructuration vers `extensions/`/`engine/` (niveau 3, missions E1 → E3), suppression
  du code prouvé (niveau 4, après E10), renommage des packages existants et du dépôt GitHub.
- **État initial** : registre de prompts IA avec 12 références mortes ; staging du laboratoire non conforme
  à Server Prod (réseau `web`, résolveur `le`, PostgreSQL/MinIO embarqués) ; publication GHCR active sur
  `main` ; 58 fichiers « Enistere OS » ; glossaire et onboarding du laboratoire.
- **Changements réalisés** : voir *Completed* (entrées R0-C).
- **Fichiers touchés** : `factory/ai/**` (archivage prompts/registre/script, README), `factory/quality/`
  (archivage de la gouvernance des prompts, références), `factory/quality/scripts/docs-link-check.mjs`
  (cible par défaut archivée retirée), `deployment/**`, `.github/workflows/{registry-ci,api-runtime-ci,factory-golden-runtime}.yml`
  et `README.md`, `docs/glossary`, `docs/onboarding`, `docs/examples`, commentaire de
  `starters/nestjs/prisma/schema.prisma`, description de `starters/nestjs/package.json`, `.gitleaks.toml`
  (titre), gouvernance.
- **Contrats impactés** : aucun.
- **Migrations** : aucune.
- **Tests exécutés / résultats** : foundation typecheck OK, 56/56 ; golden régénéré sans diff ;
  `factory:test` 554/554 ; conformance et baseline OK, rapports inchangés ; fitness functions OK ;
  `npm test`, typecheck, `contracts:check`, `design:check`, `generate:check` OK ; liens OK ; audit OK ;
  YAML des workflows valide.
- **Tests non exécutés** : workflows GitHub modifiés (seulement validés syntaxiquement ; exécution par la CI
  de la PR).
- **Preuves** : diff de la mission ; comparaison des liens cassés avec la baseline (9 préexistants, aucun
  introduit ; 1 corrigé) ;
  `docs/archive/README.md` (table de correspondance).
- **Risques résiduels** : R-13 (précédent de réordonnancement), R-14 (liens préexistants).
- **Décisions** : ADR-093.
- **Documentation** : ARBITRATIONS, ADR-092/093, registre ADR, DECISIONS, BACKLOG, ROADMAP, CONTEXT,
  CURRENT_STATE, IMPLEMENTATION_MATRIX, RISK_REGISTER, archive, glossaire, onboarding, CHANGELOG.
- **Statut** : PASS.
- **Prochaine action unique** : E1 — Kernel Façade.
