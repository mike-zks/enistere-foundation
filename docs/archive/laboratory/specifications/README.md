# Spécifications du laboratoire

Statut : **référence de la couche de compatibilité** ([ADR-091](../adr/ADR-091-foundation-dossier-authority-and-laboratory-status.md)).

Ces spécifications décrivent le pipeline historique Blueprint → CSM → ResolvedSystem → GenerationPlan,
les runtimes, les capabilities, les primitives et le Platform Baseline tels qu'implémentés dans
`factory/`, `starters/` et `capabilities/`. Elles restent opposables à ce code tant qu'il existe.

Elles ne définissent pas la cible produit : celle-ci relève des documents 01 à 07. Les contrats
autoritatifs de la cible (A1–A7) sont publiés comme JSON Schemas sous
[`kernel/contracts/schemas/`](../../kernel/contracts/README.md) (ADR-092). En cas de conflit, le dossier
projet l'emporte et l'écart est tracé dans [`CONTEXT.md`](../../CONTEXT.md).
