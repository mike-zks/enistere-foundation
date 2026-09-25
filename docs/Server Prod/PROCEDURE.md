# Procédure de déploiement et d'exploitation Enistere

Cette procédure transforme la politique en étapes vérifiables. Elle s'applique au premier déploiement et aux évolutions ultérieures.

## 1. Préparer le projet

1. Lire `ARCHITECTURE.md` et `POLITIQUE.md`.
2. Désigner le propriétaire et le contact d'alerte.
3. Inventorier DNS, routes, processus, dépendances, données, volumes et variables.
4. Classer chaque route comme publique, interne ou administrative.
5. Fixer les limites initiales de CPU, mémoire et stockage.
6. Définir RPO, RTO, périmètre de sauvegarde et méthode de restauration.
7. Recenser les écarts à la politique.

Le dépôt applicatif fournit ses Dockerfiles de production, manifeste Compose, exemple de configuration sans secret, migrations, healthchecks, tests, workflows CI/CD et runbook métier.

## 2. Préparer la plateforme

1. Créer les DNS Cloudflare en mode proxy et vérifier TLS.
2. Protéger les routes administratives avec Cloudflare Access.
3. Créer les secrets sur le VPS avec des permissions minimales, sans afficher leur contenu.
4. Créer les identités PostgreSQL ou Redis avec le moindre privilège.
5. Créer `/srv/enistere/apps/<projet>` et les emplacements persistants documentés.
6. Relier les services uniquement aux réseaux Docker requis.
7. Ajouter données et manifestes au périmètre Restic.
8. Ajouter métriques, tableaux de bord, sondes et alertes.
9. Pour OIDC, créer un realm Keycloak au nom du projet, puis ses clients et rôles sans réutiliser de secret existant.

## 3. Valider et déployer

La pull request doit réussir les contrôles adaptés : formatage, lint, typecheck, tests, contrats, migrations depuis une base vierge, build, audit des dépendances et recherche de secrets.

1. Créer un tag protégé sur un commit dont la CI est verte.
2. Construire et publier les images une seule fois, puis enregistrer leurs digests.
3. Sauvegarder les données et manifestes concernés.
4. Valider le manifeste rendu sans valeur secrète.
5. Télécharger les images par digest.
6. Exécuter les migrations comme tâche ponctuelle.
7. Démarrer les services et attendre leurs healthchecks.
8. Tester depuis l'extérieur TLS, routes critiques, OIDC et redirections.
9. Vérifier métriques, journaux et alertes.
10. Attacher les preuves à la livraison.

Pour chaque notification de test, vérifier que le lien d'action utilise le domaine public canonique. Pour Grafana, il doit commencer par `https://grafana.enistere.com/` et mener à Cloudflare Access.

En cas d'échec, restaurer les manifestes et digests précédents et conserver un statut CI en échec.

## 4. Vérifier l'isolation

```sh
sudo docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Ports}}\t{{.Status}}'
sudo ss -lntup
sudo docker network inspect enistere_public enistere_internal enistere_data enistere_observability
```

Les seuls ports publics attendus restent 22, 80 et 443. Vérifier aussi que l'IP d'origine ne contourne ni Traefik ni Cloudflare Access.

## 5. Sauvegarder et restaurer

La rétention centrale est de 7 quotidiennes, 4 hebdomadaires et 6 mensuelles. Après l'ajout d'un projet : lancer une sauvegarde réelle, confirmer son succès, restaurer dans un répertoire isolé, restaurer PostgreSQL dans une instance temporaire, vérifier les données puis supprimer l'environnement temporaire. Ne jamais tester une restauration directement sur les données actives.

## 6. Reprise après sinistre

1. Rétablir un hôte Ubuntu supporté et durci.
2. Restaurer Docker, les réseaux et Traefik depuis les manifestes.
3. Récupérer les secrets par le canal protégé prévu.
4. Restaurer PostgreSQL dans une instance contrôlée et vérifier son intégrité.
5. Restaurer les autres données persistantes.
6. Redéployer les images par leurs digests connus.
7. Rétablir l'observabilité et Portainer.
8. Basculer DNS et trafic après les tests internes.
9. Vérifier TLS, OIDC, routes critiques, métriques et alertes depuis l'extérieur.
10. Consigner le snapshot utilisé, les écarts et les corrections.

## 7. Preuves d'admission

Conserver : commit et tag, digests, résultat CI, migrations, tests des routes et certificats, absence de ports internes, healthchecks, métriques, alertes, snapshot, restauration isolée, rollback et exceptions avec propriétaire et échéance.

## 8. Intégrer un projet à Keycloak

