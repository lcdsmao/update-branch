import retry from 'async-retry'
import {
  FetchConfig,
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
            ${getPullRequestFragment(ctx.fetchConfig)}
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
          pullRequests(first: ${ctx.fetchConfig.prs}, states: OPEN) {
            nodes {
              ${getPullRequestFragment(ctx.fetchConfig)}
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

function getPullRequestFragment(cfg: FetchConfig): string {
  return `
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
  labels(first: ${cfg.labels}) {
    nodes {
      name
    }
  }
  comments(last: ${cfg.comments}) {
    nodes {
      minimizedReason
    }
  }
  commits(last: 1) {
    nodes {
      commit {
        statusCheckRollup {
          contexts(${cfg.prRunsContextOrder}: ${cfg.checks}) {
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
}
