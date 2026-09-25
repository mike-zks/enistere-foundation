# 05 — Prompt — Reprise du repository et réalignement produit — Enistere FOUNDATION

> Projet : **Enistere Foundation**  
> Audience : Directions techniques, architectes, équipes produit et conformité  
> Statut : version d'action à valider avant exécution

ENISTERE FOUNDATION

PROMPT DIRECTEUR — REPRISE DU REPOSITORY ET RÉALIGNEMENT PRODUIT

Inspection, réforme éventuelle et exécution gouvernée depuis l'existant

Version 1.1 — Septembre 2026 — Réalignement gouvernance et numérotation documentaire, sur le modèle Enistere Trust/Capital

## RÉSUMÉ EXÉCUTIF

Ce document fournit le prompt directeur destiné à reprendre le développement d'Enistere Foundation à partir du repository réel et de l'existant technique, après clôture de l'étude et stabilisation du Dossier Projet Final Professionnel V1.0. Il intègre désormais une couche de gouvernance documentaire commune à l'ensemble des projets Enistere (sources de vérité, plateforme de production, continuité agent/humain, fichiers de gouvernance, matrice de propriété, convention de nommage — sections 2 à 2G), sans réduire la méthode de reprise et de réforme du repository propre à Foundation (sections 3 à 18).

Le principe constitutionnel est simple: le dossier final définit la CIBLE; le repository réel définit l'ÉTAT D'IMPLÉMENTATION. Aucun outil, agent ou développeur ne doit déduire que la cible est déjà présente dans le code parce qu'elle est décrite dans la documentation. Inversement, aucun actif existant ne doit être conservé par inertie s'il contredit la cible ou crée une dette structurelle démontrée.

Le prompt autorise donc une réforme du repository, mais uniquement après inspection, cartographie, analyse d'écart, proposition d'options, décision explicite et plan de migration. Il interdit les réécritures massives motivées par une préférence esthétique, les suppressions de preuves historiques, les renommages globaux sans bénéfice mesurable et la création de nouvelles architectures parallèles non décidées.

La reprise doit préserver les actifs prouvés du laboratoire lorsqu'ils restent compatibles: normalisation avant résolution; séparation intent/resolution/plan; sérialisation déterministe et digests; modèles calculés immuables; diagnostics structurés; Platform Baseline; runtime-family contracts; behavioral conformance; ownership-aware regeneration; goldens; migrations fail-loud; support explicite de UNSUPPORTED.

La première mission technique après le préflight demeure E0 — Contract Foundation, sauf si l'inspection du repository démontre qu'un prérequis bloquant doit être traité avant. Cette exception doit être prouvée et consignée, pas supposée.

## 1. OBJET, PORTÉE ET DESTINATAIRES

### 1.1 Objet

Le prompt permet à Codex, Claude Code, un autre agent de développement ou une équipe humaine de reprendre le repository sans perdre la vision finale et sans confondre documentation et réalité d'implémentation.

Il doit permettre quatre résultats: comprendre exactement l'état courant; mesurer l'écart avec la cible; décider ce qui doit être conservé, réformé, migré ou supprimé; exécuter la transformation par missions courtes, vérifiables et réversibles autant que possible.

### 1.2 Portée

Le prompt couvre: Git; branches; commits; Pull Requests; issues; structure du repository; packages; runtimes; starters; contrats; schemas; tests; goldens; CI/CD; sécurité; dépendances; ADR; documentation technique; qualité; architecture; migrations; compatibilité; release engineering.

Il ne remplace pas le Cahier des charges, l'Architecture technique, la Roadmap ni le registre des risques. Il les transforme en contraintes d'exécution sur le repository.

## 2. SOURCES DE VÉRITÉ ET ORDRE D'AUTORITÉ

### 2.1 Pour la cible produit

Le dossier Enistere Foundation comprend désormais sept documents. Les numéros ci-dessous renvoient aux documents effectivement présents dans le dossier :

1. **01 — Synthèse de l'étude** : contexte, vision et décisions fondatrices — Software System Engineering Platform dotée d'un Governed System Compiler et d'un Evidence-Driven System Evolution Engine.
2. **02 — Cahier des charges produit** : exigences fonctionnelles et non fonctionnelles. Fait autorité pour le périmètre fonctionnel et les critères d'acceptation.
3. **03 — Architecture technique** : décisions d'architecture — Foundation Kernel, Control Plane, Engine/Compilation Runtime, Execution Workers, Extension & Registry Ecosystem, Surfaces & Connectors, AI Gateway/Agent Runtime —, sécurité, contrats et frontières techniques. Fait autorité pour les frontières, contrats et contraintes techniques.
4. **04 — Système de design UX UI et interfaces de référence** (anciennement numéroté 12), avec `design-tokens.json` : langage visuel, composants, parcours et états d'interface du Web Workbench et des autres surfaces de collaboration. Base de conception à respecter dès l'implémentation frontend ; n'est pas contractuelle écran par écran et reste à éprouver par tests utilisateurs.
5. **05 — ce prompt** de reprise du repository et de réalignement produit.
6. **06 — Versions et feuille de route** (anciennement numéroté 05) : roadmap gate-driven (RELEASE GATE OVER CALENDAR), missions techniques séquencées E0 → E10, gates P1–P10 et horizons R0/V1/V2… — la séquence de référence utilisée en section 8.
7. **07 — Carte produit et capacités** (anciennement numéroté 06) : seize Product Capabilities CAP-01 à CAP-16, organisées en trois plans logiques (Knowledge & Decision, System Compilation, Assurance & Evolution) et six zones techniques (Foundation Kernel, Control Plane, Engine/Compilation Runtime, Execution Workers, Extension & Registry Ecosystem, Surfaces & Connectors), avec AI Gateway/Agent Runtime comme plan transversal.

