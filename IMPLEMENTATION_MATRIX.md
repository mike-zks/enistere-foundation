# IMPLEMENTATION MATRIX

> Couverture **prouvée** (document 05 §2E). Un contrat ou une capacité n'est VERIFIED que si une preuve
> adaptée existe (test automatisé, golden, conformance, audit) — jamais sur déclaration. Mise à jour :
> 2026-09-26, fin de E6 (ADR-100 : politiques d'organisation évaluées et contrat A9 DesignSystem). Niveaux : SPECIFIED · IMPLEMENTED · EXECUTABLE · CONTRACT-COMPATIBLE ·
> CONFORMANT · VERIFIED (document 02 annexe B).

## Contrats (A1–A7 : E0 ; A8 : E4 ; A9 : E6)

| Contrat | Zone | Implemented | Tested | Production-ready | Niveau | Evidence | Mission | Notes |
|---|---|---|---|---|---|---|---|---|
| Primitives partagées (version/seam, stable ref, provenance, acceptance/status, diagnostics, digest) | Kernel | Oui | Oui | N/A (bibliothèque) | VERIFIED (tests) | `kernel/contracts/test/primitives.test.ts`, `versioning-and-schemas.test.ts`, `authority.test.ts` ; vecteur sha256/JCS vérifié indépendamment | E0 | Chaîne de migration vide ; mécanisme prouvé par génération synthétique |
| A1 Requirement Baseline | Kernel | Oui | Oui | N/A | VERIFIED (tests + golden) | `contracts.test.ts` (A1) ; `goldens/asteria/contracts/requirement-baseline--asteria-requirements--r1.json` | E0 | Provenance, ambiguïtés bloquantes, cycles, acceptation humaine d'une proposition IA |
| A2 Decision Set | Kernel | Oui | Oui | N/A | VERIFIED (tests + golden) | `contracts.test.ts` (A2), `contract-set.test.ts` (traçabilité) ; `decision-set--asteria-decisions--r1.json` | E0 | Alternatives, rationale, drivers résolus dans A1 |
| A3 Effective Organization Context | Kernel | Oui | Oui | N/A | VERIFIED (tests + golden) | `effective-context.test.ts` ; `effective-organization-context--asteria-context--r1.json` | E0, E6 | Dérivé reproductible (algorithme v1) ; appliqué à la compilation depuis E6 (catalogue fermé) ; Entity Profile/Policy Pack restent des références externes |
| A4 System Definition | Kernel | Oui | Oui | N/A | VERIFIED (tests + golden) | `contracts.test.ts` (A4), `contract-set.test.ts`, `goldens/test/golden-asteria.test.ts` ; `system-definition--asteria--r1/r2.json` | E0 | Kinds ouverts (Async Worker accepté) ; pas encore d'IR (E3) |
| A5 Domain Contract | Kernel | Oui | Oui | N/A | VERIFIED (tests + golden) | `contracts.test.ts` (A5) ; `domain-contract--asteria-service-requests--r1.json` | E0 | Facets offline-sync, scheduling, workflow ; projection vers runtimes en E5 |
| A6 Change Request | Kernel | Oui | Oui | N/A | VERIFIED (tests + golden) | `contracts.test.ts` (A6), `contract-set.test.ts` ; `change-request--asteria-cr-001/002--r1.json` | E0 | Cohérence base → proposé vérifiée ; calcul d'impact automatique en E7 |
| A7 EvidenceRecord | Kernel | Oui | Oui | N/A | VERIFIED (tests + golden) | `contracts.test.ts` (A7), `contract-set.test.ts` (péremption, historique) ; 9 fichiers `goldens/asteria/evidence/` | E0 | Produits par le checker du golden et par VERIFY (citent l'A8 vérifié) ; exportés dans la proof chain (E4) |
| A8 MaterializationRecord | Kernel | Oui | Oui | N/A | VERIFIED (tests + golden) | `kernel/contracts/test/materialization-record.test.ts` (schéma, chemins, outcome, autorité, ensemble) ; `materializer.test.ts` ; `goldens/asteria/expected/proof-chain.json` | E4 | Produit par le compilateur seulement ; stocké par composant dans `.foundation/records/` |
| A9 DesignSystem | Kernel | Oui | Oui | N/A | VERIFIED (tests + golden) | `kernel/contracts/test/design-system.test.ts` (valeurs typées, alias, cycles, surcharges, autorité, liaison des surfaces) ; `design-system--operator-design-system--r1.json` ; `npm run design:tokens` (tokens du document 04) | E6 | Appartient à l'organisation (sans `system`) ; types de tokens fermés |
| Proof chain v1 (export, vérification par rejeu) | Kernel | Oui | Oui | N/A | VERIFIED (tests + golden + CI) | `kernel/compiler/test/proof-chain.test.ts` ; `goldens/test/golden-asteria.test.ts` ; `surfaces/cli/test/cli.test.ts` (altération → code 1) ; job CI `adapters` (`verify-bundle`) | E4 | Pas de signature ni d'enveloppe in-toto/SLSA |
| Golden Asteria (5 surfaces dont Async Worker) | Goldens | Oui | Oui | N/A | VERIFIED (golden byte-identique) | `goldens/test/golden-asteria.test.ts` ; `goldens/asteria/expected/report.json` ; job CI `kernel` | E0 | Ne dépend que du Kernel (test d'imports) ; aucune matérialisation avant E2 |

## Compilation E1 (Kernel Façade)

| Élément | Zone | Implemented | Tested | Production-ready | Niveau | Evidence | Mission | Notes |
|---|---|---|---|---|---|---|---|---|
| System Closure | Kernel | Oui | Oui | N/A | VERIFIED (tests) | `kernel/compiler/test/compiler.test.ts` (fermeture exacte, digest sensible à chaque entrée) | E1 | Digest cité par chaque A8 (E4) |
| System IR | Kernel | Oui | Oui | N/A | VERIFIED (tests + golden) | `compiler.test.ts` (normalisation, indépendance à l'ordre) ; `goldens/asteria/expected/compilation.json` | E1, E3 | Porte les Domain IR et les bindings ; intention non réalisée listée |
| Domain IR | Kernel | Oui | Oui | N/A | VERIFIED (tests + golden) | `kernel/compiler/test/domain-ir.test.ts` (types résolus, références épinglées, ordre, facets, bindings, PARTIAL) ; `expected/compilation.json` | E3 | Facets non interprétées ; projeté en contrat OpenAPI par E5 |
| Contrat d'API partagé (projection OpenAPI 3.1) | Kernel | Oui | Oui | N/A | VERIFIED (tests + golden + CI) | `kernel/compiler/test/api-contract.test.ts` (routes, schémas, digest indépendant du catalogue, même digest fournisseur/consommateurs, owner work) ; `goldens/asteria/expected/compilation.json` ; job CI `adapters` (check `contract`) | E5 | Pas d'AsyncAPI ; invariants non exécutables ; routes RPC |
| Catalogue d'extensions (données) | Kernel | Oui | Oui | N/A | VERIFIED (tests) | `compiler.test.ts` (invalides, doublons, chevauchements refusés) | E1 | Descripteurs seulement ; manifests d'adapter en E2 |
| Résolution (ResolvedSystem) | Kernel | Oui | Oui | N/A | VERIFIED (tests + golden) | `compiler.test.ts` (catalogue vide → UNSUPPORTED, repli tracé, capability sans fournisseur) ; golden PARTIAL | E1 | Compatibilité de versions (E2) |
| Évaluation des politiques (A3) | Kernel | Oui | Oui | N/A | VERIFIED (tests + golden) | `kernel/compiler/test/organization-design.test.ts` (blocage sans waiver, runtime, fournisseur d'identité, accessibilité, waiver expiré) ; `expected/compilation.json` (`policy`) ; `materializer.test.ts` (waiver expiré : rien n'est écrit) | E6 | Catalogue fermé de 4 familles de règles ; les autres sont NOT_EVALUATED |
| Design bindings | Kernel | Oui | Oui | N/A | VERIFIED (tests + golden) | `organization-design.test.ts` (contextes résolus, theme ≠ domain) ; `expected/compilation.json` (`ir.designBindings`) | E6 | Aucun adapter de surface ne les consomme encore (E8) |
| ExecutionPlan | Kernel | Oui | Oui | N/A | VERIFIED (tests + golden) | `compiler.test.ts` ; `expected/compilation.json` | E1 | Aucun artefact de fichier ni écriture (E2) |
| Kernel Façade `validate / resolve / plan` | Kernel | Oui | Oui | N/A | VERIFIED (tests + golden) | `compiler.test.ts` (ensemble/catalogue invalide jamais résolu, sélection, ambiguïté, déterminisme, TA-04) | E1 | — |
| CLI `enistere-foundation` | Surfaces | Oui | Oui | N/A | VERIFIED (tests) | `surfaces/cli/test/cli.test.ts` (codes 0/1/2/64, sortie identique au golden) | E1 | Pas de distribution publiée |

## Adapter Protocol E2

| Élément | Zone | Implemented | Tested | Production-ready | Niveau | Evidence | Mission | Notes |
|---|---|---|---|---|---|---|---|---|
| Manifest d'adapter v0 et conversion en catalogue | Kernel | Oui | Oui | N/A | VERIFIED (tests) | `kernel/extensions/test/extensions.test.ts` | E2 | Pas de signature ni provenance (TA-06) |
| Règle d'ownership `decideWrite` | Kernel | Oui | Oui | N/A | VERIFIED (tests) | `extensions.test.ts` ; `engine/materializer/test/materializer.test.ts` (conflit sans écriture, owner-seeded préservé) | E2 | — |
| Hôte d'extensions (TRUSTED_IN_PROCESS) | Engine | Oui | Oui | N/A | VERIFIED (tests) | `materializer.test.ts` (modes non supportés et identités contradictoires écartés) | E2 | Isolation process/conteneur avec les Workers |
| MATERIALIZE (A8, idempotence, owner change préservé) | Engine | Oui | Oui | N/A | VERIFIED (tests) | `materializer.test.ts` (dont gate E4 : adapter v1 → v2, changement de l'équipe préservé) ; `surfaces/cli/test/cli.test.ts` | E2, E4 | — |
| VERIFY → EvidenceRecords | Engine | Oui | Oui | N/A | VERIFIED (tests + CI) | `materializer.test.ts` (PASS, FAIL, INCONCLUSIVE) ; job CI `adapters` | E2 | — |
| Adapter NestJS (`api-service`) | Extensions | Oui | Oui | N/A | BOOTABLE + CONTRACT (CI) | `extensions/runtimes/nestjs/test/adapter.test.ts` (contrat embarqué à l'identique, routes validées, handlers seedés, aucune capability simulée) ; `materializer.test.ts` (handlers de l'équipe préservés) ; job CI `adapters` (install, build, `/health` = 200, `contract`, audit) ; `expected/materialization.json` | E2, E5 | Pas de lockfile ; pas de capabilities ; logique métier = owner work |

## Product Capabilities (document 07)

L'itération précédente (générateur, 7 starters, capabilities auth/rbac/files, CLI) a été supprimée
(ADR-094) : aucune de ses mesures n'est revendiquée. Ce qui n'est pas prouvé par le Kernel est **Non**.

| Capability | Plan logique / zones | Implemented | Tested | Production-ready | Evidence | Mission | Notes |
|---|---|---|---|---|---|---|---|
| CAP-01 Intent Intake & Source Understanding | Knowledge & Decision / Control Plane, Surfaces | Non (contrat seulement : sources + provenance dans A1) | Contrat oui | Non | A1 `spec.sources` + digest du brief (`goldens/test/golden-asteria.test.ts`) | V1+ | Aucun ingestion/parsing |
| CAP-02 Requirements Engineering | Knowledge & Decision / Control Plane | Partiel (contrat A1) | Oui (contrat) | Non | A1 | E0 → V1 | Pas de surface ni de workflow |
| CAP-03 Architecture Intelligence & Decision Support | Knowledge & Decision / Control Plane | Partiel (contrat A2) | Oui (contrat) | Non | A2 | E0 → V1 | Pas d'évaluation de patterns |
| CAP-04 Organization / Entity Governance | Knowledge & Decision / Control Plane, Kernel policy | Partiel (A3 dérivé et appliqué à la compilation) | Oui | Non | A3, `organization-design.test.ts`, golden | E6, V2 | Entity Profiles/Policy Packs non modélisés ; catalogue de règles fermé |
| CAP-05 System Definition | Knowledge & Decision ↔ Compilation / Kernel | Partiel (contrat A4 + closure + IR + bindings de domaine) | Oui | Non | A4, golden, `compiler.test.ts`, `domain-ir.test.ts`, `organization-design.test.ts` | E0 → E6 | Day-2 (E7) |
| CAP-06 Domain Contract & Business Semantics | Knowledge & Decision ↔ Compilation / Kernel | Partiel (contrat A5 + Domain IR + contrat OpenAPI partagé réalisé par NestJS) | Oui | Non | A5, golden, `domain-ir.test.ts`, `api-contract.test.ts`, job CI `adapters` | E3 → E5 | Facets et invariants non exécutés ; pas d'AsyncAPI |
| CAP-07 Runtime & Technology Ecosystem | System Compilation / Registry, Adapters | Partiel (Adapter Protocol v0, un adapter NestJS) | Oui | Non | `extensions.test.ts`, `adapter.test.ts`, job CI `adapters` | E2, E8 | Une seule famille de runtime ; substitution en E8 |
| CAP-08 Platform Capabilities | System Compilation / Capability Adapters | Non | Non | Non | — | E2+ | À exprimer via manifests d'extension |
| CAP-09 Design System & Experience Governance | Knowledge & Decision / Compilation | Partiel (contrat A9, design bindings, politique d'accessibilité, tokens de l'interface Foundation) | Oui | Non | A9, `design-system.test.ts`, `organization-design.test.ts`, `npm run design:tokens` | E6 | Mockups absents (D-5) ; aucune surface générée |
| CAP-10 System Compiler | System Compilation / Kernel, Engine | Partiel (closure → IR → résolution → plan → matérialisation → vérification) | Oui | Non | `compiler.test.ts`, `api-contract.test.ts`, `materializer.test.ts`, `expected/materialization.json`, job CI `adapters` | E1 → E6 | Day-2 (E7) ; second runtime (E8) |
| CAP-11 AI Engineering Assistant | Transversal / AI Gateway | Non (invariants d'autorité IA seulement) | Oui (invariants) | Non | Invariants d'autorité IA dans A1–A7 (`authority.test.ts`) | V1+ | Pas d'AI Gateway ni d'AgentActionRecord |
| CAP-12 Conformance, Evidence & Assurance | Assurance & Evolution / Kernel Evidence, Checkers | Partiel (A7, A8, checker du golden, VERIFY des adapters, proof chain v1 exportable) | Oui | Non | A7, A8, `goldens/test/golden-asteria.test.ts`, `materializer.test.ts`, `proof-chain.test.ts`, job CI `adapters` | E4 | Pas d'Evidence Graph, de proof profiles ni de signature |
| CAP-13 Lifecycle & System Evolution | Assurance & Evolution / Engine, Workers | Partiel (contrat A6) | Oui (contrat) | Non | A6, cohérence et péremption | E7 | Pas de calcul d'impact |
| CAP-14 Brownfield / Existing System Adoption | Assurance & Evolution / Workers, Observers | Non | Non | Non | — | V3 | Hors périmètre R0 |
| CAP-15 Surfaces & Collaboration | Transversal / Surfaces | Partiel (CLI headless) | Oui | Non | `surfaces/cli/test/cli.test.ts` | E1, V1 | Pas de Workbench, API ni SDK |
| CAP-16 Ecosystem, Registry & Distribution | Transversal / Registry | Non | Non | Non | — | V2–V4 | — |

Aucune capacité n'est PRODUCTION_READY ; aucun service Foundation n'est déployé
([`PRODUCTION_READINESS.md`](docs/governance/PRODUCTION_READINESS.md)).
