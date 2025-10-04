# Fish shell completions for yarn scripts in this project

# If you are not having the completions to the scripts sourced after entering
# this directory, you might want to use a dotenv loader for fish shell, such as:
#
#   • https://github.com/janw/dotenv.fish
#   • https://github.com/berk-karaal/loadenv.fish
#
# See also:
#   • `man dotenv`

# Helper function to check if we're completing a specific yarn script
function __fish_yarn_script_is
    set -l script $argv[1]
    set -l cmd (commandline -opc)
    set -l script_idx (contains -i -- $script $cmd 2>/dev/null)
    test -n "$script_idx"
end

# Helper to get git tags
function __fish_yarn_git_tags
    git tag --list 2>/dev/null
end

# Helper to get current version from package.json
function __fish_yarn_current_version
    grep -oP '(?<="version": ")[^"]*' package.json 2>/dev/null
end

# Complete yarn script names when using 'yarn run'
# complete -c yarn -n "__fish_seen_subcommand_from run" -a "dev build typecheck deps:build deps:check deps:check:upstream deps:check:local deps:check:current deps:update dev:pack dev:install set-version clean clean:packs clean:packs:keep-latest clean:only packs:latest test test:only prepublishOnly" -d "Run script"

# Complete yarn commands (without 'run')
complete -c yarn -f -n "not __fish_seen_subcommand_from run; and not __fish_seen_subcommand_from add remove install upgrade global" -a "dev" -d "Build project (dev mode)"
complete -c yarn -f -n "not __fish_seen_subcommand_from run; and not __fish_seen_subcommand_from add remove install upgrade global" -a "build" -d "Build project"
complete -c yarn -f -n "not __fish_seen_subcommand_from run; and not __fish_seen_subcommand_from add remove install upgrade global" -a "typecheck" -d "Run TypeScript type checking"
complete -c yarn -f -n "not __fish_seen_subcommand_from run; and not __fish_seen_subcommand_from add remove install upgrade global" -a "dev:pack" -d "Build and pack for development"
complete -c yarn -f -n "not __fish_seen_subcommand_from run; and not __fish_seen_subcommand_from add remove install upgrade global" -a "clean" -d "Remove dist directory"
complete -c yarn -f -n "not __fish_seen_subcommand_from run; and not __fish_seen_subcommand_from add remove install upgrade global" -a "clean:packs" -d "Remove all .tgz pack files"
complete -c yarn -f -n "not __fish_seen_subcommand_from run; and not __fish_seen_subcommand_from add remove install upgrade global" -a "clean:packs:keep-latest" -d "Remove all .tgz pack files except latest"
complete -c yarn -f -n "not __fish_seen_subcommand_from run; and not __fish_seen_subcommand_from add remove install upgrade global" -a "packs:latest" -d "Show latest .tgz pack file"
complete -c yarn -f -n "not __fish_seen_subcommand_from run; and not __fish_seen_subcommand_from add remove install upgrade global" -a "test" -d "Run type check, build, and tests"
complete -c yarn -f -n "not __fish_seen_subcommand_from run; and not __fish_seen_subcommand_from add remove install upgrade global" -a "test:only" -d "Run tests only"
complete -c yarn -f -n "not __fish_seen_subcommand_from run; and not __fish_seen_subcommand_from add remove install upgrade global" -a "prepublishOnly" -d "Pre-publish build check"

# deps:* - dependency management scripts
complete -c yarn -n "not __fish_seen_subcommand_from run; and not __fish_seen_subcommand_from add remove install upgrade global" -a "deps:build" -d "Clone and build from upstream repo"
complete -c yarn -f -n "not __fish_seen_subcommand_from run; and not __fish_seen_subcommand_from add remove install upgrade global" -a "deps:check" -d "Compare current version with upstream"
complete -c yarn -f -n "not __fish_seen_subcommand_from run; and not __fish_seen_subcommand_from add remove install upgrade global" -a "deps:check:upstream" -d "Get latest upstream release tag"
complete -c yarn -f -n "not __fish_seen_subcommand_from run; and not __fish_seen_subcommand_from add remove install upgrade global" -a "deps:check:local" -d "Get latest local git tag"
complete -c yarn -f -n "not __fish_seen_subcommand_from run; and not __fish_seen_subcommand_from add remove install upgrade global" -a "deps:check:current" -d "Get current package version"
complete -c yarn -f -n "not __fish_seen_subcommand_from run; and not __fish_seen_subcommand_from add remove install upgrade global" -a "deps:update" -d "Update from latest upstream release"
complete -c yarn -f -n "__fish_yarn_script_is deps:build" -a "latest" -d "Build from latest upstream release"
complete -c yarn -f -n "__fish_yarn_script_is deps:build" -a "(__fish_yarn_git_tags)" -d "Build from specific tag"

# dev:install - requires directory path
complete -c yarn -n "not __fish_seen_subcommand_from run; and not __fish_seen_subcommand_from add remove install upgrade global" -a "dev:install" -d "Install latest dev package to directory"
complete -c yarn -r -n "__fish_yarn_script_is dev:install" -d "Target directory for dev package install"

# set-version - accepts version number and optional flags
complete -c yarn -n "not __fish_seen_subcommand_from run; and not __fish_seen_subcommand_from add remove install upgrade global" -a "set-version" -d "Set package version"
complete -c yarn -f -n "__fish_yarn_script_is set-version; and not string match -qr '^-' -- (commandline -ct)" -a "(__fish_yarn_current_version)" -d "Current version"
complete -c yarn -f -n "__fish_yarn_script_is set-version; and not string match -qr '^-' -- (commandline -ct)" -a "(__fish_yarn_git_tags)" -d "Git tag version"
complete -c yarn -f -n "__fish_yarn_script_is set-version" -l dev -s d -d "Create dev version with timestamp"
complete -c yarn -f -n "__fish_yarn_script_is set-version" -l update-last-version -s u -d "Update last-version.txt"
complete -c yarn -f -n "__fish_yarn_script_is set-version" -l save-current -s s -d "Save current package.json version to last-version.txt"
complete -c yarn -f -n "__fish_yarn_script_is set-version" -l git-tag -s g -d "Create git tag for the version"
