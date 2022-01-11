# Update Branch

Merge your pull request in order when enabled the `Require branches to be up to date before merging`.

Inspired by [Merge Queue feature of Mergify](https://mergify.io/features/merge-queue).

> Safety
> 
> Do not merge broken pull requests. By merging your pull requests serially using a queue, your code is safe. Each pull request is tested with the latest CI code.

> Save CI time
> 
> Rather than overconsuming your CI time by trying to merge multiple pull requests, just run it once before the pull request gets merged.

## Quick Start

1. Enable `Allow auto-merge` in `Settings/Options`.

2. (Optional) Create a branch protection rule in `Settings/Branches`.

Support checks:

- `Require approvals`
- `Status checks that are required`

This feature requires personal access token that has enough permission.

3. Create a workflow file (`.github/workflow/update-branch.yaml`):

```yaml
name: Update branch

on:
  push:
    branches:
      - main
  pull_request:
    types:
      - labeled
  check_suite:
    types:
      - completed

  # Allows you to run this workflow manually from the Actions tab
  workflow_dispatch:

jobs:
  update-branch:
    runs-on: ubuntu-latest
    steps:
      - uses: lcdsmao/update-branch@v3
        with:
          # Or use personal access token
          token: ${{ secrets.GITHUB_TOKEN }}
          # One of MERGE, SQUASH, REBASE (default: MERGE)
          autoMergeMethod: SQUASH
          # Required at least 2 approves (default: 0)
          requiredApprovals: 2
          # Ignore pull requests without these labels
          requiredLabels: auto-merge
          # Required these status checks success
          requiredStatusChecks: |
            build_pr
            WIP
          # Optional branch name pattern instead of main or master
          # Status checks will be used
          # protectedBranchNamePattern: trunk
```
