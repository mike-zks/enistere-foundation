# Spécification du contrat de design et d'expérience

- Version : 1.0.0
- Contrats exécutables : `design-experience/v1`, `theme-pack/v1`
- Statut : normatif, implémentation initiale

## 1. Portée

Cette spécification fixe les garanties de design et d'expérience communes aux
applications Web et Mobile. Elle ne prescrit ni composants, ni framework de
rendu, ni structure DOM ou widget. Next.js, Angular, React Native et Flutter
restent responsables de leurs implémentations idiomatiques.

L'unité partagée est un contrat logique polyglotte. Un package npm React ne peut
pas en être la source universelle.

## 2. Sources exécutables

```text
contracts/design/
├── design-experience.v1.json
├── schemas/design-experience.v1.schema.json
├── schemas/theme-pack.v1.schema.json
├── themes/*.v1.json
└── generated/
    ├── design-tokens.css
    ├── design-contract.ts
    ├── design_contract.dart
    └── manifest.json
```

Les deux schémas JSON fermés et les documents qu'ils valident sont la source
exécutable. Les fichiers de `generated/` sont des projections déterministes et
ne doivent pas être modifiés à la main.

## 3. Contrat d'expérience

`design-experience/v1` définit les clés de couleurs sémantiques et sept patterns
initiaux : `loading`, `empty`, `error`, `success`, `unauthorized`, `forbidden` et
`offline`.

Chaque pattern déclare au minimum : surfaces applicables, niveau d'annonce,
présence d'une action, comportement de focus, motion, clé de message localisable
et sûreté du contenu. Les détails techniques ne sont jamais révélés par défaut.

La conformité porte sur le résultat observable. Elle n'exige pas les mêmes
pixels ni les mêmes composants entre familles.

## 4. ThemePack

Un `ThemePack/v1` versionné porte :

- une identité de pack et d'institution ;
- les contextes applicatifs bornés auxquels il s'applique ;
- les modes `light` et `dark` avec exactement les mêmes clés sémantiques ;
- les échelles partagées et une cible tactile minimale d'au moins 44 px ;
- les préférences de mode et le fallback ;
- un digest individuel dérivé dans le manifeste généré ;
- éventuellement des assets locaux déclaratifs avec texte alternatif.

Les thèmes ne portent ni donnée métier, ni credential, ni règle d'autorisation.
Ils n'acceptent ni URL distante, ni CSS, HTML, JavaScript ou police exécutable.

## 5. Résolution

L'ordre initial est déterministe :

1. pack explicitement sélectionné et déjà enregistré ;
2. couple exact `institutionId/contextId` ;
3. contexte `default` de l'institution ;
4. fallback déclaré du pack si celui-ci est indisponible ;
5. pack `enistere-default` ;
6. préférence utilisateur autorisée, sinon mode du système autorisé, sinon
   `light`.

Deux packs ne peuvent pas revendiquer le même couple institution/contexte. Les
identifiants de sélection proviennent du système résolu ou d'une configuration
applicative contrôlée, jamais d'une décision d'autorisation côté client. L'API
reste autoritaire sur l'identité et le tenant.

## 6. Bindings et livraison

- CSS variables : Web Next.js et Angular ;
- données TypeScript sans DOM : React Native ;
- source Dart : Flutter.

Un projet dérivé ne reçoit que le binding réellement consommé par ses
applications. La présence des trois projections dans le dépôt Foundation ne
rend pas obligatoire leur livraison ensemble et n'impose aucune publication de
package.

Les composants restent propres à leur plateforme. La partie React DOM de
`@enistere/ui-kit` est un binding Web historique en cours de séparation, pas le
contrat neutre.

## 7. Validation et évolution

Toute modification doit conserver : schémas fermés, parité exacte des clés,
unicité des sélecteurs, fallback acyclique, chemins d'assets locaux sûrs et
génération byte-identique. `npm run design:check` est bloquant en CI.

Un retrait ou renommage de clé/pattern, une modification de l'ordre de résolution
ou une incompatibilité de ThemePack exige une nouvelle version majeure du
contrat. Un ajout compatible exige une version mineure et la migration explicite
des bindings concernés.

## 8. Non revendiqué

- les quatre runtimes consomment les bindings, mais leurs sept patterns ne sont
  pas encore tous implémentés ni comparés ;
- typographie, ombres, motion et échelles supplémentaires restent des extensions
  propres aux adapters tant qu'elles ne sont pas promues dans le contrat ;
- aucune parité comportementale ou visuelle n'est encore démontrée ;
- aucun calcul automatique de contraste, test visuel, catalogue de composants,
  chargement distant ou conformité réglementaire n'est revendiqué ;
- les bindings TypeScript et Dart générés ne constituent pas encore des packages
  publiés.
