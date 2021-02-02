import {Octokit} from '@octokit/core'
import * as core from '@actions/core'
import * as github from '@actions/github'
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

  core.info(JSON.stringify(result, null, 1))
  const pullRequests = result.repository.pullRequests.nodes
  const isOutOfDate = (status: MergeStateStatus): boolean => {
    return (
      status === MergeStateStatus.BEHIND ||
      status === MergeStateStatus.UNKNOWN ||
      status === MergeStateStatus.UNSTABLE
    )
  }
  const isMergeable = (state: MergeableState): boolean => {
    return (
      state === MergeableState.MERGEABLE || state === MergeableState.UNKNOWN
    )
  }
  const pending = pullRequests.find(
    pr =>
      isMergeable(pr.mergeable) &&
      isOutOfDate(pr.mergeStateStatus) &&
      pr.reviews.totalCount >= approvedCount
  )
  return pending
}