Lis également, avant tout déploiement ou décision touchant l'infrastructure partagée, la documentation de production de l'écosystème Enistere (le socle commun de production, hors dossier projet) : elle s'impose comme contrainte d'implémentation dès que le projet touche au réseau, aux secrets, aux bases de données partagées, à l'observabilité ou au déploiement (section 2B).

Le dossier ne comporte plus de document séparé d'index/gouvernance documentaire, de table de vérité séparée, de Plan d'affaires distinct ni de document dédié « Risques, conformité et hypothèses » : les contraintes économiques pertinentes sont intégrées aux documents 01 et 02 ; les risques et la conformité sont intégrés aux documents 02 et 03 et suivis de façon vivante dans `docs/governance/RISK_REGISTER.md` ; le rôle d'index et de table de vérité est désormais tenu par `CONTEXT.md`, `DECISIONS.md` et le registre `docs/adr/` (sections 2C à 2F). Ne travaille jamais à partir du seul prompt si les documents 01 à 07 sont accessibles.

### 2.2 Pour l'implémentation

Le repository Git réel prévaut: branche principale, code, contrats, tests, dépendances, CI, artefacts, releases, ADR et preuves d'exécution.

Une mention historique « terminé », « supporté », « conforme » ou « mature » n'a aucune autorité si elle n'est pas confirmée par l'état réel et les preuves correspondantes.

### 2.3 Règle de conflit et ordre d'autorité

Si le code contredit la cible, ne pas réécrire silencieusement la cible: documenter l'écart, mesurer son impact et proposer une option de convergence.

Si la documentation historique contredit le code actuel, le code est source de vérité de l'implémentation.

Si une nouvelle contrainte technique remet en cause une décision cible, produire une proposition d'ADR ou de décision; ne pas introduire l'écart comme fait accompli.

**Ordre d'autorité en cas de conflit :**

1. décisions explicites les plus récentes des documents 01 à 04 (la Synthèse fixe les décisions structurantes ; le Cahier des charges fixe les obligations produit ; l'Architecture fixe la traduction technique ; l'UX fixe les parcours et surfaces) ;
2. politique et procédure de production Enistere pour toute contrainte touchant la plateforme partagée (section 2B) ;
3. ADR validés du projet (`docs/adr/`) ;
4. code existant (le repository réel, tel que défini en 2.2).

Ne résous jamais une contradiction silencieusement : consigne-la dans un ADR ou dans `CONTEXT.md` avec une proposition de résolution, et signale-la dans le rapport de mission (section 11).

## 2B. PLATEFORME DE PRODUCTION ENISTERE — CONTRAINTES OBLIGATOIRES

Ces règles s'appliquent à toute application, API, interface, worker ou service destiné à rejoindre l'écosystème de production partagé Enistere. Elles sont contraignantes dès la conception du repository et priment sur toute convention d'infrastructure alternative en cas de conflit.

Hébergement et entrée: l'hôte de production est un VPS Ubuntu 24.04 dont les seuls ports publics sont 22, 80 et 443. Traefik est l'unique point d'entrée HTTP/HTTPS et obtient ses certificats par DNS-01; aucune application ne publie de port hôte. Cloudflare fournit DNS, proxy, WAF et TLS public, et les interfaces d'administration passent par Cloudflare Access.

Réseaux Docker: un service ne rejoint que les réseaux Docker strictement nécessaires parmi entrée publique (`enistere_public`), services internes (`enistere_internal`), données (`enistere_data`) et observabilité (`enistere_observability`). PostgreSQL et Redis ne rejoignent jamais le réseau d'entrée publique.

Conteneurs: chaque processus dispose d'une image de production dédiée, minimale, construite en plusieurs étapes, exécutée avec un utilisateur non-root, système de fichiers en lecture seule quand c'est possible, `no-new-privileges`, un init, des limites de ressources et une rotation des journaux. Les versions de base sont fixées explicitement; la CI publie l'image par digest immuable, jamais par tag `latest` — le VPS de production ne compile jamais l'application. Chaque service long expose un healthcheck qui distingue la vie du processus de sa capacité réelle à servir avec ses dépendances. Les migrations sont un job ponctuel exécuté avant le remplacement des services.

Identité et secrets: l'application utilise le fournisseur OIDC partagé de la plateforme ou justifie une exception par ADR. Les secrets vivent dans des fichiers protégés lisibles uniquement par le service concerné et n'apparaissent jamais dans les arguments de commande, manifestes Git, images ou journaux CI.

CI/CD: une pull request exécute lint, typecheck, tests, contrôle des contrats, migrations depuis une base vierge, build de production, audit de dépendances et recherche de secrets. La livraison de production part d'un tag protégé: construction et publication des images une seule fois, capture des digests, sauvegarde de l'état utile, migrations ponctuelles, démarrage avec attente des healthchecks, et restauration automatique en cas d'échec. Validation ordinaire et publication de production sont deux workflows distincts.

Données et reprise: les données persistantes utilisent `/srv/enistere/data` ou des volumes documentés; configurations sous `/srv/enistere/platform`, application sous `/srv/enistere/apps/foundation`. Le stockage d'objets applicatif (bundles de contrats signés, artefacts publiés par le registry de CAP-16 — Ecosystem, Registry & Distribution, exports d'Evidence) utilise Cloudflare R2 en production et ne remplace jamais la sauvegarde transactionnelle. La sauvegarde centrale Restic vers Backblaze B2 couvre bases, configurations et manifestes avec une rétention de 7 quotidiennes, 4 hebdomadaires et 6 mensuelles, et n'est opérationnelle qu'après restauration réelle démontrée. Si les Execution Workers (CAP-13/CAP-14) ont besoin d'une file de messages plus riche que Redis, l'instance RabbitMQ partagée de la plateforme est utilisée sur `enistere_internal` après ADR ; elle ne devient jamais une source de vérité transactionnelle.

