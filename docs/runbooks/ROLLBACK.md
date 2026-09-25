# Rollback — squelette

**Statut : non applicable** (aucun service déployé). Procédure attendue, conforme à
[`POLITIQUE.md`](../Server%20Prod/POLITIQUE.md) (« CI/CD et promotion », étape 10) :

1. Restaurer les manifestes et les digests d'images précédents (jamais un tag mobile).
2. Si une migration a été appliquée : suivre sa stratégie de compatibilité ; une migration destructive
   exige une procédure de restauration approuvée **avant** le déploiement
   ([`DATABASE_RESTORE.md`](DATABASE_RESTORE.md)).
3. Redémarrer et attendre les healthchecks.
4. Vérifier depuis l'extérieur les routes critiques et OIDC.
5. Conserver le statut CI en échec et consigner la cause, le digest restauré et l'opérateur.

Le rollback doit être **exercé** avant l'admission en production (critère PR-10).
