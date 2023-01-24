import retry from 'async-retry'
import {
  GhContext,
  PullRequestInfo,
  RepositoryGetPullRequest,
  RepositoryListPullRequest
} from './type'

export async function getPullRequest(
  ctx: GhContext,
  num: number
): Promise<PullRequestInfo> {
  const result: RepositoryGetPullRequest = await ctx.octokit.graphql(
    `query ($owner: String!, $repo: String!, $num: Int!) {
        repository(name: $repo, owner: $owner) {
          pullRequest(number: $num) {
            ${pullRequestFragment}
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
      const isAvailable = pullRequests.every(pr => pr.mergeable !== 'UNKNOWN')
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
  await ctx.octokit.request(
    'PUT /repos/{owner}/{repo}/pulls/{pull_number}/update-branch',
    {
      owner: ctx.owner,
      repo: ctx.repo,
      pull_number: num
    }
  )
}

export async function enablePullRequestAutoMerge(
  ctx: GhContext,
  prId: String
): Promise<void> {
  await ctx.octokit.graphql(
    `mutation ($id: ID!, $mergeMethod: PullRequestMergeMethod) {
      enablePullRequestAutoMerge(input: { pullRequestId: $id, mergeMethod: $mergeMethod }) {
        clientMutationId
      }
    }`,
    {
      id: prId,
      mergeMethod: ctx.autoMergeMethod
    }
  )
}

export async function mergePullRequest(
  ctx: GhContext,
  prId: String
): Promise<void> {
  await ctx.octokit.graphql(
    `mutation ($id: ID!, $mergeMethod: PullRequestMergeMethod) {
      mergePullRequest(input: { pullRequestId: $id, mergeMethod: $mergeMethod }) {
        clientMutationId
      }
    }`,
    {
      id: prId,
      mergeMethod: ctx.autoMergeMethod
    }
  )
}

async function listPullRequests(ctx: GhContext): Promise<PullRequestInfo[]> {
  const result: RepositoryListPullRequest = await ctx.octokit.graphql(
    `query ($owner: String!, $repo: String!) {
        repository(name: $repo, owner: $owner) {
          pullRequests(first: ${pullRequestCount}, states: OPEN) {
            nodes {
              ${pullRequestFragment}
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

const pullRequestCount = 50
const checkCount = 100
const labelCount = 10

const pullRequestFragment = `
  id
  title
  baseRefName
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
  labels(first: ${labelCount}) {
    nodes {
      name
    }
  }
  commits(last: 1) {
    nodes {
      commit {
        statusCheckRollup {
          contexts(first: ${checkCount}) {
            nodes {
              ... on CheckRun {
                name
                conclusion
              }
              ... on StatusContext {
                context
                state
              }
            }
          }
          state
        }
      }
    }
  }`
