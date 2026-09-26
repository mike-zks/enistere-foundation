# ADR-097 — Domain IR et liaison à l'IR système

- Statut : Accepté
- Date : 2026-09-26
- Décideur : responsable du projet (plan de mission E3 approuvé)
- Sources : document 03 v1.1 (System IR / Domain IR, phase PLAN) ; document 06 v1.1 §6.8 (E3 : IR
  déterministe, unsupported explicite) ; ADR-092 (A5), ADR-095, ADR-096

## Contexte

Depuis E1, l'IR système cite des items de domaine épinglés sans représenter le domaine. E3 dérive du Domain
Contract (A5) une représentation interne et la relie aux composants, avant toute projection vers un runtime
(E5).

## Décision

1. **Domain IR** (`buildDomainIR`, `kernel/compiler`) : dérivé, jamais édité. Collections triées par id
   (ordre des champs conservé : c'est de l'intention) ; expressions de type résolues en primitive, type du
   contrat ou liste, via `elementType` et `DOMAIN_PRIMITIVES` (aucun second parseur) ; références croisées
   (événements émis, invariants, opérations d'acceptance, cibles de facets) épinglées sous la forme
   `DomainContract/<id>@<révision>#<item>` ; défauts explicites (`idempotent: false`, `sensitive: false`).
2. **Facets non interprétées** : conservées telles quelles et listées `IR_FACET_NOT_INTERPRETED` ; le Kernel
   ne les interprète pas avant E5/E6. Rien n'est abandonné.
3. **Liaison** : l'IR système porte les Domain IR des contrats épinglés (seules les révisions épinglées),
   et des bindings par item — opération : `implementedBy`, `consumedBy` ; événement : `publishedBy`
   (déclaration explicite ou implémentation d'une opération émettrice), `subscribedBy`.
4. **Intention non réalisée** : opération sans implémentation (`IR_OPERATION_UNIMPLEMENTED`), événement
   sans publieur (`IR_EVENT_UNPUBLISHED`), facet non interprétée : listées dans l'IR, reportées par le plan
   (`unsupportedIntent`), diagnostics d'avertissement ; la compilation est PARTIAL, jamais bloquée.
5. **Adapters** : `AdapterContext.domains` (lecture seule) est ajouté au protocole v0 de façon additive.
   Aucun adapter ne génère encore de code métier (E5).

## Conséquences

- Gate E3 : IR déterministe (même digest quel que soit l'ordre des documents ; seul le contenu du contrat
  change le digest) ✔ ; unsupported explicite ✔.
- Le digest de l'IR du golden Asteria change (compilation régénérée) ; la closure et les plans d'artefacts
  de l'adapter NestJS sont inchangés.
- Limites : pas de sémantique d'invariants exécutable ni de projection de types vers un runtime (E5) ; pas
  d'interprétation des facets (E5/E6).
