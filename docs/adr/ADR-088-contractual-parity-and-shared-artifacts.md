# ADR-088 — La parité inclut le contrat externe et les artefacts partagés suivent les consommateurs

- Statut : Validé, implémentation partielle
- Date : 2026-08-02
- Décideur : Owner Foundation
- Complète : ADR-016, ADR-045, ADR-046, ADR-048, ADR-074 et ADR-086

## Contexte

La parité par famille mesure aujourd'hui les responsabilités produit et leurs
preuves. Elle ne garantit pas qu'un client compilé pour une autorité puisse en
consommer une autre. Le package `@enistere/api-contracts` est en outre un package
npm construit depuis une composition NestJS historique, tandis que Spring,
FastAPI et Flutter recopient une partie des modèles dans leur langage.

Cette asymétrie donne à l'axe NestJS + Next.js + React Native un statut implicite
de référence. Elle contredit l'objectif d'équivalence des compositions, par
exemple NestJS + Next.js + React Native et Spring + Next.js + Flutter, lorsque
les deux systèmes sélectionnent les mêmes capabilities.

## Ce que l'exécution a montré

La composition NestJS Files réellement générée produit 13 chemins, 15 opérations
et 16 schémas. Son document est identique au snapshot de
`packages/api-contracts` hors deux valeurs d'identité applicative. Le package
historique est donc un contrat de transport NestJS, pas un modèle neutre.

La composition FastAPI Files exécutée expose ses opérations sous `/api/v1`,
publie notamment `POST /api/v1/files/upload` là où le contrat NestJS publie
`POST /files`, et génère des `operationId` propres à FastAPI. Un client construit
sur le snapshot NestJS n'est pas interchangeable sans adaptation.

La composition Spring Files a démarré sur PostgreSQL réel, appliqué quatre
migrations puis reçu une requête réelle à `/v3/api-docs`. Aucun handler Springdoc
n'était enregistré : Spring MVC a levé `NoResourceFoundException`. Le catch-all
du runtime a ensuite reclassé ce 404 en réponse 500. Les 139 tests Spring verts
ne prouvaient donc ni l'export OpenAPI ni la classification correcte de ce cas.

## Décision

### Un contrat logique par autorité

Chaque autorité API du Canonical System Model possède un contrat externe
versionné. Il est composé depuis la baseline, les capabilities sélectionnées et
les communications déclarées. Il contient au minimum :

- opérations, `operationId`, chemins, verbes et statuts ;
- structures de requête et de réponse ;
- enveloppes et codes d'erreur ;
- mécanisme d'authentification observable ;
- version et règles de compatibilité.

Dans un système distribué, il n'existe pas de méga-contrat global : chaque arête
`communications[]` désigne l'autorité et la version que son consommateur utilise.

### Une source, plusieurs bindings

Le contrat est une unité logique indépendante des gestionnaires de packages.
La Factory génère uniquement les représentations utiles aux consommateurs :

| Consommateur | Représentation possible |
|---|---|
| TypeScript | modèles, opérations et client Fetch généré |
| Java | DTO/records et interface ou client HTTP généré |
| Python | modèles et client généré |
| Dart | modèles et client Dio généré |
| serveur | validation de l'adapter contre le même contrat |

Un package npm ne devient jamais la source d'un contrat polyglotte. Un binding
généré peut être livré comme source locale ou artefact d'écosystème ; aucune
publication npm, Maven, PyPI ou pub.dev n'est implicite.

### La parité possède quatre niveaux

1. **Produit** : mêmes responsabilités et invariants applicables.
2. **Contrat externe** : mêmes opérations, données, erreurs et règles de sécurité.
3. **Client** : un binding de la version déclarée peut cibler toute autorité
   conforme sans branchement sur son framework.
4. **Composition** : les profils croisés annoncés sont générés, construits et
   exercés contre leurs autorités réelles.

Un runtime ne peut pas atteindre un statut d'interchangeabilité contractuelle
si un de ces niveaux manque. La conformité produit existante reste vraie dans
son périmètre, mais ne vaut pas équivalence de profil.

### Politique des artefacts partagés

Un artefact n'est livré à un projet dérivé que lorsqu'un consommateur du plan le
référence réellement. Un nouvel artefact partagé doit avoir une frontière
neutre, au moins un consommateur identifié et un cycle de compatibilité propre.

- `@enistere/api-contracts` devient une cible TypeScript du contrat composé ;
  son OpenAPI historique est explicitement classé comme transport NestJS pendant
  la transition.
