# ADR-094 — Repartir propre : suppression de l'itération précédente

- Statut : Accepté
- Date : 2026-09-25
- Décideur : responsable du projet (décision explicite du 2026-09-25 ; plan de mission R0-D approuvé)
- Sources : document 03 §6.11, document 06 §4.6, §4.7, §6.8 (E1, E10) et tableau des gates R0 ;
  ADR-091, ADR-093
- Amende : ADR-091 (statut du laboratoire), ADR-092 (golden et pipeline historique), ADR-093 (niveau 4 du nettoyage), ADR-073 (emplacement du
  script d'allowlist)

## Contexte

Le dossier prévoyait une transition sans rupture : Blueprint, Canonical System Model et chemins
historiques servaient de couche de compatibilité jusqu'au cutover E10 (document 06 §4.6), les sept
starters devenaient des *reference extensions* (document 03 §6.11, document 06 §4.7), la gate E1 exigeait
un « legacy déterministe identique » et la gate R0 des « goldens legacy préservés ». L'ADR-093 avait
repoussé la suppression du code après E10.

Au démarrage d'E1, le responsable a constaté que cette approche faisait parler le produit en termes de
legacy alors que l'itération précédente (générateur `factory/`, 7 starters, capabilities auth/rbac/files,
packages, bindings `contracts/`, `deployment/`, `examples/`) **n'a jamais été en production ni utilisée**.
Il n'y a donc rien à préserver pour des utilisateurs, et garder cette base crée des doublons de logique
avec le Kernel : sérialisation canonique et digest, modèle de diagnostics, validation de schémas,
modèle de système (Blueprint + CSM vs System Definition), migrations, preuves de conformance vs
EvidenceRecord.

## Décision

1. **Suppression complète** de l'itération précédente, starters compris : `factory/`, `starters/`,
   `capabilities/`, `packages/`, `contracts/`, `deployment/`, `examples/`, `.dockerignore` et les
   workflows `api-runtime-ci`, `web-e2e-ci`, `registry-ci`, `factory-golden-runtime`, `web-angular-ci`.
   Le dernier état reste consultable dans l'historique Git au commit `f2590a8`, ancêtre de `main` : aucun
   tag n'est nécessaire tant que l'historique de `main` n'est pas réécrit (protégé par le ruleset).
2. **Une implémentation par concept, dans le Kernel.** Tout concept du produit (identité, digest,
   diagnostic, schéma, versionnement, modèle de système, preuve) a une seule implémentation, dans
   `kernel/`. Le golden Asteria ne dépend plus que du Kernel : la sonde `probeLegacy` et l'obligation
   `legacy-materialization` sont retirées (golden régénéré : 8 contrats, 9 EvidenceRecords). Le doublon
   interne de digest d'octets devient la primitive `fileDigest`. Un test interdit tout import hors de
   `kernel/` et `goldens/`.
3. **Outillage du dépôt conservé**, parce qu'il régit le dépôt et non le produit : `tools/quality/`
   (discipline de l'allowlist gitleaks, liens de documentation). L'allowlist gitleaks garde ses chemins
   historiques, car l'analyse couvre tout l'historique.
4. **CI minimale** : un seul `ci.yml`, quatre jobs requis — `kernel`, `secret-scan`, `docs`, `audit`.
   La PR #253 (refonte par périmètre de l'ancienne CI) est fermée sans merge.
5. **Documentation** : les ADR 001–090 (sauf ADR-073, toujours en vigueur), `specifications/`,
   `architecture/`, `checklists/`, `guides/` et `project-factory/` rejoignent
   `docs/archive/laboratory/`. Ils sont conservés comme histoire, sans valeur d'autorité ; leurs liens vers
   le code supprimé ne sont pas réécrits.
6. **E1 est à redéfinir** dans une mission séparée : sans pipeline historique à envelopper, la Kernel
   Façade s'appuiera sur une résolution native du Kernel. La gate « legacy déterministe identique » est
   caduque.

## Conséquences

- Le dépôt ne contient plus que le Kernel, le golden, l'outillage du dépôt et la gouvernance. Plus aucune
  génération de code n'est possible avant l'Adapter Protocol (E2) et un premier adapter, écrit sur le
  nouveau protocole sans rien hériter.
- Les capacités mesurées par le laboratoire (multi-runtime, capabilities, régénération, conformance) ne
  sont plus revendiquées : `IMPLEMENTATION_MATRIX.md` les ramène à TARGET.
- **Action humaine requise** : dans le ruleset `protect-main`, remplacer les huit checks requis
  (`api-contracts`, `api-client-fetch`, `ui-kit`, `web-nextjs`, `audit`, `api-runtime`, `web-e2e`,
  `api-smoke`) par `kernel`, `secret-scan`, `docs`, `audit`. Sans cela, aucune PR ne peut être mergée.
- **Mise à jour du dossier** (document 06 révisé en v1.1 par modifications suivies, à accepter par le
  responsable ; document 03 restant) : document 03 §6.11 (les
  starters ne deviennent plus des reference extensions) ; document 06 §4.6 (plus de couche de
  compatibilité), §4.7 (les sept runtimes seront réintégrés comme nouveaux adapters), §6.8 E1 (gate
  « legacy déterministe identique ») et E10 (plus de legacy à basculer), gate R0 (« goldens legacy
  préservés »). Jusqu'à cette mise à jour, le présent ADR prévaut sur ces passages, par décision
  explicite du responsable.
