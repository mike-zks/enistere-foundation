# Deployment Specification

## 1. Autorité et portée

Ce document est la spécification canonique de la livraison opérationnelle. La
[spécification des primitives](../docs/specifications/INFRASTRUCTURE_PRIMITIVE_SPECIFICATION.md)
définit les besoins d'infrastructure ; les adapters runtime définissent leurs
mécanismes ; les packs providers matérialisent un environnement. ADR-089 adopte
la séparation.

La cible n'est pas une déclaration d'implémentation. L'état mesuré est publié
dans l'[audit opérationnel du 2026-08-02](../docs/audits/OPERATIONAL_PARITY_AUDIT_2026-08-02.md).

## 2. Modèle

```text
Application logique
      + Runtime Adapter
      + Artefact(s)
      + Primitives résolues
      + Environnement / Provider Pack
      + Gates
      ↓
DeploymentUnit
```

Une application n'est ni un runtime ni une unité livrable. Une unité peut
porter un ou plusieurs artefacts ; plusieurs applications peuvent ultérieurement
être regroupées uniquement si le profil et le plan le déclarent.

## 3. Contrat `deploymentUnit/v1`

Chaque unité conforme au
[`deployment-unit.schema.json`](../factory/schema/deployment-unit.schema.json)
déclare :

- identité, application, runtime, famille et owner ;
- artefacts et statut `ready|blocked` ;
- contexte, définition, commande et sorties de build ;
- canal de distribution et immutabilité ;
- preuves ou blockers ;
- configuration non secrète et secrets par référence ;
- health ;
- migrations et réversibilité ;
- dépendances vers unités et primitives ;
- rollout et rollback.

Un secret littéral est interdit. Un chemin absolu, un chemin contenant `..` ou
un chemin Windows n'est pas un contexte de build valide.

## 4. Artefacts par famille

| Famille | Kinds v1 | Exemples idiomatiques |
|---|---|---|
| API | `oci-image`, `jvm-jar` | image NestJS/FastAPI, JAR Spring Boot |
| Web | `oci-image`, `web-static-bundle` | standalone Next.js, bundle Angular |
| Mobile | `android-package`, `ios-package`, `mobile-update-bundle` | AAB/APK, IPA, update Expo gouvernée |

Un artefact de debug ne vaut pas release. Un build source ne vaut pas artefact
distribuable. Un Dockerfile présent ne vaut pas image constructible.

## 5. Adapter runtime

L'adapter fournit de manière idiomatique :

- commandes et contextes de build ;
- sorties attendues ;
- configuration et secrets requis par nom ;
- health applicable ;
- commande de migration ;
- gates de build, démarrage et contrat ;
- stratégie de rollback compatible avec son artefact.

Ces données sont résolues dans le plan. Le générateur ne contient pas de switch
cloud ou framework parallèle.

## 6. Primitives et provider packs

Un Compose ou pack cloud est calculé uniquement depuis les primitives résolues
et les unités qui les consomment. Chaque primitive fixe provider, version,
owner, consommateurs, configuration, secrets, capacité, sauvegarde/restauration,
migration, rétention, health et preuves.

Kubernetes, une VM, Compose ou un cloud public sont des providers possibles,
jamais des invariants. Une émulation locale ne vaut pas preuve staging ou
production.

## 7. Pipeline dérivé

La CI d'un projet dérivé est produite depuis ses unités :

```text
install/restore lock
→ quality gates du runtime
→ build artefact
→ tests de l'artefact
→ sécurité/supply chain applicable
→ publication immuable autorisée
→ déploiement/promotion autorisés
→ vérification
```

Les workflows de la Foundation fabriquent et prouvent la Factory. Ils ne sont
pas copiés : leurs chemins `starters/`, matrices et permissions ne sont pas le
contrat d'un projet dérivé.

## 8. Sécurité et supply chain

- aucun secret ou credential dans Git, le lock ou l'artefact ;
- moindre privilège pour CI et runtime ;
- utilisateur non-root lorsque l'artefact le permet ;
- images et artefacts immuables ;
- migrations séparées du build ;
- aucune base exposée publiquement par défaut ;
- TLS obligatoire hors local contrôlé ;
- journaux, traces et artefacts sans données sensibles ;
- SBOM, signature, provenance, licences et scan d'image deviennent des gates
  avant toute revendication `PRODUCTION_READY`.

## 9. Hygiène de livraison

Le dérivé reçoit seulement : sources sélectionnées, contrats/bindings consommés,
tests et configuration utiles au propriétaire, artefacts opérationnels du plan,
README et runbooks correspondants, provenance et inventaire.

Il ne reçoit pas les manifests de starter, caches, sources de packs, revues,
roadmaps, rapports internes, preuves de fabrication ou configuration d'un cloud
non sélectionné.

## 10. Validation

Selon le scope déclaré :

- schéma et chemins ;
- lock reproductible ;
- build réel de chaque artefact dans le dérivé ;
- test de l'artefact, non du seul source tree ;
- health et démarrage ;
- migrations contre une primitive réelle contrôlée ;
- configuration/secrets par référence ;
- panne, backup/restore et rollback ;
- CI générée sans chemin Foundation ;
- sécurité et supply chain applicables.

Une preuve locale n'est promue ni en staging ni en production. Les preuves
serveur peuvent rester des gates de release plutôt que de chaque PR.

## 11. Compatibilité actuelle

Blueprint v1 sait sélectionner des environnements mais pas les primitives et
providers complets. Jusqu'à sa migration, l'infrastructure générée reste
explicitement partielle et ne peut pas être présentée comme un pack résolu.

Le `GenerationPlan` émet désormais une unité validée par application depuis les
sept adapters et la matérialise dans `packages/contracts/deployment-units.json`.
Les variables de capabilities sont transportées par nom et, faute de
classification dans Overlay v1, traitées par défaut comme sensibles. Les packs
providers, pipelines dérivés et corrections des artefacts bloqués restent à
implémenter selon ADR-089.
