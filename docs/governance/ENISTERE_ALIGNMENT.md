# Raccordement au socle Enistere — Enistere Foundation

- Date : 26 octobre 2026 UTC.
- Gouvernance adoptée pour le raccordement documentaire : [58d3442cd9dcef17ae8862ab90c561e897581399](https://gitlab.com/enistere/governance/-/tree/58d3442cd9dcef17ae8862ab90c561e897581399).
- Portée autorisée : instruction du propriétaire de mettre les projets aux nouvelles normes de
  gouvernance et d'architecture ; cette copie locale reste à relire avant publication/admission.
- Profil : **bibliothèque/CLI**. Base observée : `d3335fc82f841f4e879ef437f3db4cd1a0e26c9f`.
- Décision : [ADR-101](../adr/ADR-101-enistere-governance-alignment.md).

## Autorité et reprise

Le dossier maître conserve les invariants et gates produit. Pour contribution, sécurité, CI/CD,
plateforme partagée et livraison, le référentiel commun ci-dessus remplace les anciennes copies
locales `docs/Server Prod/` comme source de normes actuelles. Celles-ci restent historiques et
ne décrivent pas automatiquement l'état actuel d'un serveur. Une contradiction avec le maître
est consignée et résolue par ADR/révision approuvée ; aucun invariant métier n'est écrasé.

Lire cet addendum avec AGENTS, CONTEXT, CURRENT_STATE, le backlog et les ADR avant de reprendre.
Les registres métier conservent leur prochaine mission ; le chantier de plateforme est suivi
centralement dans governance. Les anciennes preuves gardent leur date et leur périmètre.

## Contrat de développement et CI/CD

- GitLab Free est la cible durable après validation nominative de migration : main protégée,
  MR, pipeline réussi et discussions résolues ; pas de dépendance nécessaire à Ultimate.
  Les remotes historiques restent conservés ; aucun transfert ou push n'est autorisé par cet addendum.
- Garder les versions et lockfiles réellement choisis par ce projet. Les scripts locaux et CI
  doivent appeler la même logique ; aucun gestionnaire ou template applicatif universel imposé.
- Admission courte par risque/impact ; un pipeline MR ou main, pas de doublon push/MR. Chemins
  transversaux conservateurs, jobs annulables, délais et rétention bornés, caches de confiance.
- Une modification strictement documentaire vérifie structure/liens, diff et intégrité des maîtres.
  Elle ne nécessite pas de reconstruire application/images ou de rejouer tous les E2E ; cette
  règle, issue de la politique commune et de l'instruction d'alignement du propriétaire, ne
  dispense jamais les changements exécutables, contrats, données ou sécurité de leurs tests.
- Contrôles critiques bloquants. Avant release sensible : tests indépendants d'intégration/E2E,
  migrations et retour arrière, scans de secrets/dépendances et preuves de l'artefact.
  Une déclaration locale seule ne qualifie pas une release critique.
- Construire une seule fois, publier dans le registre autorisé (GitLab Container Registry cible
  pour les images), tester/promouvoir le même digest ; autorisation humaine explicite de
  production sur ref protégée, verrou commun par cible, santé/alertes et retour arrière.
- Le runner de contribution ci-01 et son canary rootless ne qualifient pas cette application.
  Aucun secret de production, socket Docker hôte ou job privilégié dans les MR. Une release
  exige un contexte de confiance indépendant du VPS de contribution.

## Contrat d'exploitation et portabilité

Profil initial : Linux supporté/durci, Compose versionné, Traefik unique entrée HTTP/HTTPS,
services internes sans port Internet publié, réseaux/données/identités séparés, ressources
bornées, healthchecks et journaux expurgés. Kubernetes ou séparation d'hôtes répondent à des
besoins mesurés ; un serveur unique ne promet pas de haute disponibilité.

Noms logiques de rôles, OS, région, capacité, chemins d'hôte et adresses restent paramètres
d'inventaire. Le Canada est l'orientation initiale ; déplacer les données exige analyse de
résidence, dépendances et coûts, sauvegardes/restauration puis validation de bascule. Les
configurations et manifestes versionnés sans secrets doivent permettre un remplacement de VPS.

Les secrets restent hors Git/images/logs, réémissibles/révocables par usage/environnement.
Sauvegardes chiffrées hors hôte et restauration sur cible isolée sont démontrées avant ouverture ;
RPO/RTO, capacité, dépendances et contacts sont propres au service. Le fournisseur d'identité
est une configuration : Trust sera raccordé progressivement après validation, avec secours
indépendant ; ni remplacement automatique de Keycloak ni couplage au service en développement.

## Profil et exigences propres au projet

Le Kernel et la CLI sont les artefacts réellement présents ; aucun Control Plane, Workbench,
worker, registry ou AI Gateway n'est déployable à ce stade. Ne pas fabriquer un service de
production pour obtenir une CI verte. L'E6 locale comporte trois commits de plus que main :
le pull de la branche E6 a confirmé son état à jour ; une future PR doit réconcilier cette base
avec main sans perdre E6. Le contrôle des contrats, le typage et les tests des packages restent
les contrôles applicatifs pertinents ; leurs commandes viennent de package.json.

L'OIDC est une dépendance configurable d'un futur service, pas une dépendance à ajouter au Kernel.
Le realm Keycloak autrefois décrit n'est pas une obligation de déploiement. Évaluer le raccordement
à Trust lorsqu'il sera qualifié, avec accès de secours indépendant.

## Écarts d'implémentation encore ouverts

- CI GitHub existante à porter après validation de migration : délais et rétention des artefacts
  à borner ; aucun pipeline applicatif GitLab ni nouveau tag de composants homologué ici.
- Checks requis, design et autres arbitrages existants restent ouverts dans BACKLOG.
- Licence/visibilité, destination GitLab et diffusion des packages restent des décisions distinctes.
- La bibliothèque et la CLI ne sont pas soumises à un manifeste de serveur tant qu'aucun service
  long n'existe ; les tests de consommation demeurent nécessaires avant publication.

## Preuves et limites de ce raccordement

Les contrôles documentaires, empreintes des maîtres et diff sont consignés dans CURRENT_STATE.
Aucun changement de code, workflow, lockfile, image ou environnement. Aucun résultat historique
n'est converti en preuve actuelle. Tests applicatifs complets, runtime CI et admission production
restent **NOT RUN / non qualifiés dans cette mission documentaire**.

Prochaine mission produit conservée : **E7 — Day-2 Change Intelligence** (BACKLOG).
