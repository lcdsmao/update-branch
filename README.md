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

2. Create a branch protection rule in `Settings/Branches`

Support checks:

- `Require approvals`
- `Status checks that are required`

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
      - uses: lcdsmao/update-branch@v2
        with:
          # Personal access token
          # https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token 
          token: ${{ secrets.MY_PERSONAL_ACCESS_TOKEN }}
          # One of MERGE, SQUASH, REBASE (default: MERGE)
          autoMergeMethod: SQUASH
          requiredLabels: auto-merge
          # Optional branch name pattern instead of main or master
          # protectedBranchNamePattern: trunk
```
