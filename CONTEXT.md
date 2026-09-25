# CONTEXT — Enistere Foundation

> Reflet vivant du projet (document 05 §2E). Ne recopie pas les documents sources : il y renvoie.
> Dernière mise à jour : 2026-09-25, fin de la mission E1 (Kernel Façade, ADR-095).

## Vision

Enistere Foundation est une **Software System Engineering Platform** dotée d'un **Governed System
Compiler** et d'un **Evidence-Driven System Evolution Engine** : elle transforme une intention
d'ingénierie en systèmes logiciels natifs, gouvernés et vérifiables, puis maintient leur cohérence
lorsque besoins, standards et technologies évoluent (document 01). L'unité de valeur est le *System Under
Engineering Governance*, pas le starter ni la ligne de code.

## Sources de vérité (ordre d'autorité, document 05 §2.3 et ADR-091)

1. Documents du dossier, dans `docs/` :
   [01 Synthèse](docs/01%20—%20Synthèse%20de%20l’étude%20—%20ENISTERE%20FOUNDATION.docx) ·
   [02 Cahier des charges](docs/02%20—%20Cahier%20des%20charges%20produit%20—%20ENISTERE%20FOUNDATION.docx) ·
   [03 Architecture technique](docs/03%20—%20Architecture%20technique%20—%20ENISTERE%20FOUNDATION.docx) ·
   [04 Design UX UI](docs/04%20—%20Système%20de%20design%20UX%20UI%20et%20interfaces%20de%20référence%20—%20ENISTERE%20FOUNDATION.docx) ·
   [05 Prompt de reprise](docs/05%20—%20Prompt%20de%20démarrage%20du%20développement%20—%20ENISTERE%20FOUNDATION.md) ·
   [06 Versions et feuille de route](docs/06%20—%20Versions%20et%20feuille%20de%20route%20—%20ENISTERE%20FOUNDATION.docx) ·
   [07 Carte produit et capacités](docs/07%20—%20Carte%20produit%20et%20capacités%20—%20ENISTERE%20FOUNDATION.docx).
2. Production Enistere, pour toute contrainte de plateforme partagée :
   [`docs/Server Prod/`](docs/Server%20Prod/README.md) (architecture, politique, procédure).
3. ADR validés : [`docs/adr/`](docs/adr/README.md), résumés dans [`DECISIONS.md`](DECISIONS.md).
4. Code réel du dépôt — autorité sur l'**état d'implémentation**, jamais sur la cible.

Correspondance d'anciens numéros cités dans 01–03 : « Roadmap 05 » = 06 ; « Carte capacités 08 » = 07 ;
« Registre risques 10 » = [`RISK_REGISTER.md`](docs/governance/RISK_REGISTER.md) ; « 12 UX » = 04 ;
« 13 Prompt repository » = 05 ; « Plan d'affaires 04 » : absent du dossier (hypothèses économiques
intégrées à 01/02).

## Principes constitutionnels (document 05 §3 et §12)

INSPECT BEFORE CHANGE · EVIDENCE BEFORE CLAIM · PLAN BEFORE APPLY · MIGRATE BEFORE DELETE · ONE
CANONICAL MODEL PER RESPONSIBILITY · NO SILENT FALLBACK · NO CLIENT-SPECIFIC FORK IN THE GENERIC
KERNEL · NO REWRITE FOR AESTHETICS · NO DOCUMENTATION AS A SUBSTITUTE FOR TESTS.
Desired, Resolved et Observed restent distincts. Une Product Capability (CAP-xx) n'est pas une Platform
Capability. Le Kernel reste générique. L'IA OBSERVE, PROPOSE et IMPLEMENT dans son scope ; elle ne
s'accorde ni DECIDE ni VERIFY. Aucun statut VERIFIED sans preuve.

## Architecture

Six zones techniques (document 03) : Foundation Kernel, Control Plane, Engine / Compilation Runtime,
Execution Workers, Extension & Registry Ecosystem, Surfaces & Connectors ; AI Gateway / Agent Runtime
transversal. Dans le dépôt :

| Zone cible | Présent aujourd'hui |
|---|---|
| Foundation Kernel | [`kernel/contracts/`](kernel/contracts/README.md) — contrats A1–A7 (E0) ; [`kernel/compiler/`](kernel/compiler/README.md) — Kernel Façade et chaîne closure → IR → résolution → plan (E1) |
| Surfaces | [`surfaces/cli/`](surfaces/cli/README.md) — CLI headless `enistere-foundation` (E1) |
| Goldens | [`goldens/asteria/`](goldens/asteria/README.md) — golden de transition Asteria |
| Extensions (adapters de runtime), Control Plane, Workers, Registry, Workbench, AI Gateway | Absents : les extensions ne sont encore que des descripteurs de catalogue en données (E2) |
| Outillage du dépôt (hors produit) | [`tools/quality/`](tools/quality/) — gates CI (allowlist gitleaks, liens de documentation) |