Observabilité et Portainer: le service expose métriques et journaux structurés sans secret; Prometheus, Grafana, Loki et Uptime Kuma restent privés. Chaque application fournit un runbook (architecture déployée, DNS, réseaux, secrets par nom, sauvegarde, restauration, rollback, contacts d'alerte). Portainer sert uniquement à l'inventaire et à l'intervention d'urgence, jamais de source de vérité; toute modification durable y est reproduite dans Git.

Interdictions strictes, sans exception: aucun port applicatif publié sur l'hôte en dehors de 22/80/443; aucun contournement direct de Traefik ou de Cloudflare vers l'origine; aucun secret commité dans Git, un manifeste, une image ou un journal CI; aucune compilation de l'application sur le VPS de production; aucune image taguée `latest` en production; Portainer n'est jamais une source de vérité.

Critères d'admission en production — une application ne rejoint l'écosystème que lorsque: CI verte et image fixée par digest; secrets hors dépôt avec droits minimaux; limites de ressources et healthchecks présents; migrations rejouées depuis une base vierge; sauvegarde et restauration isolée démontrées; TLS, DNS, WAF, OIDC et routes critiques testés depuis l'extérieur; aucun port interne publié; métriques/journaux/alertes visibles; rollback exercé; runbook à jour. Une exception temporaire n'est valide que si elle est écrite, datée, attribuée à un propriétaire et assortie d'une échéance. Ces critères sont documentés dans `docs/governance/PRODUCTION_READINESS.md` (section 2D).

## 2C. GOUVERNANCE ET PILOTAGE DU PROJET — CONTINUITÉ AGENT / HUMAIN

Le projet peut être repris à tout moment par un agent IA différent (Codex, Claude Code ou équivalent) ou par un développeur humain, sans continuité de conversation. Ce prompt, associé aux fichiers de gouvernance de la section 2D, doit permettre à lui seul de reconstituer où en est le projet et ce qu'il reste à faire — avant même de relancer le préflight de la section 4.

**Protocole de reprise, avant toute mission :**

1. lire `CONTEXT.md` — vision, périmètre, décisions validées, mission active ;
2. lire `CURRENT_STATE.md` — état réel du repository, tests, dettes et gaps connus ;
3. lire `BACKLOG.md` et la mission active qu'il désigne ;
4. lire les ADR les plus récents dans `docs/adr/` pertinents pour la mission ;
5. lire `IMPLEMENTATION_MATRIX.md` pour connaître la couverture déjà prouvée des capacités CAP-01 à CAP-16 (document 07) et des contrats E0 (A1–A7, section 8.1).

Ne jamais engager une nouvelle mission sur un état marqué Blocked dans `CURRENT_STATE.md` sans lever explicitement le blocage constaté, ou sans le signaler à nouveau si la levée n'est pas possible.

**Registre des décisions** : toute décision d'architecture, de produit ou de dérogation à un document canonique est un ADR daté et attribué, versionné dans `docs/adr/`, et résumée dans `DECISIONS.md`. Une modification importante doit être répercutée dans les documents concernés. Une décision non tracée n'existe pas pour la mission suivante.

**Journal d'avancement** : chaque rapport de mission (section 11, gabarit en Annexe A, section 16) met à jour `CURRENT_STATE.md` et, si pertinent, `IMPLEMENTATION_MATRIX.md` et `DECISIONS.md` dans le repository — jamais seulement affiché en sortie de conversation. Cet ensemble de fichiers est la source de vérité sur l'avancement réel, indépendamment de l'agent ou de la personne qui l'a produit.

**Propriétaires et validations** (voir matrice détaillée en section 2F) : les décisions produit sont arbitrées par le responsable produit (documents 01/02/06/07), les décisions techniques par le responsable technique (document 03), les décisions d'interface par le design UX UI avec revue métier et audit d'accessibilité (document 04), et les décisions de gouvernance, de risque ou d'investissement — en l'absence de document dédié dans le dossier actuel — par la direction générale, tracées dans `docs/governance/RISK_REGISTER.md` et `DECISIONS.md`. Un agent IA ne se substitue pas à ces validations humaines ; il prépare la décision et l'expose dans son rapport de mission (section 11), et s'arrête sur ce point précis sans bloquer le reste de la mission si celle-ci peut progresser autrement.

**Cohérence documentaire** : quiconque constate une divergence entre deux documents, ou entre le repository et un document, l'inscrit dans `CONTEXT.md` et dans `DECISIONS.md`, propose une résolution, mais ne la tranche pas seul si elle touche un arbitrage marqué « validation humaine requise ».

Cette section remplace tout mécanisme antérieur fondé sur un journal de missions isolé : elle garantit qu'un changement d'agent IA ou un relais humain ne fait perdre ni le contexte, ni les décisions déjà prises, ni la trace des points encore ouverts.

## 2D. FICHIERS DE GOUVERNANCE OBLIGATOIRES

Crée à la racine du repository :

- `README.md`
- `CONTEXT.md`
- `AGENTS.md`
- `ROADMAP.md`
- `BACKLOG.md`
- `CURRENT_STATE.md`
- `IMPLEMENTATION_MATRIX.md`
- `DECISIONS.md`
- `SECURITY.md`
- `CONTRIBUTING.md`
- `CHANGELOG.md`

Crée également :

- `docs/adr/README.md` (registre et gabarit ADR)
- `docs/runbooks/README.md` (index des runbooks — au minimum `DEPLOYMENT.md`, `ROLLBACK.md`, `DATABASE_RESTORE.md`, `SECRET_ROTATION.md`, `LOCAL_DEVELOPMENT.md`)
- `docs/governance/PRODUCTION_READINESS.md` (checklist d'admission en production, voir section 2B)
- `docs/governance/DEFINITION_OF_DONE.md` (definition of done, à croiser avec les gates E0–E10 et P1–P10 du document 06)
- `docs/governance/RISK_REGISTER.md` (risques et hypothèses du projet, tenu à jour au fil du développement puisque le dossier ne contient plus de document dédié aux risques : ce registre en devient la source de vérité vivante)
- `docs/governance/DEPENDENCIES.md` (registre des dépendances critiques — runtimes, contrats externes, services partagés de la plateforme)

`README.md` reste court : présentation du produit, lien vers `CONTEXT.md`, instructions de démarrage local, lien vers les documents 01 à 07 et vers la documentation de production Enistere. `SECURITY.md` documente la politique de divulgation des vulnérabilités et renvoie vers `docs/governance/RISK_REGISTER.md`. `CONTRIBUTING.md` documente les conventions de commit, de PR et de tests (section 9). `CHANGELOG.md` suit les changements notables par mission/tag, alignés sur les missions E0–E10.

## 2E. CONTEXT.md, AGENTS.md, CURRENT_STATE.md, IMPLEMENTATION_MATRIX.md

**CONTEXT.md** doit résumer, sans jamais recopier les documents source : vision (Governed System Compiler, Evidence-Driven System Evolution Engine) ; périmètre retenu et hors périmètre pour la mission en cours (greenfield, brownfield, lifecycle) ; principes constitutionnels non négociables (section 3) ; architecture (renvoi vers document 03) ; production Enistere (renvoi vers section 2B) ; décisions validées (renvoi vers `DECISIONS.md`) ; mission active ; prochaine mission unique ; liens vers les documents 01 à 07.

**AGENTS.md** doit imposer à tout agent : lire `CONTEXT.md` ; lire `CURRENT_STATE.md` ; lire la mission active dans `BACKLOG.md` ; lire les ADR récents ; respecter l'architecture du document 03 et les principes constitutionnels de la section 3 ; ne jamais invente le résultat d'un test non exécuté, transformer confidence en approval, contourner un UNSUPPORTED par fallback silencieux ou cacher un échec de sécurité (section 10) ; ne pas modifier le périmètre sans ADR ; mettre à jour `CURRENT_STATE.md` après tout travail ; mettre à jour `IMPLEMENTATION_MATRIX.md` avec preuve ; documenter les décisions dans `DECISIONS.md` ; garder les secrets hors dépôt ; exécuter les tests avant de conclure une mission ; ne jamais marquer « done » sans preuve ; suivre le protocole de reprise de la section 2C ; proposer, en fin de mission, exactement une prochaine action unique (section 11).

**CURRENT_STATE.md** — format minimum : Commit/branch, Date, Mission, Completed, In progress, Blocked, Tests, Known gaps, Decisions, Next single action. Doit refléter le repository réel, jamais une intention ni une description issue de la documentation seule (section 2.2).

**IMPLEMENTATION_MATRIX.md** — tableau Capability · Plan logique / zones techniques · Implemented · Tested · Production-ready · Evidence · Mission E0–E10 associée · Notes, couvrant l'intégralité des seize Product Capabilities CAP-01 à CAP-16 du document 07 (Carte produit et capacités) dès le bootstrap. Tant que la séquence n'a pas dépassé E0, la matrice suit en priorité les sept contrats A1–A7 de la section 8.1 (Requirement Baseline, Decision Set, Effective Organization Context, System Definition, Domain Contract, Change Request, EvidenceRecord), puis étend sa couverture à CAP-01…CAP-16 au fil des missions E1–E10. Une capability ou un contrat n'est VERIFIED que si une preuve adaptée existe : test automatisé, golden Asteria, conformance ou audit — jamais une déclaration sans Evidence.

## 2F. MATRICE DE PROPRIÉTÉ ET DE VALIDATION DOCUMENTAIRE

| Document / fichier | Rôle propriétaire | Portée d'autorité | Validation requise pour modification |
|---|---|---|---|
| 01 Synthèse de l'étude | Direction / Produit | Vision, décisions structurantes | Validation humaine requise |
| 02 Cahier des charges produit | Produit | Exigences fonctionnelles, critères d'acceptation | Validation humaine requise |
| 03 Architecture technique | Technique | Kernel/Engine/Control Plane/Workers, sécurité, contrats, exploitation | ADR + revue technique ; validation humaine si remise en cause d'un ADR majeur |
| 04 Système de design UX UI | UX / Design produit | Design system, parcours, accessibilité | Revue UX ; validation humaine si changement de tokens/marque |
| 05 (ce prompt) | Gouvernance / Pilotage | Méthode de reprise, réforme, gates, règles d'exécution agent | Validation humaine requise |
| 06 Versions et feuille de route | Produit / Pilotage | Séquence E0–E10, gates P1–P10, horizons R0/V1/V2 | Ajustement libre dans l'horizon en cours ; changement d'ordre des missions/gates = validation humaine |
| 07 Carte produit et capacités | Produit / Architecture | Identifiants CAP-01–CAP-16, plans logiques, zones techniques | Validation humaine requise pour ajout/suppression d'une capacité |
| `CONTEXT.md` | Agent en session + Gouvernance | Reflet vivant de l'état et des décisions | Mise à jour libre en fin de mission ; changement de vision = validation humaine |
| `AGENTS.md` | Gouvernance | Règles permanentes des agents | Validation humaine requise |
| `CURRENT_STATE.md` / `IMPLEMENTATION_MATRIX.md` | Agent en session | État factuel, traçabilité des preuves | Mise à jour libre et obligatoire en fin de mission |
| `DECISIONS.md` / `docs/adr/` | Technique + Gouvernance | Journal des décisions et ADR | Ajout libre ; suppression/réécriture = validation humaine |
| `docs/governance/RISK_REGISTER.md` | Direction / Risques | Risques et hypothèses (dette et risques, section 5.D) | Revue gouvernance ; tout risque Critical/High = validation humaine |
| `docs/governance/PRODUCTION_READINESS.md` | Technique + Gouvernance | Critères d'admission en production (section 2B) | Validation humaine requise avant premier déploiement production |

Toute divergence entre documents doit être résolue en revenant à l'ordre d'autorité de la section 2.3 et signalée au propriétaire concerné via `CONTEXT.md` ou `DECISIONS.md`. Aucun agent IA ne tranche seul un arbitrage marqué « validation humaine requise » : il documente l'option recommandée et s'arrête sur ce point précis, sans bloquer le reste de la mission si celle-ci peut progresser autrement.

## 2G. CONVENTION DE NOMMAGE

Utilise désormais exclusivement les conventions suivantes dans le code, les manifests, la documentation et les artefacts :

- produit : Enistere Foundation ;
- nom court : Foundation ;
- repository : `enistere-foundation` ;
- packages : `@enistere/foundation-*` ;
- API : `api.foundation.enistere.com` ;
- Web / Control Plane (Web Workbench) : `foundation.enistere.com` ;
- Registry (CAP-16 — Ecosystem, Registry & Distribution) : `registry.foundation.enistere.com` ;
- CLI : binaire/package `enistere-foundation` ;
- Sandbox/staging : `staging.foundation.enistere.com`.

Ces noms de domaine sont une proposition cohérente avec la convention retenue pour l'ensemble des projets Enistere ; ils doivent être confirmés par un ADR avant toute création DNS effective, conformément aux critères d'admission en production de la section 2B.

## 3. PRINCIPES D'EXÉCUTION

INSPECT BEFORE CHANGE.

EVIDENCE BEFORE CLAIM.

PLAN BEFORE APPLY.

MIGRATE BEFORE DELETE.

ONE CANONICAL MODEL PER RESPONSIBILITY.

NO SILENT FALLBACK.

NO CLIENT-SPECIFIC FORK IN THE GENERIC KERNEL.

NO REWRITE FOR AESTHETICS.

NO DOCUMENTATION AS A SUBSTITUTE FOR TESTS.

Toute mission doit être suffisamment petite pour que son objectif, son diff, ses tests et son résultat puissent être expliqués indépendamment.

## 4. PRÉFLIGHT OBLIGATOIRE

Avant de modifier un fichier, produire un état des lieux vérifiable.

### 4.1 Git

Identifier: repository et remotes; branche courante; branche principale; HEAD; statut dirty/clean; commits récents; branches locales et distantes pertinentes; tags/releases; divergences; worktrees; submodules éventuels.

### 4.2 Collaboration

Inspecter les Pull Requests ouvertes ou récemment fusionnées, issues pertinentes, discussions techniques disponibles, commentaires de review et CI associée. Ne pas déduire qu'une branche locale est canonique si main ou une PR plus récente a déjà changé la situation.

### 4.3 Structure

Cartographier les répertoires de premier et deuxième niveau, packages/workspaces, applications, libraries, schemas, contrats, tools, scripts, docs, goldens, fixtures, migrations et exemples.

### 4.4 Runtimes et starters

Identifier exactement les familles réellement présentes et leur état: NestJS, Spring Boot, FastAPI, Next.js, Angular, React Native, Flutter ou toute autre famille observée. Distinguer: squelette présent; générable; bootable; testé; conforme; utilisé dans un golden.

### 4.5 Contrats et modèles

Inventorier les modèles aujourd'hui autoritatifs ou calculés: blueprint, canonical system, resolved system, generation plan, runtime contracts, capability manifests, platform baseline, diagnostics, ownership, migration metadata, etc. Relever les doublons, lectures legacy et frontières floues.

### 4.6 Tests et preuves

Exécuter ou inspecter selon les instructions du repository: unit tests; integration tests; goldens; conformance; type checks; lint; build; dependency audit; vulnerability checks; docs/link checks; migration tests. Tout test non exécuté doit être marqué NOT RUN avec la raison.

### 4.7 Architecture et documentation

Lire les ADR et documents techniques qui décrivent l'architecture réellement implémentée. Identifier ceux qui sont actifs, obsolètes, contradictoires ou historiques. Ne pas supprimer un document historique avant d'avoir décidé sa destination de migration ou d'archivage.

### 4.8 Sécurité et supply chain

Inspecter les dépendances critiques, secrets accidentels, workflows CI, permissions, publication de packages, registries, signatures, vulnérabilités connues et configuration des outils de sécurité disponibles.

## 5. RAPPORT DE BASELINE OBLIGATOIRE

Le préflight produit un rapport contenant:

A. IDENTITÉ DU SNAPSHOT

Repository; branch; HEAD; date; working tree; remote baseline.

B. ÉTAT PAR ZONE

Kernel / models; engine; factory/generator; runtimes; capabilities; schemas; contracts; CLI; web/API éventuels; workers éventuels; tests; docs; CI; security.

C. CLAIM MATRIX

Pour chaque capacité revendiquée: CLAIMED / OBSERVED / PROVEN / GAP / UNKNOWN.

D. DETTE ET RISQUES

Doublons; legacy reads; modèles omniscients; hardcoding runtime; parité incomplète; migrations fragiles; tests manquants; dépendances vulnérables; architecture documentaire dérivée du code mais non validée.

E. PREUVES

Commandes exécutées; résultats; chemins; commits; logs; rapports; artefacts.

Le rapport se termine par exactement UNE prochaine action technique recommandée.

## 6. COMPARAISON À LA CIBLE

Après baseline, construire une Gap Matrix entre l'existant et la cible Foundation.

Axes minimaux:

- contracts canoniques;

- Requirement Baseline;

- Decision Set;

- Effective Organization Context;

- System Definition;

- Domain Contract;

- Change Request;

- EvidenceRecord;

- Desired / Resolved / Observed;

- Kernel boundary;

- Engine / resolver / planner;

- ownership;

- extension protocol;

- runtime adapters;

- Platform Capabilities;

- Platform Baseline;

- conformance;

- lifecycle;

- brownfield;

- surfaces;

- security;

- observability;

- portability;

- migration and compatibility.

Pour chaque axe: EXISTANT; CIBLE; ÉCART; PREUVE; RISQUE; ACTION; HORIZON ROADMAP.

## 7. RÉFORME DU REPOSITORY — QUAND ET COMMENT

### 7.1 Réforme autorisée

Une réforme est autorisée lorsqu'au moins une des conditions suivantes est démontrée:

- plusieurs modèles prétendent être source de vérité pour la même responsabilité;

- une architecture legacy empêche un invariant du cahier des charges;

- un hardcoding technologique empêche l'Extension by Contract;

- une structure rend les migrations ou tests de conformance impraticables;

- un package ou dossier n'a plus de responsabilité cohérente;

- une dette crée des risques de corruption, divergence ou overwrite;

- la séparation Kernel / Engine / Workers / Surfaces est impossible sans déplacement structurant;

- des contraintes de sécurité ou supply chain nécessitent une isolation.

### 7.2 Réforme non justifiée

Ne pas réformer uniquement pour: renommer les dossiers; adopter une architecture à la mode; passer en microservices; changer de langage; remplacer un framework qui fonctionne; aligner le repository sur un diagramme esthétique; supprimer l'historique; réécrire du code prouvé sans bénéfice mesuré.

### 7.3 Méthode de réforme

OBSERVE → MAP → CLASSIFY → PROPOSE OPTIONS → DECIDE → MIGRATION PLAN → COMPATIBILITY SEAM → TRANSFORM → VERIFY → REMOVE LEGACY ONLY AFTER PROOF.

Les options doivent au minimum inclure KEEP, ADAPT, EXTRACT, REPLACE ou RETIRE, avec coût, risque, compatibilité et effet sur la roadmap.

## 8. SÉQUENCE TECHNIQUE DE RÉFÉRENCE

Après le préflight et la décision de transformation, suivre la séquence définie par la roadmap. Le point d'entrée actuel est E0 — Contract Foundation.

### 8.1 E0 — Contract Foundation

Objectif: introduire ou consolider les contrats de première classe nécessaires à la cible sans cutover brutal.

Contrats attendus:

A1 Requirement Baseline.

A2 Decision Set.

A3 Effective Organization Context.

A4 System Definition.

A5 Domain Contract.

A6 Change Request.

A7 EvidenceRecord.

Primitives partagées: version; stable ref; provenance; acceptance/status; diagnostics; digest; migration/version seam.

Golden de preuve: Asteria, comprenant Requester Web, Internal Ops Web, Field Mobile, Authority API et Async Worker. Le Worker est un test obligatoire d'extensibilité et de non-réduction du système aux seules apps Web/API.

Non-objectifs E0: pas de cutover complet; pas de suppression massive des modèles historiques; pas de Control Plane complet; pas de refonte CLI générale; pas de Workbench; pas de brownfield; pas d'agents avancés; pas de migration globale de toutes les familles runtime.

Gate E0: PASS uniquement si les contrats sont versionnés, testés, sérialisés de manière déterministe lorsque applicable, reliés aux diagnostics et utilisables dans le golden sans créer une nouvelle source de vérité concurrente.

Si E0 PASS: mission suivante E1 — Kernel Façade, sauf preuve nouvelle nécessitant un ajustement accepté.

## 9. RÈGLES DE BRANCHE ET DE COMMIT

Créer une branche dédiée par mission sauf instruction contraire du repository.

Un commit doit représenter une unité explicable.

Ne pas mélanger refactor massif, feature, documentation et upgrade de dépendances sans nécessité.

Avant commit: tests pertinents; diff review; generated files identifiés; secret scan si disponible.

Ne jamais force-push une branche partagée sans autorisation explicite.

Ne jamais publier, merger ou supprimer une branche distante sans autorisation utilisateur ou workflow explicite.

## 10. RÈGLES POUR LES AGENTS IA

Un agent peut analyser, proposer et modifier dans le scope de la mission. Il ne doit jamais:

- inventer le résultat d'un test non exécuté;

- qualifier une capacité de mature sans critère;

- transformer confidence en approval;

- modifier un contrat canonique hors scope pour « faire passer » un test;

- contourner un UNSUPPORTED par fallback silencieux;

- supprimer des migrations ou goldens pour réduire les échecs;

- cacher un échec de sécurité;

- produire de la documentation affirmant un état non observé;

- interpréter une conversation comme une source durable d'autorité.

## 11. FORMAT DES MISSIONS

Chaque mission doit commencer par:

MISSION ID.

OBJECTIF.

IN SCOPE.

OUT OF SCOPE.

BASELINE GIT.

CONTRATS / ADR IMPACTÉS.

CRITÈRES DE PASS.

Chaque mission doit se terminer par:

RÉSULTAT: PASS / PARTIAL / FAIL / BLOCKED.

DIFF SUMMARY.

PREUVES.

TESTS EXÉCUTÉS.

TESTS NON EXÉCUTÉS.

MIGRATIONS.

RISQUES RÉSIDUELS.

DOCUMENTATION MODIFIÉE.

PROCHAINE ACTION UNIQUE.

Ce rapport, une fois produit, met à jour `CURRENT_STATE.md`, `IMPLEMENTATION_MATRIX.md`, `DECISIONS.md` et `BACKLOG.md` (section 2C) — il ne reste jamais seulement dans la sortie de conversation.

## 12. PROMPT MAÎTRE PRÊT À L'EMPLOI

--- DÉBUT DU PROMPT ---

Tu reprends le développement du repository Enistere Foundation à partir de son état réel. Ta mission n'est pas de reconstruire le produit à partir de la documentation comme si le repository était vide. Tu dois d'abord comprendre ce qui existe, ce qui est prouvé, ce qui est legacy, ce qui est contradictoire et ce qui peut être réutilisé.

CONTEXTE PRODUIT

Enistere Foundation est une Software System Engineering Platform dotée d'un Governed System Compiler et d'un Evidence-Driven System Evolution Engine. La cible relie intention, requirements, décisions, contexte organisationnel, System Definition, Domain Contract, System Closure, résolution, Execution Plan, implémentation native, Evidence, Observed State et évolution contrôlée.

La documentation finale décrit la CIBLE. Le repository réel décrit l'ÉTAT D'IMPLÉMENTATION. Ne confonds jamais les deux.

SOURCES DE VÉRITÉ CIBLE

01 Synthèse de l'étude.

02 Cahier des charges produit.

03 Architecture technique.

04 Système de design UX UI et interfaces de référence, avec `design-tokens.json`.

06 Versions et feuille de route (roadmap gate-driven E0–E10, gates P1–P10).

07 Carte produit et capacités (CAP-01 à CAP-16).

Documentation de production de l'écosystème Enistere (socle commun, hors dossier projet — section 2B).

RÈGLES CONSTITUTIONNELLES

- Respecter sans exception les contraintes de la plateforme de production Enistere (section 2B) dès qu'un élément touche réseau, secrets, bases partagées, observabilité ou déploiement.

- Tenir à jour `CONTEXT.md`, `CURRENT_STATE.md`, `IMPLEMENTATION_MATRIX.md` et `DECISIONS.md` (sections 2C à 2F) à chaque mission.

- Inspect before change.

- Evidence before claim.

- Plan before apply.

- Migrate before delete.

- Desired, Resolved et Observed restent distincts.

- Une Product Capability CAP-01…CAP-16 n'est pas une Platform Capability technique.

- Le Kernel reste générique et framework-independent.

- Les runtimes, capabilities, integrations, design adapters, checkers, migrations et observers s'étendent par contrat.

- Aucun overwrite silencieux du owner-managed code.

- Aucun fallback silencieux pour un chemin unsupported.

- Aucun statut VERIFIED sans preuve.

- L'IA peut OBSERVE, PROPOSE et IMPLEMENT dans son scope; elle ne s'accorde pas automatiquement DECIDE ou VERIFY.

ÉTAPE 1 — PRÉFLIGHT OBLIGATOIRE

Avant toute modification, inspecte: git status, remotes, branche principale, HEAD, branches, tags, commits récents, PR/issues disponibles, structure du repository, packages, workspaces, runtimes, schemas, contrats, modèles, CLI, tests, goldens, CI, migrations, ADR, docs, dépendances, vulnérabilités et outils de qualité.

Exécute les tests raisonnablement disponibles selon les instructions du repository. Si un test n'est pas exécuté, indique NOT RUN et pourquoi.

ÉTAPE 2 — BASELINE

Produis un rapport court mais complet: snapshot Git; carte des zones; état des runtimes; modèles/contrats présents; tests; dettes; claims observés; risques; preuves.

ÉTAPE 3 — GAP ANALYSIS

Compare l'existant à la cible. Pour chaque responsabilité structurante, indique EXISTANT / CIBLE / ÉCART / PREUVE / ACTION.

ÉTAPE 4 — RÉFORME ÉVENTUELLE

Tu peux proposer une réforme du repository si l'écart le justifie. Ne réforme jamais pour des raisons esthétiques. Toute réforme doit présenter au moins les options KEEP / ADAPT / EXTRACT / REPLACE ou RETIRE et leurs conséquences.

Ne supprime aucun modèle, dossier, migration, golden ou compatibilité legacy avant qu'un seam de migration et des preuves rendent la suppression sûre.

ÉTAPE 5 — PROCHAINE ACTION

Après inspection, propose exactement UNE prochaine mission technique. Si aucun blocage préalable démontré n'existe, cette mission doit être E0 — Contract Foundation.

E0 doit introduire/consolider: Requirement Baseline, Decision Set, Effective Organization Context, System Definition, Domain Contract, Change Request et EvidenceRecord, plus les primitives partagées de version/ref/provenance/acceptance/diagnostics/digest. Utilise le golden Asteria multi-application avec Async Worker comme test d'extensibilité.

FORMAT DE SORTIE

1. Snapshot Git.

2. État réel résumé.

3. Écarts critiques.

4. Preuves exécutées.

5. Décision KEEP/ADAPT/EXTRACT/REPLACE/RETIRE si nécessaire.

6. Une seule prochaine mission.

7. Critères PASS de cette mission.

N'entreprends pas la mission suivante tant que la mission courante n'a pas produit son rapport et ses preuves.

--- FIN DU PROMPT ---

## 13. SCHÉMA DE GOUVERNANCE DE LA REPRISE

## Figure 1 — Boucle de gouvernance de la reprise depuis l'existant

CIBLE DOCUMENTAIRE

↓ contraint

INSPECTION DU REPOSITORY RÉEL

↓

BASELINE OBSERVÉE

↓

GAP MATRIX

↓

OPTIONS DE TRANSFORMATION

↓ décision explicite

PLAN DE MIGRATION / MISSION

↓

IMPLÉMENTATION

↓

TESTS / GOLDENS / CONFORMANCE / SECURITY

↓

EVIDENCE

↓

NOUVEL ÉTAT OBSERVÉ

↺ compare à la cible

Le dossier ne « gagne » pas contre le code; le code ne « gagne » pas contre la cible. Le système de gouvernance explicite l'écart, choisit la transformation et exige une preuve avant de déclarer la convergence.

### 13.1 Persistance et propriétaires — continuité agent / humain

Le projet peut être repris à tout moment par un agent IA différent ou par un développeur humain, sans continuité de conversation. La boucle de la Figure 1 ne suffit à elle seule que si son historique est conservé: chaque rapport de mission (section 11, Annexe A) met à jour `CURRENT_STATE.md`, `IMPLEMENTATION_MATRIX.md` et `DECISIONS.md` dans le repository, jamais seulement affiché en sortie de conversation. Le protocole complet de reprise — ordre de lecture, registre des décisions, journal d'avancement, propriétaires et validations — est défini en section 2C ; il est la première chose à appliquer avant toute nouvelle mission, avant même de relancer le préflight de la section 4.

Toute décision d'architecture ou de dérogation à un document canonique est un ADR daté et attribué, versionné dans `docs/adr/`. Une décision non tracée n'existe pas pour la mission suivante.

Propriétaires et validations : voir la matrice détaillée en section 2F. En synthèse, les décisions produit sont arbitrées par le responsable produit (documents 01/02/06/07), les décisions techniques par le responsable technique (document 03), les décisions d'interface par le design UX UI (document 04), et les décisions de gouvernance ou de risque — en l'absence de document dédié dans le dossier actuel — par la direction générale, tracées dans `docs/governance/RISK_REGISTER.md`. Un agent IA ne se substitue pas à ces validations humaines; il prépare la décision et l'expose dans son rapport de mission (section 11).

## 14. SIGLES ET ABRÉVIATIONS

ADR — Architecture Decision Record.

API — Application Programming Interface.

CI/CD — Continuous Integration / Continuous Delivery ou Deployment selon le contexte.

CLI — Command-Line Interface.

IR — Intermediate Representation.

PR — Pull Request.

SBOM — Software Bill of Materials.

SLO — Service Level Objective.

## 15. GLOSSAIRE

Baseline Git: snapshot vérifiable de l'état du repository utilisé comme point de départ d'une mission.

Gap Matrix: comparaison structurée entre l'existant observé et la cible acceptée.

Compatibility seam: frontière temporaire permettant de maintenir l'ancien et le nouveau modèle pendant une migration contrôlée.

Golden: fixture/scénario de référence utilisé pour vérifier un comportement complet et reproductible.

Conformance: vérification qu'une implémentation respecte un contrat comportemental ou technique défini.

Claim: assertion de support, maturité ou comportement qui doit être associée à une preuve appropriée.

Reform: modification structurelle du repository justifiée par un besoin d'architecture, de sécurité, de migration ou de cohérence, et non par la seule préférence de forme.

Product Capability (CAP-xx): responsabilité produit stable parmi les seize définies au document 07 (CAP-01 à CAP-16), distincte d'une Platform Capability technique, d'une Facet, d'une Integration ou d'une Extension.

## 16. ANNEXE A — TEMPLATE DE RAPPORT DE MISSION

Mission:

Date:

Branch / HEAD:

Objectif:

Scope:

Out of scope:

État initial:

Changements réalisés:

Fichiers / packages touchés:

Contrats impactés:

Migrations:

Tests exécutés:

Résultats:

Preuves:

Risques résiduels:

Décisions:

Documentation:

Statut PASS/PARTIAL/FAIL/BLOCKED:

Prochaine action unique:

## 17. ANNEXE B — CHECKLIST AVANT RÉFORME

Le problème est-il prouvé?

L'invariant cible impacté est-il identifié?

Existe-t-il une option moins disruptive?

La compatibilité est-elle nécessaire?

Le rollback ou forward-fix est-il défini?

Les migrations sont-elles testables?

Les goldens couvrent-ils le comportement?

Le changement réduit-il réellement une ambiguïté de source de vérité?

Les impacts runtime sont-ils connus?

La documentation et les ADR concernés sont-ils identifiés?

La suppression legacy peut-elle attendre une preuve supplémentaire?

## 18. CONCLUSION

La reprise du développement doit commencer par l'état réel, non par une projection du dossier final sur le code. Le repository peut être réformé lorsque la convergence l'exige, mais toute réforme doit être explicable, progressive et prouvée.

Le premier résultat attendu de l'utilisation de ce prompt n'est donc pas un grand diff. C'est une baseline Git fiable, une Gap Matrix et une unique mission suivante permettant de rapprocher le produit de sa cible sans perdre les actifs déjà démontrés.

FIN — PROMPT DIRECTEUR DE REPRISE DU REPOSITORY V1.1

## Contrôle avant exécution

- [ ] Les variables et dépendances sont renseignées.
- [ ] Les faits sont séparés des hypothèses.
- [ ] Les livrables et critères d'acceptation sont compris.
- [ ] Les données sensibles, secrets et identifiants sont exclus.
- [ ] Le responsable du projet a validé le périmètre.
- [ ] Les fichiers de gouvernance de la section 2D sont créés et à jour ; le protocole de continuité de la section 2C est opérationnel.
