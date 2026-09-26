# ADR-098 — A8 MaterializationRecord et proof chain v1

- Statut : Accepté
- Date : 2026-09-26
- Décideur : responsable du projet (plan de mission E4 approuvé ; choix « nouveau contrat A8 » et
  « JSON auto-porteur »)
- Sources : document 06 v1.1 §6.8 (E4 : owner change survit ; proof chain exportable) ; document 03 v1.1
  (MATERIALIZE, VERIFY, ownership) ; ADR-092 (A1–A7), ADR-096 (Adapter Protocol v0), ADR-097

## Contexte

Depuis E2, ce qu'une matérialisation a écrit n'était tracé que par un fichier local
`.foundation/inventory.json`, hors du modèle de contrats, et les EvidenceRecords de VERIFY ne formaient
pas une chaîne vérifiable hors du dépôt. Deux représentations de « ce qui a été écrit » auraient coexisté
si l'on avait ajouté un record à côté de l'inventaire.

## Options

- Place du record : **nouveau contrat A8** (retenu) ou extension d'A7 (mélange « ce qui a été écrit » et
  « ce qui a été vérifié »).
- Format d'export : **JSON auto-porteur** (retenu) ou enveloppe in-toto/SLSA d'emblée (dépendance au
  format et à la signature avant d'en avoir besoin).

## Décision

1. **A8 `MaterializationRecord`** (`kernel/contracts`) : contrat de première classe, classe RECORD, plan
   Evidence, statuts `VALID | SUPERSEDED`. Spec : `system`, `subject` (System Definition épinglée,
   composant), digests de `closure` et de `plan`, `adapter { id, version }`, `producedBy`, `outcome`
   (`APPLIED | CONFLICT`), `executedAt` (injecté), `files [{ path, ownership, digest, decision }]`.
   Autorité : COMPILE_APPLY par le compilateur (`origin: COMPILER`) ; une IA ou un autre acteur est
   refusé (`AUTHORITY_AI_CANNOT_APPLY`, `AUTHORITY_ACTOR_CANNOT_APPLY`). Règles : chemins sûrs et uniques,
   décisions cohérentes avec l'outcome, fichier owner-seeded jamais UPDATE ni CONFLICT, composant existant
   dans la SD référencée. La baseline passe de sept à **huit contrats** ; A8 réutilise tout le socle E0
   (schéma, registre, digest, références épinglées, ensemble fermé, migrations).
2. **Une implémentation par concept** : l'inventaire local disparaît. Le dernier A8 du composant
   (`<composant>/.foundation/records/`, une révision par matérialisation, `supersedes` vers la
   précédente) est l'unique inventaire d'ownership lu par `decideWrite` et par VERIFY. Un composant en
   conflit n'est pas écrit ; son record CONFLICT est retourné, non stocké. `isSafeArtifactPath` est
   déplacé dans `kernel/contracts` (réexporté par `kernel/extensions`).
3. **A7 cite A8** : chaque EvidenceRecord de VERIFY place l'A8 vérifié, épinglé, dans `inputs`.
4. **Proof chain v1** (`kernel/compiler/src/proof-chain.ts`) : bundle JSON
   `foundation.enistere.com/proof-chain/v1` — contrats de la closure de référence (documents complets),
   catalogue d'extensions, digests closure/IR/resolved/plan, A8, A7, digest JCS du contenu.
   `verifyProofChain` ne réimplémente rien : digest, `validateContractSet` sur l'ensemble fermé,
   **rejeu** de la compilation par la façade (mêmes digests), chaque A8 VALID décrit cette compilation,
   chaque A7 de composant cite un A8 du bundle. Codes `PROOF_*`.
5. **Surfaces** : CLI `export` et `verify-bundle` (0 = VALID, 1 = INVALID) ; le job CI `adapters` exporte
   et vérifie le bundle réel et le publie en artefact. Signature et enveloppe in-toto/SLSA pourront
   envelopper le bundle plus tard sans en changer le contenu.

## Conséquences

- Gate E4 : owner change survit (test « an owner change survives a new adapter version » : adapter v1 →
  modification de l'équipe → adapter v2 : UPDATE des fichiers compiler-owned, KEEP_OWNER du fichier de
  l'équipe, A8 rév. 2 supersedes rév. 1) ✔ ; proof chain exportable et vérifiable hors du dépôt (golden
  `expected/proof-chain.json`, CLI, job CI) ✔.
- Les workspaces matérialisés avant E4 (inventaire) ne sont pas repris : aucun n'existe hors des tests
  (ADR-094, aucune production).
- Limites : pas de signature ni d'enveloppe in-toto/SLSA ; pas d'Evidence Graph ni de proof profiles
  (V1+) ; le bundle ne contient pas les fichiers matérialisés, seulement leurs digests.
