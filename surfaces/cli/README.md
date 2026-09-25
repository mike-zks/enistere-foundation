# @enistere/foundation-cli

CLI headless au-dessus de la Kernel Façade (mission E1) — surface uniquement : lecture des fichiers,
sortie JSON, code de sortie. Toute décision appartient à la façade.

```sh
node surfaces/cli/src/cli.ts <validate|resolve|plan> <fichier|dossier>... [--catalog <fichier>] [--definition <id>]
```

| Code | Signification |
|---|---|
| 0 | VALID / RESOLVED / PLANNED |
| 1 | INVALID (ensemble de contrats ou catalogue invalide, System Definition absente ou ambiguë) |
| 2 | PARTIAL : des éléments UNSUPPORTED sont listés dans la sortie |
| 64 | Erreur d'usage ou fichier illisible |

Exemple (golden Asteria) :
`node surfaces/cli/src/cli.ts plan goldens/asteria/contracts goldens/asteria/evidence --catalog goldens/asteria/sources/catalog.json`
