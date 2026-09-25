# Étude UI/UX multi-runtime — 2026-08-09

> **MISE À JOUR 2026-08-09.** La formalisation et la migration des bindings
> recommandées aux étapes 1, 2, 3 et 5 sont exécutées par
> [ADR-090](../adr/ADR-090-polyglot-design-experience-contract.md). Le tableau
> ci-dessous reste la mesure initiale, désormais supersédée pour les sources de
> tokens et les thèmes. La parité comportementale et visuelle reste non prouvée.

## Statut et portée

Cette étude mesure l'état réel de `@enistere/ui-kit`, Next.js, Angular, React
Native et Flutter. Elle évalue la proposition suivante : conserver des
implémentations idiomatiques indépendantes, tout en garantissant une parité de
comportement et des thèmes dynamiques adaptés au contexte et aux institutions.

Elle ne choisit pas une nouvelle bibliothèque UI, ne crée pas de composant et
ne prétend pas prouver la parité visuelle.

## Preuves exécutées

Le 2026-08-09 :

- `npm run tokens:check --workspace=@enistere/ui-kit` : artefacts à jour ;
- `npm test --workspace=@enistere/ui-kit` : 26 fichiers de tests verts ;
- `npm test --workspace=@enistere/web-nextjs` : 22 fichiers verts ;
- `npm run test:ci --prefix starters/angular` : 109 tests Chrome Headless verts ;
- `npm test --prefix starters/react-native` : 47 fichiers verts ;
- `flutter test` dans `starters/flutter` : 9 tests verts.

Le premier essai Angular a compilé puis échoué à ouvrir le port Karma sous le
sandbox (`listen EPERM`). La même commande hors sandbox, sur boucle locale
contrôlée, a exécuté 109/109 tests. Flutter a nécessité l'accès normal du SDK
Snap à son répertoire utilisateur ; le run autorisé a exécuté 9/9 tests.

## État mesuré

| Surface | Source réelle des tokens | Composants | Sélection du thème | Thème institutionnel |
|---|---|---|---|---|
| Next.js | dépendance directe `@enistere/ui-kit` et CSS généré | 19 primitives React DOM partagées, plus états Web locaux | clair fixé dans le layout ; dark techniquement disponible par attribut | absent |
| Angular | copie manuelle des variables dans `styles.scss` | Angular Material et quatre états Angular locaux | CSS dark présent, aucun resolver runtime mesuré | absent |
| React Native | copie TypeScript d'un sous-ensemble, gardée par tests d'alignement | primitives RN maison et cinq états principaux | système ou préférence light/dark via provider | absent |
| Flutter | constantes Dart recopiées | Material 3 et quatre états Flutter locaux | `ThemeMode.system` | absent |

`@enistere/ui-kit` contient deux produits différents :

1. une source de tokens agnostiques, générée en JSON, TypeScript et CSS ;
2. une bibliothèque de composants **React DOM**, avec `react >=18` comme peer.

Le premier est multi-runtime dans son intention. Le second ne peut être la
bibliothèque universelle d'Angular, React Native et Flutter. Aujourd'hui, seul
Next.js consomme réellement le package livré. La fermeture de packages des
projets React Native exclut même `ui-kit`, et Dart ne peut pas consommer un
package npm comme dépendance runtime idiomatique.

## Analyse de la proposition du propriétaire

La direction est juste sur les deux points structurants :

- chaque runtime doit conserver ses composants, son moteur de rendu, sa
  navigation, ses idiomes d'accessibilité et ses avantages propres ;
- la parité doit porter sur les intentions et résultats observables, pas sur un
  arbre DOM ou une API de composant React imposée ailleurs.

Le terme « package UI/UX utilisable par tous » doit toutefois désigner une
**unité logique polyglotte**, comme le contrat API, et non nécessairement un
unique artefact npm. Sinon Angular serait artificiellement couplé à React,
Flutter à Node et React Native au DOM.

## Frontière recommandée

```text
Contrat de design et d'expérience neutre
├── tokens primitifs et sémantiques
├── schéma de ThemePack
├── patterns UX observables
├── règles d'accessibilité
└── fixtures de conformité
          ↓ génération déterministe
Bindings CSS │ TypeScript data │ Dart
          ↓
Next adapter │ Angular adapter │ RN adapter │ Flutter adapter
          ↓
Composants idiomatiques et indépendants
```

La source canonique devrait vivre sous `contracts/design/`, suivant la même
règle que les contrats API polyglottes. Les bindings ne sont livrés à un projet
dérivé que si son application les consomme :

- CSS variables pour Next.js et Angular ;
- données TypeScript sans DOM pour React Native ;
- source Dart générée pour Flutter ;
- composants React DOM actuels séparés sous une identité explicite telle que
  `@enistere/ui-react`, consommée uniquement par Next.js.

Cette séparation permet aussi de ne pas surcharger un dérivé par un package
universel factice. Un binding généré peut être matérialisé directement dans
l'application si le publier comme package n'apporte aucun bénéfice de cycle de
vie ou de réutilisation.

