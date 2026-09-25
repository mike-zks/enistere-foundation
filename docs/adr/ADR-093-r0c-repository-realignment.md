# ADR-093 — Mission R0-C « Repository Realignment » entre E0 et E1, et nommage

- Statut : Accepté
- Date : 2026-09-25
- Décideur : Responsable du projet (arbitrages ARB-01 à ARB-04 du 2026-09-25)
- Sources : [`ARBITRATIONS.md`](../governance/ARBITRATIONS.md), document 05 §7, document 06 §4.6 et §6.8
- Complète : ADR-091, ADR-092

## Contexte

Après E0, le responsable du projet demande un dépôt entièrement orienté vers la vision Foundation. Le
document 06 n'autorise que E1 après E0 et maintient le laboratoire en couche de compatibilité jusqu'au
cutover E10. Les arbitrages ont été soumis avec options et recommandations.

## Décisions

1. **ARB-01** — La décomposition P1–P10 d'ADR-092 est acceptée : E0 est **PASS**.
2. **ARB-02** — Une mission **R0-C — Repository Realignment** est insérée entre E0 et E1. C'est une
   dérogation assumée à l'ordre du document 06 §6.8, limitée au nettoyage ; elle ne change aucun gate.
3. **ARB-03** — Profondeur retenue : niveaux 1 et 2.
   - Niveau 1 (mort ou trompeur) : archivage des prompts IA du laboratoire, de leur registre (12
     références mortes), de leur gouvernance et de leur guide d'usage ; des gabarits `factory/templates/` ;
     des exemples de profils `docs/examples/reference-systems/` ; du glossaire et de l'onboarding du
     laboratoire, remplacés par des versions Foundation ; retrait de « Enistere OS » de la documentation
     active (les ADR historiques et le CHANGELOG restent inchangés).
   - Niveau 2 (non conforme à la production Enistere) : archivage de `deployment/staging/` et
     `deployment/docs/` ; suspension de la publication GHCR (`registry-ci.yml` ne tourne plus qu'en PR, en
     lecture seule) ; `DEPLOYMENT_SPECIFICATION.md` subordonnée à `docs/Server Prod/`.
   - Niveau 3 (réorganisation vers la structure cible) : mission par mission (E1 → E3), chacune avec son
     seam et ses preuves. Niveau 4 (suppression du code prouvé) : après E10.
4. **ARB-04** — Nommage : le dépôt GitHub est renommé `enistere-foundation` par le responsable ; les
   packages du laboratoire prennent le préfixe `@enistere/foundation-*` lors de leur migration ; les
   domaines `*.foundation.enistere.com` sont confirmés par ADR au premier déploiement ; le realm Keycloak
   sera `foundation`.
5. ARB-05 et ARB-06 sont réalisés comme sous-ensemble du niveau 1–2 retenu. ARB-07 à ARB-10 restent
   ouverts avec leur recommandation.

## Conséquences

- Aucun code prouvé n'est supprimé ; toutes les suites du laboratoire restent vertes.
- La prochaine mission après R0-C est E1.
- Toute réintroduction d'une publication d'images passe par `PRODUCTION_READINESS.md`.
