# IMPLEMENTATION MATRIX

> Couverture **prouvée** (document 05 §2E). Un contrat ou une capacité n'est VERIFIED que si une preuve
> adaptée existe (test automatisé, golden, conformance, audit) — jamais sur déclaration. Mise à jour :
> 2026-09-25, fin de R0-D (ADR-094 : itération précédente supprimée, statuts « Lab » retirés). Niveaux : SPECIFIED · IMPLEMENTED · EXECUTABLE · CONTRACT-COMPATIBLE ·
> CONFORMANT · VERIFIED (document 02 annexe B).

## Contrats E0 (A1–A7)

| Contrat | Zone | Implemented | Tested | Production-ready | Niveau | Evidence | Mission | Notes |
|---|---|---|---|---|---|---|---|---|
| Primitives partagées (version/seam, stable ref, provenance, acceptance/status, diagnostics, digest) | Kernel | Oui | Oui | N/A (bibliothèque) | VERIFIED (tests) | `kernel/contracts/test/primitives.test.ts`, `versioning-and-schemas.test.ts`, `authority.test.ts` ; vecteur sha256/JCS vérifié indépendamment | E0 | Chaîne de migration vide ; mécanisme prouvé par génération synthétique |
| A1 Requirement Baseline | Kernel | Oui | Oui | N/A | VERIFIED (tests + golden) | `contracts.test.ts` (A1) ; `goldens/asteria/contracts/requirement-baseline--asteria-requirements--r1.json` | E0 | Provenance, ambiguïtés bloquantes, cycles, acceptation humaine d'une proposition IA |
| A2 Decision Set | Kernel | Oui | Oui | N/A | VERIFIED (tests + golden) | `contracts.test.ts` (A2), `contract-set.test.ts` (traçabilité) ; `decision-set--asteria-decisions--r1.json` | E0 | Alternatives, rationale, drivers résolus dans A1 |
| A3 Effective Organization Context | Kernel | Oui | Oui | N/A | VERIFIED (tests + golden) | `effective-context.test.ts` ; `effective-organization-context--asteria-context--r1.json` | E0 | Dérivé reproductible (algorithme v1) ; Entity Profile/Policy Pack restent des références externes jusqu'à E6 |
| A4 System Definition | Kernel | Oui | Oui | N/A | VERIFIED (tests + golden) | `contracts.test.ts` (A4), `contract-set.test.ts`, `golden-asteria.test.ts` ; `system-definition--asteria--r1/r2.json` | E0 | Kinds ouverts (Async Worker accepté) ; pas encore d'IR (E3) |
| A5 Domain Contract | Kernel | Oui | Oui | N/A | VERIFIED (tests + golden) | `contracts.test.ts` (A5) ; `domain-contract--asteria-service-requests--r1.json` | E0 | Facets offline-sync, scheduling, workflow ; projection vers runtimes en E5 |
| A6 Change Request | Kernel | Oui | Oui | N/A | VERIFIED (tests + golden) | `contracts.test.ts` (A6), `contract-set.test.ts` ; `change-request--asteria-cr-001/002--r1.json` | E0 | Cohérence base → proposé vérifiée ; calcul d'impact automatique en E7 |
| A7 EvidenceRecord | Kernel | Oui | Oui | N/A | VERIFIED (tests + golden) | `contracts.test.ts` (A7), `contract-set.test.ts` (péremption, historique) ; 9 fichiers `goldens/asteria/evidence/` | E0 | Produits par le checker du golden ; export de proof chain en E4 |
| Golden Asteria (5 surfaces dont Async Worker) | Goldens | Oui | Oui | N/A | VERIFIED (golden byte-identique) | `golden-asteria.test.ts` ; `goldens/asteria/expected/report.json` ; job CI `kernel` | E0 | Ne dépend que du Kernel (test d'imports) ; aucune matérialisation avant E2 |

## Product Capabilities (document 07)

L'itération précédente (générateur, 7 starters, capabilities auth/rbac/files, CLI) a été supprimée
(ADR-094) : aucune de ses mesures n'est revendiquée. Ce qui n'est pas prouvé par le Kernel est **Non**.

| Capability | Plan logique / zones | Implemented | Tested | Production-ready | Evidence | Mission | Notes |
|---|---|---|---|---|---|---|---|
| CAP-01 Intent Intake & Source Understanding | Knowledge & Decision / Control Plane, Surfaces | Non (contrat seulement : sources + provenance dans A1) | Contrat oui | Non | A1 `spec.sources` + digest du brief (`golden-asteria.test.ts`) | V1+ | Aucun ingestion/parsing |
| CAP-02 Requirements Engineering | Knowledge & Decision / Control Plane | Partiel (contrat A1) | Oui (contrat) | Non | A1 | E0 → V1 | Pas de surface ni de workflow |
| CAP-03 Architecture Intelligence & Decision Support | Knowledge & Decision / Control Plane | Partiel (contrat A2) | Oui (contrat) | Non | A2 | E0 → V1 | Pas d'évaluation de patterns |
| CAP-04 Organization / Entity Governance | Knowledge & Decision / Control Plane, Kernel policy | Partiel (A3 dérivé) | Oui (contrat) | Non | A3 | E6, V2 | Entity Profiles/Policy Packs non modélisés |
| CAP-05 System Definition | Knowledge & Decision ↔ Compilation / Kernel | Partiel (contrat A4) | Oui | Non | A4, golden | E0 → E3 | Pas encore d'IR ni de résolution |
| CAP-06 Domain Contract & Business Semantics | Knowledge & Decision ↔ Compilation / Kernel | Partiel (contrat A5) | Oui | Non | A5, golden | E5 | Pas de projection vers un runtime |
| CAP-07 Runtime & Technology Ecosystem | System Compilation / Registry, Adapters | Non | Non | Non | — | E2, E8 | Runtimes à réécrire comme adapters du protocole E2 |
| CAP-08 Platform Capabilities | System Compilation / Capability Adapters | Non | Non | Non | — | E2+ | À exprimer via manifests d'extension |
| CAP-09 Design System & Experience Governance | Knowledge & Decision / Compilation | Non | Non | Non | — | E6 | `design-tokens.json` du doc 04 absent (CONTEXT D-5) |
| CAP-10 System Compiler | System Compilation / Kernel, Engine | Non | Non | Non | — | E1, E3 | Aucune résolution ni plan ; E1 à redéfinir (BACKLOG) |
| CAP-11 AI Engineering Assistant | Transversal / AI Gateway | Non (invariants d'autorité IA seulement) | Oui (invariants) | Non | Invariants d'autorité IA dans A1–A7 (`authority.test.ts`) | V1+ | Pas d'AI Gateway ni d'AgentActionRecord |
| CAP-12 Conformance, Evidence & Assurance | Assurance & Evolution / Kernel Evidence, Checkers | Partiel (contrat A7 + checker du golden) | Oui | Non | A7, `golden-asteria.test.ts` | E4 | Pas d'Evidence Graph ni de proof profiles |
| CAP-13 Lifecycle & System Evolution | Assurance & Evolution / Engine, Workers | Partiel (contrat A6) | Oui (contrat) | Non | A6, cohérence et péremption | E7 | Pas de calcul d'impact |
| CAP-14 Brownfield / Existing System Adoption | Assurance & Evolution / Workers, Observers | Non | Non | Non | — | V3 | Hors périmètre R0 |
| CAP-15 Surfaces & Collaboration | Transversal / Surfaces | Non | Non | Non | — | E1, V1 | Pas de CLI, Workbench, API ni SDK Foundation |
| CAP-16 Ecosystem, Registry & Distribution | Transversal / Registry | Non | Non | Non | — | V2–V4 | — |

Aucune capacité n'est PRODUCTION_READY ; aucun service Foundation n'est déployé
([`PRODUCTION_READINESS.md`](docs/governance/PRODUCTION_READINESS.md)).
