# Arbitrages en attente — propositions

> Points qui exigent une validation humaine (document 05 §2F). Pour chacun : le constat prouvé, les
> options (méthode KEEP / ADAPT / EXTRACT / REPLACE / RETIRE, document 05 §7.3), la recommandation et
> ce qu'elle débloque. Une décision prise est reportée dans un ADR et dans [`DECISIONS.md`](../../DECISIONS.md),
> puis la ligne passe en « Tranché ». Ouvert le 2026-09-25, après E0 ; ARB-01 à ARB-06 tranchés le même
> jour ([ADR-093](../adr/ADR-093-r0c-repository-realignment.md)). ARB-07 et ARB-10 tranchés par la mission R0-D ([ADR-094](../adr/ADR-094-clean-slate.md)). **Restent ouverts : ARB-08, ARB-09, ARB-11 et ARB-12.**

## Synthèse

| # | Sujet | Recommandation | Propriétaire | Statut |
|---|---|---|---|---|
| ARB-01 | Validation du gate E0 (P1–P10) | Accepter la décomposition d'ADR-092 | Produit / Pilotage | Tranché — accepté (ADR-093) |
| ARB-02 | Place de la mission de nettoyage dans la séquence | Insérer **R0-C — Realignment** entre E0 et E1 | Produit / Pilotage | Tranché — R0-C avant E1 (ADR-093) |
| ARB-03 | Profondeur du nettoyage | Retrait/archivage des actifs morts ou non conformes + réorganisation progressive par mission ; pas de suppression du code prouvé avant E10 | Technique | Tranché — niveaux 1+2 (ADR-093) |
| ARB-04 | Nommage : dépôt, packages, domaines | Renommer le dépôt maintenant ; packages au fil des migrations ; domaines par ADR au 1er déploiement | Direction + plateforme | Tranché — proposition complète (ADR-093) |
| ARB-05 | Staging et publication d'images du laboratoire (`deployment/`, `registry-ci.yml`) | Archiver le staging non conforme ; suspendre la publication GHCR | Plateforme | Réalisé dans R0-C (ADR-093) |
| ARB-06 | Runtime IA du laboratoire (`factory/ai`) | Archiver prompts et registre ; conserver les primitives testées (rédaction, citations) comme candidates à l'AI Gateway | Technique | Réalisé dans R0-C (ADR-093) ; primitives supprimées avec l'itération précédente (ADR-094) |
| ARB-07 | Sept starters dans la CI | Conserver les sept comme *reference extensions* ; aucune nouvelle capacité par runtime avant E2 | Produit | Tranché autrement — starters supprimés, runtimes réécrits comme adapters (ADR-094) |
| ARB-08 | Corrections du document 05 (Ubuntu, RabbitMQ) | Document 05 renvoie à Server Prod pour les faits d'infrastructure | Gouvernance | Ouvert |
| ARB-09 | Livrables manquants du document 04 (`design-tokens.json`, maquettes) | Les fournir avant toute mission Workbench/design (E6, V1) | Design UX UI | Ouvert |
| ARB-10 | Réécriture d'`AGENTS.md` et archivage de `MANDAT.md` | Valider par la revue de la PR de la mission E0 | Gouvernance | Tranché — PR #252 mergée ; règle du laboratoire remplacée par ADR-094 |
| ARB-11 | Checks requis du ruleset `protect-main` | Remplacer les huit checks de l'ancienne CI par `kernel`, `secret-scan`, `docs`, `audit` | Responsable (GitHub) | Ouvert — bloque tout merge |
| ARB-12 | Passages du dossier contredits par ADR-094 | Réviser 03 §6.11 et 06 §4.6, §4.7, §6.8 (E1, E10), gate R0 | Gouvernance | Ouvert |

---

## ARB-01 — Gate E0 (P1–P10)

- **Constat** : le document 06 exige « P1–P10 PASS » sans les définir ; le brief E0 (n° 28) n'est pas
  dans le dossier. ADR-092 en propose dix, tous PASS avec preuves (`CURRENT_STATE.md`).
- **Options** : (a) accepter la proposition ; (b) l'amender ; (c) fournir le brief n° 28 d'origine.
- **Recommandation** : (a), ou (c) si le brief existe — il fait alors foi.
- **Débloque** : le passage formel à E1 (ou à R0-C si ARB-02 est retenu).

