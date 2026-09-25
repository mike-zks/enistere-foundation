# Déploiement — squelette

**Statut : non applicable.** Aucun service Enistere Foundation n'est déployable à ce jour. Ce squelette
fixe la procédure attendue ; il sera complété par la première mission qui produit un processus long, et
validé contre [`PRODUCTION_READINESS.md`](../governance/PRODUCTION_READINESS.md).

## Procédure attendue (résumé de [`PROCEDURE.md`](../Server%20Prod/PROCEDURE.md) §3)

1. PR verte : formatage, lint, typecheck, tests, contrats, migrations depuis une base vierge, build,
   audit des dépendances, recherche de secrets.
2. Tag protégé sur un commit vert ; workflow de publication distinct de la validation.
3. Construction et publication des images **une seule fois** ; capture des digests.
4. Sauvegarde des données et manifestes concernés.
5. Validation du manifeste rendu, sans valeur secrète.
6. Téléchargement des images par digest sous `/srv/enistere/apps/foundation`.
7. Migrations en tâche ponctuelle.
8. Démarrage et attente des healthchecks.
9. Tests externes : TLS, routes critiques, OIDC (realm `foundation`), redirections.
10. Vérification métriques, journaux, alertes ; preuves attachées à la livraison.

En cas d'échec : [`ROLLBACK.md`](ROLLBACK.md), statut CI en échec conservé.

## À compléter

Architecture déployée, DNS (après ADR), réseaux Docker, secrets par nom, limites de ressources,
commandes de vérification, contacts d'alerte.
