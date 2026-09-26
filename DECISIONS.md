# DECISIONS — registre résumé

> Résumé des décisions ; le détail fait foi dans [`docs/adr/`](docs/adr/README.md). Ajout libre ;
> suppression ou réécriture = validation humaine (document 05 §2F).

| Date | Décision | ADR | Statut | Propriétaire |
|---|---|---|---|---|
| 2026-09-25 | Le dossier 01–07 puis la production Enistere font autorité ; le laboratoire devient couche de compatibilité ; `MANDAT.md`, `docs/project-status`, `docs/roadmap`, `docs/strategy`, `docs/audits` archivés sans suppression ; convention de nommage appliquée aux nouveaux artefacts. | [ADR-091](docs/adr/ADR-091-foundation-dossier-authority-and-laboratory-status.md) | Accepté | Responsable du projet |
| 2026-09-25 | E0 : sept contrats A1–A7 dans `kernel/contracts` (TypeScript natif Node, JSON Schema 2020-12 + Ajv), digest sha256/JCS hors statut de cycle de vie, références épinglées sans « latest », ensemble fermé, A3 dérivé reproductible, A6 cohérent et borné par sa classification, A7 append-only ; golden Asteria à cinq surfaces. | [ADR-092](docs/adr/ADR-092-e0-contract-foundation.md) | Accepté | Responsable technique |
| 2026-09-25 | Décomposition P1–P10 du gate E0 validée : E0 PASS. | [ADR-092](docs/adr/ADR-092-e0-contract-foundation.md), [ADR-093](docs/adr/ADR-093-r0c-repository-realignment.md) | Accepté (ARB-01) | Produit / Pilotage |
| 2026-09-25 | Mission R0-C « Repository Realignment » insérée entre E0 et E1 (dérogation à l'ordre du document 06 §6.8) ; nettoyage des niveaux 1 (mort/trompeur) et 2 (non conforme à la production) ; niveau 3 mission par mission, niveau 4 après E10 ; publication GHCR suspendue. | [ADR-093](docs/adr/ADR-093-r0c-repository-realignment.md) | Accepté (ARB-02, 03, 05, 06) | Responsable du projet |
| 2026-09-25 | Repartir propre : l'itération précédente (jamais en production) est supprimée, starters compris ; une implémentation par concept, dans le Kernel ; golden Asteria découplé ; CI réduite à `kernel`, `secret-scan`, `docs`, `audit` ; ADR 001–090 archivés (sauf ADR-073) ; E1 à redéfinir. Prévaut sur 03 §6.11 et 06 §4.6, §4.7, E1, E10, R0. | [ADR-094](docs/adr/ADR-094-clean-slate.md) | Accepté | Responsable du projet |
| 2026-09-25 | E1 : Kernel Façade `validate → resolve → plan` sur une chaîne native (System Closure → System IR → ResolvedSystem → ExecutionPlan) résolue contre un catalogue d'extensions en données ; CLI `enistere-foundation` ; gate E1 redéfinie (déterminisme, UNSUPPORTED explicite, TA-04). | [ADR-095](docs/adr/ADR-095-e1-kernel-facade.md) | Accepté | Responsable du projet |
| 2026-09-25 | E2 : Adapter Protocol v0 (manifest validé par le Kernel, conversion en catalogue E1, contrat RuntimeAdapter sans I/O, règle d'ownership sans overwrite silencieux, VERIFY en EvidenceRecords) ; Engine `engine/materializer` ; premier adapter NestJS écrit de zéro ; sens des dépendances entre zones vérifié ; job CI `adapters`. | [ADR-096](docs/adr/ADR-096-adapter-protocol-v0.md) | Accepté | Responsable du projet |
| 2026-09-26 | E3 : Domain IR dérivé du Domain Contract (types résolus, références épinglées, facets conservées mais non interprétées) ; liaison opérations/événements ↔ composants dans l'IR système ; intention non réalisée listée (PARTIAL, jamais bloquant) ; `AdapterContext.domains` additif. | [ADR-097](docs/adr/ADR-097-domain-ir.md) | Accepté | Responsable du projet |
| 2026-09-25 | Nommage : dépôt `enistere-foundation` (renommage par le responsable), packages `@enistere/foundation-*` à la migration, domaines par ADR au 1er déploiement, realm Keycloak `foundation`. | [ADR-093](docs/adr/ADR-093-r0c-repository-realignment.md) | Accepté (ARB-04) | Direction + plateforme |

Décisions antérieures (ADR-001 → ADR-090, sauf ADR-073) : archivées sans autorité avec le code qu'elles
régissaient ([`docs/archive/laboratory/adr/`](docs/archive/laboratory/adr/), ADR-094).

## Arbitrages encore ouverts

ARB-08 et ARB-09 : [`ARBITRATIONS.md`](docs/governance/ARBITRATIONS.md).

## Divergences documentaires signalées

Tenues dans [`CONTEXT.md`](CONTEXT.md#divergences-documentaires-ouvertes) (D-1 à D-9).
