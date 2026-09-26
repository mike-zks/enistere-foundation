# ADR-099 — Projection du Domain Contract en contrat OpenAPI partagé

- Statut : Accepté
- Date : 2026-09-26
- Décideur : responsable du projet (plan de mission E5 approuvé ; choix « OpenAPI 3.1 dérivé par le
  Kernel » et « validation du contrat seule »)
- Sources : document 06 v1.1 §6.8 (E5 : domaine distinct de capability ; contrat partagé) ; document 02
  (FR-DOM-01/02, « une facet n'est pas une Platform Capability », préférence pour OpenAPI) ; document 03
  v1.1 (§4.8 REST/OpenAPI, contrats externes) ; ADR-096, ADR-097, ADR-098

## Contexte

Depuis E3, le Domain IR décrit types, opérations, événements et invariants et les lie aux composants,
mais aucun runtime ne le réalise : l'Authority API matérialisée ne contient aucune opération métier.
Les consommateurs (web, mobile, worker) n'ont aucun contrat commun avec leur fournisseur.

## Options

- Contrat : **OpenAPI 3.1 dérivé par le Kernel** (retenu) ; types générés dans l'adapter (non
  partageable, projection hors du Kernel) ; OpenAPI + AsyncAPI (transport d'événements non validé, D-3).
- Exécution : **validation du contrat seule** (retenu) ; invariants exécutables (exige une expression
  formelle des invariants dans A5) ; squelettes sans validation (contrat non appliqué).

## Décision

1. **Une seule projection**, dans `kernel/compiler/src/api-contract.ts` : un document OpenAPI 3.1 par
   couple (domaine, composant fournisseur), limité aux opérations que le composant implémente (bindings
   E3). Routes dérivées sans convention inventée : COMMAND → `POST /<contexte>/<opération>`, QUERY sans
   entrée → `GET`, QUERY avec entrée → `POST`. Réponses 200, 400 (entrée hors contrat), 422 (erreurs
   déclarées), 501 (non implémentée), en Problem Details (RFC 9457). Schémas JSON 2020-12 fermés ; les
   primitives portent un motif (validation sans extension de formats) ; `decimal` reste une chaîne.
2. **Domaine distinct de capability** : l'autorisation est portée comme intention de domaine
   (`x-foundation-authorization`), jamais comme `securityScheme` ; les fichiers sont des valeurs
   `file-ref` ; le contrat est identique quel que soit le catalogue (fournisseurs de capabilities
   présents ou non) ; les facets restent non interprétées et listées.
3. **Contrat partagé** : `ExecutionPlan.sharedContracts` liste chaque contrat avec son fournisseur, ses
   consommateurs et son digest ; le step MATERIALIZE du fournisseur le nomme ; `PlanResult.apiContracts`
   porte les documents ; `AdapterContext.apiContracts` les transmet (additif au protocole v0). Le digest
   entre dans celui du plan : la proof chain (E4) le couvre sans code nouveau.
4. **Owner work** : `ownerWork` liste désormais chaque opération projetée à implémenter et chaque
   invariant à faire respecter par le fournisseur — obligations visibles, non exécutées.
5. **Adapter NestJS 0.2.0** : embarque le document tel quel (`contract/<contexte>.openapi.json`, servi
   par `GET /contracts/...`), en dérive types, interface de handlers, contrôleur (entrées validées par Ajv
   contre les schémas du contrat) et module ; `src/extension/<contexte>.handlers.ts` est owner-seeded et
   répond 501 jusqu'à l'implémentation par l'équipe. Aucune garde d'autorisation ni gestion de fichiers
   n'est simulée. Le check TOOLCHAIN `contract` exécute `scripts/contract-check.mjs` dans le projet
   généré (document servi à l'identique, 400 sur entrée invalide, 501 sur opération non implémentée) :
   le protocole de sonde n'est pas étendu (écart assumé au plan, qui prévoyait `method`/`body`).

## Conséquences

- Gate E5 : domaine distinct de capability (digest indépendant du catalogue, aucune facet ni scheme de
  sécurité) ✔ ; contrat partagé (fournisseur et 4 consommateurs citent le même digest ; document embarqué
  identique) ✔.
- Le service généré dépend d'`ajv` (version exacte) ; son Dockerfile copie `contract/`.
- Limites : pas d'AsyncAPI ni de transport d'événements ; invariants non exécutables ; pas de
  génération de clients pour les consommateurs (aucun adapter web/mobile/worker avant E8) ; routes RPC
  plutôt que ressources REST.
