#!/usr/bin/env bash
# Sentinel-X Chaos Generator

# Builds a chaotic test repo with injected secrets and ground-truth oracle.
# Usage: bash chaos-generator.sh [--commits N] [--output DIR]

set -e

#Config
TOTAL_COMMITS=120
TARGET_DIR="../sentinel-chaos-demo"
REPO_NAME="chaos-repo"
BRANCH_COUNTER=0
ORACLE_COUNT=0

#Arg Parse
while [[ $# -gt 0 ]]; do
  case "$1" in
    --commits) TOTAL_COMMITS="$2"; shift 2;;
    --output)  TARGET_DIR="$2"; shift 2;;
    --help)
      echo "Usage: bash chaos-generator.sh [--commits N] [--output DIR]"
      exit 0;;
    *) echo "Unknown: $1"; exit 1;;
  esac
done

REPO_PATH="${TARGET_DIR}/${REPO_NAME}"
ORACLE_FILE="${TARGET_DIR}/ground_truth.json"

#Helpers
cyan()  { echo -e "\033[0;36m$1\033[0m"; }
red()   { echo -e "\033[0;31m$1\033[0m"; }
green() { echo -e "\033[0;32m$1\033[0m"; }
blue()  { echo -e "\033[0;34m$1\033[0m"; }

info()  { blue "[INFO]  $1"; }
ok()    { green "[OK]    $1"; }
chaos() { red "[CHAOS]  $1"; }
oracle(){ cyan "[ORACLE] $1"; }

rand_elem() {
  local -n arr=$1
  echo "${arr[$((RANDOM % ${#arr[@]}))]}"
}

#Backdate commits across ~12 weeks
random_date() {
  local weeks=$((RANDOM % 12))
  local days=$((RANDOM % 7))
  local h=$((RANDOM % 24)) m=$((RANDOM % 60)) s=$((RANDOM % 60))
  date -d "${weeks} weeks ago + ${days} days + ${h} hours + ${m} minutes + ${s} seconds" \
    "+%Y-%m-%dT%H:%M:%S" 2>/dev/null || date "+%Y-%m-%dT%H:%M:%S"
}

#Deep nested path 3-6 levels
deep_path() {
  local depth=$((3 + RANDOM % 4))
  local dirs=("src" "lib" "internal" "legacy" "v1" "tests" "utils" "config" "helpers" "core" "services" "api" "handlers" "models" "controllers" "middleware")
  local hidden=(".cache" ".config" ".local" ".build" ".temp" ".webpack" ".next")
  local bases=("config" "settings" "credentials" "auth" "connection" "database" "service" "handler" "util" "helper" "constants" "env")
  local exts=("json" "yaml" "yml" "env" "ts" "tsx" "js" "go" "py" "conf" "cfg" "ini" "xml" "toml")

  local path=""
  for ((i=0; i<depth; i++)); do
    if ((RANDOM % 5 == 0)); then
      path+="/$(rand_elem hidden)"
    else
      path+="/$(rand_elem dirs)"
    fi
  done
  path+="/$(rand_elem bases).$(rand_elem exts)"
  echo "$path"
}

commit_msg() {
  local msgs=(
    "feat: add user authentication module"
    "fix: resolve race condition in data sync"
    "refactor: extract utility functions to shared lib"
    "chore: update dependencies and lock files"
    "docs: add API documentation for endpoints"
    "test: add integration tests for payment flow"
    "style: improve component styling and responsiveness"
    "perf: optimize database query performance"
    "ci: configure automated deployment pipeline"
    "build: update webpack configuration for prod"
    "feat: implement real-time notification system"
    "fix: handle edge cases in form validation"
    "refactor: simplify error handling patterns"
    "chore: migrate to new configuration format"
    "feat: add export functionality for reports"
    "fix: correct timezone conversion in scheduler"
    "test: add unit tests for auth middleware"
    "docs: update README with setup instructions"
    "perf: reduce bundle size by 40%"
    "feat: implement caching layer for API responses"
  )
  echo "${msgs[$((RANDOM % ${#msgs[@]}))]}"
}

