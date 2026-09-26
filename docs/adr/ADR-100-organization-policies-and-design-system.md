# ADR-100 — Évaluation des politiques d'organisation et contrat A9 DesignSystem

- Statut : Accepté
- Date : 2026-09-26
- Décideur : responsable du projet (choix « catalogue fermé » et « contrat A9 DesignSystem »)
- Sources : document 06 v1.1 §6.8 (E6 : theme ≠ domain ; une policy bloque ou produit un waiver) ;
  document 02 (Design Systems, Policy Packs et Entity Profiles restent des objets versionnés distincts) ;
  document 04 (tokens) ; ADR-092 (A3), ADR-097, ADR-099 ; divergence D-5

## Contexte

A3 (contexte d'organisation effectif) était dérivé et validé, mais la compilation ne l'appliquait pas.
Les surfaces citaient un Design System externe qui n'existait nulle part ; `design-tokens.json` (document
04) était absent (D-5).

## Options

- Politiques : **catalogue fermé interprété par le Kernel** (retenu) ; prédicats déclaratifs dans A3
  (changement de schéma) ; langage de règles CEL/Rego (dépendance, déterminisme à prouver).
- Design : **contrat A9 `DesignSystem`** (retenu) ; fichier externe épinglé hors de l'ensemble fermé ;
  report des design bindings.

## Décision

1. **Politiques** (`kernel/compiler/src/policy.ts`) : après la résolution, le Kernel évalue les règles
   effectives d'A3 qu'il connaît — `runtime.<famille>.allowed` (runtime résolu des composants dont le kind
   commence par `<famille>-`), `security.identity.provider` (fournisseur des intégrations `oidc-provider`),
   `data.residency` (région des environnements ; `eu` couvre `eu-west`), `quality.accessibility.level`
   (niveau WCAG 2.2 garanti par le Design System de chaque surface). Issues par sujet : SATISFIED, WAIVED
   (satisfait seulement grâce au waiver, avec son identifiant et son expiration), VIOLATED, NOT_APPLICABLE ;
   règle hors catalogue : NOT_EVALUATED (listée avec un avertissement, jamais ignorée).
2. **Une violation bloque** : `POLICY_VIOLATION` (erreur) rend la compilation INVALID ; aucun plan n'est
   produit ; le rapport reste dans le résultat (`policy`). La levée passe par un waiver approuvé par un
   humain dans une nouvelle révision d'A3. Le rapport entre dans le plan et donc dans la proof chain.
3. **Expiration** : la compilation reste intemporelle ; MATERIALIZE, à son instant injecté, refuse un
   plan qui repose sur un waiver expiré (`MATERIALIZE_WAIVER_EXPIRED`, rien n'est écrit).
4. **A9 `DesignSystem`** : contrat de première classe (AUTHORITATIVE, acceptation humaine) — tokens au
   format W3C Design Tokens (types fermés color, dimension, fontFamily, fontWeight, number, duration ;
   alias), conformité d'accessibilité, contextes de design avec surcharges. Il n'a pas de `system` : il
   appartient à l'organisation (l'ensemble fermé l'accepte à ce titre). Une seule interprétation des
   tokens (`resolveDesignTokens`, `validateTokens`). La baseline passe à neuf contrats.
5. **A4** : `experience.designSystem` devient une référence épinglée vers A9 (remplace la référence
   externe) ; `designContext` doit exister dans A9 ; `environments[].region` optionnel. L'IR porte
   `region` et `provider`.
6. **Design bindings** : l'IR porte, par surface, les tokens résolus du contexte et l'accessibilité ;
   le plan en liste les digests ; `AdapterContext.designBindings` (additif). **Theme ≠ domain** : un
   changement de token ne change ni le Domain IR ni le contrat d'API ; un changement de domaine ne change
   aucun binding.
7. **D-5** : `docs/design/design-tokens.json` porte les tokens de l'interface Foundation (document 04),
   validés par le même validateur (`npm run design:tokens`, job CI `kernel`) ; les mockups restent absents.

## Conséquences

- Gate E6 : une policy bloque (sans W-001, l'environnement staging `eu-central` viole la résidence ;
  runtime, fournisseur d'identité et accessibilité testés) et produit un waiver (W-001 → staging WAIVED)
  ✔ ; theme ≠ domain ✔.
- Le golden change : A9 ajouté, surfaces épinglées, régions, fournisseur OIDC aligné sur la règle
  verrouillée ; tous les digests en aval sont régénérés.
- Limites : `deployment.image.reference`, `ai.decide.allowed` (appliqué par l'autorité des contrats) et
  `evidence.retention.days` restent NOT_EVALUATED ; aucun adapter de surface ne consomme encore les
  bindings (E8) ; la famille de runtime repose sur le préfixe du kind.
