# Registre des risques et hypothèses

Source de vérité vivante des risques du projet (document 05 §2D) — le dossier ne contient plus de
document dédié. Revue gouvernance ; tout risque **Critical/High** exige une validation humaine.
Échelle : probabilité et impact Low / Medium / High ; criticité = combinaison.

| ID | Risque / hypothèse | Prob. | Impact | Criticité | Mitigation / réponse | Propriétaire | Statut |
|---|---|---|---|---|---|---|---|
| R-01 | **Double source de vérité** : les contrats A1–A7 et le pipeline Blueprint/CSM divergent avant le cutover. | Medium | High | High | ADR-092 : golden non consommé par la génération, aucun import croisé (test), sonde de compatibilité en lecture seule ; E1 introduit un seam unique et testé. | Technique | Ouvert — surveillé |
| R-02 | **Gate E0 non défini** (P1–P10 absents du dossier) : risque d'un PASS contestable. | High | Medium | High | Décomposition proposée (ADR-092) ; validation humaine demandée avant E1. | Produit / Pilotage | Ouvert |
| R-03 | Le digest de contenu exclut `metadata.status` : un changement de statut non gouverné passerait inaperçu. | Low | Medium | Medium | Transitions tracées par révisions et Change Requests ; E4/E7 ajouteront l'historique d'audit des transitions. | Technique | Accepté (E0) |
| R-04 | Exécution TypeScript native de Node (type stripping) : dépendance à Node ≥ 22.18 et à la syntaxe effaçable. | Low | Low | Low | `engines`, CI Node 24, `erasableSyntaxOnly` dans `tsconfig`. | Technique | Accepté |
| R-05 | Ajv, dépendance d'exécution du Kernel (supply chain). | Low | Medium | Medium | Version verrouillée, audit npm en CI, schémas neutres réinterprétables par un autre validateur. | Technique | Surveillé |
| R-06 | Vulnérabilités de dépendances du laboratoire couvertes par des exceptions datées (`factory/quality/audit-exceptions.json`). | Medium | Medium | Medium | Revue à échéance ; non modifié par E0. | Technique | Hérité |
| R-07 | Artefacts de staging du laboratoire (`deployment/`, GHCR, Cloud Core) non alignés sur la production Enistere (Traefik, réseaux, Keycloak commun). | Medium | High | High | Aucun déploiement Foundation avant [`PRODUCTION_READINESS.md`](PRODUCTION_READINESS.md) ; audit d'alignement avant toute mission touchant le déploiement. | Plateforme | Ouvert |
| R-08 | Divergences documentaires 05 ↔ production (Ubuntu 24.04/26.04.1, RabbitMQ) conduisant à de mauvaises hypothèses d'infrastructure. | Medium | Medium | Medium | Consignées (CONTEXT D-2, D-3) ; la documentation de production prévaut. | Gouvernance | Ouvert |
| R-09 | Tokens et maquettes du document 04 absents du dépôt. | High | Low | Medium | Non bloquant avant le Workbench ; demande consignée (CONTEXT D-5). | Design UX UI | Ouvert |
| R-10 | Réécriture de l'autorité (`AGENTS.md`, archivage du mandat) sans revue humaine formelle. | Low | High | Medium | Demandée explicitement par le responsable ; revue de PR requise (ADR-091). | Gouvernance | Ouvert jusqu'à revue |
| R-11 | Surinvestissement dans la parité des sept runtimes avant la preuve du protocole d'adapter. | Medium | High | High | Document 06 §4.7 : un runtime puis une substitution (E2, E8) ; aucune migration globale en R0. | Produit | Surveillé |
| R-12 | Hypothèses de marché et de financement (180 M FCFA, trajectoire Y1–Y5) non validées par des données terrain. | Medium | High | High | Gates de roadmap ; recalibrage par données commerciales réelles (document 06 §6.11). | Direction | Hérité du dossier |