1. Choisir un identifiant de realm stable, en minuscules, égal au nom du projet.
2. Décrire dans Git les clients, rôles, groupes, scopes, flux, URI de redirection et de déconnexion, sans valeur secrète.
3. Créer un secret distinct pour chaque client confidentiel et le déposer dans le fichier protégé prévu sur le VPS.
4. Déployer la configuration du realm de manière reproductible ; réserver la console aux diagnostics et aux urgences.
5. Configurer l'issuer public sous la forme `https://auth.enistere.com/realms/<projet>`. Une URL interne peut servir à la découverte ou au JWKS, mais la validation doit exiger cet issuer public exact.
6. Tester connexion, retour, renouvellement, déconnexion, refus d'un rôle absent et indisponibilité temporaire de l'IdP.
7. Ajouter la base et la configuration Keycloak aux sauvegardes, puis exercer la restauration isolée.

Pour migrer un realm existant, commencer par une sauvegarde et un export, répéter l'import sur une instance temporaire, comparer clients et rôles, réduire le TTL DNS si le nom change, puis effectuer la bascule pendant une fenêtre annoncée. Valider tous les parcours OIDC avant de retirer l'ancienne instance. Conserver l'ancienne pile arrêtée mais restaurable pendant la période de retour arrière définie.

---

## Annexe opérationnelle : Portainer

Portainer Business Edition fournit l'inventaire Docker, les journaux et les opérations manuelles d'urgence. GitHub Actions et les manifestes versionnés restent la source de vérité : une modification durable faite dans Portainer doit être reproduite dans Git puis redéployée par la CI.

## Accès

- URL : `https://platform.enistere.com`
- Protection : Cloudflare Access, politique nominative
- Environnement : `enistere-production`, Docker Standalone par socket local
- Version observée : Portainer Business Edition 2.45.1 (`portainer/portainer-ee:2.45.1`)

Le conteneur ne publie aucun port hôte. Traefik le joint sur `enistere_public`. Le routeur accepte seulement les plages IP officielles Cloudflare ; une requête directe vers l'IP du VPS avec l'en-tête `Host` reçoit 403.

Les fichiers résident dans `/srv/enistere/platform/management`, les données dans `/srv/enistere/data/portainer` et la clé de chiffrement dans `/srv/enistere/secrets/portainer/secret-key`. La clé ne doit jamais être affichée ou copiée dans Git.

## Commandes d'exploitation

```sh
sudo docker compose -f /srv/enistere/platform/management/compose.yml ps
sudo docker compose -f /srv/enistere/platform/management/compose.yml logs --tail 100 portainer
sudo docker compose -f /srv/enistere/platform/management/compose.yml restart portainer
sudo ss -lntp
```

Une mise à jour remplace le digest dans Compose après lecture des notes de version et sauvegarde. Elle ne doit jamais utiliser `latest` ou `lts` comme référence déployée.

## Sauvegarde

Le service central `enistere-backup.service` arrête Portainer quelques secondes, archive `/srv/enistere/data/portainer`, puis le redémarre avant l'envoi Restic. Son trap redémarre aussi le conteneur si la copie échoue. `portainer-data.tar.gz`, les manifestes et la clé protégée sont déposés dans le dépôt chiffré Backblaze B2 avec la rétention centrale.

Vérification :

```sh
sudo systemctl start enistere-backup.service
sudo systemctl show enistere-backup.service -p Result -p ExecMainStatus
sudo docker ps --filter name=enistere-portainer
```

## Restauration

Restaurer d'abord dans un répertoire isolé. Ne jamais extraire directement sur les données actives.

1. Restaurer `portainer-data.tar.gz`, le manifeste de management et la clé depuis le même snapshot Restic.
2. Vérifier que l'archive contient `portainer/portainer.edb` et que ce fichier n'est pas vide.
3. Arrêter Portainer.
4. Sauvegarder ou déplacer le répertoire actif.
5. Extraire l'archive sous `/srv/enistere/data` en conservant les permissions.
6. Restaurer la clé dans `/srv/enistere/secrets/portainer/secret-key` en mode `0600`.
7. Démarrer Portainer et vérifier `/api/status`, l'authentification et l'environnement local.
8. Vérifier que l'accès direct à l'origine reste refusé et qu'aucun port supplémentaire n'écoute.

Le 17 septembre 2026, une sauvegarde réelle vers Backblaze a réussi. L'archive a été restaurée et extraite dans `/tmp` ; `portainer.edb` faisait 1 048 576 octets et le contrôle s'est terminé par `PORTAINER_RESTORE_OK` sans toucher à l'instance active.

## Maintenance courante du serveur

Le timer `enistere-maintenance.timer` s'exécute chaque dimanche à 04:30 UTC avec un délai aléatoire maximal de vingt minutes. Il lance `/srv/enistere/scripts/maintenance/enistere-maintenance`.

