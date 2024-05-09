#!/usr/bin/env bash

# Usage: $0 --license_plate=VALUE --env=VALUE --app_name=VALUE [--prefix=VALUE] [--min_tags=VALUE]

# Initialize default values
LICENSE_PLATE=""
ENV=""
APP_NAME=""
PREFIX=""
MIN_TAGS=10  # Default to keeping all tags if MIN_TAGS is not specified

# Parse named arguments
while [ $# -gt 0 ]; do
  case "$1" in
    --license_plate=*)
      LICENSE_PLATE="${1#*=}"
      ;;
    --env=*)
      ENV="${1#*=}"
      ;;
    --app_name=*)
      APP_NAME="${1#*=}"
      ;;
    --prefix=*)
      PREFIX="${1#*=}"
      ;;
    --min_tags=*)
      MIN_TAGS="${1#*=}"
      ;;
    *)
      echo "Invalid argument: $1"
      echo "Usage: $0 --license_plate=VALUE --env=VALUE --app_name=VALUE [--prefix=VALUE] [--min_tags=VALUE]"
      exit 1
  esac
  shift
done

# Validation of required arguments and env values
if [ -z "$LICENSE_PLATE" ] || [ -z "$ENV" ] || [ -z "$APP_NAME" ]; then
  echo "Usage: $0 --license_plate=VALUE --env=VALUE --app_name=VALUE [--prefix=VALUE] [--min_tags=VALUE]"
  echo "License plate, environment, and app name are required."
  exit 1
fi

# Check if env value is allowed
case "$ENV" in
  dev|test|prod)
    # All good, continue
    ;;
  *)
    echo "The --env parameter must be one of: dev, test, prod."
    exit 1
    ;;
esac

# Setup internal variables
DC_NAMESPACE="${LICENSE_PLATE}-${ENV}"
IS_NAMESPACE="${LICENSE_PLATE}-tools"
DC_NAME="${ENV}-${APP_NAME}"

# Lookup the dc to get the deployed container image tag
DC_IMAGE=$(oc get dc/$DC_NAME -n $DC_NAMESPACE -o json | jq -r '.spec.template.spec.containers[].image')
if [ -z "$DC_IMAGE" ]; then
  echo "DeploymentConfig image tag not found." >&2
  exit 1
fi

# Extract the GitHub run number from the DC Image
DC_BUILD_ID=$(echo "$DC_IMAGE" | grep -oE '[0-9]+$')
if [ -z "$DC_BUILD_ID" ]; then
  echo "No GitHub run number found in DC image tag." >&2
  exit 1
fi

# Process ImageStream Tags and output those prior to the deployed version
oc get is/$APP_NAME -n $IS_NAMESPACE -o json | jq -r --arg DC_BUILD_ID "$DC_BUILD_ID" --arg PREFIX "$PREFIX" --arg IS_NAME "$APP_NAME" --argjson MIN_TAGS "$MIN_TAGS" '
  .status.tags
  | map(select(.tag | startswith($PREFIX) and test(".*-[0-9]+$")))
  | map(.tag)
  | map(select(capture(".*-(?<id>[0-9]+)$").id | tonumber < ($DC_BUILD_ID | tonumber)))
  | sort_by(capture(".*-(?<id>[0-9]+)$").id | tonumber)
  | if $MIN_TAGS > 0 then .[:-$MIN_TAGS] else . end
  | .[]
  | "\($IS_NAME):\(.)"
'
