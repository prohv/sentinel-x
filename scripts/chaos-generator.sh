#!/usr/bin/env bash
# Sentinel-X Chaos Generator
# Usage: bash chaos-generator.sh [--commits N] [--output DIR]
# Run it outside this folder

TOTAL_COMMITS=60
TARGET_DIR="./sentinel-chaos-demo"
REPO_NAME="chaos-repo"
BRANCH_COUNTER=0
ORACLE_ENTRIES=""
pending_cleanup=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --commits) TOTAL_COMMITS="$2"; shift 2;;
    --output)  TARGET_DIR="$2"; shift 2;;
    *) shift;;
  esac
done

REPO_PATH="${TARGET_DIR}/${REPO_NAME}"
ORACLE_FILE="${TARGET_DIR}/ground_truth.json"

cyan()  { echo -e "\033[0;36m$1\033[0m"; }
red()   { echo -e "\033[0;31m$1\033[0m"; }
green() { echo -e "\033[0;32m$1\033[0m"; }
blue()  { echo -e "\033[0;34m$1\033[0m"; }

info()  { blue "[INFO]  $1"; }
ok()    { green "[OK]    $1"; }
chaos() { red "[CHAOS]  $1"; }
oracle(){ cyan "[ORACLE] $1"; }

rand_elem() {
  local -a arr=("$@")
  echo "${arr[$((RANDOM % ${#arr[@]}))]}"
}

random_date() {
  local weeks=$((RANDOM % 12))
  local days=$((RANDOM % 7))
  local h=$((RANDOM % 24)) m=$((RANDOM % 60)) s=$((RANDOM % 60))
  date -d "${weeks} weeks ago + ${days} days + ${h} hours + ${m} minutes + ${s} seconds" \
    "+%Y-%m-%dT%H:%M:%S" 2>/dev/null || date "+%Y-%m-%dT%H:%M:%S"
}

rand_alnum() {
  local len="${1:-24}"
  local out=""
  local chars="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  for ((i=0; i<len; i++)); do
    out+="${chars:$((RANDOM % 62)):1}"
  done
  echo "$out"
}

rand_upper() {
  local len="${1:-16}"
  local out=""
  local chars="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  for ((i=0; i<len; i++)); do
    out+="${chars:$((RANDOM % 36)):1}"
  done
  echo "$out"
}

rand_hex() {
  local len="${1:-32}"
  local out=""
  local chars="0123456789abcdef"
  for ((i=0; i<len; i++)); do
    out+="${chars:$((RANDOM % 16)):1}"
  done
  echo "$out"
}

deep_path() {
  local depth=$((3 + RANDOM % 3))
  local dirs=(src lib internal legacy v1 tests utils config helpers core services api)
  local hidden=(.cache .config .local .build .temp .webpack .next)
  local bases=(config settings credentials auth connection database service handler util constants env)
  local exts=(json yaml yml env ts tsx js go py conf cfg)

  if ((RANDOM % 5 == 0)); then
    local path="$(rand_elem "${hidden[@]}")"
  else
    local path="$(rand_elem "${dirs[@]}")"
  fi
  for ((i=1; i<depth; i++)); do
    if ((RANDOM % 5 == 0)); then
      path+="/$(rand_elem "${hidden[@]}")"
    else
      path+="/$(rand_elem "${dirs[@]}")"
    fi
  done
  path+="/$(rand_elem "${bases[@]}").$(rand_elem "${exts[@]}")"
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
    "style: improve component styling"
    "perf: optimize database query performance"
    "ci: configure automated deployment pipeline"
    "build: update webpack configuration"
    "feat: implement real-time notifications"
    "fix: handle edge cases in form validation"
    "refactor: simplify error handling"
    "chore: migrate to new config format"
    "feat: add export functionality"
    "fix: correct timezone conversion"
    "test: add unit tests for auth"
    "docs: update README instructions"
    "perf: reduce bundle size"
    "feat: implement caching layer"
  )
  echo "${msgs[$((RANDOM % ${#msgs[@]}))]}"
}

