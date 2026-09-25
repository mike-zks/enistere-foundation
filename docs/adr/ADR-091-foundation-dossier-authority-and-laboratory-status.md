# ADR-091 — Le dossier Enistere Foundation (01–07) fait autorité ; le laboratoire devient couche de compatibilité

- Statut : Accepté
- Amendé par : [ADR-094](ADR-094-clean-slate.md) — le laboratoire n'est plus une couche de compatibilité : il est supprimé (dernier état au commit `f2590a8`)
- Date : 2026-09-25
- Décideur : Responsable du projet (instruction explicite de reprise du 2026-09-25) ; rédigé par l'agent de la mission E0
- Supersède : l'autorité de `MANDAT.md` (archivé) et la hiérarchie de l'ancien `SOURCE_OF_TRUTH.md`
- Complète : ADR-044, ADR-045, ADR-046 (dont la portée est limitée au pipeline du laboratoire)

## Contexte

Le dépôt a été construit comme laboratoire « Enistere OS Foundation » sous un mandat
(`MANDAT.md`) qui faisait du Blueprint → CSM → ResolvedSystem → GenerationPlan le modèle canonique
unique et interdisait toute représentation concurrente ou tout « legacy interne ».

Le dossier projet final (documents 01 à 07, septembre 2026) redéfinit la cible : Software System
Engineering Platform dotée d'un Governed System Compiler et d'un Evidence-Driven System Evolution
Engine. Le document 03 §7.8 classe explicitement « Blueprint comme contrat utilisateur total » et « CSM
comme modèle omniscient » parmi les concepts à généraliser ou remplacer, et le document 06 §4.6 impose
que Blueprint, CSM et chemins historiques servent de couche de compatibilité jusqu'au cutover E10.

Les deux corpus se contredisent sur l'autorité (quel document gouverne), sur le pipeline (unique et
définitif contre transitoire) et sur le traitement de l'existant (« aucun legacy » contre « compatibility
seam, migrate before delete »).

## Décision

1. **Ordre d'autorité** (document 05 §2.3, confirmé par l'instruction de reprise) : documents 01 → 07 du
   dossier, puis documentation de production Enistere (`docs/Server Prod/`) pour toute contrainte de
   plateforme partagée, puis ADR validés, puis code. `docs/governance/SOURCE_OF_TRUTH.md` est réécrit en
   conséquence.
2. **Le laboratoire est un actif de preuve et une couche de compatibilité**, non l'architecture cible :
   `factory/`, `starters/`, `capabilities/`, `packages/`, `contracts/`, `deployment/`, les spécifications
   et l'architecture de référence V2 restent en place et testés. Ils ne sont ni supprimés ni étendus comme
   s'ils étaient le produit final. ADR-044 à ADR-090 restent valides **pour ce périmètre**.
3. **Archivage sans suppression** sous `docs/archive/laboratory/` des documents de pilotage qui
   concurrençaient le nouveau dispositif de gouvernance : `MANDAT.md`, `docs/project-status/`,
   `docs/roadmap/`, `docs/strategy/`, `docs/audits/`. Leurs liens sont réécrits ; Git conserve l'historique.
   Exception : `PROFILE_MATRIX.md` est une donnée de référence du laboratoire vérifiée par
   `factory/test/profiles.test.mjs` (documentation ↔ registre) ; il reste actif sous
   `docs/project-factory/PROFILE_MATRIX.md`, seul le chemin lu par le test change.
4. **Dispositif de gouvernance** du document 05 §2C–2F à la racine : `CONTEXT.md`, `AGENTS.md`,
   `ROADMAP.md`, `BACKLOG.md`, `CURRENT_STATE.md`, `IMPLEMENTATION_MATRIX.md`, `DECISIONS.md`,
   `SECURITY.md`, et sous `docs/` : registre ADR, runbooks, `PRODUCTION_READINESS.md`,
   `RISK_REGISTER.md`, `DEPENDENCIES.md`.
5. **Convention de nommage** (document 05 §2G) : appliquée à tout nouvel artefact (`@enistere/foundation-*`,
   package racine `enistere-foundation`). Les packages existants (`@enistere/api-contracts`, `ui-kit`,
   `api-client-fetch`, `web-nextjs`) gardent leur nom jusqu'à leur migration effective : un renommage
   global sans bénéfice mesurable est exclu (document 05 §7.2). Le renommage du dépôt GitHub
   (`enistere-os-foundation` → `enistere-foundation`) et les domaines `*.foundation.enistere.com` restent
   des propositions à confirmer par ADR avant toute création DNS.

## Conséquences

- Les fitness functions FF6–FF8 du laboratoire continuent de garder le pipeline historique ; elles ne
  s'appliquent pas aux nouveaux contrats du Kernel (ADR-092), qui ne sont pas des représentations internes
  de ce pipeline.
- Toute future suppression d'un actif du laboratoire suit « OBSERVE → … → REMOVE LEGACY ONLY AFTER PROOF »
  (document 05 §7.3) et un ADR dédié.
- Les documents 01–03 contiennent encore des renvois à l'ancienne numérotation du dossier (ex. « Roadmap
  05 », « registre 10 ») ; la correspondance est tenue dans `CONTEXT.md`.

## Validation humaine requise

La réécriture d'`AGENTS.md` et l'archivage du mandat relèvent d'une validation humaine (document 05
§2F). Ils ont été demandés explicitement par le responsable du projet ; la revue de la PR vaut
confirmation.