```sh
sudo systemctl list-timers enistere-maintenance.timer
sudo systemctl start enistere-maintenance.service
sudo systemctl show enistere-maintenance.service -p Result -p ExecMainStatus
sudo journalctl -u enistere-maintenance.service -n 100 --no-pager
sudo docker system df
sudo df -h / /srv/enistere
```

Le script retire seulement les conteneurs arrêtés anciens, les images pendantes, le cache de build ancien, les journaux de plus de trente jours et les espaces temporaires de restauration ou de staging expirés. Ne jamais ajouter `docker volume prune`, `docker network prune` ou `docker system prune -a` à cette automatisation.

Avant de supprimer des images versionnées : relever les digests des conteneurs actifs, identifier le digest de rollback, vérifier que les manifestes les référencent, puis supprimer seulement les autres images nommément.

Chaque mois, vérifier également : mises à jour Ubuntu, versions Docker et images, espace disque, mémoire, redémarrages de conteneurs, état SMART disponible chez l'hébergeur, certificats, règles UFW/OVH, comptes SSH, timers, alertes et succès de la dernière restauration exercée.

## Configurer et utiliser Uptime Kuma

Uptime Kuma est accessible à `https://status.enistere.com`. Il ne publie aucun port hôte et sa donnée persistante réside dans le volume `enistere-monitoring_uptime_kuma_data`.

### Ajouter une sonde

1. Ouvrir **Add New Monitor**.
2. Choisir **HTTP(s)** pour une application Web ou une API.
3. Donner un nom incluant le projet et le rôle, par exemple `Karevo API`.
4. Utiliser une URL de santé externe en HTTPS qui ne requiert aucun secret.
5. Régler l'intervalle à 60 secondes, le délai à 10 secondes et trois tentatives.
6. Accepter uniquement les codes HTTP attendus.
7. Activer la vérification TLS et l'expiration du certificat.
8. Ajouter les tags `production`, le nom du projet et le type de service.
9. Associer les notifications Telegram et e-mail.
10. Enregistrer puis provoquer, sur une cible de test, une alerte et son rétablissement.

Créer au minimum une sonde pour chaque point d'entrée public et une sonde dédiée au parcours critique lorsque celui-ci possède une URL de contrôle sûre. Une réponse de page d'accueil ne remplace pas un test OIDC, API ou dépendance critique.

### Maintenance planifiée

Avant une intervention, créer une fenêtre dans **Maintenance** avec début, fin, fuseau horaire et moniteurs concernés. Cette fenêtre suspend les notifications attendues sans supprimer l'historique. La retirer ou la clôturer immédiatement si l'intervention se termine plus tôt.

### Exploitation

- Consulter les incidents, temps de réponse et taux de disponibilité.
- Acquitter les alertes dans le canal opérationnel, pas en désactivant une sonde.
- Documenter la cause et l'action corrective lors d'une panne réelle.
- Vérifier chaque mois l'envoi Telegram et e-mail avec une sonde de test.
- Sauvegarder le volume Uptime Kuma par Restic et tester sa restauration dans un emplacement isolé.

### Vérifications techniques

```sh
sudo docker ps --filter name=enistere-uptime-kuma
sudo docker logs --tail 100 enistere-uptime-kuma
sudo docker inspect enistere-uptime-kuma --format '{{range .Mounts}}{{.Source}} -> {{.Destination}}{{println}}{{end}}'
```

Ne pas placer de jeton, mot de passe ou en-tête d'authentification durable dans une sonde lorsque l'état recherché peut être exposé par un endpoint de santé limité.

## Pilotage PostgreSQL et Redis

Dans Grafana, ouvrir le tableau **Enistere - Data Platform**. Il présente la disponibilité des deux moteurs, les connexions PostgreSQL, la taille des bases, les transactions, les clients Redis, la mémoire, les cache hits/misses et les évictions.

```sh
sudo docker ps --filter name=exporter
sudo docker exec enistere-prometheus wget -qO- http://localhost:9090/api/v1/targets
```

Les exporteurs doivent apparaître `up`. Les ports 9187 et 9121 ne doivent pas apparaître dans `ss -lntup`.

Toute restauration PostgreSQL suit ces étapes : sélectionner le snapshot avec Restic, restaurer le dump sous `/srv/enistere/restore/<date>`, démarrer une instance PostgreSQL temporaire isolée, importer, contrôler les bases et les données, puis planifier séparément la bascule. Ne jamais restaurer directement dans `/srv/enistere/data/postgres`.

## Administrer les données par SSH

Les bases ne disposent d'aucune console Web. La consultation et les corrections passent par SSH, `psql` et les scripts versionnés. Les secrets sont lus depuis leurs fichiers protégés sans être affichés dans l'historique du shell.

