-- Renaming identity providers names to be aligned with Keycloak.
ALTER TYPE sims.identity_provider_types RENAME VALUE 'BCEID' TO 'bceidbusiness';

ALTER TYPE sims.identity_provider_types RENAME VALUE 'BCSC' TO 'bcsc';

ALTER TYPE sims.identity_provider_types RENAME VALUE 'IDIR' TO 'idir';

-- Add new enum options.
ALTER TYPE sims.identity_provider_types
ADD
    VALUE 'bceidbasic'
AFTER
    'bceidbusiness';

-- Add new enum options.
ALTER TYPE sims.identity_provider_types
ADD
    VALUE 'bceidboth'
AFTER
    'bceidbasic';