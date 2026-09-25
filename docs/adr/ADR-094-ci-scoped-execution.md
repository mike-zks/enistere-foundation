# ADR-094 — CI par périmètre : exécuter sur une PR ce que la PR peut casser

- Statut : Accepté
- Date : 2026-09-25
- Décideur : Responsable du projet (demande du 2026-09-25 : « il y a trop de jobs »)
- Sources : document 06 §4.7 (pas de parité artificielle sur sept runtimes en premier), ADR-091, ADR-093
- Complète : ADR-013 (CI), ADR-073 (secret scanning)

## Contexte

Chaque PR déclenchait 47 jobs, quel que soit son contenu : 32 compositions `golden-runtime`, les
workflows runtime (NestJS, E2E Web, Angular, images) et une chaîne de quatre jobs de packages, chacun
refaisant `npm ci`. Une PR purement documentaire ou limitée au Kernel payait le même coût qu'un
changement de starter. Huit noms de checks sont exigés par le ruleset `protect-main` : les renommer ou
filtrer leur workflow bloquerait toute PR.

## Décision

1. **Périmètres déclarés** dans `factory/quality/ci-scopes.json` (préfixes de chemins) et évalués par
   `factory/quality/scripts/ci-scope.mjs` (testé) : `kernel`, `packagesWeb`, `apiRuntime`, `webE2e`,
   `registry`, `goldenRuntime`. Sur PR, un job dont le périmètre n'est pas touché est **sauté** par `if:`.
   GitHub traite un job sauté comme réussi pour un check requis : **aucun nom de check ne change**.
2. **Toujours exécutés** : `factory` (laboratoire + conformance), `secret-scan`, `audit` (son
   `needs: web-nextjs` n'imposait qu'un ordre et est retiré).
3. **Sécurité par défaut** : hors PR (push `main`, nuit, déclenchement manuel), tout s'exécute ; un diff
   inconnu ou vide active tout ; toute modification de la CI, du lockfile ou du `package.json` racine
   active tout.
4. **Golden runtime** : la liste des compositions vit dans `factory/quality/golden-runtime-matrix.json`.
   Sur PR touchant le laboratoire : sous-ensemble `pullRequest` (10 sur 32), qui couvre les 7 runtimes,
   les 3 capabilities, la preuve de démarrage des 3 API de base, la régénération par famille et le profil
   distribué. Un test impose que toute composition citée par une étape spécifique du workflow en fasse
   partie. La matrice complète `full` tourne sur push `main`, chaque nuit (03:17 UTC) et à la demande ;
   un test impose qu'elle contienne toutes les compositions.
5. `web-angular-ci.yml` (check non requis) utilise un filtre `paths` au niveau du workflow.

## Effet attendu (jobs démarrés par PR)

| Type de PR | Avant | Après |
|---|---|---|
| Documentation / gouvernance | 47 | 8 (dont 5 jobs de périmètre de quelques secondes) |
| Kernel E0 / golden Asteria | 47 | 9 |
| Starter NestJS | 47 | 24 |
| CI, lockfile ou `package.json` racine | 47 | 29 (golden : 10 compositions) |
| Push `main` | 47 | 52 (tout, + 5 jobs de périmètre) |

## Conséquences

- Une régression révélée seulement par une composition hors sous-ensemble est détectée au merge ou la
  nuit, pas sur la PR. Le sous-ensemble est ajustable par simple modification du JSON, sous test.
- Consolider la chaîne `api-contracts → api-client-fetch → ui-kit → web-nextjs` en un seul job réduirait
  encore le coût, mais renomme des checks requis : à faire avec une mise à jour du ruleset
  (action humaine), non réalisée ici.
