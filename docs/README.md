# Documentation

Hiérarchie : [`governance/SOURCE_OF_TRUTH.md`](governance/SOURCE_OF_TRUTH.md) ·
[ADR-091](adr/ADR-091-foundation-dossier-authority-and-laboratory-status.md).

## Dossier projet (sources de vérité cible)

Par ordre d'autorité pour la cible produit :

1. [01 — Synthèse de l'étude](01%20—%20Synthèse%20de%20l’étude%20—%20ENISTERE%20FOUNDATION.docx)
2. [02 — Cahier des charges produit](02%20—%20Cahier%20des%20charges%20produit%20—%20ENISTERE%20FOUNDATION.docx)
3. [03 — Architecture technique](03%20—%20Architecture%20technique%20—%20ENISTERE%20FOUNDATION.docx)
4. [04 — Système de design UX UI et interfaces de référence](04%20—%20Système%20de%20design%20UX%20UI%20et%20interfaces%20de%20référence%20—%20ENISTERE%20FOUNDATION.docx)
5. [05 — Prompt de reprise du repository](05%20—%20Prompt%20de%20démarrage%20du%20développement%20—%20ENISTERE%20FOUNDATION.md)
6. [06 — Versions et feuille de route](06%20—%20Versions%20et%20feuille%20de%20route%20—%20ENISTERE%20FOUNDATION.docx)
7. [07 — Carte produit et capacités](07%20—%20Carte%20produit%20et%20capacités%20—%20ENISTERE%20FOUNDATION.docx)

## Production Enistere

[`Server Prod/`](Server%20Prod/README.md) — architecture, politique et procédure de l'écosystème de
production partagé ; s'impose dès qu'un travail touche réseau, secrets, données partagées,
observabilité ou déploiement.

## Décisions et gouvernance

- [`adr/`](adr/README.md) — registre des ADR (ADR-091+ : Foundation ; ADR-044 → 090 : laboratoire).
- [`governance/`](governance/SOURCE_OF_TRUTH.md) — source de vérité, Definition of Done,
  [production readiness](governance/PRODUCTION_READINESS.md), [registre des risques](governance/RISK_REGISTER.md),
  [dépendances critiques](governance/DEPENDENCIES.md), politiques opérationnelles.
- [`runbooks/`](runbooks/README.md) — exploitation (déploiement, rollback, restauration, rotation, local).

## Référence du laboratoire (couche de compatibilité)

Décrivent l'implémentation **historique** — pipeline Blueprint → CSM → ResolvedSystem →
GenerationPlan, runtimes, capabilities, baseline — et non la cible produit :
[`specifications/`](specifications/README.md), [`architecture/`](architecture/README.md), `glossary/`,
`guides/`, `onboarding/`, `checklists/`, `project-factory/`, `examples/`.

## Archives

[`archive/`](archive/README.md) — documents de pilotage du laboratoire remplacés par la gouvernance du
dossier (mandat, état, roadmap, stratégie, audits). Non autoritaires ; conservés comme preuves
historiques.
