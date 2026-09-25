# Runbooks

Index des runbooks d'exploitation (document 05 §2D). Les runbooks de production s'appuient sur
[`docs/Server Prod/PROCEDURE.md`](../Server%20Prod/PROCEDURE.md), qui fait autorité pour la plateforme
partagée ; ils ne la recopient pas.

| Runbook | Objet | Statut |
|---|---|---|
| [`LOCAL_DEVELOPMENT.md`](LOCAL_DEVELOPMENT.md) | Installer, tester, régénérer le golden | Actif |
| [`DEPLOYMENT.md`](DEPLOYMENT.md) | Déployer un service Foundation sur l'hôte partagé | Squelette — aucun service déployable |
| [`ROLLBACK.md`](ROLLBACK.md) | Revenir aux manifestes et digests précédents | Squelette |
| [`DATABASE_RESTORE.md`](DATABASE_RESTORE.md) | Restaurer PostgreSQL en instance isolée | Squelette |
| [`SECRET_ROTATION.md`](SECRET_ROTATION.md) | Faire tourner un secret sans l'exposer | Squelette |

Un squelette décrit la procédure attendue et renvoie à la procédure de production ; il ne vaut pas preuve
d'exploitation. Chaque runbook de production devra préciser : architecture déployée, DNS, réseaux,
secrets **par nom**, commandes de vérification, sauvegarde, restauration, rotation, rollback, contacts
d'alerte.