# ── Boilerplate: real components ──
boilerplate_component() {
  local name="$1"
  cat << EOF
import React, { useState, useEffect } from "react";

interface ${name}Props {
  id?: string;
  title?: string;
}

export const ${name}: React.FC<${name}Props> = ({ id, title }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch(\`/api/${name.toLowerCase()}/\${id}\`)
      .then((res) => res.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch((err) => console.error(err));
  }, [id]);

  if (loading) return <div className="spinner">Loading...</div>;
  if (!data) return <div>Not found</div>;

  return (
    <div className="${name.toLowerCase()}-card">
      <h2>{title || data.name}</h2>
      <p>{data.description}</p>
    </div>
  );
};
EOF
}

boilerplate_lib() {
  local name="$1"
  cat << EOF
/**
 * ${name} utility module
 */

interface ${name}Options {
  timeout?: number;
  retries?: number;
  debug?: boolean;
}

const DEFAULT_OPTS: ${name}Options = {
  timeout: 5000,
  retries: 3,
  debug: false,
};

export function ${name}Init(opts?: ${name}Options) {
  const config = { ...DEFAULT_OPTS, ...opts };
  console.log("[${name}] initialized with", config);
  return { config };
}

export async function ${name}Fetch(url: string, opts?: ${name}Options) {
  const c = ${name}Init(opts);
  const res = await fetch(url, { signal: AbortSignal.timeout(c.config.timeout) });
  if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
  return res.json();
}

export function ${name}Parse(raw: unknown) {
  if (typeof raw === "string") return JSON.parse(raw);
  return raw;
}
EOF
}

boilerplate_api() {
  local name="$1"
  cat << EOF
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });
  return NextResponse.json({ id, name: "${name}" });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  return NextResponse.json({ created: true, ...body }, { status: 201 });
}
EOF
}

boilerplate_test() {
  local name="$1"
  cat << EOF
import { describe, it, expect } from "vitest";
import { ${name}Init, ${name}Fetch } from "../${name}";

describe("${name}", () => {
  it("should init with defaults", () => {
    const { config } = ${name}Init();
    expect(config.timeout).toBe(5000);
    expect(config.retries).toBe(3);
  });

  it("should override options", () => {
    const { config } = ${name}Init({ timeout: 1000 });
    expect(config.timeout).toBe(1000);
  });

  it("should throw on bad url", async () => {
    await expect(${name}Fetch("bad-url")).rejects.toThrow();
  });
});
EOF
}

# ── Secret generators ──
gen_aws()         { echo "AKIA$(rand_upper 16)"; }
gen_stripe()      { local m="live"; ((RANDOM % 2 == 0)) && m="test"; echo "sk_${m}_$(rand_alnum 24)"; }
gen_github()      { echo "ghp_$(rand_alnum 36)"; }
gen_apikey()      { echo "$(rand_hex 32)"; }
gen_entropy()     { echo "$(rand_hex 64)"; }
gen_password()    { echo "$(rand_alnum 16)"; }
gen_slack()       { echo "xoxb-$(rand_hex 12)-$(rand_hex 24)-$(rand_alnum 24)"; }
gen_sendgrid()    { echo "SG.$(rand_alnum 22).$(rand_alnum 43)"; }
gen_twilio()      { echo "$(rand_hex 32)"; }

SECRET_TYPES=(aws stripe github apikey entropy password slack sendgrid twilio)

gen_private_key() {
  cat << 'PRIVKEY'
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA0Z3VS5JJcds3xfn/ygWyF8PbnGy0AHB7MhgHcTz6sE2I2yPB
aFDrBz9vFqU4yL8GmPnG0Y2fK5p3LqKXvP8FhK5x8L3qM7vN6wQ9zR5cY8fT2nK
L4mP9vQ6xR7cS3fN5pL8mK2vT9xQ6yR4cP7fL3nM5vK8wQ2zT6cY9fU2oL5mQ8v
-----END RSA PRIVATE KEY-----
PRIVKEY
}

# ── Oracle ──
oracle_log() {
  local st="$1" ch="$2" fp="$3" ln="$4" sv="$5" lc="$6"
  ORACLE_ENTRIES="${ORACLE_ENTRIES}    {\"secretType\":\"${st}\",\"commitHash\":\"${ch}\",\"filePath\":\"${fp}\",\"lineNumber\":${ln},\"lifecycle\":\"${lc}\"},"
}

# ── Inject secret into a file ──
inject_secret() {
  local secret_type="$1" file_path="$2"
  local secret_value="" content="" line_num=0
  local existing=""

  local dir
  dir="$(dirname "$file_path")"
  mkdir -p "$dir" || { echo "ERROR: mkdir failed for $dir"; return 1; }

  # Load existing content if file exists
  if [[ -f "$file_path" ]]; then
    existing=$(cat "$file_path")
  fi

  case "$secret_type" in
    aws)
      secret_value=$(gen_aws)
      content="AWS_ACCESS_KEY_ID=${secret_value}"
      line_num=$((RANDOM % 5 + 1));;
    stripe)
      secret_value=$(gen_stripe)
      content="STRIPE_SECRET_KEY=${secret_value}"
      line_num=$((RANDOM % 5 + 1));;
    github)
      secret_value=$(gen_github)
      content="GITHUB_TOKEN=${secret_value}"
      line_num=$((RANDOM % 5 + 1));;
    apikey)
      secret_value=$(gen_apikey)
      content="API_KEY=${secret_value}"
      line_num=$((RANDOM % 5 + 1));;
    entropy)
      secret_value=$(gen_entropy)
      content="ENCRYPTION_SECRET=${secret_value}"
      line_num=$((RANDOM % 5 + 1));;
    password)
      secret_value=$(gen_password)
      content="DB_PASSWORD=${secret_value}"
      line_num=$((RANDOM % 5 + 1));;
    slack)
      secret_value=$(gen_slack)
      content="SLACK_BOT_TOKEN=${secret_value}"
      line_num=$((RANDOM % 5 + 1));;
    sendgrid)
      secret_value=$(gen_sendgrid)
      content="SENDGRID_API_KEY=${secret_value}"
      line_num=$((RANDOM % 5 + 1));;
    twilio)
      secret_value=$(gen_twilio)
      content="TWILIO_AUTH_TOKEN=${secret_value}"
      line_num=$((RANDOM % 5 + 1));;
  esac

  # Append to existing or create new
  if [[ -n "$existing" ]]; then
    printf '%s\n%s\n' "$existing" "$content" > "$file_path"
  else
    printf '%s\n' "$content" > "$file_path"
  fi

  echo "${secret_type}|${file_path}|${line_num}|${secret_value}"
}

# ── Inject secret inline into source code ──
inject_inline_secret() {
  local secret_type="$1" file_path="$2"
  local secret_value="" line_content="" line_num=0
  local existing=""

  local dir
  dir="$(dirname "$file_path")"
  mkdir -p "$dir" || return 1

  if [[ -f "$file_path" ]]; then
    existing=$(cat "$file_path")
  fi

  case "$secret_type" in
    aws)
      secret_value=$(gen_aws)
      line_content="  accessKeyId: '${secret_value}',";;
    stripe)
      secret_value=$(gen_stripe)
      line_content="const stripe = new Stripe('${secret_value}');";;
    github)
      secret_value=$(gen_github)
      line_content="const token = '${secret_value}';";;
    apikey)
      secret_value=$(gen_apikey)
      line_content="const apiKey = '${secret_value}';";;
    password)
      secret_value=$(gen_password)
      line_content="// TODO: change default password '${secret_value}'";;
    slack)
      secret_value=$(gen_slack)
      line_content="const SLACK_TOKEN = '${secret_value}';";;
    entropy)
      secret_value=$(gen_entropy)
      line_content="export const SECRET = '${secret_value}';";;
  esac

  if [[ -n "$existing" ]]; then
    printf '%s\n%s\n' "$existing" "$line_content" > "$file_path"
  else
    printf '%s\n' "$line_content" > "$file_path"
  fi

  echo "${secret_type}|${file_path}|${line_num}|${secret_value}"
}

do_commit() {
  git add -A >/dev/null 2>&1
  GIT_COMMITTER_DATE="$2" git commit -m "$1" --date="$2" --allow-empty >/dev/null 2>&1 || true
}

branch_inject() {
  local branch_name="feature/leak-$((++BRANCH_COUNTER))"
  chaos "  Branch: ${branch_name}"
  git checkout -b "$branch_name" 2>/dev/null || return 0

  # Pick a random secret type not in .env
  local stype
  stype=$(rand_elem aws stripe github slack password entropy apikey)

  local fpath
  if ((RANDOM % 3 == 0)); then
    fpath=$(deep_path)
  else
    fpath="$(rand_elem src lib internal config)/$(rand_elem credentials secrets config auth).$(rand_elem json yaml env ts js)"
  fi

  local result
  result=$(inject_secret "$stype" "$fpath")
  if [[ $? -ne 0 || -z "$result" ]]; then
    git checkout main 2>/dev/null || git checkout master 2>/dev/null || true
    return 0
  fi

  local lnum secret
  IFS='|' read -r _ _ lnum secret <<< "$result"

  mkdir -p src/lib
  boilerplate_lib "Branch${BRANCH_COUNTER}" > "src/lib/branch_${BRANCH_COUNTER}.ts"
  do_commit "feat: experimental ${branch_name}" "$(random_date)"
  oracle_log "$stype" "$(git rev-parse HEAD)" "$fpath" "$lnum" "$secret" "branch"
  git checkout main 2>/dev/null || git checkout master 2>/dev/null || true
  ok "  Abandoned at: ${fpath}"
}

# ── Build project skeleton ──
build_skeleton() {
  local components=(Dashboard Navbar Sidebar Auth Modal Table Chart Form Card Button Header Footer Layout Provider)
  local libs=(api auth db cache config logger middleware schema utils hooks validators helpers formatters parsers)
  local apis=(users posts comments products orders payments notifications webhooks uploads sessions)
  local tests=("api.test" "auth.test" "utils.test" "schema.test" "config.test")

  # .env.local with 25-30 secrets (Feature: taint baseline)
  chaos "  Seeding .env.local with 28 secrets..."
  {
    echo "# App"
    echo "NODE_ENV=development"
    echo "PORT=3000"
    echo ""
    echo "# Database"
    echo "DATABASE_URL=postgres://admin:$(gen_password)@db.example.com:5432/production"
    echo "REDIS_URL=redis://cache:$(gen_password)@redis.example.com:6379"
    echo "MONGODB_URI=mongodb://root:$(gen_password)@cluster0.example.com:27017/app"
    echo ""
    echo "# AWS"
    echo "AWS_ACCESS_KEY_ID=$(gen_aws)"
    echo "AWS_SECRET_ACCESS_KEY=$(rand_hex 40)"
    echo "AWS_REGION=us-east-1"
    echo ""
    echo "# Stripe"
    echo "STRIPE_SECRET_KEY=$(gen_stripe)"
    echo "STRIPE_PUBLISHABLE_KEY=pk_live_$(rand_alnum 24)"
    echo "STRIPE_WEBHOOK_SECRET=$(rand_hex 32)"
    echo ""
    echo "# GitHub"
    echo "GITHUB_TOKEN=$(gen_github)"
    echo "GITHUB_CLIENT_SECRET=$(rand_hex 32)"
    echo ""
    echo "# Third-party APIs"
    echo "SENDGRID_API_KEY=$(gen_sendgrid)"
    echo "SLACK_BOT_TOKEN=$(gen_slack)"
    echo "TWILIO_AUTH_TOKEN=$(gen_twilio)"
    echo "API_KEY=$(gen_apikey)"
    echo "API_SECRET=$(gen_apikey)"
    echo ""
    echo "# Auth"
    echo "JWT_SECRET=$(rand_hex 32)"
    echo "SESSION_SECRET=$(rand_hex 32)"
    echo "ENCRYPTION_KEY=$(gen_entropy)"
    echo ""
    echo "# Misc"
    echo "ADMIN_PASSWORD=$(gen_password)"
    echo "BACKUP_PASSWORD=$(gen_password)"
    echo "DEPLOY_KEY=$(gen_entropy)"
    echo "PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----"
  } > ".env.local"
  oracle_log "env-baseline" "" ".env.local" 0 "" "active"

  # package.json
  cat > "package.json" << 'PKG'
{
  "name": "chaos-app",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest"
  },
  "dependencies": {
    "react": "^19.0.0",
    "next": "^16.0.0",
    "stripe": "^17.0.0"
  }
}
PKG

  # tsconfig
  cat > "tsconfig.json" << 'TSC'
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "strict": true,
    "moduleResolution": "bundler",
    "paths": { "@/*": ["./src/*"] }
  }
}
TSC

  # next.config
  cat > "next.config.ts" << 'NXC'
import type { NextConfig } from "next";
const config: NextConfig = {};
export default config;
NXC

  # gitignore
  cat > ".gitignore" << 'GIT'
node_modules/
.next/
.env
*.log
GIT

  # src structure
  mkdir -p src/{components/{ui,layout,auth,forms,dashboard},lib/{api,db,auth,utils},pages/api/{users,products,auth},tests}

  # Generate components
  for comp in "${components[@]}"; do
    boilerplate_component "$comp" > "src/components/ui/${comp}.tsx"
  done

  # Generate lib files
  for lib in "${libs[@]}"; do
    boilerplate_lib "$lib" > "src/lib/${lib}.ts"
  done

  # Generate API routes
  for api in "${apis[@]}"; do
    boilerplate_api "$api" > "src/pages/api/${api}/route.ts"
  done

  # Generate tests
  for t in "${tests[@]}"; do
    boilerplate_test "$t" > "src/tests/${t}.ts"
  done

  do_commit "chore: scaffold project" "$(random_date)"
  ok "Skeleton built"
}

# ── Main ──
main() {
  mkdir -p "$TARGET_DIR" || { echo "ERROR: cannot create $TARGET_DIR"; exit 1; }
  rm -rf "${TARGET_DIR:?}"/* 2>/dev/null || true
  rm -rf "${TARGET_DIR:?}"/.[!.]* 2>/dev/null || true

  chaos "Sentinel-X Chaos Generator"
  chaos "═══════════════════════════════════"
  info "Commits: ${TOTAL_COMMITS}"
  info "Output:  ${TARGET_DIR}"
  echo ""

  mkdir -p "$REPO_PATH" || { echo "ERROR: cannot create $REPO_PATH"; exit 1; }
  cd "$REPO_PATH" || { echo "ERROR: cd failed"; exit 1; }
  git init >/dev/null 2>&1 || { echo "ERROR: git init failed"; exit 1; }
  git config user.name "Chaos Agent"
  git config user.email "chaos@sentinel-x.dev"

  # Phase 1: Build skeleton + .env.local
  chaos "Phase 1: Project skeleton..."
  build_skeleton

  echo ""

  # Phase 2: Evolve app with commits
  chaos "Phase 2: Evolving app (${TOTAL_COMMITS} commits)..."

  local components=(UserProfile Dashboard Settings Modal Form Table Chart Card Header Footer Layout Provider)
  local libs=(cache formatter parser validator scheduler middleware observer emitter transformer)
  local apis=(analytics reviews inventory billing reports audit search export)

  for ((i=1; i<=TOTAL_COMMITS; i++)); do
    # Oops lifecycle — cleanup previous (30% chance)
    if [[ -n "$pending_cleanup" ]] && ((RANDOM % 10 < 3)); then
      local cfile="$pending_cleanup"
      local action=$((RANDOM % 3))
      if ((action == 0)); then
        rm -f "$cfile" 2>/dev/null || true
      elif ((action == 1)); then
        echo "$cfile" >> ".gitignore"
        rm -f "$cfile" 2>/dev/null || true
      else
        printf '# Secrets removed\nAPI_KEY=\nDATABASE_URL=\n' > "$cfile"
      fi
      do_commit "fix: remove credentials from ${cfile}" "$(random_date)"
      oracle_log "cleanup" "$(git rev-parse HEAD)" "$cfile" 0 "" "deleted"
      pending_cleanup=""
    fi

    # 35% inject secret, 65% normal
    if ((RANDOM % 100 < 35)); then
      # Pick injection type: env file (50%), inline source (30%), config file (20%)
      local inj_type=$((RANDOM % 10))

      if ((inj_type < 5)); then
        # Add to .env.local or new env file
        local env_file=".env.local"
        if ((RANDOM % 3 == 0)); then
          env_file="$(rand_elem .env.production .env.staging .env.test .env.development)"
        fi
        local result
        result=$(inject_secret "$(rand_elem "${SECRET_TYPES[@]}")" "$env_file")
        if [[ $? -eq 0 && -n "$result" ]]; then
          local stype lnum secret
          IFS='|' read -r stype _ lnum secret <<< "$result"
          do_commit "chore: update ${env_file}" "$(random_date)"
          oracle_log "$stype" "$(git rev-parse HEAD)" "$env_file" "$lnum" "$secret" "active"
          chaos "  [${i}] env: ${env_file}"
          pending_cleanup="$env_file"
        fi

      elif ((inj_type < 8)); then
        # Inline in source file
        local src_files=(
          "src/lib/api.ts"
          "src/lib/db.ts"
          "src/lib/auth.ts"
          "src/lib/config.ts"
          "src/lib/utils.ts"
          "src/lib/middleware.ts"
          "src/pages/api/users/route.ts"
          "src/pages/api/products/route.ts"
        )
        local src_file
        src_file=$(rand_elem "${src_files[@]}")

        local result
        result=$(inject_inline_secret "$(rand_elem aws stripe github apikey password slack entropy)" "$src_file")
        if [[ $? -eq 0 && -n "$result" ]]; then
          local stype lnum secret
          IFS='|' read -r stype _ lnum secret <<< "$result"
          do_commit "$(commit_msg)" "$(random_date)"
          oracle_log "$stype" "$(git rev-parse HEAD)" "$src_file" "$lnum" "$secret" "active"
          chaos "  [${i}] inline: ${src_file}"
          pending_cleanup="$src_file"
        fi

      else
        # Config/secrets file
        local fpath
        if ((RANDOM % 4 == 0)); then
          fpath=$(deep_path)
          chaos "  [${i}] deep: ${fpath}"
        else
          fpath="$(rand_elem src lib config internal)/$(rand_elem credentials secrets config auth database).$(rand_elem json yaml ts env)"
          chaos "  [${i}] config: ${fpath}"
        fi

        local result
        result=$(inject_secret "$(rand_elem "${SECRET_TYPES[@]}")" "$fpath")
        if [[ $? -eq 0 && -n "$result" ]]; then
          local stype lnum secret
          IFS='|' read -r stype _ lnum secret <<< "$result"
          do_commit "$(commit_msg)" "$(random_date)"
          oracle_log "$stype" "$(git rev-parse HEAD)" "$fpath" "$lnum" "$secret" "active"
          pending_cleanup="$fpath"
        fi
      fi

      # Branch every 15 commits
      if ((i % 15 == 0)); then
        branch_inject
      fi
    else
      # Normal app commit — add component, lib, api route, or test
      local commit_type=$((RANDOM % 5))
      case $commit_type in
        0)
          local comp
          comp="$(rand_elem "${components[@]}")_$(printf '%02d' $i)"
          boilerplate_component "$comp" > "src/components/ui/${comp}.tsx"
          ;;
        1)
          local lib
          lib="$(rand_elem "${libs[@]}")_$(printf '%02d' $i)"
          boilerplate_lib "$lib" > "src/lib/${lib}.ts"
          ;;
        2)
          local api
          api="$(rand_elem "${apis[@]}")_${i}"
          mkdir -p "src/pages/api/${api}"
          boilerplate_api "$api" > "src/pages/api/${api}/route.ts"
          ;;
        3)
          boilerplate_test "feature_${i}" > "src/tests/feature_${i}.test.ts"
          ;;
        4)
          # Add a new page + component together
          local page
          page="$(rand_elem dashboard admin settings profile billing reports)"
          mkdir -p "src/pages/${page}"
          cat > "src/pages/${page}/index.tsx" << PAGEEOF
import { ${page^} } from "@/components/ui/${page^}";
export default function ${page^}Page() { return <${page^} />; }
PAGEEOF
          boilerplate_component "${page^}" > "src/components/ui/${page^}.tsx"
          ;;
      esac
      do_commit "$(commit_msg)" "$(random_date)"
    fi
  done

  # Final cleanup — 50% chance
  if [[ -n "$pending_cleanup" ]] && ((RANDOM % 2 == 0)); then
    rm -f "$pending_cleanup" 2>/dev/null || true
    do_commit "security: final cleanup" "$(random_date)"
    oracle_log "cleanup" "$(git rev-parse HEAD)" "$pending_cleanup" 0 "" "deleted"
  fi

  echo ""

  # Phase 3: Abandoned branches
  info "Creating abandoned branches..."
  for bi in 1 2 3 4; do
    branch_inject
    git checkout "feature/leak-${BRANCH_COUNTER}" 2>/dev/null || true
    for j in 1 2 3; do
      boilerplate_component "Feat${bi}_${j}" > "src/components/ui/feat${bi}_${j}.tsx"
      do_commit "feat: branch ${bi} commit ${j}" "$(random_date)"
    done
    git checkout main 2>/dev/null || git checkout master 2>/dev/null || true
  done

  # Hidden file ghosts
  echo ""
  info "Planting hidden file secrets..."
  local hfiles=(".config/credentials.json" ".cache/auth.yml" ".local/db.conf" ".next/env.js" ".temp/secrets.json")
  for hf in "${hfiles[@]}"; do
    local result
    result=$(inject_secret "$(rand_elem "${SECRET_TYPES[@]}")" "$hf")
    if [[ $? -eq 0 && -n "$result" ]]; then
      local stype lnum secret
      IFS='|' read -r stype _ lnum secret <<< "$result"
      do_commit "chore: add ${hf}" "$(random_date)"
      oracle_log "$stype" "$(git rev-parse HEAD)" "$hf" "$lnum" "$secret" "active"
      chaos "  HIDDEN: ${hf}"
    fi
  done

  # Write oracle
  if [[ -n "$ORACLE_ENTRIES" ]]; then
    local clean="${ORACLE_ENTRIES%,}"
    printf '[\n%s\n]\n' "$clean" > "$ORACLE_FILE"
  else
    printf '[]\n' > "$ORACLE_FILE"
  fi

  git checkout main 2>/dev/null || git checkout master 2>/dev/null || true

  local commits branches files
  commits=$(git rev-list --count HEAD)
  branches=$(git branch | wc -l | tr -d ' ')
  files=$(git ls-files | wc -l | tr -d ' ')

  local oracle_count=0
  if [[ -f "$ORACLE_FILE" ]]; then
    oracle_count=$(grep -c "secretType" "$ORACLE_FILE" 2>/dev/null || echo 0)
  fi

  echo ""
  chaos "═══════════════════════════════════"
  chaos "  CHAOS COMPLETE"
  chaos "═══════════════════════════════════"
  info "Commits:     ${commits}"
  info "Branches:    ${branches}"
  info "Files:       ${files}"
  oracle "Secrets:     ${oracle_count}"
  oracle "Oracle:      ${ORACLE_FILE}"
  echo ""
  ok "Ready!"
}

main