#Boilerplate fixtures
boilerplate() {
  local kind=$((RANDOM % 4))
  case $kind in
    0) cat << 'EOF'
import React, { useState, useEffect } from "react";

interface UserProps { id: string; name: string; email: string; }

export const UserProfile: React.FC<UserProps> = ({ id, name, email }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProps | null>(null);

  useEffect(() => {
    fetch(`/api/users/${id}`)
      .then((res) => res.json())
      .then((data) => { setUser(data); setLoading(false); })
      .catch((err) => console.error(err));
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>User not found</div>;

  return <div className="user-profile"><h2>{user.name}</h2><p>{user.email}</p></div>;
};
EOF
      ;;
    1) cat << 'EOF'
package handler

import (
	"net/http"
	"encoding/json"
	"log"
)

type Response struct {
	Status  string `json:"status"`
	Message string `json:"message"`
	Code    int    `json:"code"`
}

func HealthCheck(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	resp := Response{Status: "ok", Message: "Service is healthy", Code: 200}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}
EOF
      ;;
    2) cat << 'EOF'
export function debounce(fn, delay = 300) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

export function throttle(fn, limit = 500) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
EOF
      ;;
    3) cat << 'EOF'
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
}

.card:hover { transform: translateY(-4px); }
EOF
      ;;
  esac
}

#Secret generators
gen_aws()      { echo "AKIA$(head -c 16 /dev/urandom | od -An -tx1 | tr -d ' \n' | tr 'a-f' 'A-F' | head -c 16)"; }
gen_stripe()   { local m=$([ $((RANDOM % 2)) -eq 0 ] && echo "live" || echo "test"); echo "sk_${m}_$(head -c 24 /dev/urandom | od -An -tx1 | tr -d ' \n' | head -c 24)"; }
gen_github()   { echo "ghp_$(head -c 36 /dev/urandom | od -An -tx1 | tr -d ' \n' | head -c 36)"; }
gen_apikey()   { head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n' | head -c 32; }
gen_entropy()  { head -c 64 /dev/urandom | od -An -tx1 | tr -d ' \n' | head -c 64; }
gen_password() { head -c 16 /dev/urandom | od -An -tx1 | tr -d ' \n' | head -c 16; }

gen_private_key() {
  cat << 'PRIVKEY'
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA0Z3VS5JJcds3xfn/ygWyF8PbnGy0AHB7MhgHcTz6sE2I2yPB
aFDrBz9vFqU4yL8GmPnG0Y2fK5p3LqKXvP8FhK5x8L3qM7vN6wQ9zR5cY8fT2nK
L4mP9vQ6xR7cS3fN5pL8mK2vT9xQ6yR4cP7fL3nM5vK8wQ2zT6cY9fU2oL5mQ8v
-----END RSA PRIVATE KEY-----
PRIVKEY
}

SECRET_TYPES=("aws" "stripe" "github" "apikey" "entropy" "password" "private_key")

#Oracle
oracle_init() {
  echo "[" > "$ORACLE_FILE"
}

oracle_log() {
  local secret_type="$1" commit_hash="$2" file_path="$3" line_num="$4" secret_value="$5" lifecycle="$6"

  if ((ORACLE_COUNT > 0)); then
    local tmp
    tmp=$(head -c -1 "$ORACLE_FILE" 2>/dev/null || cat "$ORACLE_FILE")
    echo "${tmp}," > "$ORACLE_FILE"
  fi

  local escaped
  escaped=$(echo "$secret_value" | sed 's/\\/\\\\/g; s/"/\\"/g' | head -c 200)

  cat >> "$ORACLE_FILE" << ENTRY
  {
    "secretType": "${secret_type}",
    "commitHash": "${commit_hash}",
    "filePath": "${file_path}",
    "lineNumber": ${line_num},
    "secretValue": "${escaped}",
    "lifecycle": "${lifecycle}"
  }
ENTRY

  ORACLE_COUNT=$((ORACLE_COUNT + 1))
}

oracle_close() {
  echo "]" >> "$ORACLE_FILE"
  oracle "Oracle sealed: ${ORACLE_COUNT} secrets logged to ground_truth.json"
}

#Inject secret — echoes: type|path|line|value
inject_secret() {
  local secret_type="$1" file_path="$2"
  local secret_value="" content="" line_num=0

  mkdir -p "$(dirname "${REPO_PATH}/${file_path}")"

  case "$secret_type" in
    aws)
      secret_value=$(gen_aws)
      if ((RANDOM % 2 == 0)); then
        content="const AWS_CONFIG = {\n  accessKeyId: '${secret_value}',\n  region: 'us-east-1'\n};\nmodule.exports = AWS_CONFIG;"
        line_num=2
      else
        content="# TODO: remove before production\n# AWS_ACCESS_KEY=${secret_value}\nDATABASE_URL=postgres://localhost:5432/db"
        line_num=2
      fi
      ;;
    stripe)
      secret_value=$(gen_stripe)
      content="const stripe = require('stripe');\nconst client = new stripe('${secret_value}');\n\nmodule.exports = client;"
      line_num=2
      ;;
    github)
      secret_value=$(gen_github)
      content="# GitHub Integration\nGITHUB_TOKEN=${secret_value}\nREPO_OWNER=myorg\nREPO_NAME=myrepo"
      line_num=2
      ;;
    apikey)
      secret_value=$(gen_apikey)
      content="{\n  \"api_key\": \"${secret_value}\",\n  \"endpoint\": \"https://api.example.com/v2\",\n  \"timeout\": 5000\n}"
      line_num=2
      ;;
    entropy)
      secret_value=$(gen_entropy)
      content="export const ENCRYPTION_KEY = '${secret_value}';\nexport const IV_LENGTH = 16;\nexport const ALGORITHM = 'aes-256-gcm';"
      line_num=1
      ;;
    password)
      secret_value=$(gen_password)
      content="const DB_PASSWORD = '${secret_value}';\nconst DB_HOST = 'localhost';\nconst DB_PORT = 5432;"
      line_num=1
      ;;
    private_key)
      secret_value="-----BEGIN RSA PRIVATE KEY-----"
      local privkey
      privkey=$(gen_private_key)
      content="# Server SSL Certificate\n${privkey}\n# End of certificate"
      line_num=2
      ;;
  esac

  echo -e "$content" > "${REPO_PATH}/${file_path}"
  echo "${secret_type}|${file_path}|${line_num}|${secret_value}"
}

