# Update-branch

Merge your pull request in order when enabled the `Require branches to be up to date before merging`.

Inspired by [Merge Queue feature of Mergify](https://mergify.io/features/merge-queue).

> Rather than overconsuming your CI time by trying to merge multiple pull requests, just run it once before the pull request gets merged.

## Quick Start

0. Enable `Allow auto-merge` in `Settings`

1. Create an issue for this action to record the working status. Remember the issue number.

2. Create a workflow file (`.github/workflow/update-branch.yaml`):

```yaml
name: Update branch

on:
  push:
    branches:
      # Find any PR that can be merged after main updated
      - main
  schedule:
    # Also find any PR that can be merged periodically
    - cron: "0 1-12 * * 1-5"

  # Allows you to run this workflow manually from the Actions tab
  workflow_dispatch:

jobs:
  update-branch:
    runs-on: ubuntu-latest
    steps:
      - uses: lcdsmao/update-branch@v1
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          # Require at least 2 approves
          approvedCount: 2
          # One of MERGE, SQUASH, REBASE
          autoMergeMethod: MERGE
          # The number of the issue that used to record status
          recordIssueNumber: 2568
          # Require this status checks success
          statusChecks: |
            build_pr
            WIP
```
