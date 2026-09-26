# Design de l'interface Foundation

[`design-tokens.json`](design-tokens.json) : tokens de l'interface d'Enistere Foundation elle-même
(Workbench, surfaces du produit), repris du document 04 (couleurs, typographie, espacements) au format W3C
Design Tokens. Le fichier est validé par le même validateur que les Design Systems (A9) des systèmes
construits (`validateTokens`, test `kernel/contracts/test/design-system.test.ts`).

Ce ne sont pas les tokens des systèmes générés : ceux-ci sont portés par leur propre contrat A9
`DesignSystem` ([ADR-100](../adr/ADR-100-organization-policies-and-design-system.md)).

Les mockups cités par le document 04 restent absents (divergence D-5, partiellement levée).