#Branch with secret
branch_inject() {
  local branch_name="feature/leak-$((++BRANCH_COUNTER))"
  chaos "Abandoned branch: ${branch_name}"

  git checkout -b "$branch_name" 2>/dev/null

  local path
  path=$(deep_path)
  local result
  result=$(inject_secret "$(rand_elem SECRET_TYPES)" "$path")

  local stype fpath lnum secret
  stype=$(echo "$result" | cut -d'|' -f1)
  fpath=$(echo "$result" | cut -d'|' -f2)
  lnum=$(echo "$result" | cut -d'|' -f3)
  secret=$(echo "$result" | cut -d'|' -f4)

  local ext="${path##*.}"
  boilerplate > "src/feature_${BRANCH_COUNTER}.${ext}"
  git add -A

  local cdate
  cdate=$(random_date)
  GIT_COMMITTER_DATE="$cdate" git commit -m "feat: experimental ${branch_name}" --date="$cdate" --allow-empty

  local hash
  hash=$(git rev-parse HEAD)
  oracle_log "$stype" "$hash" "$fpath" "$lnum" "$secret" "branch"

  git checkout main 2>/dev/null || git checkout master 2>/dev/null
  ok "Branch '${branch_name}' abandoned with secret at: ${fpath}"
}

#Core
main() {
  #Safety check — ensure target dir exists or create it
  if [[ ! -d "$TARGET_DIR" ]]; then
    mkdir -p "$TARGET_DIR" || { echo "ERROR: Cannot create ${TARGET_DIR}"; exit 1; }
  fi

  #Clean slate
  rm -rf "${TARGET_DIR:?}"/*
  rm -rf "${TARGET_DIR:?}"/.[!.]* 2>/dev/null || true

  chaos "═══════════════════════════════════════════════════"
  chaos "  Sentinel-X Chaos Generator"
  chaos "═══════════════════════════════════════════════════"
  info "Commits:  ${TOTAL_COMMITS}"
  info "Output:   ${TARGET_DIR}"
  info "Repo:     ${REPO_PATH}"
  echo ""

  #Init repo
  mkdir -p "$REPO_PATH"
  (cd "$REPO_PATH" && git init && git config user.name "Chaos Agent" && git config user.email "chaos@sentinel-x.dev")

  cat > "${REPO_PATH}/README.md" << 'EOF'
# Chaos Test Repository

Auto-generated by Sentinel-X Chaos Generator.
Contains intentional fake secrets for scanner testing.

**DO NOT USE ANY CREDENTIALS HERE**
EOF

  mkdir -p "${REPO_PATH}/src"
  touch "${REPO_PATH}/src/.gitkeep"

  (cd "$REPO_PATH" && git add -A && git commit -m "chore: init" --date="$(random_date)")

  #Init oracle
  oracle_init

  local pending_cleanup=""

  for ((i=1; i<=TOTAL_COMMITS; i++)); do
    #Oops lifecycle — cleanup previous secret
    if [[ -n "$pending_cleanup" ]]; then
      local action=$((RANDOM % 3))
      local cfile="$pending_cleanup"
      case $action in
        0) rm -f "${REPO_PATH}/${cfile}"; chaos "  CLEANUP: deleted ${cfile}";;
        1) echo "$cfile" >> "${REPO_PATH}/.gitignore"
           rm -f "${REPO_PATH}/${cfile}"
           chaos "  CLEANUP: gitignored + removed ${cfile}";;
        2) cat > "${REPO_PATH}/${cfile}" << 'CLEAN'
# Secrets removed — use environment variables
API_KEY=${process.env.API_KEY}
DATABASE_URL=${process.env.DATABASE_URL}
CLEAN
           chaos "  CLEANUP: replaced ${cfile} with env vars";;
      esac

      (cd "$REPO_PATH" && git add -A)
      local cdate
      cdate=$(random_date)
      (cd "$REPO_PATH" && GIT_COMMITTER_DATE="$cdate" git commit -m "fix: remove hardcoded credentials from ${cfile}" --date="$cdate" --allow-empty)

      local chash
      chash=$(cd "$REPO_PATH" && git rev-parse HEAD)
      oracle_log "cleanup" "$chash" "$cfile" 0 "" "deleted"
      pending_cleanup=""
    fi

    #Inject secret (70%) or normal commit (30%)
    if ((RANDOM % 10 < 7)); then
      local fpath
      if ((RANDOM % 5 < 2)); then
        fpath=$(deep_path)
        chaos "  INJECT deep: ${fpath}"
      else
        local dirs=("src" "lib" "config" "internal" "utils" "api")
        local bases=("config" "credentials" "auth" "settings" "database" "service")
        local exts=("json" "yaml" "env" "ts" "js" "go" "py")
        fpath="$(rand_elem dirs)/$(rand_elem bases).$(rand_elem exts)"
        chaos "  INJECT: ${fpath}"
      fi

      local stype
      stype=$(rand_elem SECRET_TYPES)
      local result
      result=$(inject_secret "$stype" "$fpath")

      local line_num secret
      line_num=$(echo "$result" | cut -d'|' -f3)
      secret=$(echo "$result" | cut -d'|' -f4)

      mkdir -p "${REPO_PATH}/src"
      boilerplate > "${REPO_PATH}/src/boilerplate_${i}.ts"

      (cd "$REPO_PATH" && git add -A)
      local cdate
      cdate=$(random_date)
      (cd "$REPO_PATH" && GIT_COMMITTER_DATE="$cdate" git commit -m "$(commit_msg)" --date="$cdate" --allow-empty)

      local hash
      hash=$(cd "$REPO_PATH" && git rev-parse HEAD)
      oracle_log "$stype" "$hash" "$fpath" "$line_num" "$secret" "active"

      pending_cleanup="$fpath"

      #Branching entropy every 20 commits
      if ((i % 20 == 0)); then
        branch_inject
      fi
    else
      mkdir -p "${REPO_PATH}/src"
      boilerplate > "${REPO_PATH}/src/update_${i}.ts"

      (cd "$REPO_PATH" && git add -A)
      local cdate
      cdate=$(random_date)
      (cd "$REPO_PATH" && GIT_COMMITTER_DATE="$cdate" git commit -m "$(commit_msg)" --date="$cdate" --allow-empty)
    fi

    info "  Commit ${i}/${TOTAL_COMMITS}"
  done

  #Cleanup remaining
  if [[ -n "$pending_cleanup" ]]; then
    rm -f "${REPO_PATH}/${pending_cleanup}"
    (cd "$REPO_PATH" && git add -A)
    local cdate
    cdate=$(random_date)
    (cd "$REPO_PATH" && GIT_COMMITTER_DATE="$cdate" git commit -m "security: final credential cleanup" --date="$cdate" --allow-empty)
    local chash
    chash=$(cd "$REPO_PATH" && git rev-parse HEAD)
    oracle_log "cleanup" "$chash" "$pending_cleanup" 0 "" "deleted"
  fi

  echo ""

  #Extra abandoned branches
  info "Creating abandoned feature branches..."
  for bi in 1 2 3 4; do
    branch_inject
    git checkout "feature/leak-${BRANCH_COUNTER}" 2>/dev/null || true
    for j in 1 2 3; do
      mkdir -p "${REPO_PATH}/src/feat${bi}"
      boilerplate > "${REPO_PATH}/src/feat${bi}/file${j}.ts"
      (cd "$REPO_PATH" && git add -A)
      local cdate
      cdate=$(random_date)
      (cd "$REPO_PATH" && GIT_COMMITTER_DATE="$cdate" git commit -m "feat: branch ${bi} commit ${j}" --date="$cdate" --allow-empty)
    done
    git checkout main 2>/dev/null || git checkout master 2>/dev/null
  done

  echo ""

  #Hidden file ghosts
  info "Planting secrets in hidden files..."
  local hfiles=(".env.local" ".config/credentials.json" ".cache/auth.yml" ".local/db.conf" ".next/env.js")
  for hf in "${hfiles[@]}"; do
    local stype
    stype=$(rand_elem SECRET_TYPES)
    local result
    result=$(inject_secret "$stype" "$hf")

    local fpath lnum secret
    fpath=$(echo "$result" | cut -d'|' -f2)
    lnum=$(echo "$result" | cut -d'|' -f3)
    secret=$(echo "$result" | cut -d'|' -f4)

    (cd "$REPO_PATH" && git add -A)
    local cdate
    cdate=$(random_date)
    (cd "$REPO_PATH" && GIT_COMMITTER_DATE="$cdate" git commit -m "chore: add ${hf}" --date="$cdate" --allow-empty)

    local hash
    hash=$(cd "$REPO_PATH" && git rev-parse HEAD)
    oracle_log "$stype" "$hash" "$hf" "$lnum" "$secret" "active"

    chaos "  HIDDEN: ${hf}"
  done

  echo ""

  #Seal oracle
  (cd "$REPO_PATH" && git checkout main 2>/dev/null || git checkout master 2>/dev/null)
  oracle_close

  #Summary
  local commits branches files
  commits=$(cd "$REPO_PATH" && git rev-list --count HEAD)
  branches=$(cd "$REPO_PATH" && git branch | wc -l | tr -d ' ')
  files=$(cd "$REPO_PATH" && git ls-files | wc -l | tr -d ' ')

  echo ""
  chaos "═══════════════════════════════════════════════════"
  chaos "  CHAOS COMPLETE"
  chaos "═══════════════════════════════════════════════════"
  info "Repo:        ${REPO_PATH}"
  info "Commits:     ${commits}"
  info "Branches:    ${branches}"
  info "Files:       ${files}"
  oracle "Secrets:     ${ORACLE_COUNT}"
  oracle "Oracle:      ${ORACLE_FILE}"
  echo ""
  info "Scan with:   sentinel-x scanner on ${REPO_PATH}"
  info "Verify:      Compare output against ${ORACLE_FILE}"
  echo ""
  ok "Chaos repo ready for battle testing!"
}

main
