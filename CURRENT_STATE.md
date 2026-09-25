# CURRENT STATE

> État réel du dépôt (document 05 §2E) — jamais une intention. Mis à jour obligatoirement en fin de mission.

| Champ | Valeur |
|---|---|
| Commit / branche | Base `56c8113` (`main`, fusion de la PR #251) ; travail sur `claude/hopeful-wozniak-z6g3wd` (commits de la mission E0 au-dessus de la base) |
| Date | 2026-09-25 |
| Mission | E0 — Contract Foundation (horizon R0) |
| Résultat | **PASS** au regard du gate du document 05 §8.1 ; **PASS proposé** pour P1–P10 (décomposition à valider, ADR-092) |

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

## In progress

Aucun.

## Blocked

Aucun blocage technique. En attente de décision humaine (non bloquant pour démarrer le préflight E1) :
décomposition P1–P10 (ADR-092).

## Tests (exécutés le 2026-09-25 sur l'arbre de travail de la mission)

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
- Divergences documentaires D-1 à D-6 ([`CONTEXT.md`](CONTEXT.md)).

## Decisions

ADR-091 (autorité du dossier, laboratoire en compatibilité, archivage), ADR-092 (Contract Foundation) —
voir [`DECISIONS.md`](DECISIONS.md).

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
- **Décisions** : ADR-091, ADR-092 ; décomposition P1–P10 proposée (validation humaine requise).
- **Documentation** : README, CONTEXT, AGENTS, ROADMAP, BACKLOG, CURRENT_STATE, IMPLEMENTATION_MATRIX,
  DECISIONS, SECURITY, CONTRIBUTING, CHANGELOG ; `docs/README.md`, `SOURCE_OF_TRUTH.md`,
  `DEFINITION_OF_DONE.md`, `PRODUCTION_READINESS.md`, `RISK_REGISTER.md`, `DEPENDENCIES.md`, runbooks,
  registre ADR, archives.
- **Statut** : PASS (gate document 05 §8.1) — P1–P10 proposés PASS, en attente de validation.
- **Prochaine action unique** : E1 — Kernel Façade.
