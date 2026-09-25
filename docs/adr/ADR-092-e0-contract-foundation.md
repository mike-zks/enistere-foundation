# ADR-092 — E0 Contract Foundation : sept contrats de première classe et primitives partagées

- Statut : Accepté — décomposition P1–P10 validée le 2026-09-25 ([ADR-093](ADR-093-r0c-repository-realignment.md), ARB-01)
- Date : 2026-09-25
- Décideur : Responsable technique (document 03) ; rédigé par l'agent de la mission E0
- Sources : document 05 §8.1, document 06 §6.8, document 02 (FR-*, NFR-*, SEC-*), document 03 §6.9–6.18
- Complète : ADR-091

## Contexte

La mission E0 introduit les contrats autoritatifs de la cible — A1 Requirement Baseline, A2 Decision
Set, A3 Effective Organization Context, A4 System Definition, A5 Domain Contract, A6 Change Request,
A7 EvidenceRecord — et leurs primitives partagées (version, stable ref, provenance, acceptance/status,
diagnostics, digest, seam de migration), sans cutover, sans modifier la génération historique et sans
créer une source de vérité concurrente (document 05 §8.1, document 06 §6.1).

## Décision

### Emplacement et technologie

- Package `kernel/contracts/` (`@enistere/foundation-kernel-contracts`, workspace npm, privé) : première
  brique de la zone **Foundation Kernel** du document 03 §6.19. Golden sous `goldens/asteria/`.
- TypeScript sur Node.js LTS (document 03 §4.2), **exécuté nativement** par le retrait de types de Node
  (≥ 22.18 ; CI en Node 24), syntaxe effaçable uniquement : aucune étape de build pour tester.
  `tsc --noEmit` vérifie les types.
- Les **JSON Schemas draft 2020-12** (`kernel/contracts/schemas/v1alpha1/`) sont la source neutre de la
  forme ; le Kernel les interprète via Ajv (mode strict), seule dépendance d'exécution. Les règles
  sémantiques inexprimables en schéma vivent dans `src/contracts/`. Aucune règle de forme n'est réécrite
  en TypeScript.
- Aucune dépendance vers un framework cible, un cloud ou un LLM ; aucun import du laboratoire.

### Primitives partagées

| Primitive | Décision |
|---|---|
| Version | `apiVersion: foundation.enistere.com/v1alpha1` ; révision entière `metadata.revision` ≥ 1, immuable dans sa sémantique. |
| Seam de migration | Registre explicite de migrations pures par (kind, from) ; version inconnue → `CONTRACT_UNSUPPORTED_API_VERSION` (classe UNSUPPORTED), cycle ou migration incorrecte → `CONTRACT_MIGRATION_FAILED`. Chaîne vide en E0, mécanisme testé par une génération synthétique. |
| Stable ref | `Kind/id@revision[#item]`, épinglable par digest ; aucune forme « latest ». Les entrées d'un contrat autoritatif sont **épinglées** (`pinnedContractRef`). |
| Digest | sha256 sur la sérialisation canonique RFC 8785 (JCS) du **contenu** : tout le document sauf `metadata.status`. Un passage ACCEPTED → SUPERSEDED ou VALID → EXPIRED ne casse aucune référence ; toute autre modification exige une nouvelle révision. |
| Provenance | origine (HUMAN, IMPORT, AI_PROPOSAL, COMPILER, CHECKER, OBSERVER, MIGRATION), acteur typé, outil, sources avec digest des octets, `derivedFrom` épinglé, confiance. La provenance ne confère aucune autorité. |
| Acceptance/status | Trois classes d'état : AUTHORITATIVE (A1, A2, A4, A5, A6 : transition DECIDE explicite par un humain, ou par le système sous Approval Policy), DERIVED (A3 : produit par le compilateur, recalculé, jamais accepté), RECORD (A7 : VERIFY par un checker ou un relecteur humain, jamais une IA). |
| Diagnostics | Codes stables préfixés, classe du modèle d'échec du document 03 §6.18, sévérité, couche, référence stable, JSON Pointer, remédiation, `retryable` ; ordre déterministe et dédoublonné. |

