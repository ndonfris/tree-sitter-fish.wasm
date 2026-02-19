#!/usr/bin/env bash

set -e

# Must be run from the project root
if [ ! -f "package.json" ] || [ ! -f "grammar.ts" ] || [ ! -f "grammar.js" ]; then
    echo "Error: This script must be run from the project root directory."
    exit 1
fi

usage() {
    cat <<EOF
Usage: ./npm-package/$(basename "$0") [OPTIONS|ARGUMENT]

Build a standalone tree-sitter-fish WASM tarball containing only:
  - tree-sitter-fish.wasm
  - package.json

Options:
  -v, --version <version>        Specify the npm package version explicitly
  -t, --tag <tag>                npm dist-tag for publish (default: patch)
  -p, --publish                  Publish the tarball to npm after building
  -n, --dry-run                  Show what publish would run, without executing it
  --use-branch-version           Parse version from last-version.txt (format: [tag/]X.X.X)
  --use-latest-remote-release    Use the latest release tag from ram02z/tree-sitter-fish
  -h, --help                     Show this help message

  Branch version format for --use-branch-version (via last-version.txt):
    [patch|branch|dev|nightly|latest]/X.X.X
    - The prefix before '/' sets the npm publish tag
    - Everything after '/' is the version specifier
    - If no prefix, defaults to 'patch'
    - If no version, uses default auto-resolution

Arguments:
  <version>                 If no options are given, the version can be passed as a single argument
                            EXAMPLES: "3.6.0-2", "3.6.0-patch.1", "4.0.2"

Examples:
  ./npm-package/$(basename "$0")
  ./npm-package/$(basename "$0") -v 3.6.0-patch.2
  ./npm-package/$(basename "$0") -v 3.6.0-patch.2 --publish
  ./npm-package/$(basename "$0") -v 3.6.0-patch.2 --tag dev --publish
  ./npm-package/$(basename "$0") -v 3.6.0-patch.2 --dry-run
  ./npm-package/$(basename "$0") --use-branch-version --publish
  ./npm-package/$(basename "$0") --use-latest-remote-release --publish
EOF
}

FORCED_VERSION=""
PUBLISH=false
DRY_RUN=false
PUBLISH_TAG=""

