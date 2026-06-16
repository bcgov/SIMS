#!/usr/bin/env bash

# Usage: $0 --license_plate=VALUE --app_name=VALUE [--min_tags=VALUE]
# Outputs ImageStream tags that start with "v" (release tags), sorted by creation date,
# keeping the most recent MIN_TAGS entries. Extra arguments (e.g., --env, --prefix) are
# accepted and silently ignored for compatibility with pruneImages.sh.

# Initialize default values
LICENSE_PLATE=""
APP_NAME=""
MIN_TAGS=10  # Default to keeping 10 release tags if MIN_TAGS is not specified

# Parse named arguments
while [ $# -gt 0 ]; do
  case "$1" in
    --license_plate=*)
      LICENSE_PLATE="${1#*=}"
      ;;
    --app_name=*)
      APP_NAME="${1#*=}"
      ;;
    --min_tags=*)
      MIN_TAGS="${1#*=}"
      ;;
    --env=*|--prefix=*)
      # Accepted but not used; release tags are pruned by creation date only.
      ;;
    *)
      echo "Invalid argument: $1"
      echo "Usage: $0 --license_plate=VALUE --app_name=VALUE [--min_tags=VALUE]"
      exit 1
  esac
  shift
done

# Validation of required arguments
if [ -z "$LICENSE_PLATE" ] || [ -z "$APP_NAME" ]; then
  echo "Usage: $0 --license_plate=VALUE --app_name=VALUE [--min_tags=VALUE]"
  echo "License plate and app name are required."
  exit 1
fi

IS_NAMESPACE="${LICENSE_PLATE}-tools"

# Output all "v" (release) tags older than the most recent MIN_TAGS entries,
# sorted by creation date descending.
oc get is/$APP_NAME -n $IS_NAMESPACE -o json | jq -r --arg IS_NAME "$APP_NAME" --argjson MIN_TAGS "$MIN_TAGS" '
  .status.tags
  | map(select(.tag | startswith("v")))
  | map({tag: .tag, created: (.items[0].created // "N/A")})
  | map(select(.created != "N/A"))
  | sort_by(.created)
  | reverse
  | if $MIN_TAGS > 0 then .[$MIN_TAGS:] else . end
  | .[].tag
  | "\($IS_NAME):\(.)"
'
