# ADR-095 — E1 Kernel Façade : chaîne de compilation native et catalogue d'extensions en données

- Statut : Accepté
- Date : 2026-09-25
- Décideur : responsable du projet (choix « chaîne complète » et plan de mission E1 approuvés le 2026-09-25)
- Sources : document 03 (Engine / Compilation Runtime, phase PLAN, TA-02, TA-04, TA-10), document 06 §6.8
  (E1–E3), ADR-092, ADR-094

## Contexte

La gate E1 du document 06 (« CLI/test via validate-resolve-plan ; legacy déterministe identique ») supposait
un pipeline historique à envelopper. L'ADR-094 l'a supprimé. Le document 03 décrit la chaîne cible de la
phase PLAN : System Closure → System IR → ResolvedSystem → ExecutionPlan, déterministe et sans écriture.
Aucun adapter n'existe avant l'Adapter Protocol (E2).

## Décision

1. **Chaîne native dans le Kernel** (`kernel/compiler`, `@enistere/foundation-kernel-compiler`) :
   - *System Closure* : fermeture transitive des références épinglées de la System Definition en vigueur
     (A1, A2, A3, A5), versions du compiler et digest du catalogue ; Change Requests et Evidence exclus ;
   - *System IR* : normalisé (trié, défauts explicites, items de domaine épinglés), indépendant de l'ordre
     d'écriture ;
   - *Résolution* contre un **catalogue d'extensions déclaré en données** (adapters de runtime par kind de
     composant, fournisseurs de capabilities par runtime), vide par défaut ; préférences essayées dans
     l'ordre déclaré, repli tracé, UNSUPPORTED explicite ; un catalogue ambigu (chevauchement) est refusé ;
   - *ExecutionPlan* agnostique : `MATERIALIZE`, `CONNECT_EXTERNAL` (composant EXTERNAL : jamais
     matérialisé), `BIND_CAPABILITY`, `ownerWork`, obligations de preuve ; aucun artefact de fichier avant E2.
2. **Façade** `createKernelFacade()` : `validate`, `resolve`, `plan`, sans état ; résultats JSON
   déterministes ; un ensemble ou un catalogue invalide n'est jamais résolu ; statut PARTIAL dès qu'un
   élément est UNSUPPORTED, élément toujours listé.
3. **Surface** `surfaces/cli` (`enistere-foundation`) : lecture de fichiers et codes de sortie uniquement.
4. **Gate E1 redéfinie** (remplace « legacy déterministe identique ») : CLI et tests via
   validate → resolve → plan ; mêmes entrées → mêmes octets (quel que soit l'ordre des documents) ;
   UNSUPPORTED explicite ; aucun nom de framework dans le Kernel (test TA-04) ; golden Asteria compilé de
   bout en bout.
5. **Conséquences sur la séquence** : E2 transforme les manifests d'adapter en descripteurs du catalogue et
   ajoute MATERIALIZE/VERIFY réels ; E3 se recentre sur le Domain IR et l'enrichissement de l'IR (le pont
   System Definition → IR de base est livré par E1).

## Conséquences

- Les codes `CATALOG_*`, `RESOLVE_*` et `FACADE_*` rejoignent le registre unique de diagnostics ; couches
  `kernel.compiler` et `kernel.facade`.
- Le golden Asteria gagne `sources/catalog.json` (catalogue **synthétique**, sans adapter réel) et
  `expected/compilation.json` (résultat de `plan`, identique à la sortie de la CLI).
- Limites connues : pas de politique d'organisation appliquée à la résolution (runtimes autorisés par le
  contexte effectif : E6), pas de compatibilité de versions entre extensions (E2), pas de Domain IR (E3).
- Document 06 §6.8 (gate E1, périmètre E3) révisé en v1.1, modifications suivies à accepter (ARB-12).