while [[ $# -gt 0 ]]; do
    case "$1" in
        -v|--version)
            [[ -z "${2:-}" ]] && { echo "Error: --version requires an argument"; exit 1; }
            FORCED_VERSION="$2"
            shift 2
            ;;
        -t|--tag)
            [[ -z "${2:-}" ]] && { echo "Error: --tag requires an argument"; exit 1; }
            PUBLISH_TAG="$2"
            shift 2
            ;;
        -p|--publish)
            PUBLISH=true
            shift
            ;;
        -n|--dry-run)
            DRY_RUN=true
            PUBLISH=true
            shift
            ;;
        --use-branch-version)
            # Try current git branch first, fall back to last-version.txt
            BRANCH_SPEC=$(git branch --show-current 2>/dev/null | tr -d '[:space:]')
            if [[ -z "$BRANCH_SPEC" && -f "last-version.txt" ]]; then
                BRANCH_SPEC=$(cat last-version.txt | tr -d '[:space:]')
            fi
            if [[ -z "$BRANCH_SPEC" ]]; then
                echo "Error: Could not determine branch name and last-version.txt not found"
                exit 1
            fi
            if [[ "$BRANCH_SPEC" == */* ]]; then
                # Format: tag/version (e.g., patch/3.6.0, dev/3.6.1-alpha.1)
                PARSED_TAG="${BRANCH_SPEC%%/*}"
                PARSED_VERSION="${BRANCH_SPEC#*/}"
            else
                # No prefix — default tag to patch, treat whole string as version
                PARSED_TAG="patch"
                PARSED_VERSION="$BRANCH_SPEC"
            fi
            # Strip leading 'v' prefix if present
            PARSED_VERSION="${PARSED_VERSION#v}"
            # Validate tag, default to patch if unrecognized
            case "$PARSED_TAG" in
                patch|branch|dev|nightly|latest) ;;
                *) PARSED_TAG="patch" ;;
            esac
            # Only set PUBLISH_TAG if not already overridden by --tag
            [[ -z "$PUBLISH_TAG" ]] && PUBLISH_TAG="$PARSED_TAG"
            # Only set version if it looks like semver (X.X.X...)
            if [[ "$PARSED_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+ ]]; then
                FORCED_VERSION="$PARSED_VERSION"
            fi
            echo "Branch version: tag=$PUBLISH_TAG version=${FORCED_VERSION:-auto}"
            shift
            ;;
        --use-latest-remote-release)
            FORCED_VERSION=$(curl -s https://api.github.com/repos/ram02z/tree-sitter-fish/releases/latest \
                | jq -r '.tag_name' | sed 's/^v//')
            if [[ -z "$FORCED_VERSION" || "$FORCED_VERSION" == "null" ]]; then
                echo "Error: Could not fetch latest release from ram02z/tree-sitter-fish"
                exit 1
            fi
            [[ -z "$PUBLISH_TAG" ]] && PUBLISH_TAG="latest"
            echo "Using latest remote release: $FORCED_VERSION (tag=$PUBLISH_TAG)"
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            if [[ -z "$FORCED_VERSION" && "$1" != -* ]]; then
                FORCED_VERSION="$1"
                shift
            else
                echo "Error: Unknown option '$1'"
                usage
                exit 1
            fi
            ;;
    esac
done

# Default publish tag to 'patch' if not set
[[ -z "$PUBLISH_TAG" ]] && PUBLISH_TAG="patch"

# ---------------------------------------------------------------------------
# 1. Build tree-sitter-fish.wasm from the repo
# ---------------------------------------------------------------------------
yarn install
yarn build:wasm

# ---------------------------------------------------------------------------
# 2. Move the wasm into a clean npm-package/ directory
# ---------------------------------------------------------------------------
mkdir -p ./npm-package
mv ./tree-sitter-fish.wasm ./npm-package/tree-sitter-fish.wasm

# ---------------------------------------------------------------------------
# 3. Resolve the package version
# ---------------------------------------------------------------------------
pre_pack_version=$(curl -s "https://raw.githubusercontent.com/ram02z/tree-sitter-fish/master/package.json" \
    | grep '"version"' | sed 's/.*"version": "\(.*\)".*/\1/')

last_wasm_pack_version=$(npm view @ndonfris/tree-sitter-fish time --json 2>/dev/null \
    | jq -r 'to_entries | max_by(.key | if . == "modified" or . == "created" then "" else . end) | .key' \
    || echo "0.0.0")

get_larger_version() {
    local v1="$1" v2="$2"
    local base1="${v1%%-*}" base2="${v2%%-*}"
    local pre1="" pre2=""
    [[ "$v1" == *-* ]] && pre1="${v1#*-}"
    [[ "$v2" == *-* ]] && pre2="${v2#*-}"

    if [[ "$base1" != "$base2" ]]; then
        local larger; larger=$(printf '%s\n%s\n' "$base1" "$base2" | sort -V | tail -1)
        [[ "$larger" == "$base1" ]] && echo "$v1" || echo "$v2"
        return
    fi

    [[ -z "$pre1" && -z "$pre2" ]] && { echo "equal:$v1"; return; }
    [[ -z "$pre1" ]] && { echo "$v2"; return; }
    [[ -z "$pre2" ]] && { echo "$v1"; return; }
    [[ "$pre1" == "$pre2" ]] && { echo "latest:$v1"; return; }

    local id1="" id2=""
    [[ "$pre1" == *"."* ]] && id1="${pre1%.*}"
    [[ "$pre2" == *"."* ]] && id2="${pre2%.*}"

    if [[ "$id1" != "$id2" ]]; then
        echo "error: same base $base1 but conflicting pre-release IDs: '$pre1' vs '$pre2'" >&2
        return 1
    fi

    local num1="${pre1##*.}" num2="${pre2##*.}"
    [[ "$pre1" != *"."* ]] && num1="$pre1"
    [[ "$pre2" != *"."* ]] && num2="$pre2"
    (( num1 >= num2 )) && echo "$v1" || echo "$v2"
}

bump_prerelease() {
    local v="$1"
    local base="${v%%-*}"
    local pre=""
    [[ "$v" == *-* ]] && pre="${v#*-}"

    if [[ -z "$pre" ]]; then
        echo "${base}-patch.1"
    elif [[ "$pre" == *"."* ]]; then
        local id="${pre%.*}" num="${pre##*.}"
        echo "${base}-${id}.$((num + 1))"
    else
        echo "${base}-patch.1"
    fi
}

determine_version() {
    if [[ -n "$FORCED_VERSION" ]]; then
        echo "$FORCED_VERSION"
        return
    fi

    local result
    result=$(get_larger_version "$pre_pack_version" "$last_wasm_pack_version")

    case "$result" in
        error:*)              echo "$result" >&2; exit 1 ;;
        latest:*|equal:*)     bump_prerelease "$pre_pack_version" ;;
        "$last_wasm_pack_version") bump_prerelease "$last_wasm_pack_version" ;;
        *)                    echo "$pre_pack_version" ;;
    esac
}

