# Asteria — brief client (synthétique)

> Source artifact of the Asteria golden. Synthetic: no real client, organization or person.
> Derived from the multi-application scenario of document 01 §6.1 and document 02 §6.1.
> Its sha256 is pinned by `RequirementBaseline/asteria-requirements@1` (`spec.sources`).

## Contexte

Un opérateur de services techniques de proximité reçoit aujourd'hui les demandes d'intervention
(éclairage, voirie, déchets, eau) par téléphone et par courriel. Les demandes se perdent, les délais ne
sont pas suivis et les agents terrain travaillent sur papier.

## Besoin exprimé

1. Les usagers (demandeurs) déposent une demande géolocalisée avec photos depuis un portail Web public
   et suivent l'état de leurs propres demandes.
2. Les agents d'exploitation qualifient, priorisent et affectent les demandes depuis un back-office Web
   interne.
3. Les agents terrain reçoivent leurs affectations sur mobile, y compris sans réseau pendant leur
   tournée, et saisissent un compte rendu d'intervention avec photos.
4. Les demandeurs sont prévenus par courriel à chaque changement d'état.
5. Une demande qui dépasse son délai est escaladée automatiquement au superviseur.
6. Les pièces jointes sont analysées (malware) avant d'être visibles.
7. Les traitements longs (notifications, escalades, analyse des fichiers) ne doivent jamais ralentir le
   service.
8. Le portail public est accessible (niveau WCAG 2.2 AA).
9. L'authentification passe par le fournisseur d'identité commun de l'écosystème Enistere.

## Hors besoin immédiat

- Une carte publique anonymisée des demandes (idée à étudier plus tard).

## Questions ouvertes lors de l'atelier

- Combien de temps un agent terrain peut-il rester hors ligne ?
- Quels canaux de notification au-delà du courriel ?
