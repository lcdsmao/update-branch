import retry from 'async-retry'
import {
  GhContext,
  MergeableState,
  MergeStateStatus,
  PullRequestInfo,
  RepositoryPullRequestInfo,
  RepositoryPullRequestsInfo
} from './type'

export async function getPullRequest(
  ctx: GhContext,
  num: number
): Promise<PullRequestInfo> {
  const result: RepositoryPullRequestInfo = await ctx.octokit.graphql(
    `query ($owner: String!, $repo: String!, $num: Int!) {
        repository(name: $repo, owner: $owner) {
          pullRequest(number: $num) {
            nodes {
              title
              number
              mergeable
              mergeStateStatus
              reviews(states: APPROVED) {
                totalCount
              }
              reviewRequests {
                totalCount
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

export async function getMergePendingPullRequests(
  ctx: GhContext,
  approvedCount: number
): Promise<PullRequestInfo | undefined> {
  const pullRequests = await listAvailablePullRequests(ctx)
  if (pullRequests === undefined) {
    return
  }
  const pending = pullRequests.find(pr => isPendingPr(pr, approvedCount))
  return pending
}

async function listAvailablePullRequests(
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

async function listPullRequests(ctx: GhContext): Promise<PullRequestInfo[]> {
  const result: RepositoryPullRequestsInfo = await ctx.octokit.graphql(
    `query ($owner: String!, $repo: String!) {
        repository(name: $repo, owner: $owner) {
          pullRequests(first: 20, states: OPEN) {
            nodes {
              title
              number
              mergeable
              mergeStateStatus
              reviews(states: APPROVED) {
                totalCount
              }
              reviewRequests {
                totalCount
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

function isPendingPr(pr: PullRequestInfo, approvedCount: number): boolean {
  const isOutOfDate = (status: MergeStateStatus): boolean => {
    return status === MergeStateStatus.BEHIND
  }
  const isMergeable = (state: MergeableState): boolean => {
    return state === MergeableState.MERGEABLE
  }
  return (
    isMergeable(pr.mergeable) &&
    isOutOfDate(pr.mergeStateStatus) &&
    pr.reviews.totalCount >= approvedCount &&
    pr.reviews.totalCount >= pr.reviewRequests.totalCount
  )
}
