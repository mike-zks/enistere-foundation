# ADR-090 — Le design partagé est un contrat polyglotte, pas une bibliothèque universelle de composants

- Statut : Validé, bindings consommés ; parité UX ouverte
- Date : 2026-08-09
- Décideur : Owner Foundation
- Complète : ADR-008, ADR-009, ADR-010 et ADR-088

## Contexte

L'[étude UI/UX multi-runtime](../audits/UI_UX_MULTI_RUNTIME_STUDY_2026-08-09.md)
a exécuté les suites des quatre familles clientes. Next.js consomme directement
`@enistere/ui-kit`, qui mélange tokens neutres et 19 composants React DOM.
Angular, React Native et Flutter copient ou adaptent des valeurs sans source
exécutable commune. Leurs tests verts ne prouvent ni la parité des états UX, ni
un thème institutionnel dynamique.

Faire du package React la référence limiterait Angular et Flutter et donnerait
à l'axe Next.js/React Native un statut privilégié contraire à la parité des
familles.

## Décision

La source commune est le contrat logique décrit par la
[spécification design/expérience](../specifications/DESIGN_EXPERIENCE_SPECIFICATION.md)
et matérialisé sous `contracts/design/`.

Il sépare :

1. les tokens sémantiques et patterns UX observables ;
2. les `ThemePack` institution/contexte validés ;
3. les bindings de données CSS, TypeScript et Dart ;
4. les composants idiomatiques appartenant à chaque runtime.

La résolution d'un thème suit un couple institution/contexte enregistré, un
fallback déterministe et la préférence de mode autorisée. Aucun contenu distant
ou exécutable n'entre dans un ThemePack v1. La sélection visuelle ne décide
jamais de l'identité, du tenant ou d'une permission.

La partie React DOM actuelle de `@enistere/ui-kit` est classée comme binding Web
historique. Son éventuelle séparation ou son renommage relève d'une migration,
pas de la définition du contrat neutre.

## Première tranche exécutée

Deux JSON Schemas fermés sont évalués par le validateur autonome de la Factory et
croisés avec Ajv. Deux packs de fixture portent les mêmes 19 clés en modes light
et dark, mais des identités distinctes. Le registre refuse collisions de
sélecteur, cycles de fallback, propriétés exécutables, assets distants, chemins
remontants et clés manquantes.

Un resolver prouve les sélections explicite, institution/contexte, contexte par
défaut et fallback global. Un générateur déterministe émet CSS, données
TypeScript et Dart avec un digest commun. Le contrôle de dérive est intégré aux
quality gates et à la CI.

## Tranche de migration exécutée

Le générateur matérialise directement la projection utile dans chaque frontière :
CSS et données Web dans le UI Kit/Next.js, CSS + resolver TypeScript dans Angular,
données TypeScript sans DOM dans React Native et données Dart dans Flutter.
Chaque runtime résout réellement les deux packs par institution, contexte et
mode ; les trois copies de couleurs ont été retirées. La génération de quatre
projets dérivés prouve qu'aucun ne reçoit `contracts/design/` ni le binding d'une
autre famille.

## Conséquences

### Acquis

- aucune famille frontend ne devient la référence implicite des autres ;
- identité institutionnelle, contexte et préférence de mode ont une règle
  commune sans partager de composants ;
- les dérivés pourront recevoir seulement leur binding utile ;
- la parité UX devient exprimable par résultats observables.

### Coûts et migration

- chaque nouvelle projection ou extension locale doit rester compatible avec le
  contrat et son contrôle de drift ;
- accessibilité réelle, traduction, contraste et comportement doivent être
  vérifiés sur chaque plateforme, pas déduits du schéma.

### Non revendiqué

- aucun package n'est renommé, séparé ou publié ;
- typographie, ombres, motion et échelles propres aux plateformes ne sont pas
  encore élevées au rang de contrat commun ;
- aucune parité UX/visuelle, conformité WCAG/réglementaire, régression visuelle
  ou qualité de marque n'est prouvée ;
- aucun thème distant, signature de pack, catalogue Figma ou infrastructure de
  distribution n'est fourni ;
- aucune architecture runtime, API, cloud ou CI/CD dérivée n'est modifiée.

## Rollback

Retirer les schémas, fixtures et bindings rétablit les copies propres aux
runtimes. Ce rollback est mécanique mais réintroduit l'absence de contrat et de
preuve de dérive mesurée par l'étude.
