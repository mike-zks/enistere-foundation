# Restauration de base de données — squelette

**Statut : non applicable** (Foundation ne possède encore aucune base). Procédure attendue, conforme à
[`PROCEDURE.md`](../Server%20Prod/PROCEDURE.md) §5 et « Pilotage PostgreSQL et Redis » :

1. Sélectionner le snapshot Restic (rétention 7 quotidiennes / 4 hebdomadaires / 6 mensuelles).
2. Restaurer le dump sous `/srv/enistere/restore/<date>` — **jamais** directement dans
   `/srv/enistere/data/postgres`.
3. Lors d'une reprise complète, restaurer les rôles globaux avant les bases ; ne jamais appliquer les
   rôles de production sur un serveur actif pour un simple test.
4. Démarrer une instance PostgreSQL temporaire isolée, importer, contrôler bases et données.
5. Planifier séparément la bascule, dans une transaction contrôlée et tracée.
6. Supprimer l'environnement temporaire ; consigner snapshot, écarts et opérateur.

Une sauvegarde n'est opérationnelle qu'après une restauration réelle démontrée (critère PR-06).
