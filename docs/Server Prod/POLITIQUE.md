# Politique de développement et de déploiement Enistere

Cette politique s'applique à toute nouvelle application, API, interface, worker ou service déployé sur la plateforme Enistere. Elle doit être prise en compte dès la création du dépôt et contrôlée avant le premier déploiement.

## Principes de responsabilité

- Git et la CI/CD sont la source de vérité des images, manifestes et versions déployées.
- Portainer sert à observer et à intervenir en urgence. Toute modification durable effectuée depuis son interface doit être reproduite dans Git.
- Traefik est l'unique entrée HTTP/HTTPS. Une application ne publie aucun port hôte.
- PostgreSQL, Redis, les métriques, les journaux et les interfaces d'administration restent sur les réseaux privés.
- Cloudflare fournit DNS, proxy, WAF et TLS public. Les interfaces d'exploitation sont protégées par Cloudflare Access.

## À créer au début d'un projet

Le dépôt doit déclarer :

1. le propriétaire du service et son contact d'alerte ;
2. les noms DNS souhaités et leur caractère public ou administratif ;
3. les dépendances PostgreSQL, Redis, R2, B2 et OIDC ;
4. les objectifs de disponibilité, de sauvegarde, de rétention et de restauration ;
5. les besoins CPU, mémoire et stockage avec des limites initiales ;
6. les données personnelles ou sensibles traitées ;
7. les commandes reproductibles de build, migration, healthcheck et rollback.

Le développement local utilise des fichiers d'exemple sans secret. Aucun secret réel, export de production ou fichier `.env` privé n'entre dans Git, une image, un log CI ou une issue.

## Contrat d'exécution des conteneurs

Chaque processus possède une image de production dédiée, minimale et construite en plusieurs étapes. L'image finale contient seulement le runtime, le code compilé et les dépendances de production. Elle s'exécute avec un utilisateur non-root, un système de fichiers en lecture seule lorsque le logiciel le permet, `no-new-privileges`, un `init`, une limite de processus, une rotation des journaux et des limites CPU/mémoire.

Les versions de base et de services sont fixées explicitement. La CI publie ensuite l'image par digest immuable. Le VPS ne compile jamais une application.

Chaque service long doit fournir un healthcheck représentatif. Une API distingue au minimum la vie du processus et sa capacité à servir avec ses dépendances. Les migrations sont un processus ponctuel distinct et s'exécutent avant le remplacement des services.

Les runtimes standalone doivent recevoir explicitement toutes leurs variables d'exécution. Une transformation effectuée par un fichier de build, comme `next.config.ts`, ne constitue pas une configuration runtime. Le test de livraison doit exercer au moins une route qui dépend réellement de chaque intégration critique, par exemple `/auth/login` pour OIDC plutôt que la seule page d'accueil.

## Réseaux et exposition

Les services rejoignent seulement les réseaux nécessaires parmi : entrée publique, services internes, données et observabilité. Traefik partage le réseau d'entrée avec le frontend ciblé. Une base ou un cache ne rejoint jamais ce réseau.

Les règles Traefik sont versionnées et n'exposent que les routes prévues. Après chaque déploiement, `ss -lntup` doit confirmer qu'aucun nouveau port hôte n'est apparu. Les ports 80 et 443 appartiennent à Traefik ; le port 22 reste régi par la politique SSH de la plateforme.

Pour les domaines à plusieurs niveaux comme `api.projet.enistere.com`, la couverture du certificat Cloudflare doit être confirmée avant la mise en service. Les certificats d'origine sont émis par DNS-01 avec un jeton limité à la zone.

## Identité et secrets

Une application utilise le fournisseur Keycloak commun ou justifie une exception dans un ADR. Chaque projet possède un realm distinct ; partager un realm entre projets est interdit. Les comptes d'administration sont séparés des comptes applicatifs et délégués au périmètre minimal du realm. Le realm `master` reste réservé à l'administration de la plateforme.

Les clients, URI de redirection, URI de déconnexion, audience, rôles, groupes, scopes et flux sont versionnés sans leurs secrets dans le dépôt du projet. Les jokers dans les URI de redirection sont interdits en production, sauf exception documentée et bornée. Chaque client confidentiel possède son propre secret ; un secret n'est jamais réutilisé entre projets, environnements ou clients. Le parcours complet navigateur vers l'IdP et retour à l'application fait partie des contrôles de production.

Une mise à jour du moteur Keycloak relève de la plateforme. Une évolution d'un realm relève du projet et passe par la CI/CD ou une procédure reproductible. Toute modification manuelle durable dans la console doit être exportée, nettoyée de ses secrets et reportée dans Git.

