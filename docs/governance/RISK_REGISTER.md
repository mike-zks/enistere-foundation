# Registre des risques et hypothèses

Source de vérité vivante des risques du projet (document 05 §2D) — le dossier ne contient plus de
document dédié. Revue gouvernance ; tout risque **Critical/High** exige une validation humaine.
Échelle : probabilité et impact Low / Medium / High ; criticité = combinaison.

| ID | Risque / hypothèse | Prob. | Impact | Criticité | Mitigation / réponse | Propriétaire | Statut |
|---|---|---|---|---|---|---|---|
| R-01 | **Double source de vérité** : les contrats A1–A7 et un second modèle de système divergent. | Low | High | Medium | Itération précédente supprimée (ADR-094) : une seule implémentation par concept, dans le Kernel ; test interdisant tout import hors de `kernel/` et `goldens/`. | Technique | Atténué (R0-D) |
| R-02 | **Gate E0 non défini** (P1–P10 absents du dossier) : risque d'un PASS contestable. | High | Medium | High | Décomposition validée (ADR-093, ARB-01). | Produit / Pilotage | Clos |
| R-03 | Le digest de contenu exclut `metadata.status` : un changement de statut non gouverné passerait inaperçu. | Low | Medium | Medium | Transitions tracées par révisions et Change Requests ; E4/E7 ajouteront l'historique d'audit des transitions. | Technique | Accepté (E0) |
| R-04 | Exécution TypeScript native de Node (type stripping) : dépendance à Node ≥ 22.18 et à la syntaxe effaçable. | Low | Low | Low | `engines`, CI Node 24, `erasableSyntaxOnly` dans `tsconfig`. | Technique | Accepté |
| R-05 | Ajv, dépendance d'exécution du Kernel (supply chain). | Low | Medium | Medium | Version verrouillée, audit npm en CI, schémas neutres réinterprétables par un autre validateur. | Technique | Surveillé |
| R-06 | Vulnérabilités de dépendances de l'itération précédente couvertes par des exceptions datées. | — | — | — | Dépendances supprimées avec le code (ADR-094) ; lockfile réduit à 9 paquets, `npm audit` : 0 vulnérabilité. | Technique | Clos (R0-D) |
| R-07 | Artefacts de staging de l'itération précédente non alignés sur la production Enistere (Traefik, réseaux, Keycloak commun). | — | — | — | Artefacts supprimés (ADR-094) ; aucun déploiement Foundation avant [`PRODUCTION_READINESS.md`](PRODUCTION_READINESS.md). | Plateforme | Clos (R0-D) |
| R-08 | Divergences documentaires 05 ↔ production (Ubuntu 24.04/26.04.1, RabbitMQ) conduisant à de mauvaises hypothèses d'infrastructure. | Medium | Medium | Medium | Consignées (CONTEXT D-2, D-3) ; la documentation de production prévaut. | Gouvernance | Ouvert |
| R-09 | Tokens et maquettes du document 04 absents du dépôt. | High | Low | Medium | Non bloquant avant le Workbench ; demande consignée (CONTEXT D-5). | Design UX UI | Ouvert |
| R-10 | Réécriture de l'autorité (`AGENTS.md`, archivage du mandat) sans revue humaine formelle. | Low | High | Medium | Demandée explicitement par le responsable ; revue de PR requise (ADR-091). | Gouvernance | Ouvert jusqu'à revue |
| R-11 | Surinvestissement dans la parité des runtimes avant la preuve du protocole d'adapter. | Medium | High | High | Un runtime puis une substitution (E2, E8) ; les runtimes sont réécrits comme adapters, sans héritage (ADR-094). | Produit | Surveillé |
| R-12 | Hypothèses de marché et de financement (180 M FCFA, trajectoire Y1–Y5) non validées par des données terrain. | Medium | High | High | Gates de roadmap ; recalibrage par données commerciales réelles (document 06 §6.11). | Direction | Hérité du dossier |
| R-13 | Dérogation à l'ordre du document 06 (R0-C inséré avant E1) créant un précédent de réordonnancement. | Low | Medium | Medium | Périmètre borné aux niveaux 1–2, aucun gate modifié, décision tracée (ADR-093). | Produit / Pilotage | Accepté |
| R-14 | Liens relatifs cassés dans la documentation. | — | — | — | Code concerné supprimé ; le contrôleur couvre désormais tout le dépôt hors `docs/archive/` (ADR-094). | Technique | Clos (R0-D) |
| R-15 | **Checks requis obsolètes** : le ruleset `protect-main` exige encore les huit checks de l'ancienne CI, qui ne s'exécutent plus. Aucune PR ne peut être mergée. | High | High | High | Ruleset mis à jour par le responsable ; PR #254 mergée avec `kernel`, `secret-scan`, `docs`, `audit`. | Responsable | Clos |
| R-16 | Écart entre le dossier (documents 03 §6.11, 06 §4.6, §4.7, §6.8 E1/E3/E10, R0) et les décisions de repartir propre et de redéfinir E1. | High | Medium | Medium | Documents 03 et 06 révisés en v1.1 (modifications suivies à accepter dans Word). | Gouvernance | Clos |
