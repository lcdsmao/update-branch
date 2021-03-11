import {Octokit} from '@octokit/core'
import * as core from '@actions/core'
import * as github from '@actions/github'
import retry from 'async-retry'
import {
  MergeableState,
  MergeStateStatus,
  PullRequestInfo,
  RepositoryPullRequestInfo,
  RepositoryPullRequestsInfo
} from './type'

export async function getPullRequest({
  octokit,
  num
}: {
  octokit: Octokit
  num: number
}): Promise<PullRequestInfo> {
  const {owner, repo} = github.context.repo
  const result: RepositoryPullRequestInfo = await octokit.graphql(
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
      owner,
      repo,
      num
    }
  )
  return result.repository.pullRequest
}

export async function getMergePendingPullRequests(params: {
  octokit: Octokit
  approvedCount: number
}): Promise<PullRequestInfo | undefined> {
  const {octokit, approvedCount} = params
  const pullRequests = await listAvailablePullRequests(octokit)
  if (pullRequests === undefined) {
    return
  }
  core.info(JSON.stringify(pullRequests, null, 1))

  const pending = pullRequests.find(pr => isPendingPr(pr, approvedCount))
  return pending
}

async function listAvailablePullRequests(
  octokit: Octokit
): Promise<PullRequestInfo[]> {
  return await retry(
    async () => {
      const pullRequests = await listPullRequests(octokit)
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

async function listPullRequests(octokit: Octokit): Promise<PullRequestInfo[]> {
  const {owner, repo} = github.context.repo
  const result: RepositoryPullRequestsInfo = await octokit.graphql(
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
      owner,
      repo
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
