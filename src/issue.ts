import {
  GhContext,
  IssueInfo,
  RepositoryGetIssue,
  RepositoryListIssue
} from './type'

export async function findCreatedIssueWithBodyPrefix(
  ctx: GhContext,
  createdBy: string,
  bodyPrefix: string
): Promise<IssueInfo | undefined> {
  const data: RepositoryListIssue = await ctx.octokit.graphql(
    `query ($owner: String!, $repo: String!, $createdBy: String!) {
        repository(name: $repo, owner: $owner) {
          issues(first: 100, filterBy: {createdBy: $createdBy}, states: OPEN) {
            nodes {
              id
              body
            }
          }
        }
      }`,
    {
      owner: ctx.owner,
      repo: ctx.repo,
      createdBy
    }
  )
  return data.repository.issues.nodes.find(v => v.body.includes(bodyPrefix))
}

export async function createIssue(
  ctx: GhContext,
  title: string
): Promise<IssueInfo> {
  const response = await ctx.octokit.request(
    'POST /repos/{owner}/{repo}/issues',
    {
      owner: ctx.owner,
      repo: ctx.repo,
      title
    }
  )
  return {
    id: response.data.node_id,
    body: ''
  }
}

export async function getIssue(
  ctx: GhContext,
  num: number
): Promise<IssueInfo> {
  const data: RepositoryGetIssue = await ctx.octokit.graphql(
    `query ($owner: String!, $repo: String!, $num: Int!) {
        repository(name: $repo, owner: $owner) {
          issue(number: $num) {
            id
            body
          }
        }
      }`,
    {
      owner: ctx.owner,
      repo: ctx.repo,
      num
    }
  )
  return data.repository.issue
}

export async function updateIssue(
  ctx: GhContext,
  issue: IssueInfo
): Promise<void> {
  await ctx.octokit.graphql(
    `mutation ($id: ID!, $body: String!) {
      updateIssue(input: {id: $id, body: $body}) {
        clientMutationId
      }
    }`,
    {
      id: issue.id,
      body: issue.body
    }
  )
}