pack_version=$(determine_version)
git_hash=$(git log --pretty='%h' -n 1)

echo "ram02z/tree-sitter-fish: $pre_pack_version | @ndonfris/tree-sitter-fish: $last_wasm_pack_version | new version: $pack_version (${git_hash})"

# ---------------------------------------------------------------------------
# 4. Write a minimal package.json (only the wasm file is shipped)
# ---------------------------------------------------------------------------
cat > ./npm-package/package.json <<EOF
{
  "name": "@ndonfris/tree-sitter-fish",
  "version": "$pack_version",
  "description": "Fish tree-sitter grammar (WASM only)",
  "main": "tree-sitter-fish.wasm",
  "files": ["tree-sitter-fish.wasm"],
  "keywords": ["tree-sitter", "fish", "shell", "parser"],
  "author": "Krnik",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/ram02z/tree-sitter-fish.git"
  },
  "homepage": "https://github.com/ram02z/tree-sitter-fish#readme",
  "bugs": { "url": "https://github.com/ram02z/tree-sitter-fish/issues" },
  "tree-sitter": [{ "scope": "source.fish", "file-types": ["fish"] }],
  "exports": {
    ".": "./tree-sitter-fish.wasm",
    "./tree-sitter-fish.wasm": "./tree-sitter-fish.wasm",
    "./package.json": "./package.json"
  }
}
EOF

# ---------------------------------------------------------------------------
# 5. Pack the tarball (contains only tree-sitter-fish.wasm + package.json)
# ---------------------------------------------------------------------------
pushd ./npm-package > /dev/null
npm pack
popd > /dev/null

echo "Done. Tarball is in ./npm-package/"

# ---------------------------------------------------------------------------
# 6. Publish to npm (if requested)
# ---------------------------------------------------------------------------
if [[ "$PUBLISH" == true ]]; then
    # Publish only runs in GitHub Actions — locally, --publish is treated as --dry-run
    if [[ -z "${GITHUB_ACTIONS:-}" ]]; then
        DRY_RUN=true
        echo "Local environment detected, forcing dry-run mode"
    fi

    PROVENANCE=""
    [[ -n "${GITHUB_ACTIONS:-}" ]] && PROVENANCE="--provenance"
    publish_cmd="npm publish --access public --tag $PUBLISH_TAG $PROVENANCE ./npm-package/"

    # Find the tarball that npm pack created
    TARBALL=$(ls -t ./npm-package/*.tgz 2>/dev/null | head -1)

    GH_REPO="ndonfris/tree-sitter-fish.wasm"
    GH_TAG="v${pack_version}"
    IS_PRERELEASE=false
    [[ "$pack_version" == *-* ]] && IS_PRERELEASE=true
    PRERELEASE_FLAG=""
    [[ "$IS_PRERELEASE" == true ]] && PRERELEASE_FLAG="--prerelease"

    gh_release_cmd="gh release create $GH_TAG --repo $GH_REPO --title \"$GH_TAG\" $PRERELEASE_FLAG --notes \"Published @ndonfris/tree-sitter-fish@$pack_version (tag: $PUBLISH_TAG)\" $TARBALL"

    if [[ "$DRY_RUN" == true ]]; then
        echo "[dry-run] Would run: $publish_cmd"
        echo "[dry-run] Would run: $gh_release_cmd"
    else
        $publish_cmd
        echo "Published @ndonfris/tree-sitter-fish@$pack_version (tag: $PUBLISH_TAG)"

        # Create GitHub release with the tarball (non-fatal — npm publish already succeeded)
        if ! command -v gh &>/dev/null; then
            echo "Warning: gh CLI not found, skipping GitHub release"
        elif gh release view "$GH_TAG" --repo "$GH_REPO" &>/dev/null; then
            echo "GitHub release $GH_TAG already exists, uploading tarball to existing release"
            gh release upload "$GH_TAG" "$TARBALL" --repo "$GH_REPO" --clobber || \
                echo "Warning: Failed to upload tarball to existing release"
        else
            gh release create "$GH_TAG" \
                --repo "$GH_REPO" \
                --title "$GH_TAG" \
                $PRERELEASE_FLAG \
                --notes "Published \`@ndonfris/tree-sitter-fish@$pack_version\` to npm (tag: \`$PUBLISH_TAG\`)" \
                "$TARBALL" \
            && echo "Created GitHub release $GH_TAG on $GH_REPO" \
            || echo "Warning: Failed to create GitHub release (npm publish succeeded)"
        fi
    fi
fi
