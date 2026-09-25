# Rotation de secret — squelette

**Statut : non applicable** (aucun secret Foundation n'existe). Règles applicables dès le premier
secret (document 05 §2B, [`POLITIQUE.md`](../Server%20Prod/POLITIQUE.md) « Identité et secrets ») :

- Les secrets vivent dans des fichiers protégés lisibles uniquement par le service concerné ; jamais dans
  une commande, une variable imprimée, un manifeste Git, une image, un journal CI ou une Evidence.
- Chaque client OIDC confidentiel du realm `foundation` possède son propre secret, jamais réutilisé entre
  projets, environnements ou clients.
- Les identités de base de données sont séparées par usage (migration, application, worker, sauvegarde).

## Procédure attendue

1. Générer le nouveau secret dans le fournisseur (Keycloak, PostgreSQL, R2...) sans l'afficher.
2. Déposer le fichier protégé sur l'hôte avec des droits minimaux.
3. Redéployer le service consommateur par la CI (digests inchangés) et vérifier healthchecks et parcours
   dépendant du secret (ex. connexion OIDC complète).
4. Révoquer l'ancien secret ; vérifier qu'il est refusé.
5. Consigner la rotation (secret **par nom**, date, opérateur) ; un secret exposé se traite par rotation,
   jamais par une exception de scan.
