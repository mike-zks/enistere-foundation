# ADR-096 — Adapter Protocol v0 et premier adapter NestJS

- Statut : Accepté
- Date : 2026-09-25
- Décideur : responsable du projet (plan de mission E2 approuvé : NestJS, Authority API seule, VERIFY
  structurel + toolchain)
- Sources : document 03 v1.1 §6.10–6.11, §6.18–6.19, TA-04, TA-06, TA-10 ; document 02 FR-OWN-02 ;
  document 06 v1.1 §6.8 (E2) ; ADR-094, ADR-095

## Contexte

E1 résout les composants contre un catalogue d'extensions déclaré en données, sans adapter réel. E2 doit
prouver le protocole d'adapter (DESCRIBE → VALIDATE INTENT → RESOLVE → PLAN → MATERIALIZE → VERIFY) avec
un premier runtime, écrit de zéro.

## Décision

1. **Contrat dans le Kernel** (`kernel/extensions`) : schéma `adapter-manifest.v0` (protocole
   `foundation.enistere.com/adapter-protocol/v0`), validé par l'interpréteur de schémas du Kernel
   (`jsonSchemaDiagnostics`) ; conversion des manifests en descripteurs du catalogue E1, validés par
   `validateCatalog` (validateur unique) ; interface `RuntimeAdapter` (`describe`, `validateIntent`,
   `plan`, `toolchainChecks`) sans I/O ; `planArtifacts` (chemins relatifs sûrs, digests, ownership bornée
   par la classe du composant : un composant OWNER_MANAGED n'est que *seedé*) ; règle pure `decideWrite`.
2. **Ownership** (FR-OWN-02) : un fichier COMPILER_OWNED est créé, mis à jour s'il est tel que le
   compiler l'a écrit, sinon **conflit** — jamais écrasé ; un fichier OWNER_SEEDED est créé une fois puis
   appartient à l'équipe. Un composant en conflit n'est pas écrit du tout (pas d'application partielle).
   Chaque composant matérialisé porte un inventaire `.foundation/inventory.json`.
3. **Engine** (`engine/materializer`) : hôte d'extensions (découverte des manifests, chargement par
   `entry`, jamais par import nommé) ; v0 n'exécute que le mode `TRUSTED_IN_PROCESS` — les autres modes
   sont UNSUPPORTED explicites en attendant les Workers ; une identité contredisant le manifest est une
   violation de contrat. MATERIALIZE n'accède pas au réseau.
4. **VERIFY** : checks déclarés par le manifest, ordonnés du prérequis au dépendant. STRUCTURAL
   (inventaire ↔ fichiers) en processus ; TOOLCHAIN (commandes sans shell, timeout, environnement réduit
   à une liste blanche, aucun secret) sur demande. Un check après un échec est INCONCLUSIVE. Chaque
   résultat est un EvidenceRecord A7 (`producedBy: CHECKER`), validé par `validateContract`.
5. **Premier adapter** `extensions/runtimes/nestjs` : kind `api-service`, NestJS 12 (ESM), versions
   exactes, `GET /health`, configuration par variables d'environnement, image non-root, point
   d'extension `src/extension/**` owner-seeded. Checks : structure, install, build, boot (`/health` = 200),
   audit (aucune vulnérabilité haute).
6. **Sens des dépendances** (document 03 §6.19), vérifié par test : Kernel → rien ; Engine → Kernel ;
   extensions → Kernel ; surfaces et goldens → Kernel et Engine. Le golden devient un workspace
   (`goldens/`), pour que les tests du Kernel ne dépendent pas de l'Engine.
7. **CI** : job `adapters` (matérialisation du golden Asteria puis `verify --toolchain`, EvidenceRecords
   publiés en artefact).

## Conséquences

- Gate E2 : discovery, resolve, plan, materialize et verify par manifest ✔ ; aucune capability perdue —
  authentication, authorization et files de l'Authority API sont listées UNSUPPORTED ✔ ; aucun nom de
  framework dans le Kernel ni l'Engine (tests TA-04) ✔ ; preuve BOOTABLE par le job `adapters`.
- Limites connues : pas de lockfile généré (l'installation résout les versions exactes déclarées, pas
  les dépendances transitives) ; pas de signature ni provenance des extensions (TA-06, V2+) ; pas
  d'isolation process/conteneur (Workers) ; pas de domaine (E5) ni de capabilities (adapters de
  capability) ; l'Async Worker reste UNSUPPORTED.
- **Action humaine** : ajouter `adapters` aux checks requis du ruleset `protect-main`.
