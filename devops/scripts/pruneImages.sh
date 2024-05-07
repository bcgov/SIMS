#!/usr/bin/env bash

# Usage: $0 --license_plate=VALUE --env=VALUE --apps=VALUE [--prefix=VALUE] [--min_tags=VALUE] [--type=DC|JOB]

# Initialize default values
LICENSE_PLATE=""
ENV=""
APPLICATIONS=""
PREFIX=""
MIN_TAGS=10  # Default to keeping 10 tags if MIN_TAGS is not specified
TYPE="DC"

# Parse named arguments
while [ $# -gt 0 ]; do
  case "$1" in
    --license_plate=*)
      LICENSE_PLATE="${1#*=}"
      ;;
    --env=*)
      ENV="${1#*=}"
      ;;
    --apps=*)
      APPLICATIONS="${1#*=}"
      ;;
    --prefix=*)
      PREFIX="${1#*=}"
      ;;
    --min_tags=*)
      MIN_TAGS="${1#*=}"
      ;;
    --type=*)
      TYPE="${1#*=}"
      ;;
    *)
      echo "Usage: $0 --license_plate=VALUE --env=VALUE --apps=VALUE [--prefix=VALUE] [--min_tags=VALUE]"
      echo "Invalid argument: $1"
      exit 1
      ;;
  esac
  shift
done

# Validation for required parameters
if [ -z "$LICENSE_PLATE" ] || [ -z "$ENV" ] || [ -z "$APPLICATIONS" ] ; then
    echo "Usage: $0 --license_plate=VALUE --env=VALUE --apps=VALUE [--prefix=VALUE] [--min_tags=VALUE]"
    echo "License plate, environment, and apps are required."
    echo "Multiple applications can be provided as a comma-separated list."
    exit 1
fi

echo Starting to Prune Images for applications ${APPLICATIONS}
IFS=',' read -r -a apps <<< ${APPLICATIONS}
for app in "${apps[@]}"
do
    # Trim spaces
    trimmed_app=$(echo "$app" | xargs)
        echo "Processing \"${trimmed_app}\""
        if [ "${TYPE}" == "JOB" ]; then
            SCRIPT="./fetchOldJobTags.sh"
        else
            SCRIPT="./fetchOldTags.sh"
        fi
        ${SCRIPT} \
            --license_plate=${LICENSE_PLATE} \
            --env=${ENV} \
            --app_name=${trimmed_app} \
            --prefix=${PREFIX} \
            --min_tags=${MIN_TAGS} | \
            xargs -I {} oc tag ${LICENSE_PLATE}-tools/{} --delete
done

echo Finished Pruning Images for type ${TYPE} and applications ${APPLICATIONS}
