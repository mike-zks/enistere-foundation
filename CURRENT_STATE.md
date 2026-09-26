# CURRENT STATE

> État réel du dépôt (document 05 §2E) — jamais une intention. Mis à jour obligatoirement en fin de mission.

| Champ | Valeur |
|---|---|
| Commit / branche | Base `c28c6f1` (`main`, fusion de la PR #259) ; travail sur `claude/e4-ownership-evidence` |
| Date | 2026-09-26 |
| Mission | E4 — Ownership & Evidence Extraction (ADR-098) ; première mission de l'horizon V1 |
| Résultat | E4 **PASS** localement sur la gate du document 06 (owner change survit ; proof chain exportable) ; CI de la PR à confirmer |

## Completed

- **Kernel** : contrats A1–A7 (E0) et **A8 `MaterializationRecord`** (E4 : schéma, registre, autorité
  COMPILE_APPLY par le compilateur, règles de chemins et d'outcome, validation d'ensemble) ; compiler,
  façade (E1), Adapter Protocol v0 (E2), Domain IR (E3) ; **proof chain v1** (`exportProofChain`,
  `verifyProofChain` : digest, ensemble fermé, rejeu de la compilation, liens A8/A7).
- **Engine** : un A8 par matérialisation (`.foundation/records/`, révision n+1, supersedes) — l'inventaire
  local est supprimé, le dernier A8 est l'unique inventaire ; VERIFY cite l'A8 vérifié ; `executedAt`
  injecté.
- **CLI** : `export`, `verify-bundle`. **CI** `adapters` : export et vérification du bundle réel, publié en
  artefact.
- **Golden Asteria** : `expected/proof-chain.json` vérifié par le test (et altération refusée).
- Missions antérieures : E0, R0-C, R0-D, E1, E2, E3 — rapports ci-dessous ; documents 03 et 06 v1.1.

## In progress

Aucun.

## Blocked

Aucun. Rappel : `adapters` doit figurer dans les checks requis de `protect-main` (ADR-096).

## Tests (exécutés le 2026-09-26 sur `claude/e4-ownership-evidence`)

| Commande | Résultat |
|---|---|
| `npm run foundation:typecheck` (7 workspaces) | OK (0 erreur) |
| `npm run foundation:test` | 117/117 PASS — compiler 27 (dont proof chain 6), contracts 53 (dont A8 5), extensions 6, materializer 9 (dont gate E4), adapter 5, CLI 8, goldens 9 |
| `npm run golden:asteria:update` (deux exécutions) | Aucun écart ; 21 fichiers, 0 diagnostic |
| CLI `materialize` → `verify --toolchain` → `export` → `verify-bundle` | 2 (PARTIAL) → 0 (PASS) → 0 (EXPORTED : 6 contrats, 1 A8, 5 A7) → 0 (VALID) ; bundle altéré → INVALID |
| `npm run tools:test` · `npm run docs:links` · `npm audit --audit-level=high` · actionlint | OK · OK · 0 vulnérabilité · OK |

**NOT RUN** : CI GitHub de la PR (s'exécutera à l'ouverture, dont le job `adapters`).

## Known gaps

- Pas de signature ni d'enveloppe in-toto/SLSA de la proof chain ; pas d'Evidence Graph ni de proof
  profiles (V1+) ; le bundle porte les digests des fichiers, pas leur contenu.
- Pas de projection du domaine vers un runtime (E5) ; facets et invariants non interprétés.
- Un seul runtime (NestJS, `api-service`) ; pas de lockfile généré ; pas de signature des extensions.
- Contexte d'organisation non appliqué (E6) ; aucun Control Plane, Workbench, Worker, Registry, AI Gateway.

## Decisions

ADR-091 à ADR-097, **ADR-098** (A8 MaterializationRecord et proof chain v1) — voir
[`DECISIONS.md`](DECISIONS.md).

## Next single action

**E5 — Domain Contract Projection** ([`BACKLOG.md`](BACKLOG.md)) ; trancher d'abord le format de projection
de l'API et le périmètre des invariants exécutables.

---

## Rapport de mission E4 — Ownership & Evidence Extraction (document 05 §11, Annexe A §16)

- **Mission** : E4 — Ownership & Evidence Extraction.
- **Date** : 2026-09-26.
- **Branch / HEAD** : `claude/e4-ownership-evidence`, base `c28c6f1`.
- **Objectif** : rendre l'ownership durable (un changement de l'équipe survit à toute re-matérialisation)
  et la chaîne de preuve exportable et vérifiable hors du dépôt.
- **Scope** : `kernel/contracts` (A8), `kernel/compiler` (proof chain), `kernel/extensions`
  (réexport), `engine/materializer`, CLI, golden, CI.
- **Out of scope** : signature, in-toto/SLSA, Evidence Graph, proof profiles, Control Plane.
- **État initial** : E3 mergée ; inventaire local `.foundation/inventory.json` hors modèle de contrats ;
  EvidenceRecords non chaînés.
- **Changements réalisés** : voir *Completed*.
- **Fichiers touchés** : `kernel/contracts/{schemas/v1alpha1/{materialization-record,common}.schema.json,src/**,test/**}` ;
  `kernel/compiler/src/{proof-chain,index}.ts`, `kernel/compiler/test/proof-chain.test.ts` ;
  `kernel/extensions/src/{adapter,index,ownership}.ts` ; `engine/materializer/{src,test}/**` ;
  `surfaces/cli/**` ; `goldens/**` ; `extensions/runtimes/nestjs/manifest.json` ;
  `.github/workflows/**` ; documentation et gouvernance.
