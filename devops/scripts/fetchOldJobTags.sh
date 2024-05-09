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
  echo "Usage: $0 --license_plate=VALUE --env=VALUE --APP_NAME=VALUE [--prefix=VALUE] [--min_tags=VALUE]"
  echo "License plate, environment, and job name are required."
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
JOB_NAMESPACE="${LICENSE_PLATE}-${ENV}"
IS_NAMESPACE="${LICENSE_PLATE}-tools"
JOB_NAME="${ENV}-${APP_NAME}"

# Lookup the job to get the deployed container image tag
JOB_IMAGE=$(oc get job/$JOB_NAME -n $JOB_NAMESPACE -o json | jq -r '.spec.template.spec.containers[].image')
if [ -z "$JOB_IMAGE" ]; then
  echo "Job image tag not found." >&2
  exit 1
fi

#Extract the Image Stream name from the JOB Image
IS_NAME=$(echo "${JOB_IMAGE}" | awk -F'/|:' '{print $(NF-1)}')
if [ -z "$IS_NAME" ]; then
  echo "No ImageStream name found in Job Image tag." >&2
  exit 1
fi

# Extract the GitHub run number from the JOB Image
JOB_BUILD_ID=$(echo "$JOB_IMAGE" | grep -oE '[0-9]+$')
if [ -z "$JOB_BUILD_ID" ]; then
  echo "No GitHub run number found in Job image tag." >&2
  exit 1
fi

# Process ImageStream Tags and output those prior to the deployed version
oc get is/$IS_NAME -n $IS_NAMESPACE -o json | jq -r --arg JOB_BUILD_ID "$JOB_BUILD_ID" --arg PREFIX "$PREFIX" --arg IS_NAME "$IS_NAME" --argjson MIN_TAGS "$MIN_TAGS" '
  .status.tags
  | map(select(.tag | startswith($PREFIX) and test(".*-[0-9]+$")))
  | map(.tag)
  | map(select(capture(".*-(?<id>[0-9]+)$").id | tonumber < ($JOB_BUILD_ID | tonumber)))
  | sort_by(capture(".*-(?<id>[0-9]+)$").id | tonumber)
  | if $MIN_TAGS > 0 then .[:-$MIN_TAGS] else . end
  | .[]
  | "\($IS_NAME):\(.)"
'
