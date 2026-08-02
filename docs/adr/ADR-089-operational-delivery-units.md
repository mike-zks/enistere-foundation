# ADR-089 — La livraison opérationnelle est résolue par `deploymentUnit`

- Statut : Validé, implémentation initiale
- Date : 2026-08-02
- Décideur : Owner Foundation
- Complète : ADR-046, ADR-057, ADR-065, ADR-066, ADR-071, ADR-086 et ADR-088

## Contexte

L'[audit de parité opérationnelle](../audits/OPERATIONAL_PARITY_AUDIT_2026-08-02.md)
a exécuté les artefacts livrés par la Factory. Deux Dockerfiles sur trois sont
rouges dans un projet dérivé : NestJS attend un lockfile applicatif supprimé par
le workspace unifié ; Next.js cherche encore `starters/nextjs`. FastAPI construit,
mais aucune politique commune ne relie cette image aux autres runtimes.

Les sept sorties sans capability ni primitive résolue reçoivent PostgreSQL,
Redis et MinIO. Leur staging ne contient que Traefik. Aucune sortie ne reçoit de
CI. Les workflows de la Foundation exercent ses starters et goldens ; ils ne
sont pas des pipelines portables vers un dépôt dérivé.

La cause est conceptuelle : `application`, runtime et unité livrable sont encore
traités comme synonymes au moment de matérialiser l'exploitation, alors que
l'architecture de référence les distingue déjà.

## Décision

### `deploymentUnit` est l'unité opérationnelle

Une `application` porte une responsabilité logique. Un runtime l'implémente. Une
`deploymentUnit` décrit ce qui est effectivement construit, distribué, configuré,
migré, démarré, vérifié, promu et rollbacké.

Le modèle versionné d'une unité porte au minimum :

- application, runtime, famille et owner ;
- un ou plusieurs artefacts, leur statut, contexte de build, définition,
  commande, sorties, canal de distribution, immutabilité et preuves ;
- configuration non secrète et secrets **uniquement par référence** ;
- health applicable ;
- commande et réversibilité des migrations ;
- dépendances vers unités et primitives résolues ;
- ordre de rollout, ordre de rollback et stratégie de retour.

Le schéma normatif initial est
[`factory/schema/deployment-unit.schema.json`](../../factory/schema/deployment-unit.schema.json).
Il est exécuté par l'évaluateur JSON Schema autonome de la Factory et croisé
contre Ajv en test.

### Quatre plans restent séparés

1. **Contrat opérationnel** : garanties observables ci-dessus.
2. **Adapter runtime** : mécanisme idiomatique de build et d'exécution.
3. **Pack provider** : Compose, VM, Kubernetes ou cloud explicitement choisi.
4. **Pipeline dérivé** : gates produites depuis les unités résolues.

Un pack provider ne redéfinit ni le runtime, ni son contrat, ni ses tests. Un
workflow de fabrication de la Foundation n'est jamais copié comme CI d'un
projet dérivé.

### Les artefacts suivent les familles, pas l'axe TypeScript

| Famille | Artefacts autorisés par le contrat v1 |
|---|---|
| API | image OCI ou JAR JVM |
| Web | image OCI ou bundle statique |
| Mobile | package Android, package iOS ou bundle de mise à jour mobile |

Cette liste n'impose pas Docker à Spring, Angular ou au mobile. Elle permet à un
provider de transformer ou distribuer un artefact prêt sans faire de son choix
la vérité du runtime.

### La sélection gouverne la livraison

Un service d'infrastructure, pack cloud, package partagé, document de
fabrication ou pipeline n'est matérialisé que si une unité résolue le consomme.
Les primitives sont sélectionnées dans le modèle système, résolues vers un
provider/version puis référencées par les unités. Une capability peut exprimer
un besoin ; elle ne choisit pas seule le provider du système.

Les README et runbooks utiles au propriétaire sont livrables. Revues, roadmaps,
rapports et preuves internes à la Foundation ne le sont pas, sauf référence
explicite du plan.

### Le statut est attaché à chaque artefact

Un artefact `ready` cite au moins une preuve exécutable. Un artefact `blocked`
cite au moins un code de blocage. La conformité d'un runtime ou d'une capability
ne promeut jamais automatiquement son artefact opérationnel.

## Compatibilité et migration

Blueprint v1 continue de générer le code applicatif. Tant qu'il ne sélectionne
pas les primitives et packs providers :

- aucune infrastructure fixe ne doit être présentée comme résolue ;
- les artefacts existants restent mesurés séparément ;
- la génération peut produire des unités `blocked` sans requalifier le code
  applicatif en non conforme ;
- les champs historiques `starter.manifest.json.deployment` seront migrés vers
  le descripteur d'adapter, puis retirés sans maintenir deux vérités.

La séquence d'implémentation est : modèle exécutable → registre d'adapters →
unités dans le plan → artefacts dérivés → packs providers → CI dérivée.

## Première tranche exécutée

Le schéma `deployment-unit/v1`, son chargeur autonome et cinq scénarios de test
sont présents. Ils prouvent :

- unité API OCI valide avec secret par référence ;
- verdict identique entre l'évaluateur embarqué et Ajv ;
- refus d'un secret littéral et d'un chemin remontant hors projet ;
- preuve obligatoire pour `ready`, blocker obligatoire pour `blocked` ;
- impossibilité de faire passer une image OCI pour une release mobile.

## Conséquences

### Acquis

- la parité opérationnelle devient mesurable sans uniformiser les frameworks ;
- build context, artefact et pipeline deviennent des données résolues ;
- le cloud reste un adapter explicite, jamais un invariant ;
- les projets dérivés peuvent recevoir moins de fichiers et davantage de
  garanties réelles.

### Coûts

- les sept adapters doivent déclarer leurs artefacts et leurs statuts honnêtes ;
- le Blueprint/CSM doit porter les primitives et providers ;
- le générateur fixe doit être remplacé par une matérialisation sélectionnée ;
- Dockerfiles, bundles et releases mobiles devront être prouvés dans la
  structure dérivée, pas seulement dans les starters.

### Non revendiqué

- le schéma n'est pas encore émis dans `GenerationPlan` ;
- les Dockerfiles NestJS/Next.js restent rouges ;
- aucun pipeline dérivé, pack provider sélectionné ou cloud réel n'est livré ;
- aucun artefact Spring/Angular/mobile n'est publié ;
- aucune signature, SBOM, provenance, performance, HA, DR ou
  `PRODUCTION_READY` n'est revendiquée.

## Rollback

Retirer le schéma et cette décision rétablit `application = unité livrable` et
le Compose fixe. Cela ne restaure pas un comportement opérationnel fonctionnel :
les deux builds dérivés resteraient rouges. Le rollback documentaire est donc
possible, mais il réintroduit la cause mesurée.
