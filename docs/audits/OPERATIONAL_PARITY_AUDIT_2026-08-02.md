# Audit de parité opérationnelle — 2026-08-02

Périmètre : sept runtimes, projets dérivés de base, infrastructure locale et
staging, images, CI/CD et artefacts de release. Méthode : inspection du dépôt,
génération réelle, parsing Compose, finalisation d'un workspace dérivé et builds
Docker. Cet audit mesure l'existant ; il ne promeut aucun runtime vers
`PRODUCTION_READY`.

## Verdict

La parité applicative ne s'étend pas encore à l'exploitation. Les goldens de la
Foundation prouvent les builds et comportements des sept runtimes, mais un
projet dérivé ne reçoit ni pipeline CI, ni pack de déploiement exécutable avec
ses applications. Deux des trois Dockerfiles livrés sont inutilisables dans la
structure dérivée.

Le défaut central est une frontière absente : le plan connaît des applications,
des capabilities et quelques besoins de primitives, mais ne résout pas encore
des `deploymentUnit` avec artefacts, providers, versions, build contexts,
migrations et gates. La matérialisation écrit alors une infrastructure fixe,
indépendante de la sélection.

## Mesures des sorties dérivées

Sept projets sans capability ont été générés depuis la même Foundation :

| Variante mesurée | Applications | Fichiers | Octets | Image applicative livrée |
|---|---|---:|---:|---|
| NestJS | NestJS | 113 | 242 651 | Dockerfile, build rouge |
| Spring | Spring | 82 | 114 349 | aucune |
| FastAPI | FastAPI | 49 | 66 873 | Dockerfile, build vert |
| Next.js | NestJS + Next.js | 385 | 1 064 270 | deux Dockerfiles, deux builds rouges |
| Angular | NestJS + Angular | 180 | 343 596 | NestJS seulement, rouge |
| React Native | NestJS + Expo | 299 | 806 011 | NestJS seulement, rouge |
| Flutter | NestJS + Flutter | 176 | 403 876 | NestJS seulement, rouge |

Les sept plans déclarent **zéro primitive résolue**. Pourtant, les sept sorties
reçoivent le même Compose local avec PostgreSQL, Redis et MinIO, leurs trois
volumes et leurs trois secrets d'exemple. Les sept sorties demandant `staging`
reçoivent aussi un Compose ne contenant que Traefik et le commentaire invitant
le propriétaire à ajouter lui-même les applications.

Les quatorze Compose générés sont syntaxiquement valides. L'exécution de
`docker compose config --services` caractérise cependant leur portée réelle :

```text
local   minio postgres redis
staging proxy
```

Le projet FastAPI Auth/RBAC/Files montre l'autre moitié du défaut : son plan
résout trois besoins relationnels et un besoin object-storage, mais le Compose
ajoute quand même Redis. Provider, version, capacité, backup, rétention et
preuves exigés par la spécification des primitives ne sont pas résolus.

## Images et artefacts par runtime

| Runtime | Preuve actuelle | Écart opérationnel dérivé |
|---|---|---|
| NestJS | build/source et image du starter exercés par la Foundation | le Dockerfile dérivé attend un lockfile supprimé au profit du lock racine ; build réel arrêté sur `package-lock.json: not found` |
| Spring | `mvn verify`, JAR Spring Boot, démarrage réel | aucun Dockerfile, aucune image ni pipeline de publication |
| FastAPI | Dockerfile dérivé construit réellement | image mono-stage de 200 585 628 octets, non-root ; aucun healthcheck, label OCI, SBOM, signature ou provenance |
| Next.js | build standalone du starter dans Registry CI | le Dockerfile dérivé cherche `starters/nextjs` au lieu de `apps/web` ; build réel rouge ; aucun `.dockerignore` racine livré |
| Angular | build navigateur | aucun serveur statique/image, contrat de cache headers ou artefact de déploiement |
| React Native | tests, Doctor et export Expo iOS sans simulateur | aucun EAS/build signé, canal de release, artefact Android/iOS ou pipeline de store |
| Flutter | analyse, tests et APK debug | la configuration `release` utilise encore la clé debug ; aucun build iOS, signature ou pipeline de store |

L'absence d'image pour un client mobile n'est pas un écart : son artefact est
natif. L'absence d'une chaîne de production et de signature en est un. De même,
Kubernetes n'est pas requis ; un artefact sélectionné, exécutable et vérifiable
l'est.

## CI/CD

Les workflows de la Foundation prouvent beaucoup de code, mais ne constituent
pas la CI d'un dépôt dérivé :

