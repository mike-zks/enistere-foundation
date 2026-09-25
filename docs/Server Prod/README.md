# Enistere Production

Ce dossier est la référence courte de l'écosystème de production partagé Enistere. Il est indépendant des dépôts applicatifs et peut être fourni à une équipe ou à une IA pour concevoir, vérifier et préparer le déploiement d'un projet.

## Documents

1. [ARCHITECTURE.md](ARCHITECTURE.md) décrit les composants déployés, leurs frontières et leurs flux.
2. [POLITIQUE.md](POLITIQUE.md) fixe les règles obligatoires de développement, de sécurité et de livraison.
3. [PROCEDURE.md](PROCEDURE.md) décrit l'admission, le déploiement, les vérifications, l'exploitation et la reprise.

## Répartition des responsabilités

Ce dossier porte les conventions communes : VPS, Cloudflare, Traefik, réseaux Docker, données partagées, observabilité, sauvegardes, CI/CD et Portainer.

Chaque dépôt applicatif reste responsable de son code, de ses Dockerfiles, de ses migrations, de ses manifestes, de son contrat de configuration, de ses tests et de son runbook métier. Son backlog et sa prochaine mission décrivent uniquement le produit concerné.

## Utilisation dans un projet

Au démarrage ou avant le premier déploiement, fournir ces quatre documents à l'équipe ou à l'IA, puis lui demander :

1. d'identifier les écarts entre le projet et la politique ;
2. de proposer les artefacts propres au projet sans recopier l'infrastructure partagée ;
3. de produire les preuves d'admission exigées par la procédure ;
4. de garder les travaux produit dans le dépôt applicatif et les changements de plateforme dans ce dossier.

Les secrets restent exclusivement dans des fichiers protégés sur le VPS ou dans les gestionnaires des fournisseurs. Aucun mot de passe, jeton, contenu de clé privée ou valeur de secret ne doit entrer dans ces documents, Git, une image ou des journaux CI.
