#!/usr/bin/env bash

# Usage: $0 --license_plate=VALUE --env=VALUE --apps=VALUE [--prefix=VALUE] [--min_tags=VALUE]

# Initialize default values
LICENSE_PLATE=""
ENV=""
APPLICATIONS=""
PREFIX=""
MIN_TAGS=10  # Default to keeping 10 tags if MIN_TAGS is not specified

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
        ./fetchOldTags.sh \
            --license_plate=${LICENSE_PLATE} \
            --env=${ENV} \
            --app_name=${trimmed_app} \
            --prefix=${PREFIX} | \
            xargs -I {} echo "oc tag ${LICENSE_PLATE}-tools/${trimmed_app}:{} --delete"
done

echo Finished Pruning Images

