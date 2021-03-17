# KeyCloak

This document will explain Keycloak setup and utilities for AEST/SIMS project.

## Table of Content

- [KeyCloak](#keycloak)
  - [Table of Content](#table-of-content)
  - [Prerequisites](#prerequisites)
  - [How To](#howto)

## Prerequisites

1. Keycloak Realm: Keycloak instance is set up and can be accessed using IDIR at this [link](https://dev.oidc.gov.bc.ca/auth/admin/jxoe2o46/console/#/realms/jxoe2o46)

## HowTo

### Add a field (idp_user_name ) from an Identity Provider (BCeID) to User token

- Access BCeID `Identity Providers` from the left pane and add a `Mapper` field `BCeIDuserID` with following properties

  - Mapper type : Attribute Importer
  - Name: BCeIDuserID
  - Claim: preferred_username (This is gotten from BCeID)
  - User Attribute Name: idp_user_name

- Access Client Scopes from the left pane and create a Client Scope named `IDP` and add a mapper field mapping with the user attribute field as `idp_user_name` and token claim name as `idp_user_name`

- Add the Client Scope `IDP` to the Client `institution` from the `Client Scopes` tab

- Evaluate the token by selecting a BCeID user (already existing in the Key Cloak Users) and verify the generated token that an newly added field - `idp_user_name` should be in the token
