# Update-branch

Merge your pull request in order when enabled the `Require branches to be up to date before merging`.

Inspired by [Merge Queue feature of Mergify](https://mergify.io/features/merge-queue).

> Rather than overconsuming your CI time by trying to merge multiple pull requests, just run it once before the pull request gets merged.

## Quick Start

0. Enable `Allow auto-merge` in `Settings`.

1. Create an issue for this action to record the working status. Remember the issue number.

2. Create a workflow file (`.github/workflow/update-branch.yaml`):

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
      - uses: lcdsmao/update-branch@v
        with:
          # Or use personal access token
          token: ${{ secrets.GITHUB_TOKEN }}
          # The number of the issue that used to record status
          recordIssueNumber: 2568
          # One of MERGE, SQUASH, REBASE (default: MERGE)
          autoMergeMethod: SQUASH
          # Required at least 2 approves (default: 0)
          requiredApprovals: 2
          # Required pull request has labels (optional)
          requiredLabels: auto-merge
          # Required these status checks success
          requiredStatusChecks: |
            build_pr
            WIP
```
