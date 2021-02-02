import {Octokit} from '@octokit/core'
import * as core from '@actions/core'
import * as github from '@actions/github'
import retry from 'async-retry'
import {
  MergeableState,
  MergeStateStatus,
  PullRequestInfo,
  RepositoryPullRequestsInfo
} from './type'

export async function getMergePendingPullRequests(params: {
  octokit: Octokit
  approvedCount: number
}): Promise<PullRequestInfo | undefined> {
  const {octokit, approvedCount} = params
  const result = await listAvailablePullRequests(octokit)
  if (result === undefined) {
    return
  }
  core.info(JSON.stringify(result, null, 1))

  const pullRequests = result.repository.pullRequests.nodes
  const isOutOfDate = (status: MergeStateStatus): boolean => {
    return status === MergeStateStatus.BEHIND
  }
  const isMergeable = (state: MergeableState): boolean => {
    return state === MergeableState.MERGEABLE
  }
  const pending = pullRequests.find(
    pr =>
      isMergeable(pr.mergeable) &&
      isOutOfDate(pr.mergeStateStatus) &&
      pr.reviews.totalCount >= approvedCount
  )
  return pending
}

async function listAvailablePullRequests(
  octokit: Octokit
): Promise<RepositoryPullRequestsInfo> {
  return await retry(
    async () => {
      const result = await listPullRequests(octokit)
      const isAvailable = result.repository.pullRequests.nodes.every(
        pr => pr.mergeable !== MergeableState.UNKNOWN
      )
      if (!isAvailable) throw Error('Some PRs state are UNKNOWN.')
      return result
    },
    {
      minTimeout: 3000,
      retries: 5
    }
  )
}

async function listPullRequests(
  octokit: Octokit
): Promise<RepositoryPullRequestsInfo> {
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
  return result
}
