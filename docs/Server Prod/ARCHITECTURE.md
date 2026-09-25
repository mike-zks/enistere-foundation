# Architecture de production Enistere

## Hôte

- OVHcloud VPS-4
- Ubuntu 26.04.1 LTS
- IPv4 `148.113.240.232`
- administration par le compte `enistere` et clés SSH
- accès de secours par la console OVH

Les seuls ports publics de l'hôte sont 22, 80 et 443. PostgreSQL, Redis, Prometheus, Grafana, Loki, Uptime Kuma et Portainer ne publient aucun port hôte.

## Entrée et sécurité

Cloudflare fournit DNS, proxy, WAF, TLS public et Access. Traefik est l'unique entrée HTTP/HTTPS et obtient ses certificats d'origine par DNS-01. Les interfaces administratives doivent passer par Cloudflare Access et refuser le contournement direct de l'origine.

Les domaines applicatifs à plusieurs niveaux exigent une couverture edge vérifiée. Advanced Certificate Manager avec Total TLS est l'option retenue si ces noms restent utilisés.

## Réseaux Docker

- `enistere_public` : Traefik et services ayant une route explicite
- `enistere_internal` : communications applicatives privées
- `enistere_data` : PostgreSQL et Redis
- `enistere_observability` : métriques, traces et journaux

Un service rejoint uniquement les réseaux nécessaires. Docker Compose ne publie aucun port interne.

## Données et sauvegardes

Les données partagées résident sous `/srv/enistere/data`. Les configurations résident sous `/srv/enistere/platform` et les applications sous `/srv/enistere/apps`.

Restic chiffre et dépose les sauvegardes dans Backblaze B2 avec 7 quotidiennes, 4 hebdomadaires et 6 mensuelles. Les quatre bases PostgreSQL, les rôles globaux, Redis, Grafana, Uptime Kuma, Portainer, les configurations et les manifestes applicatifs sont couverts. Le bucket applicatif R2 est copié en lecture seule dans la sauvegarde chiffrée, avec une limite de volume protégeant le disque du VPS. Les restaurations sont exercées dans des emplacements ou instances isolés avant toute reprise réelle.

Cloudflare R2 est le stockage objet applicatif via les variables S3 standardisées. Il ne remplace pas la sauvegarde transactionnelle. Le bucket était vide lors du test du 19 septembre 2026 ; les futurs objets seront inclus automatiquement dans le job central.

## Exploitation

Prometheus, Grafana, Loki et Uptime Kuma assurent la visibilité. Les notifications d'infrastructure passent par Telegram et e-mail. Portainer fournit l'inventaire et les opérations d'urgence ; Git et la CI/CD restent la source de vérité.

Grafana déclare `https://grafana.enistere.com/` comme URL racine. Les liens générés dans les notifications pointent donc vers l'interface protégée par Cloudflare Access et jamais vers l'adresse interne `localhost:3000`.

## Identité commune

Keycloak est un service commun de la plateforme. Une seule instance maintenue et supervisée par Enistere héberge un realm distinct par projet : Karevo utilise le realm `karevo`, et tout nouveau projet reçoit son propre realm. La mutualisation porte sur le moteur, sa version, sa disponibilité, sa supervision et sa sauvegarde ; les clients, rôles, groupes, flux, thèmes, sessions, clés et politiques restent isolés dans le realm du projet.

Chaque realm possède une base de configuration versionnée sans secret et un jeu de secrets propre. Les applications consomment l'issuer public de leur realm. Elles peuvent joindre Keycloak par le réseau interne pour la découverte et les clés, à condition de continuer à valider l'issuer public attendu. Aucun projet ne reçoit de droits d'administration sur le realm d'un autre projet ni sur le realm maître.

Le service public utilise `https://auth.enistere.com`; la console utilise `https://auth-admin.enistere.com/admin/` et passe par Cloudflare Access avant l'authentification Keycloak. Traefik refuse `/admin/*` sur le domaine public et refuse les accès directs à l'origine. Le compte permanent `enistere-admin` est associé à `infra@enistere.com`; son mot de passe reste uniquement dans un fichier protégé sur le VPS. Le compte d'amorçage `karevo-bootstrap` est désactivé et son secret a été supprimé du manifeste et du disque.

Karevo a été migré vers le socle commun le 20 septembre 2026. Sa pile ne contient plus de conteneur Keycloak et consomme l'issuer `https://auth.enistere.com/realms/karevo`. La base commune se nomme `enistere_keycloak`. Le domaine historique `auth.karevo.enistere.com` n'est plus routé par Traefik.

## Plan de contrôle des données

Prometheus collecte les métriques PostgreSQL et Redis par deux exporteurs privés et les métriques Keycloak sur son port de gestion. Le rôle PostgreSQL `enistere_monitor` possède uniquement `pg_monitor`. Les exporteurs rejoignent `enistere_data` et `enistere_observability` sans publier de port hôte. Grafana provisionne le tableau `Enistere - Data Platform` et alerte lorsque PostgreSQL ou Redis devient indisponible. Une sonde privée contrôle aussi Keycloak chaque minute ; Uptime Kuma surveille son discovery endpoint sous le nom `Enistere Auth`.

L'administration des bases et la consultation des snapshots passent par SSH. Les commandes PostgreSQL utilisent l'identité adaptée et les restaurations Restic écrivent d'abord sous `/srv/enistere/restore`. Le remplacement de données actives reste une opération distincte et contrôlée.