### Sondes Uptime Kuma déployées

Les sondes publiques suivantes s'exécutent toutes les 60 secondes, avec deux nouvelles tentatives, un délai de 20 secondes entre tentatives et un timeout de 10 secondes :

- `Karevo API` sur `/health`, code attendu 200 ;
- `Karevo Identity` sur `/realms/karevo`, code attendu 200 ;
- `Karevo Operations`, code attendu 200 ;
- `Karevo Agency`, code attendu 200 ;
- Grafana, Status et Portainer, code attendu 302 de Cloudflare Access.

Telegram et e-mail sont les canaux par défaut et sont associés à chaque sonde. Une sonde administrative en 302 valide la disponibilité DNS/TLS et la présence d'Access ; les exporteurs Prometheus et les healthchecks Docker contrôlent séparément le service d'origine.

### Modifier des données PostgreSQL

Les schémas, lignes, tailles, sessions et requêtes se consultent avec `psql` depuis une session SSH autorisée.

Une correction de production passe par SSH avec le propriétaire approprié, une transaction explicite et une vérification avant validation :

```sql
BEGIN;
-- SELECT de contrôle
-- modification ciblée avec prédicat précis
-- SELECT de vérification
COMMIT;
```

Utiliser `ROLLBACK` dès que le résultat diffère de l'effet attendu. Consigner la base, la requête, le nombre de lignes touchées, le motif et l'opérateur. Une évolution fonctionnelle durable passe par une migration versionnée plutôt que par une correction manuelle.

## Dernier audit de cohérence — 20 septembre 2026

SSH utilise exclusivement les clés, sans connexion root. Le port 22 est ouvert aux adresses IPv4/IPv6 : aucune restriction à une IP administrative fixe n’est actuellement appliquée, ce qui permet l’accès mobile. Fail2ban est actif. Les règles DOCKER-USER bloquent les autres ports entrants Docker, sauf 80 et 443.

La sauvegarde inclut `/srv/enistere/apps`, les quatre bases PostgreSQL et `postgres-globals.sql` (rôles et droits globaux, fichier sensible conservé dans le dépôt chiffré). La rétention est regroupée par hôte et étiquette, indépendamment des chemins temporaires. Restaurer les rôles avant les bases lors d’une reprise complète ; ne jamais appliquer les rôles de production sur un serveur actif pour un simple test.

Résultats de clôture au 19 septembre 2026 :

- les anciennes applications Cloudflare Access `db.enistere.com` et `backup.enistere.com` ont été supprimées ; le pare-feu réseau OVH n'est pas utilisé, le filtrage est assuré par UFW, Fail2ban et la chaîne `DOCKER-USER` de l'hôte ;
- la sauvegarde Restic couvre les quatre bases PostgreSQL, leurs rôles globaux, Redis, Grafana, Uptime Kuma, Portainer, R2, les manifestes, les scripts, les secrets protégés et les configurations système nécessaires ;
- R2 est copié en lecture seule, contrôlé après copie et limité à 20 Gio de transfert avec 30 Gio de réserve disque ; le bucket était vide pendant le test ;
- le test isolé restaure les quatre bases avec propriétaires et droits, charge le snapshot Redis et vérifie l'intégrité SQLite de Grafana et Kuma ainsi que l'archive Portainer ; résultat `RESTORE_TEST_OK` ;
- `enistere-restore-test.timer` programme ce contrôle chaque mois et publie la date de réussite dans Prometheus ;
- huit sondes privées complètent les healthchecks Docker chaque minute et alimentent les alertes Grafana, dont Keycloak sur son interface de gestion ;
- PostgreSQL et Redis rejoignent uniquement `enistere_data` ; les applications y accèdent directement et Traefik reste hors de ce réseau ;
- toutes les images de plateforme sont fixées par digest dans les manifestes ;
- la maintenance utilise le même verrou que les sauvegardes, nettoie `/var/lib/enistere-backup/staging` et exécute les sondes après nettoyage ; son test réel a réussi ;
- les interfaces administratives répondent via Cloudflare Access et refusent l'accès direct à l'origine ; la console Keycloak utilise `auth-admin.enistere.com` et `/admin/*` est absent du domaine public ;
- Keycloak commun, son compte permanent, l'issuer Karevo et les redirections Operations/Agency ont été validés ; la sauvegarde et la restauration isolée de `enistere_keycloak` ont réussi ;
- la première connexion à `auth-admin.enistere.com` a été confirmée ; `karevo-bootstrap` est désactivé et son secret d'amorçage a été supprimé ;
- sept cibles Prometheus et sept sondes Uptime Kuma étaient opérationnelles lors de la vérification finale ; la sonde d'identité porte le nom `Enistere Auth`.
