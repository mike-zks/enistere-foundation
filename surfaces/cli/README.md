# @enistere/foundation-cli

CLI headless au-dessus de la Kernel Façade (E1), de l'Engine (E2) et de la proof chain (E4) — surface uniquement : lecture des
fichiers, sortie JSON, code de sortie. Toute décision appartient à la façade, à l'hôte d'extensions et au
materializer.

```sh
node surfaces/cli/src/cli.ts <validate|resolve|plan> <contrats>... [--catalog <fichier> | --extensions <dossier>] [--definition <id>]
node surfaces/cli/src/cli.ts materialize <contrats>... --extensions <dossier> --out <workspace> [--definition <id>]
node surfaces/cli/src/cli.ts verify <workspace> --extensions <dossier> [--toolchain] [--evidence-out <dossier>] [--environment local|ci]
node surfaces/cli/src/cli.ts export <contrats>... --extensions <dossier> --workspace <workspace> [--evidence <dossier>] --out <bundle> [--definition <id>]
node surfaces/cli/src/cli.ts verify-bundle <bundle>
```

`materialize` enregistre un MaterializationRecord (A8) par composant dans
`<workspace>/<composant>/.foundation/records/`. `export` rassemble contrats, catalogue, digests de
compilation, A8 du workspace et A7 de `--evidence` dans un bundle JSON auto-porteur
(`foundation.enistere.com/proof-chain/v1`) ; `verify-bundle` le vérifie hors du dépôt (digest, ensemble
fermé, rejeu de la compilation, liens A8/A7).

| Code | Signification |
|---|---|
| 0 | VALID / RESOLVED / PLANNED / MATERIALIZED / PASS / EXPORTED |
| 1 | INVALID (ensemble de contrats, catalogue ou extension invalide, System Definition absente ou ambiguë) ou FAIL (vérification) ; bundle INVALID (`verify-bundle`) |
| 2 | PARTIAL : des éléments UNSUPPORTED sont listés dans la sortie |
| 3 | CONFLICT : un fichier compiler-owned a été modifié hors du compiler ; rien n'a été écrit |
| 64 | Erreur d'usage ou fichier illisible |

Exemple (golden Asteria) :
`node surfaces/cli/src/cli.ts plan goldens/asteria/contracts goldens/asteria/evidence --catalog goldens/asteria/sources/catalog.json`
