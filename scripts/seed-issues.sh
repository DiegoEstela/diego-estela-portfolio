#!/usr/bin/env bash
# Crea etiquetas e issues iniciales con gh y jq. Las etiquetas son idempotentes; las issues se crean siempre.
# Uso: bash scripts/seed-issues.sh [--dry-run]
set -euo pipefail

cd "$(dirname "$0")/.."
gh auth status >/dev/null
command -v jq >/dev/null || { echo "Falta jq"; exit 1; }

DRY=${1:-}
FILE="scripts/issues.json"

jq -r '.labels[] | [.name,.color,.description] | @tsv' "$FILE" | while IFS=$'\t' read -r name color desc; do
  if [ "$DRY" = "--dry-run" ]; then echo "label: $name"; continue; fi
  gh label create "$name" --color "$color" --description "$desc" --force >/dev/null
done

jq -c '.issues[]' "$FILE" | while read -r issue; do
  title=$(jq -r '.title' <<<"$issue")
  labels=$(jq -r '.labels | join(",")' <<<"$issue")
  if [ "$DRY" = "--dry-run" ]; then echo "issue: $title [$labels]"; continue; fi
  tmp=$(mktemp)
  jq -r '.body' <<<"$issue" > "$tmp"
  gh issue create --title "$title" --body-file "$tmp" --label "$labels"
  rm -f "$tmp"
done
