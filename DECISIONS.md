# DECISIONS — registre résumé

> Résumé des décisions ; le détail fait foi dans [`docs/adr/`](docs/adr/README.md). Ajout libre ;
> suppression ou réécriture = validation humaine (document 05 §2F).

| Date | Décision | ADR | Statut | Propriétaire |
|---|---|---|---|---|
| 2026-09-25 | Le dossier 01–07 puis la production Enistere font autorité ; le laboratoire devient couche de compatibilité ; `MANDAT.md`, `docs/project-status`, `docs/roadmap`, `docs/strategy`, `docs/audits` archivés sans suppression ; convention de nommage appliquée aux nouveaux artefacts. | [ADR-091](docs/adr/ADR-091-foundation-dossier-authority-and-laboratory-status.md) | Accepté | Responsable du projet |
| 2026-09-25 | E0 : sept contrats A1–A7 dans `kernel/contracts` (TypeScript natif Node, JSON Schema 2020-12 + Ajv), digest sha256/JCS hors statut de cycle de vie, références épinglées sans « latest », ensemble fermé, A3 dérivé reproductible, A6 cohérent et borné par sa classification, A7 append-only ; golden Asteria à cinq surfaces. | [ADR-092](docs/adr/ADR-092-e0-contract-foundation.md) | Accepté | Responsable technique |
| 2026-09-25 | Décomposition P1–P10 du gate E0 (le dossier ne la définit pas). | [ADR-092](docs/adr/ADR-092-e0-contract-foundation.md) | **Proposé — validation humaine requise** | Produit / Pilotage |

Décisions antérieures (laboratoire, ADR-001 → ADR-090) : valides pour la couche de compatibilité ; voir
le registre ADR.

## Divergences documentaires signalées

Tenues dans [`CONTEXT.md`](CONTEXT.md#divergences-documentaires-ouvertes) (D-1 à D-7).
