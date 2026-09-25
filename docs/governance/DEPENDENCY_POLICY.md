# Politique de dépendances

Politique opérationnelle subordonnée à [`SOURCE_OF_TRUTH.md`](SOURCE_OF_TRUTH.md). Elle ne définit ni
l'architecture ni le modèle de composition : elle fixe les règles applicables aux dépendances de la
Foundation et des systèmes générés.

## Règles

- Utiliser les versions stables compatibles, vérifiées lors de chaque upgrade planifié.
- Verrouiller les résolutions par lockfile et conserver des installations reproductibles.
- Ajouter une dépendance uniquement si elle réduit un risque ou remplace une implémentation complexe.
- Préférer les bibliothèques officielles et maintenues pour la sécurité, les protocoles et les formats.
- Une capability déclare ses dépendances par target ; la composition les fusionne sans doublon.
- Les packages Enistere suivent SemVer et sont testés depuis leur artefact distribué.
- Les audits ne sont jamais désactivés pour rendre une CI verte.

## Invariant d'autonomie

> Aucun système généré ne dépend de `file:`, `npm link` ou d'un chemin vers la Foundation publiée.

Un système généré doit s'installer et démarrer sans le dépôt Foundation. L'invariant sera rendu
exécutable par la mission qui introduira la matérialisation (Adapter Protocol, E2) ; aucun test ne le
vérifie aujourd'hui, faute de génération (ADR-094).

## Upgrades majeurs

Un upgrade majeur est une mission dédiée : matrice de compatibilité, migration, tests des runtimes et
preuve sur au moins un golden.