## Ce que signifie la parité UX

La parité ne signifie ni mêmes pixels, ni mêmes widgets. Un pattern versionné
déclare des résultats observables. La première matrice devrait couvrir :

- `loading`, `empty`, `error`, `success` ;
- `unauthorized` distinct de `forbidden` ;
- `offline`, `service-unavailable`, `not-found` selon applicabilité ;
- action principale/secondaire, état disabled/busy et retry ;
- annonce accessible (`status`, `alert`, live region ou équivalent) ;
- focus/retour de focus applicable ;
- taille tactile, navigation clavier, mise à l'échelle du texte ;
- couleur jamais seule porteuse de sens ;
- réduction des animations ;
- messages sûrs, localisables et sans détail technique sensible.

Le dépôt ne possède pas aujourd'hui ce manifeste commun. Les ensembles
d'états diffèrent, comme les langues et les annonces accessibles. Les tests
locaux verts ne prouvent donc pas une équivalence entre familles.

## Thèmes dynamiques par contexte et institution

Le modèle doit séparer trois axes :

1. **mode d'affichage** : light, dark, puis éventuellement contraste renforcé ;
2. **identité institutionnelle** : palette sémantique, typographie autorisée,
   radius, assets de marque et métadonnées d'accessibilité ;
3. **contexte d'usage** : produit, surface ou densité, sans réintroduire de
   valeur métier dans les primitives globales.

Un `ThemePack` versionné devrait porter au minimum : `id`, `version`, version du
contrat, modes disponibles, références de tokens sémantiques, assets locaux
avec variantes et textes alternatifs, compatibilité, digest et fallback.

Ordre de résolution recommandé :

```text
socle accessible
→ pack institution explicitement autorisé
→ contexte applicatif borné
→ préférence utilisateur (mode, contraste, motion)
→ thème résolu et validé
```

La première version doit embarquer des packs validés à la génération et les
sélectionner par identifiant. Elle ne doit pas télécharger ni exécuter du CSS,
HTML, font URL ou code arbitraire depuis une institution. Un futur chargement
distant exigerait schéma fermé, signature/provenance, allowlist, cache, timeout,
fallback sûr et revalidation d'accessibilité.

La sélection d'une institution ne constitue jamais une décision
d'autorisation : l'API reste l'autorité sur le tenant et l'identité. Le thème
ne reçoit ni credential, ni donnée personnelle, ni règle métier.

## Défauts et dettes caractérisés

1. **Package aux responsabilités mélangées** : contrat neutre et React DOM sous
   la même identité.
2. **Copies manuelles** : Angular, RN et Flutter peuvent dériver malgré leurs
   commentaires d'alignement ; Flutter n'a pas de gate contre la source.
3. **Parité non exécutable** : aucun manifeste ne compare les patterns UX.
4. **Thèmes asymétriques** : Next reste light fixe, Angular n'a pas de resolver,
   RN gère une préférence et Flutter suit le système.
5. **Aucune institution** : pas de pack, résolution, validation, asset manifest
   ni fallback institutionnel.
6. **Accessibilité incomplètement mesurée** : tests sémantiques locaux, mais pas
   de calcul de contraste par thème, régression visuelle, zoom/font scaling ou
   matrice clavier/tactile commune.
7. **Documentation vieillissante** : le README UI Kit annonce à plusieurs
   endroits des statuts « futur » déjà partiellement implémentés dans RN et des
   nombres de tests différents ; ces textes ne doivent pas devenir la preuve.
8. **ADR-009 non matérialisée telle qu'écrite** : Tailwind/Radix/shadcn est une
   décision validée mais le package actuel utilise des primitives DOM maison.
   Ce n'est pas automatiquement un défaut ; la décision doit être réévaluée à
   partir du besoin réel avant d'ajouter ces dépendances.

## Séquence recommandée

1. créer le contrat exécutable `design-experience/v1` et `theme-pack/v1` ;
2. déplacer la source neutre sous `contracts/design/` et générer CSS, TS data et Dart ;
3. faire consommer ces bindings par les quatre runtimes et interdire les copies ;
4. séparer les composants React DOM du contrat neutre ;
5. introduire deux packs de fixture contrastés et prouver la sélection dynamique ;
6. définir puis exécuter la matrice de patterns UX sur les quatre runtimes ;
7. seulement ensuite décider publication, catalogue visuel, Figma, chargement
   distant et éventuelles bibliothèques UI par adapter.

## Non revendiqué

- aucune parité visuelle ou comportementale complète n'est démontrée ;
- aucun contraste n'a été calculé et aucune conformité réglementaire n'est affirmée ;
- aucun thème institutionnel n'est encore implémenté ;
- aucun package n'est renommé, séparé ou publié par cette étude ;
- aucun composant, runtime ou projet dérivé n'est modifié ;
- aucun choix de Tailwind, Radix, shadcn, Angular Material ou Material 3 n'est
  révoqué ou étendu sans décision dédiée.
