# Social publishing privacy contract

Public posts must respect the existing RLS contract: a personal profile or team can publish to the platform only when that author entity is public. The composer defaults to private so a private-by-default account can publish without hitting a policy rejection. Selecting public remains available, but the server action preflights author visibility and returns an actionable error instead of relying on a generic RLS failure.
