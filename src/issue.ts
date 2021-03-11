import {Octokit} from '@octokit/core'
import * as github from '@actions/github'
import {IssueInfo, RepositoryIssueInfo} from './type'

export async function getIssue({
  octokit,
  num
}: {
  octokit: Octokit
  num: number
}): Promise<IssueInfo> {
  const {owner, repo} = github.context.repo
  const data: RepositoryIssueInfo = await octokit.graphql(
    `query ($owner: String!, $repo: String!, $num: Int!) {
        repository(name: $repo, owner: $owner) {
          issue(number: $num) {
            id
            body
          }
        }
      }`,
    {
      owner,
      repo,
      num
    }
  )
  return data.repository.issue
}

export async function updateIssue({
  octokit,
  issue
}: {
  octokit: Octokit
  issue: IssueInfo
}): Promise<void> {
  await octokit.graphql(
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
