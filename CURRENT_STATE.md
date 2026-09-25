# CURRENT STATE

> État réel du dépôt (document 05 §2E) — jamais une intention. Mis à jour obligatoirement en fin de mission.

| Champ | Valeur |
|---|---|
| Commit / branche | Base `f2590a8` (`main`, fusion de la PR #252) ; travail sur `claude/r0-d-clean-slate` |
| Date | 2026-09-25 |
| Mission | R0-D — repartir propre (ADR-094), après E0 et R0-C |
| Résultat | R0-D **PASS** localement (voir *Tests*) ; CI de la PR bloquée par le ruleset tant qu'ARB-11 n'est pas traité |

## Completed

- **Kernel** `kernel/contracts` (`@enistere/foundation-kernel-contracts`, E0) : sept contrats A1–A7 en
  JSON Schema 2020-12, validation structurelle (Ajv strict) et sémantique, primitives partagées
  (apiVersion + seam de migration, références épinglées, provenance, acceptance/status, diagnostics,
  digest sha256/JCS, `fileDigest`), ensemble fermé, A3 dérivé, A6 cohérent, A7 append-only et péremption.
- **Golden Asteria** (`goldens/asteria/`) : cinq surfaces dont l'Async Worker ; 8 contrats et 9
  EvidenceRecords générés depuis `source.ts` ; scénario Day-2 (CR-001 appliqué, 3 preuves invalidées puis
  revérifiées) et proposition IA UNSUPPORTED (CR-002). Ne dépend que du Kernel (test d'imports).
- **R0-D** (ADR-094) : itération précédente supprimée (`factory/`, `starters/`, `capabilities/`,
  `packages/`, `contracts/`, `deployment/`, `examples/`, cinq workflows) ; outillage du dépôt dans
  `tools/quality/` ; racine npm réduite au Kernel ; CI à quatre jobs (`kernel`, `secret-scan`, `docs`,
  `audit`) ; ADR 001–090 (sauf 073) et documentation de l'itération précédente archivés ; gouvernance à
  jour ; travaux E1 non commités abandonnés (reposaient sur la factory).
- Missions antérieures : E0 (PASS, ADR-092/093) et R0-C (ADR-093) — rapports ci-dessous.

## In progress

Aucun.

## Blocked

- **Merge de la PR R0-D** : le ruleset `protect-main` exige huit checks de l'ancienne CI qui ne
  s'exécutent plus (ARB-11, action du responsable).
- Tag `laboratory-final` (commit `f2590a8`) créé localement mais non poussé : le proxy de session refuse
  les tags. À pousser par le responsable (`git tag laboratory-final f2590a8 && git push origin laboratory-final`).

## Tests (exécutés le 2026-09-25 sur `claude/r0-d-clean-slate`)

| Commande | Résultat |
|---|---|
| `npm ci` (lockfile régénéré) | OK — 9 paquets |
| `npm run foundation:typecheck` | OK (0 erreur) |
| `npm run foundation:test` | 56/56 PASS |
| `npm run golden:asteria:update` (deux exécutions) puis `git status --porcelain goldens/` | Aucun écart ; 17 documents, 0 diagnostic |
| Test d'imports sur la version précédente du harness | Détecte l'import `../../factory/model/canonical-system.mjs` (garde-fou effectif) |
| `npm run tools:test` | 10/10 PASS |
| `npm run secrets:allowlist` | 2 exceptions justifiées et non expirées |
| `npm run docs:links` | OK — 52 fichiers, 0 lien mort (`docs/archive/` exclu) |
| `npm audit --audit-level=high` | 0 vulnérabilité |
| gitleaks 8.30.1 (binaire vérifié), `--log-opts=--all` | no leaks found — **10 commits seulement** : clone local superficiel ; l'historique complet est analysé par le job `secret-scan` (`fetch-depth: 0`) |
| actionlint 1.7.7 sur `ci.yml` | OK |

**NOT RUN** : CI GitHub de la PR (s'exécutera à l'ouverture ; merge bloqué par ARB-11).

## Known gaps

- Pas de Kernel Façade ni de résolution : aucun chemin `validate → resolve → plan` (E1, à redéfinir).
- Aucune génération de code possible : pas d'Adapter Protocol ni d'adapter (E2), pas d'IR (E3).
- Entity Profile, Policy Pack, Design System, Approval Policy : références externes seulement (E6).
- Evidence : pas d'Evidence Graph ni d'export de proof chain (E4) ; pas de calcul d'impact (E7).
- Aucun Control Plane, Workbench, Worker d'exécution, Registry ni AI Gateway.
- Passages du dossier contredits par ADR-094, à réviser (ARB-12) ; divergences D-2 à D-5 et D-9
  ([`CONTEXT.md`](CONTEXT.md)).

## Decisions

ADR-091, ADR-092, ADR-093, **ADR-094** (repartir propre ; amende ADR-073, 091, 092 et 093) — voir
[`DECISIONS.md`](DECISIONS.md).

## Next single action

**Redéfinir puis lancer E1 — Kernel Façade** sur une résolution native (proposition dans
[`BACKLOG.md`](BACKLOG.md)), une fois le ruleset mis à jour (ARB-11).

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