## ARB-02 — Séquence : quand nettoyer ?

- **Constat** : document 06 §6.8 : « E0 PASS ; seule suite autorisée : E1 ». Document 06 §4.6 : le
  laboratoire reste couche de compatibilité jusqu'au cutover E10. Votre demande : un dépôt
  « complètement orienté vers la nouvelle vision » après E0.
- **Options** :
  - (a) **R0-C — Repository Realignment** comme mission courte et bornée entre E0 et E1 ;
  - (b) nettoyage réparti dans E1 → E3 (chaque mission retire ce qu'elle remplace) ;
  - (c) nettoyage reporté après E10, conformément à la lettre du document 06.
- **Recommandation** : (a) pour tout ce qui est mort, trompeur ou non conforme (ARB-03 niveau 1),
  puis (b) pour le code qui a une valeur de preuve. Changer l'ordre des missions exige votre validation
  (document 05 §2F) ; l'ADR correspondant sera rédigé à la décision.

## ARB-03 — Profondeur du nettoyage

Inventaire au 2026-09-25 (fichiers suivis) : `factory/` 161 · `starters/` 619 (7 runtimes) ·
`capabilities/` 611 · `packages/` 168 · `contracts/` 13 · `deployment/` 23 · `examples/` 7 ·
docs du laboratoire ≈ 45 · 58 fichiers portant encore « Enistere OS ».

| Niveau | Contenu | Risque | Classement |
|---|---|---|---|
| **1 — Mort ou trompeur** | Registre de prompts IA : 12 références vers des documents inexistants ; rapports d'exécution du staging (`deployment/docs/CC10_*`, `CC11_*`, `STAGING_*_REPORT`) ; `factory/templates/` (doublons des gabarits ADR/README) ; `docs/examples/reference-systems/` (profils du laboratoire présentés comme exemples cibles) ; « Enistere OS » dans la doc active ; glossaire et onboarding du laboratoire | Nul : aucun test n'en dépend, ou l'ajustement est trivial | RETIRE (archive) / REPLACE (glossaire, onboarding) |
| **2 — Non conforme** | `deployment/staging/*.yml` : réseau `web`, résolveur `le`, PostgreSQL et MinIO embarqués — contraire à Server Prod (réseaux `enistere_*`, DNS-01, services partagés) ; `registry-ci.yml` publie des images GHCR du laboratoire | Faible : aucune production ne l'utilise | RETIRE (archive) ou ADAPT à la mission de premier déploiement |
| **3 — Réorganisation vers la structure cible** (document 03 §6.19) | `starters/` → `extensions/runtimes/`, `capabilities/` → `extensions/capabilities/`, `factory/` → `engine/` ou `legacy/` | Moyen : chemins codés dans les tests, fitness functions, workflows ; document 05 §7.2 interdit la réforme « pour renommer des dossiers » | EXTRACT au fil de E1 (façade), E2 (adapters), E3 (IR) |
| **4 — Suppression du code prouvé** | Pipeline Blueprint → CSM, starters, capabilities | Élevé : perte de preuves et de goldens avant qu'un remplaçant existe | RETIRE uniquement après E10 (document 06 §4.6) |

- **Recommandation** : niveaux 1 et 2 dans R0-C ; niveau 3 mission par mission, chacune avec son seam
  et ses preuves ; niveau 4 après E10. Aller au-delà (niveau 3 ou 4 immédiat) est possible, mais c'est
  une dérogation au document 06 qui exige un ADR signé par vous.

## ARB-04 — Nommage

- **Constat** : convention §2G (`enistere-foundation`, `@enistere/foundation-*`,
  `*.foundation.enistere.com`) ; dépôt GitHub `enistere-os-foundation` ; packages `@enistere/api-contracts`,
  `@enistere/ui-kit`, `@enistere/api-client-fetch`, `@enistere/web-nextjs`.
- **Proposition** :
  1. renommer le dépôt GitHub en `enistere-foundation` maintenant (action de votre part ; GitHub
     conserve la redirection) ;
  2. renommer chaque package du laboratoire au moment où une mission le migre (pas de renommage global) ;
  3. confirmer les domaines par ADR lors de la première mission de déploiement, après vérification de la
     couverture de certificat edge pour les noms à plusieurs niveaux (ex. `api.foundation.enistere.com`) ;
  4. realm Keycloak `foundation` sur le fournisseur commun.

## ARB-05 — Staging et images du laboratoire

- **Constat** : voir ARB-03 niveau 2 ; `deployment/DEPLOYMENT_SPECIFICATION.md` se déclare
  « spécification canonique de la livraison opérationnelle » alors que Server Prod fait autorité.
- **Options** : (a) archiver le staging et suspendre la publication GHCR ; (b) le mettre en conformité
  maintenant ; (c) conserver en l'état.
- **Recommandation** : (a). Aucun service Foundation n'est déployable ; la mise en conformité se fera
  avec le premier vrai service (Control Plane, V2) en suivant `PRODUCTION_READINESS.md`.

## ARB-06 — Runtime IA du laboratoire

- **Constat** : `factory/ai` (44 fichiers) : prompts de génération de starters et registre pointant vers
  des documents supprimés ; primitives utiles et testées (rédaction de secrets, citations de sources,
  harnais d'évaluation, fournisseur factice).
- **Recommandation** : archiver prompts et registre ; conserver les primitives comme candidates à
  extraction dans l'AI Gateway / Agent Runtime (CAP-11), avec leurs tests.

## ARB-07 — Starters et CI

- **Constat** : 7 runtimes, 4 workflows spécifiques. Document 06 §4.7 : pas de parité artificielle sur
  sept runtimes en premier ; ils deviennent des *reference extensions*.
- **Recommandation** : les conserver tous, testés, sans nouvelle fonctionnalité par runtime avant E2 ;
  E2 enveloppe NestJS, E8 prouve la substitution.
- **Résolution** (ADR-094) : l'itération précédente n'ayant jamais été en production, les starters sont
  supprimés ; E2 écrira un premier adapter sur le nouveau protocole, sans héritage.

## ARB-08 — Document 05

- **Constat** : Ubuntu 24.04 (doc 05) contre 26.04.1 LTS (Server Prod) ; RabbitMQ partagé cité par le
  doc 05, absent de l'architecture de production.
- **Recommandation** : à la prochaine révision, le document 05 renvoie à Server Prod pour tous les faits
  d'infrastructure ; RabbitMQ n'est utilisé qu'après ADR et provisionnement réel.

## ARB-09 — Document 04

- **Constat** : `design-tokens.json` et le dossier `mockups` cités par le document 04 sont absents.
- **Recommandation** : les déposer dans `docs/design/` ; non bloquant avant E6.

## ARB-10 — Gouvernance des agents

- **Constat** : `AGENTS.md` a été réécrit et `MANDAT.md` archivé à votre demande (ADR-091).
- **Recommandation** : valider par la revue de la PR E0.
- **Résolution** : PR #252 mergée ; la règle « laboratoire = couche de compatibilité » d'`AGENTS.md` est
  remplacée par « une implémentation par concept, dans le Kernel » (ADR-094, plan R0-D approuvé).

## ARB-11 — Ruleset `protect-main`

- **Constat** : les huit checks requis (`api-contracts`, `api-client-fetch`, `ui-kit`, `web-nextjs`,
  `audit`, `api-runtime`, `web-e2e`, `api-smoke`) venaient de workflows supprimés par l'ADR-094. Seul
  `audit` existe encore, sous le même nom. Une PR attend les autres indéfiniment.
- **Recommandation** : dans *Settings → Rules → protect-main*, exiger `kernel`, `secret-scan`, `docs` et
  `audit` (noms des jobs de `ci.yml`). Aucun agent n'a les droits pour le faire.

## ARB-12 — Dossier 03 et 06

- **Constat** : ADR-094 (repartir propre) contredit document 03 §6.11 (starters en reference
  extensions) et document 06 §4.6, §4.7, §6.8 (gate E1 « legacy déterministe identique », E10
  « legacy → compatibility/import ») et la gate R0 (« goldens legacy préservés »).
- **Recommandation** : réviser ces passages dans les `.docx` ; d'ici là, ADR-094 prévaut par décision
  explicite du responsable.