- **Contrats impactés** : nouveau contrat A8 ; `common.schema.json` (kind `MaterializationRecord`) ;
  A1–A7 inchangés.
- **Migrations** : aucune (aucun workspace matérialisé hors des tests, ADR-094).
- **Tests exécutés / résultats** : voir *Tests*.
- **Preuves** : `materializer.test.ts` (gate owner change) ; `proof-chain.test.ts` ;
  `goldens/asteria/expected/proof-chain.json` ; job CI `adapters` (`verify-bundle`).
- **Risques résiduels** : voir *Known gaps*.
- **Décisions** : ADR-098.
- **Documentation** : CONTEXT, ROADMAP, BACKLOG, CURRENT_STATE, IMPLEMENTATION_MATRIX, DECISIONS,
  CHANGELOG, registre ADR, README (racine, contrats, engine, CLI, golden, workflows), runbook.
- **Statut** : PASS (owner change survit ; proof chain exportable) — localement.
- **Prochaine action unique** : E5 — Domain Contract Projection.

---

## Rapport de mission E3 — Domain IR (document 05 §11, Annexe A §16)

- **Mission** : E3 — Domain IR et enrichissement de l'IR.
- **Date** : 2026-09-26.
- **Branch / HEAD** : `claude/e3-domain-ir`, base `b196bdd`.
- **Objectif** : représenter le domaine dans l'IR, de façon déterministe, et le relier aux composants.
- **Scope** : `kernel/compiler` (Domain IR, IR, plan, façade), registre de diagnostics, contexte d'adapter,
  Engine (transmission), golden.
- **Out of scope** : projection du domaine (E5), interprétation des facets (E5/E6), Evidence (E4).
- **État initial** : E2 mergée ; items de domaine épinglés sans représentation du domaine.
- **Changements réalisés** : voir *Completed*.
- **Fichiers touchés** : `kernel/compiler/src/{domain-ir,ir,plan,facade,index}.ts`,
  `kernel/compiler/test/domain-ir.test.ts` ; `kernel/contracts/src/primitives/diagnostics.ts` et son
  test ; `kernel/extensions/src/adapter.ts` ; `engine/materializer/src/materialize.ts` ;
  `goldens/asteria/{harness.ts,README.md,expected/*}` ; documentation et gouvernance.
- **Contrats impactés** : aucun schéma modifié.
- **Migrations** : aucune.
- **Tests exécutés / résultats** : voir *Tests*.
- **Preuves** : `goldens/asteria/expected/compilation.json` (Domain IR, bindings, unsupported) ;
  `domain-ir.test.ts`.
- **Risques résiduels** : voir *Known gaps*.
- **Décisions** : ADR-097.
- **Documentation** : CONTEXT, ROADMAP, BACKLOG, CURRENT_STATE, IMPLEMENTATION_MATRIX, DECISIONS,
  CHANGELOG, registre ADR, README du compiler et du golden.
- **Statut** : PASS (IR déterministe ; unsupported explicite) — localement.
- **Prochaine action unique** : E4 — Ownership & Evidence Extraction.

---

## Rapport de mission E2 — Adapter Protocol v0 (document 05 §11, Annexe A §16)

- **Mission** : E2 — Adapter Protocol v0 et premier adapter.
- **Date** : 2026-09-25.
- **Branch / HEAD** : `claude/e2-adapter-protocol`, base `c8a1628`.
- **Objectif** : prouver le protocole d'adapter du document 03 §6.10–6.11 avec un premier runtime écrit
  de zéro, jusqu'à un service qui démarre.
- **Scope** : `kernel/extensions`, `engine/materializer`, `extensions/runtimes/nestjs`, CLI, golden, CI.
- **Out of scope** : Domain IR (E3), capabilities, second adapter (E8), Workers, signatures.
- **État initial** : E1 mergée ; résolution contre un catalogue synthétique ; aucun adapter.
- **Changements réalisés** : voir *Completed*.
- **Fichiers touchés** : `kernel/extensions/**`, `engine/materializer/**`, `extensions/runtimes/nestjs/**`
  (nouveaux) ; `kernel/contracts/src/{primitives/diagnostics.ts,schema-validation.ts,index.ts}` ;
  `surfaces/cli/**` ; `goldens/**` (workspace, harness, test déplacé) ; `package.json`,
  `package-lock.json` ; `.github/workflows/**` ; documentation et gouvernance.
- **Contrats impactés** : aucun schéma A1–A7 modifié ; nouveau schéma `adapter-manifest.v0`.
- **Migrations** : aucune.
- **Tests exécutés / résultats** : voir *Tests*.
- **Preuves** : `goldens/asteria/expected/materialization.json` ; EvidenceRecords du job `adapters` ;
  tests des workspaces.
- **Risques résiduels** : supply chain des extensions (pas de signature) ; reproductibilité transitive
  (pas de lockfile) — voir *Known gaps*.
- **Décisions** : ADR-096.
- **Documentation** : README, CONTEXT, ROADMAP, BACKLOG, CURRENT_STATE, IMPLEMENTATION_MATRIX, DECISIONS,
  CHANGELOG, registre ADR, runbook local, READMEs des packages, du golden et des workflows.
- **Statut** : PASS (gate du document 06 : discovery/resolve/plan/materialize/verify par manifest ; aucune
  capability perdue ; aucun framework dans le Kernel ni l'Engine) — localement.
- **Prochaine action unique** : E3 — Domain IR.

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
