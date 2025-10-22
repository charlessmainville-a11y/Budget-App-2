#!/usr/bin/env bash
set -euo pipefail

ids=(
  fluffytimelysheep
  surprisedspitefulhuemul
  gratefulnearwhitebeakeddolphin
)

auth_url="https://api.redgifs.com/v2/auth/temporary"
gif_url_base="https://api.redgifs.com/v2/gifs"

echo "Fetching temporary auth token..." >&2
auth_response=$(curl -sS "$auth_url")

extract_with_jq() {
  local query="$1"
  jq -er "$query" <<<"$2"
}

if command -v jq >/dev/null 2>&1; then
  token=$(extract_with_jq '.token' "$auth_response")
else
  token=$(printf '%s' "$auth_response" | sed -n 's/.*"token"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -n1)
  if [[ -z ${token:-} ]]; then
    echo "Failed to extract token and jq is unavailable." >&2
    exit 1
  fi
fi

echo "Token acquired." >&2

for id in "${ids[@]}"; do
  url="$gif_url_base/$id"
  response=$(curl -sS -w "\n%{http_code}" -H "Authorization: Bearer $token" "$url")
  status=${response##*$'\n'}
  body=${response%$'\n'*}

  if command -v jq >/dev/null 2>&1; then
    hd_url=$(jq -er '.gif.urls.hd // empty' <<<"$body" 2>/dev/null || true)
    sd_url=$(jq -er '.gif.urls.sd // empty' <<<"$body" 2>/dev/null || true)
  else
    hd_url=$(printf '%s' "$body" | sed -n 's/.*"hd"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -n1)
    sd_url=$(printf '%s' "$body" | sed -n 's/.*"sd"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -n1)
  fi

  if [[ -n ${hd_url:-} ]]; then
    media_url="$hd_url"
    quality="hd"
  elif [[ -n ${sd_url:-} ]]; then
    media_url="$sd_url"
    quality="sd"
  else
    media_url="(no media url found)"
    quality="n/a"
  fi

  printf '%s\n' "ID: $id" "Status: $status" "${quality^^} URL: $media_url" "" 
done
