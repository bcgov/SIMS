# Prerequisites
1. Openshift namespace
2. Keycloak namespace
3. Docker (For local development only)
4. Make cmd (For local development only - windows users)

# OpenShift
From a clean openshift enrionment run the below
1. "oc login Token"
2. "make init-patroni NAMESPACE=namespace-env"
3. "make deploy-patroni NAMESPACE=namespace-env"
4. "make create-db NAMESPACE=namespace-env""
  
At this point the pipeline will build and deploy the remainder

  # Local Development
1. Clone Repo to local
2. To build the images Run: "Make local"
3. To reset to a clean envrionment Run: "Make local-clean"
        
# Pipeline
We currently use 2 workflows
1. Github action automatically deploying to "dev" once a PR is merged
2. Github action manaully triggered to deploy to test based off an image tag provided that was built by #
