# ADR-101 — Raccordement à la gouvernance Enistere versionnée

- Date : 2026-10-26.
- Statut : **proposition de raccordement implémentée localement, à relire** ; orientation demandée
  par le propriétaire (« mettre à jour tous les projets aux normes »), pas approbation technique
  d'une release, migration distante ou ouverture de service.
- Portée : contribution, CI/CD et exploitation ; les invariants et gates produit sont conservés.
- Référence normative et état réel : [addendum de raccordement](../governance/ENISTERE_ALIGNMENT.md).
- Effet sur les décisions existantes : Complète ADR-091 pour la référence de plateforme et ADR-094 pour la séparation produit/laboratoire ; aucune modification de leur texte accepté.

## Contexte

Les copies Server Prod et certaines déclarations GitHub/Keycloak décrivent un socle historique.
La gouvernance d'organisation est désormais versionnée dans GitLab ; son adoption ne doit ni
créer plusieurs politiques concurrentes ni transformer une CI documentaire en homologation.

## Options

1. Raccorder par référence immuable, adapter le profil du projet et conserver les preuves historiques.
2. Copier toute la politique dans le projet : écartée car divergence de maintenance.
3. Remplacer les maîtres ou imposer une stack commune : écartée car altération des invariants produit.

## Décision proposée et mise en œuvre

L'addendum est l'unique référence locale de version pour le socle. Les points d'entrée de reprise
et de readiness y renvoient ; les copies Server Prod sont historiques. Contrôles proportionnés
à l'impact en développement et validation indépendante avant release sensible ; aucun déploiement
sur la seule présence de credentials ou d'un tag. Aucun serveur n'est modifié par cet ADR.

## Conséquences et preuves

Le code, les workflows et les maîtres ne changent pas ; les adaptations exécutables sont des lots
futurs explicitement tracés. Les états de capacités, gates et prochaine mission ne sont pas promus.
Preuves documentaires et limites : CURRENT_STATE et IMPLEMENTATION_MATRIX. Retour arrière par
revert documentaire après revue, sans toucher aux sources d'origine ou aux données.