L'itération précédente (générateur `factory/`, 7 starters, capabilities, packages), jamais mise en
production, a été supprimée : une seule implémentation par concept, dans le Kernel
([ADR-094](docs/adr/ADR-094-clean-slate.md) ; dernier état au commit `f2590a8`).

## Production Enistere

Toute mise en production suit [`docs/Server Prod/`](docs/Server%20Prod/POLITIQUE.md) et
[`PRODUCTION_READINESS.md`](docs/governance/PRODUCTION_READINESS.md) : Traefik seule entrée (22/80/443),
réseaux `enistere_*`, images par digest, secrets hors dépôt, Keycloak commun (un realm par projet),
sauvegarde Restic/B2 restaurée avant d'être déclarée opérationnelle. Aucun service Foundation n'est
déployé à ce jour.

## Décisions validées

Voir [`DECISIONS.md`](DECISIONS.md). Décisions de la reprise : ADR-091 (autorité du dossier), ADR-092 (E0
Contract Foundation), ADR-093 (R0-C), ADR-094 (suppression de l'itération précédente, qui prévaut sur les passages
du dossier supposant une couche de compatibilité) et ADR-095 (E1, chaîne de compilation native).

## Mission

- **Missions terminées** : E0 — Contract Foundation (PASS, P1–P10 validés), R0-C — Repository
  Realignment (ADR-093), R0-D — repartir propre (ADR-094) et E1 — Kernel Façade (ADR-095). Résultats :
  [`CURRENT_STATE.md`](CURRENT_STATE.md).
- **Périmètre retenu** : greenfield, modèle de contrats ; brownfield et lifecycle complet hors périmètre.
- **Prochaine mission unique** : **E2 — Adapter Protocol v0 et premier adapter** ([`BACKLOG.md`](BACKLOG.md)).

## Divergences documentaires ouvertes

Arbitrages associés et propositions : [`ARBITRATIONS.md`](docs/governance/ARBITRATIONS.md).

| # | Divergence | Proposition | Arbitrage |
|---|---|---|---|
| D-1 | Doc 06 exige « P1–P10 PASS » pour E0 sans les définir ; le brief E0 (n° 28) est absent du dossier. | Décomposition d'ADR-092. | Clos — validée (ADR-093, ARB-01) |
| D-2 | Doc 05 §2B : VPS Ubuntu 24.04 ; `Server Prod/ARCHITECTURE.md` : Ubuntu 26.04.1 LTS. | La documentation de production décrit l'état réel de l'hôte ; corriger doc 05 à la prochaine révision. | Gouvernance |
| D-3 | Doc 05 §2B mentionne une instance RabbitMQ partagée ; absente de `Server Prod/ARCHITECTURE.md`. | Ne pas supposer RabbitMQ disponible ; ADR requis avant usage (Workers, E4+). | Technique + plateforme |
| D-4 | Doc 03 : object store S3/MinIO ; production : Cloudflare R2. | Compatible (abstraction S3) ; R2 en production Enistere, MinIO en self-hosted. | Aucun (compatible) |
| D-5 | Doc 04 cite `design-tokens.json` et un dossier `mockups`, absents du dépôt. | À fournir avant tout travail Workbench/design ; non bloquant pour E0–E3. | Design UX UI |
| D-6 | Convention §2G (`enistere-foundation`, `@enistere/foundation-*`) vs dépôt `enistere-os-foundation` et packages existants. | Dépôt renommé par le responsable ; packages à la migration ; domaines par ADR au 1er déploiement. | Tranché (ADR-093, ARB-04) — renommage GitHub à effectuer |
| D-7 | Doc 03 : Control Plane NestJS + Temporal ; `MANDAT.md` (archivé) : pipeline factory unique. | Résolu par ADR-091. | Clos |
| D-8 | Doc 06 §6.8 : seule suite de E0 = E1 ; demande de nettoyage complet après E0. | Mission R0-C insérée, limitée aux niveaux 1–2. | Clos (ADR-093) |
| D-9 | Doc 03 §6.11, doc 06 §4.6, §4.7, E1, E10, R0 : laboratoire en couche de compatibilité, starters en reference extensions, « legacy identique ». Décision du responsable : repartir propre. | ADR-094/095 prévalent ; document 06 révisé en v1.1 (modifications suivies à accepter) ; document 03 §6.11 à réviser. | Tranché — 06 fait, 03 restant |
