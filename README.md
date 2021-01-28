# SIMS
[![img](https://img.shields.io/badge/Lifecycle-Experimental-339999)](https://github.com/bcgov/repomountie/blob/master/doc/lifecycle-badges.md)

Student Information Management System. Post-Secondary Student Financial Aid System. 

# Prerequisites
1. Openshift namespace
2. Keycloak namespace
3. Docker (For local development only)
4. Make cmd (For local development only - windows users)

# OpenShift
1. From a clean openshift enrionment run the below

oc login <Token>
make init-patroni NAMESPACE=0c27fb-test
make deploy-patroni NAMESPACE=0c27fb-test
make create-db NAMESPACE=0c27fb-test
  
2. at this point the pipeline will build and deploy the remainder

  # Local Development
1. Clone Repo to local
2. To build the images Run:
        "Make local"
3. To reset to a clean envrionment Run:
        "Make local-clean
        
# Pipeline
We currently use 2 workflows
1. Github action automatically deploying to "dev" once a PR is merged
2. Github action manaully triggered to deploy to test based off an image tag provided that was built by #1
