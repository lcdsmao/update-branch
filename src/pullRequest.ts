import retry from 'async-retry'
import {
  GhContext,
  MergeableState,
  PullRequestInfo,
  RepositoryPullRequestInfo,
  RepositoryPullRequestsInfo
} from './type'

const firstPrNum = 40
const checksNum = 40

export async function getPullRequest(
  ctx: GhContext,
  num: number
): Promise<PullRequestInfo> {
  const result: RepositoryPullRequestInfo = await ctx.octokit.graphql(
    `query ($owner: String!, $repo: String!, $num: Int!) {
        repository(name: $repo, owner: $owner) {
          pullRequest(number: $num) {
            title
            number
            merged
            mergeable
            mergeStateStatus
            reviews(states: APPROVED) {
              totalCount
            }
            reviewRequests {
              totalCount
            }
            commits(last: 1) {
              nodes {
                commit {
                  statusCheckRollup {
                    contexts(first: ${checksNum}) {
                      nodes {
                        ... on CheckRun {
                          name
                          conclusion
                        }
                      }
                    }
                    state
                  }
                }
              }
            }
          }
        }
      }`,
    {
      headers: {
        accept: 'application/vnd.github.merge-info-preview+json'
      },
      owner: ctx.owner,
      repo: ctx.repo,
      num
    }
  )
  return result.repository.pullRequest
}

export async function listAvailablePullRequests(
  ctx: GhContext
): Promise<PullRequestInfo[]> {
  return await retry(
    async () => {
      const pullRequests = await listPullRequests(ctx)
      const isAvailable = pullRequests.every(
        pr => pr.mergeable !== MergeableState.UNKNOWN
      )
      if (!isAvailable) throw Error('Some PRs state are UNKNOWN.')
      return pullRequests
    },
    {
      minTimeout: 3000,
      retries: 5
    }
  )
}

export async function updateBranch(ctx: GhContext, num: number): Promise<void> {
  await ctx.octokit.pulls.updateBranch({
    owner: ctx.owner,
    repo: ctx.repo,
    pull_number: num
  })
}

async function listPullRequests(ctx: GhContext): Promise<PullRequestInfo[]> {
  const result: RepositoryPullRequestsInfo = await ctx.octokit.graphql(
    `query ($owner: String!, $repo: String!) {
        repository(name: $repo, owner: $owner) {
          pullRequests(first: ${firstPrNum}, states: OPEN) {
            nodes {
              title
              number
              merged
              mergeable
              mergeStateStatus
              reviews(states: APPROVED) {
                totalCount
              }
              reviewRequests {
                totalCount
              }
              commits(last: 1) {
                nodes {
                  commit {
                    statusCheckRollup {
                      contexts(first: ${checksNum}) {
                        nodes {
                          ... on CheckRun {
                            name
                            conclusion
                          }
                        }
                      }
                      state
                    }
                  }
                }
              }
            }
          }
        }
      }`,
    {
      headers: {
        accept: 'application/vnd.github.merge-info-preview+json'
      },
      owner: ctx.owner,
      repo: ctx.repo
    }
  )
  return result.repository.pullRequests.nodes
}
