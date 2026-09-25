# Onboarding

Pour un développeur ou un agent qui arrive sur Enistere Foundation.

## 1. Comprendre (30 minutes)

1. [`CONTEXT.md`](../../CONTEXT.md) — vision, sources de vérité, zones, divergences ouvertes.
2. Documents [01](../01%20—%20Synthèse%20de%20l’étude%20—%20ENISTERE%20FOUNDATION.docx) (synthèse) et
   [07](../07%20—%20Carte%20produit%20et%20capacités%20—%20ENISTERE%20FOUNDATION.docx) (capacités), puis
   [03](../03%20—%20Architecture%20technique%20—%20ENISTERE%20FOUNDATION.docx) (architecture).
3. [`GLOSSARY.md`](../glossary/GLOSSARY.md).

## 2. Situer le travail

- État réel : [`CURRENT_STATE.md`](../../CURRENT_STATE.md) · preuves : [`IMPLEMENTATION_MATRIX.md`](../../IMPLEMENTATION_MATRIX.md).
- Mission et prochaine action : [`BACKLOG.md`](../../BACKLOG.md) · séquence : [`ROADMAP.md`](../../ROADMAP.md).
- Décisions : [`DECISIONS.md`](../../DECISIONS.md) · arbitrages : [`ARBITRATIONS.md`](../governance/ARBITRATIONS.md).
- Règles de travail : [`AGENTS.md`](../../AGENTS.md) (protocole de reprise et de fin de mission).

## 3. Lancer

[`runbooks/LOCAL_DEVELOPMENT.md`](../runbooks/LOCAL_DEVELOPMENT.md) : `npm ci`, `npm run foundation:test`,
`npm run golden:asteria:update`.

## 4. Où coder

| Besoin | Dossier |
|---|---|
| Contrats et invariants du Kernel | `kernel/contracts/` |
| Scénarios de preuve | `goldens/` |
| Outillage du dépôt (gates CI) | `tools/quality/` |

Une seule implémentation par concept, dans le Kernel (ADR-094) : pas de second modèle de système, de
diagnostic, de digest ou de schéma ailleurs.

Tout déploiement suit [`docs/Server Prod/`](../Server%20Prod/README.md) et
[`PRODUCTION_READINESS.md`](../governance/PRODUCTION_READINESS.md).