- les goldens exercent les sept runtimes et 32 compositions ;
- les workflows dédiés ciblent directement `starters/nestjs`,
  `starters/nextjs` et `starters/angular` ;
- Registry CI ne construit et ne publie que NestJS et Next.js, depuis les
  chemins de la Foundation ;
- aucun workflow n'est matérialisé dans les sept projets dérivés ;
- aucun workflow ne publie de JAR Spring, image FastAPI, bundle Angular, artefact
  Expo ou artefact Flutter ;
- aucun workflow de déploiement dérivé, promotion d'environnement ou rollback
  n'existe.

La CI est donc forte comme preuve de la **Factory**, mais absente comme produit
livré par la Factory. Une copie des workflows actuels serait incorrecte : leurs
chemins, matrices et responsabilités appartiennent à la Foundation.

## Charge résiduelle de fabrication

La frontière ajoutée par la mission de matérialisation retire caches,
`starter.manifest.json`, spécifications de starter et sources de capabilities.
Elle laisse toutefois dans chaque dérivé NestJS sept documents internes : revues
Auth/Files/API, roadmap, statut d'implémentation et preuves de la Foundation.
Next.js ajoute trois revues Web et le package UI livre sa spécification interne.
Ces fichiers ne sont ni des contrats du système dérivé ni des runbooks
d'exploitation. Ils augmentent l'inventaire et réintroduisent l'histoire du
starter dans le produit livré.

Les README runtime utiles, tests, migrations et configuration framework restent
des actifs du projet dérivé ; ils ne doivent pas être supprimés par une règle de
nom globale. La sélection doit être déclarative et testée par destination.

## Gaps priorisés

### P0 — artefacts annoncés mais inutilisables

- Dockerfiles NestJS et Next.js cassés après matérialisation ;
- staging généré sans application, image ni migration ;
- aucune CI dérivée alors que le README expose `scripts/verify.mjs` comme unique
  gate local.

### P1 — infrastructure non résolue

- blueprint/CSM sans primitives système sélectionnables ;
- Compose fixe sans rapport avec les besoins résolus ;
- provider/version, ownership, secrets par référence, backup/restore, capacité,
  rétention et migration non portés par le plan d'infrastructure ;
- pack staging historique orienté NestJS + Next.js et Prisma, non portable vers
  Spring/FastAPI/Angular.

### P1 — release non paritaire

- aucune publication Spring/FastAPI/Angular/mobile ;
- aucune convention commune d'image, healthcheck, utilisateur, migrations,
  métadonnées OCI et rollback ;
- aucune production signée mobile ;
- SBOM, signatures, provenance, licence scanning et scan d'image restent ouverts.

## Frontières à formaliser

La correction ne doit pas imposer un mécanisme identique aux frameworks. Elle
doit séparer :

1. **contrat opérationnel observable** : build reproductible, artefact
   identifiable, configuration/secrets, health, migrations, démarrage,
   observabilité, rollback et preuves ;
2. **adapter de runtime** : JAR Spring, image Python, standalone Next, bundle
   Angular, APK/AAB/IPA ou artefact Expo idiomatique ;
3. **pack de provider** : Compose local, GHCR, VM, Kubernetes ou cloud choisi ;
4. **pipeline dérivé** : généré depuis les `deploymentUnit` et leurs gates,
   jamais copié depuis les workflows de fabrication de la Foundation.

Un fichier opérationnel n'est livré que si une unité du plan le consomme. Un
provider cloud mentionné dans le dépôt ne vaut ni sélection ni support.

## Non revendiqué

- aucun déploiement cloud ou staging externe n'a été exécuté ;
- aucune image Spring/Angular ni release mobile n'a été créée, puisqu'aucun
  contrat exécutable correspondant n'existe ;
- le Dockerfile FastAPI a été construit mais son démarrage en image n'a pas été
  retesté ; le runtime hors image avait déjà démarré dans le golden ;
- aucune performance, charge, haute disponibilité, disaster recovery ou
  `PRODUCTION_READY` n'est prouvée ;
- cet audit ne décide ni Kubernetes, ni un fournisseur cloud, ni un registre.

## Preuves exécutées

- génération des sept variantes et inventaire fichiers/octets ;
- génération FastAPI Auth/RBAC/Files et lecture des primitives réellement
  résolues ;
- parsing de quatorze Compose et extraction des services effectifs ;
- `enistere install` du projet NestJS + Next.js dérivé ;
- builds Docker réels NestJS et Next.js : échecs reproduits sur leurs chemins ;
- build Docker réel FastAPI : succès, puis inspection de sa configuration et de
  sa taille ;
- inspection des six workflows actifs et recherche des artefacts cloud/release.