### Règles structurantes

- **Ensemble fermé** : un ensemble de contrats d'un système est fermé sous ses références (résolution,
  digest, item, type attendu) ; un contrat ACCEPTED ne repose que sur des entrées acceptées ou dérivées
  courantes. C'est une vue de validation, pas un modèle fusionné.
- **A3 dérivé reproductible** : algorithme `foundation.effective-organization-context` v1 (précédence
  croissante, verrous, dérogations explicites avec trace) ; toute divergence → `CONTEXT_NOT_REPRODUCIBLE`.
- **A4 ouvert** : les kinds de composants et préférences runtime sont des identifiants opaques résolus
  par extensions (E2) ; le Kernel n'énumère ni runtime ni type d'application.
- **A6 gouverné** : base épinglée ; changements RFC 6901 limités à `/spec` ; les changements déclarés
  doivent produire exactement la révision proposée (`CHANGE_INCONSISTENT`) ; UNSUPPORTED ne peut être
  ni accepté ni appliqué ; base dépassée → `CHANGE_BASE_STALE`.
- **A7 append-only** : une invalidation est une nouvelle révision qui supersède la précédente ; une
  preuve est périmée quand une révision plus récente que celle qu'elle a vérifiée est en vigueur.

### Relation avec le laboratoire

Le pipeline Blueprint → CSM → ResolvedSystem → GenerationPlan reste la seule entrée de génération
jusqu'à E3/E10. Les nouveaux contrats sont des objets autoritatifs **amont** ; ils ne sont pas une
représentation interne de ce pipeline (FF7 inchangée). Le golden Asteria lit le registre du laboratoire
en lecture seule pour déclarer, composant par composant, ce que le pipeline historique sait représenter :
l'Async Worker y est **UNSUPPORTED**, rapporté comme tel.

### Gate E0

Le critère opposable est celui du document 05 §8.1 : contrats versionnés, testés, sérialisés de manière
déterministe, reliés aux diagnostics et utilisables dans le golden sans source de vérité concurrente.
Le document 06 exige « P1–P10 PASS » sans définir P1–P10 dans le dossier (le brief E0 n° 28 de l'étude
n'y figure pas). Décomposition proposée puis **validée** par le responsable du projet (ARB-01) :

| Critère | Énoncé |
|---|---|
| P1 | Chaque contrat A1–A7 possède un schéma versionné publié et une entrée unique de registre. |
| P2 | Les primitives version/seam, ref, provenance, acceptance/status, diagnostics, digest sont implémentées et testées. |
| P3 | Sérialisation canonique et digest déterministes (vecteur de référence, indépendance de l'ordre des clés). |
| P4 | Diagnostics structurés à codes stables, classés, localisés et ordonnés de façon déterministe. |
| P5 | Invariants d'autorité : l'IA ne DECIDE ni ne VERIFY ; confiance ≠ approbation ; le dérivé est recalculé. |
| P6 | UNSUPPORTED explicite (version inconnue, changement non supporté, pipeline historique) ; aucun fallback. |
| P7 | Ensemble fermé : références résolues, digests épinglés, items existants, dépendances acceptées. |
| P8 | Golden Asteria : cinq surfaces dont l'Async Worker, régénération byte-identique, preuves issues d'un checker. |
| P9 | Aucune source de vérité concurrente : laboratoire inchangé et vert, aucun import croisé, golden non consommé par la génération. |
| P10 | État, matrice, décisions, ADR et job CI tenus à jour avec preuves. |

## Conséquences

- E1 (Kernel Façade) consommera ce package ; il ne doit pas le contourner.
- Ajouter un kind de contrat ou une génération de schéma passe par un ADR, une entrée de registre, un
  schéma et une migration.
- Entity Profile, Policy Pack, Design System et Approval Policy restent des références externes
  (`externalRef`) jusqu'à E6.