- `@enistere/api-client-fetch` doit être absorbé par le binding TypeScript ou
  réduit à un transport privé d'adapter ; il ne porte aucune vérité produit.
- `@enistere/ui-kit` n'est pas le design commun des familles Front. Les
  applications Next.js, Angular, React Native et Flutter implémentent leur UI de
  façon idiomatique contre un éventuel contrat de design neutre (tokens et règles
  observables). Aucun composant React n'est imposé à une autre famille.
- `packages/contracts/` dans un projet dérivé reste un ensemble de descriptions
  propres au système généré ; ce n'est pas le package partagé historique.

Les frameworks restent libres de leurs mécanismes internes. Spring Security,
Pydantic, guards NestJS, Riverpod ou TanStack Query ne font pas partie du contrat
externe tant qu'ils n'affectent pas une garantie observable.

## Première tranche exécutée

`ApiErrorResponse` est promu en JSON Schema neutre sous `contracts/schemas/`.
Un générateur déterministe produit des bindings TypeScript, Java, Python et Dart
ainsi qu'une projection OpenAPI 3.0. Spring, FastAPI, Flutter et le package
TypeScript consomment ces sorties ; un digest du schéma et un gate de drift les
lient à la source unique.

Cette tranche prouve le mécanisme polyglotte. Elle ne suffit pas à déclarer la
surface complète Auth/RBAC/Files contractuellement équivalente.

## Conséquences

### Acquis

- La différence entre contrat neutre, transport d'autorité et binding de langage
  devient explicite.
- La parité de famille ne peut plus être interprétée comme une équivalence HTTP
  ou une équivalence de profil sans preuve supplémentaire.
- Le seul partage applicatif privilégié est le contrat composé réellement
  consommé ; les composants UI restent propres à leur framework.
- La même règle peut s'appliquer aux appels API-à-API à partir du graphe CSM.

### Coûts et migrations

- Les opérations Auth/RBAC/Files doivent être extraites des snapshots et copies
  runtime vers une composition contractuelle neutre.
- Les trois adapters API devront converger sur leur frontière publique ou perdre
  leur revendication d'interchangeabilité.
- Les clients écrits à la main devront être remplacés ou validés contre les
  bindings générés.
- `api-client-fetch` et `ui-kit` nécessitent une migration explicite ; ils ne sont
  pas supprimés par cette ADR.

### Non revendiqué

- Aucun client HTTP complet Java, Python ou Dart n'est encore généré.
- Aucune surface Auth/RBAC/Files complète n'est encore neutre ni identique entre
  NestJS, Spring et FastAPI.
- Spring ne publie pas actuellement `/v3/api-docs` dans la composition mesurée ;
  la cause d'enregistrement Springdoc et le 404 reclassé en 500 restent à corriger.
- Aucune équivalence produit complète, performance, montée en charge ou
  `PRODUCTION_READY` n'est revendiquée.
- Aucune publication de package ou registre externe n'est réalisée.
- Les contrats infrastructure, cloud, CI/CD, images, déploiements et exploitation
  ne sont pas décidés ici ; leur audit constitue la prochaine mission.

## Vérifications exécutées

- génération NestJS Files et OpenAPI reproductible ;
- génération FastAPI Files et extraction directe de `app.openapi()` ;
- démarrage Spring Files avec PostgreSQL Testcontainers, quatre migrations et
  requête MockMvc réelle à `/v3/api-docs` ;
- génération et contrôle de drift des cinq représentations d'`ApiErrorResponse` ;
- compilation/tests TypeScript, compilation Java, `flutter analyze` et 9 tests
  Flutter ;
- golden FastAPI Auth/RBAC/Files sur PostgreSQL et MinIO jetables : quatre
  migrations, Ruff, 52 tests, audit de dépendances, démarrage HTTP réel et trois
  capabilities conformes ;
- golden Spring Auth/RBAC/Files : 139 tests, aucune erreur ni échec et trois
  capabilities conformes ;
- matérialisation des bindings dans des projets Spring, FastAPI, Flutter et
  Next.js réellement générés ;
- suite Factory 536/536, fitness functions sans finding et liens de 151 documents.

Le premier golden FastAPI a échoué sur Ruff : le générateur Python produisait
une ligne de 105 caractères. Le générateur, et non son artefact isolé, a été
corrigé avant la preuve verte ci-dessus.

## Rollback

Révoquer cette décision rétablit la parité limitée aux responsabilités produit
et maintient le snapshot NestJS comme référence implicite des clients. Les
bindings polyglottes redeviennent des copies sans source commune. Ce rollback
est possible techniquement, mais réintroduit le couplage que les mesures ont mis
en évidence.
