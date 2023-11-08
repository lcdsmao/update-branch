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

> This action only has effect if you enabled `Settings/Branches/YourBranchProtectionRule/Require status checks to pass before merging/Require branches to be up to date before merging`.

1. Enable `Allow auto-merge` in `Settings/Options`.

2. Create a workflow file (`.github/workflow/update-branch.yaml`):

Example:

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
          # Ignore pull requests without these labels
          requiredLabels: auto-merge
          # Required at least 2 approves (default: 0)
          requiredApprovals: 2
          # Required approvals from all requested reviewers
          allRequestedReviewersMustApprove: true
          # Required these status checks success
          requiredStatusChecks: |
            build_pr
            WIP
          # Optionally set the maximum amount of pull requests to match against (default: 50)
          fetchMaxPr: 50
          # Optionally set the maximum amount of pull request checks to fetch (default: 100)
          fetchMaxPrChecks: 100
          # Optionally set the maximum amount of pull request labels to fetch (default: 10)
          fetchMaxPrLabels: 10
          # The order pr checks should be fetched in. If the required checks are the last ones, consider setting to "last"
          prChecksFetchOrder: first
```

If you are using a personal access token and it has permission to access branch protection rules, you can set your jobs like:

```yaml
jobs:
  update-branch:
    runs-on: ubuntu-latest
    steps:
      - uses: lcdsmao/update-branch@v3
        with:
          # Personal access token
          token: ${{ secrets.MY_PAT }}
          # One of MERGE, SQUASH, REBASE (default: MERGE)
          autoMergeMethod: SQUASH
          # Ignore pull requests without these labels
          requiredLabels: auto-merge
          # `Status checks` and `Require approvals` settings will be used
          # Or ignore this key then the action will automatically find main or master branch protection rule
          protectedBranchNamePattern: trunk
```