Les secrets sont fournis par des fichiers protégés, lisibles uniquement par le service concerné. Ils ne figurent jamais dans les arguments de commande, variables imprimées, manifests Git ou sorties de validation. Les identités de base de données sont séparées par usage : migration, application, worker, session et sauvegarde selon le besoin.

## CI/CD et promotion

Une pull request exécute lint, formatage, typecheck, tests, contrôle des contrats, migrations depuis une base vierge, build de production, audit de dépendances et recherche de secrets selon la technologie du projet.

Une livraison de production part d'un tag protégé. La CI :

1. construit une fois les cibles de production ;
2. publie chaque image dans le registre ;
3. capture son digest ;
4. utilise une identité SSH dédiée et restreinte ;
5. sauvegarde l'état utile ;
6. valide le manifeste rendu ;
7. télécharge les digests ;
8. exécute les migrations ponctuelles ;
9. démarre avec attente des healthchecks ;
10. restaure les manifestes et digests précédents en cas d'échec, tout en conservant un statut CI en échec.

La CI ordinaire et la publication de production sont deux workflows distincts : un push de code valide, un tag de production publie et déploie. Un tag ne doit pas relancer inutilement le workflow de validation déjà passé sur le commit.

## Données, sauvegardes et reprise

Les données persistantes utilisent les emplacements gérés de `/srv/enistere/data` ou des volumes explicitement documentés. Une application déclare les bases, fichiers de configuration et manifestes nécessaires à sa reprise.

La sauvegarde centrale Restic vers Backblaze B2 couvre ces éléments avec 7 quotidiennes, 4 hebdomadaires et 6 mensuelles. Une sauvegarde n'est considérée opérationnelle qu'après une restauration réelle dans un emplacement isolé et, pour PostgreSQL, dans une instance temporaire. Les buckets applicatifs R2 ne remplacent pas une sauvegarde de la base.

Une migration destructive exige une stratégie de compatibilité ou une procédure de restauration approuvée avant déploiement.

## Observabilité et exploitation

Le service expose des métriques utiles, des journaux structurés sans secret et des alertes liées à des pannes que l'équipe sait traiter. Prometheus, Grafana, Loki et Uptime Kuma restent privés ou passent par une route administrative protégée.

Les outils générant des liens dans leurs notifications déclarent leur URL publique canonique. Une alerte ne doit contenir ni `localhost`, ni adresse de conteneur, ni IP d'origine.

Chaque application fournit un runbook contenant : architecture déployée, DNS, réseaux, secrets attendus par nom, commandes de vérification, sauvegarde, restauration, rotation des clés, rollback et contacts d'alerte.

## Critères d'admission en production

Une application peut rejoindre l'écosystème lorsque :

- la CI du commit est verte et l'image est fixée par digest ;
- les secrets sont hors dépôt et les droits sont minimaux ;
- les limites de ressources et healthchecks sont présents ;
- les migrations ont été rejouées depuis une base vierge ;
- la sauvegarde et une restauration isolée ont été démontrées ;
- TLS, DNS, WAF, OIDC et les routes applicatives critiques ont été testés depuis l'extérieur ;
- aucun port interne n'est publié ;
- les métriques, journaux et alertes sont visibles ;
- le rollback a été exercé et conserve un statut d'échec lorsque le déploiement échoue ;
- le runbook et l'inventaire de production sont à jour.

Une exception temporaire est écrite, datée, attribuée à un propriétaire et accompagnée d'une échéance. Sans ces quatre éléments, elle ne constitue pas une exception valide.

L'exploitation de l'interface partagée suit l'annexe Portainer de [PROCEDURE.md](PROCEDURE.md).

## Maintenance du serveur

La maintenance automatique peut supprimer les conteneurs arrêtés depuis plus de sept jours, les images pendantes, le cache de construction ancien, les journaux de plus de trente jours et les restaurations temporaires de plus de sept jours.

Elle ne supprime jamais automatiquement un volume Docker, un réseau, une image versionnée, une sauvegarde Restic, une base, un bucket ou une donnée applicative. Les images servant au déploiement courant ou au rollback sont retirées uniquement après vérification des digests encore référencés.

Toute opération de maintenance produit un résultat systemd consultable et vérifie ensuite l'espace disque, l'état Docker, les services critiques et les sauvegardes.

## Administration des données

L'administration PostgreSQL s'effectue par SSH avec l'identité adaptée. Les consultations utilisent une transaction en lecture seule lorsque possible. Les modifications de production utilisent une transaction contrôlée et tracée. Une modification durable du modèle passe par une migration versionnée.
