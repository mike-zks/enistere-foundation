# Production readiness — admission dans l'écosystème Enistere

Source : document 05 §2B et [`docs/Server Prod/`](../Server%20Prod/POLITIQUE.md) (politique et procédure,
qui prévalent en cas de conflit). **Validation humaine requise avant le premier déploiement de
production** (document 05 §2F).

## État

Aucun service Enistere Foundation n'est déployable ni déployé à la date du 2026-09-25 : le Kernel E0 est
une bibliothèque, sans processus long. Cette checklist s'appliquera dès qu'un processus Foundation
(API du Control Plane, Workbench, worker, registry) visera l'hôte partagé. Les artefacts de staging de
l'itération précédente (supprimés, ADR-094) ne valent pas admission.

## Déclarations à fournir dès la création d'un service (POLITIQUE « À créer au début d'un projet »)

- [ ] Propriétaire du service et contact d'alerte.
- [ ] Noms DNS et caractère public ou administratif (proposition §2G : `api.foundation.enistere.com`,
      `foundation.enistere.com`, `registry.foundation.enistere.com`, `staging.foundation.enistere.com` —
      à confirmer par ADR ; couverture de certificat edge multi-niveaux à vérifier).
- [ ] Dépendances PostgreSQL, Redis, R2, B2, OIDC (realm Keycloak `foundation` sur `auth.enistere.com`).
- [ ] Objectifs de disponibilité, sauvegarde, rétention, restauration (RPO/RTO).
- [ ] Besoins et limites CPU, mémoire, stockage.
- [ ] Données personnelles ou sensibles traitées.
- [ ] Commandes reproductibles de build, migration, healthcheck et rollback.

## Critères d'admission

| # | Critère | Preuve attendue |
|---|---|---|
| PR-01 | CI verte sur le commit ; image publiée et fixée par digest (jamais `latest`) | Lien CI, digests |
| PR-02 | Secrets hors dépôt, fichiers protégés à droits minimaux ; aucun secret en argument, manifeste, image ou journal | Recherche de secrets, revue des manifestes |
| PR-03 | Image multi-étapes, non-root, FS en lecture seule si possible, `no-new-privileges`, init, limites de ressources, rotation des journaux | Manifeste Compose rendu |
| PR-04 | Healthchecks distinguant vie du processus et capacité à servir avec ses dépendances | Sorties healthcheck |
| PR-05 | Migrations en job ponctuel, rejouées depuis une base vierge | Journal de migration |
| PR-06 | Sauvegarde Restic/B2 incluse et restauration isolée démontrée (PostgreSQL en instance temporaire) | `RESTORE_TEST_OK` ou équivalent |
| PR-07 | TLS, DNS, WAF, OIDC et routes critiques testés depuis l'extérieur (route dépendant réellement d'OIDC) | Résultats de tests externes |
| PR-08 | Aucun port applicatif publié ; seuls 22/80/443 ; réseaux `enistere_*` minimaux ; bases hors `enistere_public` | `ss -lntup`, `docker network inspect` |
| PR-09 | Métriques, journaux structurés sans secret et alertes visibles (Prometheus, Grafana, Loki, Uptime Kuma) | Captures / requêtes |
| PR-10 | Rollback exercé, statut CI en échec conservé en cas d'échec | Journal d'exercice |
| PR-11 | Runbook et inventaire de production à jour | [`../runbooks/`](../runbooks/README.md) |
| PR-12 | Validation et publication de production dans deux workflows distincts ; déploiement depuis un tag protégé ; le VPS ne compile jamais | Workflows |

Une exception temporaire n'est valide que si elle est écrite, datée, attribuée à un propriétaire et
assortie d'une échéance.

## Interdits sans exception

Port applicatif hors 22/80/443 ; contournement de Traefik ou Cloudflare ; secret dans Git, un manifeste,
une image ou un journal CI ; compilation sur le VPS ; image `latest` en production ; Portainer comme
source de vérité.
