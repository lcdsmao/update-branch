import {GhContext, IssueInfo, RepositoryGetIssue} from './type'

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
    `mutation ($id: String!, $body: String!) {
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
