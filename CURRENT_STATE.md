# CURRENT STATE

> État réel du dépôt (document 05 §2E) — jamais une intention. Mis à jour obligatoirement en fin de mission.

| Champ | Valeur |
|---|---|
| Commit / branche | Base `83aa8e1` (`main`, fusion de la PR #254) ; travail sur `claude/e1-kernel-facade` |
| Date | 2026-09-25 |
| Mission | E1 — Kernel Façade (ADR-095), après E0, R0-C et R0-D |
| Résultat | E1 **PASS** localement sur la gate redéfinie (voir *Tests*) ; CI de la PR à confirmer |

## Completed

- **Kernel contracts** `kernel/contracts` (E0) : sept contrats A1–A7, primitives partagées, ensemble
  fermé ; registre unique de diagnostics étendu (`CATALOG_*`, `RESOLVE_*`, `FACADE_*` ; couches
  `kernel.compiler`, `kernel.facade`).
- **Kernel compiler** `kernel/compiler` (E1) : System Closure, System IR, catalogue d'extensions en
  données, résolution (ResolvedSystem), ExecutionPlan agnostique (`MATERIALIZE`, `CONNECT_EXTERNAL`,
  `BIND_CAPABILITY`, `ownerWork`, obligations de preuve) et façade `validate` / `resolve` / `plan`.
- **CLI** `surfaces/cli` (`enistere-foundation`) : surface sans logique, codes 0 / 1 / 2 / 64.
- **Golden Asteria** : 8 contrats, 9 EvidenceRecords ; compilé de bout en bout contre le catalogue
  synthétique `sources/catalog.json` → `expected/compilation.json` : **PARTIAL**, 5 composants
  matérialisés (dont l'Async Worker), `asteria-db` connecté (EXTERNAL), 2 éléments UNSUPPORTED listés
  (`asteria-objects` sans adapter, capability `notifications` sans fournisseur), 16 obligations de preuve.
- Missions antérieures : E0 (PASS), R0-C, R0-D — rapports ci-dessous.

## In progress

Aucun.

## Blocked

Aucun. Le tag `laboratory-final` est abandonné : le commit `f2590a8` reste atteignable comme ancêtre de
`main` (ADR-094).

## Tests (exécutés le 2026-09-25 sur `claude/e1-kernel-facade`)

| Commande | Résultat |
|---|---|
| `npm ci` | OK |
| `npm run foundation:typecheck` (3 workspaces + golden) | OK (0 erreur) |
| `npm run foundation:test` | 74/74 PASS — contracts 56, compiler 13, CLI 5 |
| `npm run golden:asteria:update` (deux exécutions) puis `git status --porcelain goldens/` | Aucun écart ; 19 fichiers, 0 diagnostic |
| CLI `plan` sur le golden avec catalogue | Code 2 (PARTIAL), sortie octet pour octet égale à `expected/compilation.json` |
| CLI `plan` sans catalogue · ensemble altéré · usage invalide | Code 2 (tout UNSUPPORTED) · code 1 (INVALID) · code 64 |
| `npm run tools:test` | 10/10 PASS |
| `npm run docs:links` | OK |
| `npm audit --audit-level=high` | 0 vulnérabilité |
| actionlint 1.7.7 sur `ci.yml` | OK |

**NOT RUN** : CI GitHub de la PR (s'exécutera à l'ouverture) ; gitleaks sur tout l'historique (fait par
le job `secret-scan`).

## Known gaps

- Aucun adapter réel ni matérialisation : le plan ne produit aucun fichier (E2).
- Le contexte d'organisation effectif (A3) n'est pas appliqué à la résolution (runtimes autorisés,
  politiques) : E6. Pas de compatibilité de versions entre extensions : E2.
- Pas de Domain IR (E3) ; les items de domaine sont seulement épinglés dans l'IR.
- Pas de record d'exécution persistant (closure, plan) ni d'Evidence de compilation : E4.
- Aucun Control Plane, Workbench, Worker, Registry ni AI Gateway.
- Documents 03 et 06 révisés en v1.1 (modifications suivies à accepter) ; divergences D-2 à D-5.

## Decisions

ADR-091, ADR-092, ADR-093, ADR-094, **ADR-095** (E1 : chaîne native, catalogue en données, gate
redéfinie) — voir [`DECISIONS.md`](DECISIONS.md).

## Next single action

**E2 — Adapter Protocol v0 et premier adapter** ([`BACKLOG.md`](BACKLOG.md)) ; choisir d'abord le runtime
du premier adapter.

---

## Rapport de mission E1 — Kernel Façade (document 05 §11, Annexe A §16)

- **Mission** : E1 — Kernel Façade, redéfinie par ADR-095 après ADR-094.
- **Date** : 2026-09-25.
- **Branch / HEAD** : `claude/e1-kernel-facade`, base `83aa8e1`.
- **Objectif** : une façade headless unique `validate → resolve → plan`, utilisable par CLI et tests, sur
  la chaîne du document 03 (closure → IR → ResolvedSystem → ExecutionPlan), sans framework dans le Kernel.
- **Scope** : `kernel/compiler`, `surfaces/cli`, codes de diagnostic, golden Asteria compilé, gouvernance.
- **Out of scope** : adapters et matérialisation (E2), Domain IR (E3), Evidence de compilation (E4),
  politiques d'organisation (E6), Control Plane, Workbench.
- **État initial** : Kernel E0 seul, aucun chemin de compilation, aucune CLI (après R0-D).
- **Changements réalisés** : voir *Completed*.
- **Fichiers touchés** : `kernel/compiler/**`, `surfaces/cli/**` (nouveaux) ;
  `kernel/contracts/src/primitives/diagnostics.ts` et deux tests ; `goldens/asteria/{harness.ts,README.md,sources/catalog.json,expected/*}` ;
  `package.json`, `package-lock.json` (workspaces) ; `.github/workflows/{ci.yml,README.md}` (libellés) ;
  documentation et gouvernance.
- **Contrats impactés** : aucun schéma A1–A7 modifié ; golden contrats/preuves inchangés.
- **Migrations** : aucune.
- **Tests exécutés / résultats** : voir *Tests*.
- **Preuves** : `goldens/asteria/expected/compilation.json` (digests closure, IR, resolved, plan) ; tests
  `kernel/compiler/test/`, `surfaces/cli/test/`.
- **Risques résiduels** : R-11 (parité des runtimes), R-16 (dossier) —
  [`RISK_REGISTER.md`](docs/governance/RISK_REGISTER.md).
- **Décisions** : ADR-095.
- **Documentation** : README, CONTEXT, ROADMAP, BACKLOG, CURRENT_STATE, IMPLEMENTATION_MATRIX, DECISIONS,
  CHANGELOG, ARBITRATIONS, RISK_REGISTER, registre ADR, runbook local, READMEs des packages et du golden,
  workflows.
- **Statut** : PASS (gate ADR-095) localement.
- **Prochaine action unique** : E2 — Adapter Protocol v0 et premier adapter.

---

## Rapport de mission R0-D — repartir propre (document 05 §11, Annexe A §16)

- **Mission** : R0-D — suppression de l'itération précédente (décision du responsable, ADR-094).
- **Date** : 2026-09-25.
- **Branch / HEAD** : `claude/r0-d-clean-slate`, base `f2590a8`.
- **Objectif** : repartir sur une base unique, sans code ni vocabulaire hérité d'une itération jamais
  mise en production, et sans logique dupliquée.
- **Scope** : suppression du code, de la CI et des dépendances de l'itération précédente ; découplage du
  golden ; outillage du dépôt ; archivage documentaire ; gouvernance.
- **Out of scope** : E1 (redéfinie séparément), modification des documents 01–07, ruleset GitHub.
- **État initial** : Kernel E0 et golden sur `main` ; 1 570 fichiers de l'itération précédente ; golden
  couplé à `factory/model/canonical-system.mjs` ; 8 checks requis tous issus de l'ancienne CI ; lockfile
  de 7 649 lignes.
- **Changements réalisés** : voir *Completed*.
- **Fichiers touchés** : suppressions ci-dessus ; `goldens/**`, `kernel/contracts/src/primitives/digest.ts`
  et deux tests ; `tools/quality/**` (déplacés) ; `package.json`, `package-lock.json` ; `.github/**` ;
  `.gitleaks.toml` (commentaires) ; `docs/**` (archivage, liens, ADR-094, amendements) ; fichiers de
  gouvernance racine.
- **Contrats impactés** : aucun schéma modifié ; golden régénéré (CR-001 et EvidenceRecords changent de
  digest car une obligation disparaît).
- **Migrations** : aucune.
- **Tests exécutés / résultats** : voir *Tests*.
- **Preuves** : golden régénéré à l'identique ; test d'imports ; contrôle de liens ; audit ; gitleaks.
- **Risques résiduels** : R-15 (ruleset, bloquant), R-16 (dossier) —
  [`RISK_REGISTER.md`](docs/governance/RISK_REGISTER.md).
- **Décisions** : ADR-094.
- **Documentation** : README, CONTEXT, AGENTS, ROADMAP, BACKLOG, CURRENT_STATE, IMPLEMENTATION_MATRIX,
  DECISIONS, SECURITY, CONTRIBUTING, CHANGELOG ; ARBITRATIONS, RISK_REGISTER, SOURCE_OF_TRUTH et
  politiques ; registre ADR, archives, glossaire, onboarding, runbook local, workflows.
- **Statut** : PASS localement ; merge soumis à ARB-11.
- **Prochaine action unique** : redéfinir et lancer E1 — Kernel Façade.

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
