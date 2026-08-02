# Architecture des contrats

## Sources canoniques

```text
contracts/
├── http/
├── schemas/
├── events/
├── errors/
├── permissions/
└── telemetry/
```

## Standards

- OpenAPI pour HTTP ;
- JSON Schema pour les structures ;
- AsyncAPI ou schémas versionnés pour les événements ;
- enveloppe d'erreur canonique versionnée (`ApiErrorResponse`) pour les erreurs ([ADR-048](../adr/ADR-048-canonical-api-error-contract.md)) ;
- identifiants versionnés pour les permissions.

## Génération polyglotte

```text
Canonical Contracts
├── TypeScript models and clients
├── Java DTOs and interfaces
├── Dart models and clients
├── server bindings
└── test fixtures
```

Aucun package TypeScript n’est la source unique d’un contrat polyglotte. Le
contrat est une unité logique ; npm, Maven, Python et Dart n'en sont que des
représentations générées et seules celles réellement consommées sont livrées.

## Contrat composé par autorité

La baseline et les capabilities sélectionnées composent le contrat externe de
chaque autorité déclarée dans le Canonical System Model. Dans une architecture
distribuée, chaque arête `communications[]` référence l'autorité et la version
consommées ; il n'existe pas de contrat global contenant toutes les opérations de
toutes les applications.

Un adapter serveur est conforme seulement si sa surface observable respecte ce
contrat : `operationId`, route, verbe, statut, schéma, erreur et sécurité. Une
preuve de responsabilité produit ne suffit pas à établir cette compatibilité.

## Frontends et design

Les applications Next.js, Angular, React Native et Flutter restent indépendantes
et idiomatiques. Un contrat de design peut partager des tokens et des règles
observables, mais un package de composants propre à un framework n'est jamais la
source universelle du design.

Voir [ADR-088](../adr/ADR-088-contractual-parity-and-shared-artifacts.md).

## Versionnement

- changement compatible : version mineure ;
- changement incompatible : nouvelle version ;
- événements suffixés `.v1`, `.v2` ;
- coexistence temporaire selon politique de support.

## Contract-first

Les adapters serveur et client sont validés contre la source canonique.
