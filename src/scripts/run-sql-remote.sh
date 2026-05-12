#!/usr/bin/env zsh

set -euo pipefail

if [[ $# -lt 3 ]]; then
  echo "Usage: run-sql-remote.sh WORKSPACE_FOLDER SQL_FILE D1_DATABASE [TOKEN=value ...]" >&2
  exit 1
fi

workspace_folder="$1"
sql_file="$2"
d1_database="$3"

shift 3

if [[ ! -d "$workspace_folder" ]]; then
  echo "Workspace folder not found: $workspace_folder" >&2
  exit 1
fi

if [[ ! -f "$sql_file" ]]; then
  echo "SQL file not found: $sql_file" >&2
  exit 1
fi

if [[ -z "$d1_database" ]]; then
  echo "D1 database name is empty." >&2
  exit 1
fi

sql_text="$(cat "$sql_file")"

for parameter in "$@"; do
  if [[ "$parameter" != *=* ]]; then
    echo "Invalid parameter: $parameter" >&2
    echo "Expected TOKEN=value, for example START_DATE=2020-01-01" >&2
    exit 1
  fi

  parameter_name="${parameter%%=*}"
  parameter_value="${parameter#*=}"

  if [[ ! "$parameter_name" =~ '^[A-Z][A-Z0-9_]*$' ]]; then
    echo "Invalid parameter name: $parameter_name" >&2
    echo "Use uppercase names like START_DATE or END_DATE." >&2
    exit 1
  fi

  if [[ "$parameter_name" == *DATE && ! "$parameter_value" =~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' ]]; then
    echo "Invalid date for $parameter_name: $parameter_value" >&2
    echo "Use YYYY-MM-DD, for example 2020-01-01." >&2
    exit 1
  fi

  token="__${parameter_name}__"
  sql_text="${sql_text//$token/$parameter_value}"
done

cd "$workspace_folder"

npx wrangler d1 execute "$d1_database" --remote --command="$sql_text"