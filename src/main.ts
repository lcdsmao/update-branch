import * as core from '@actions/core'
import * as github from '@actions/github'
import {getIssue, updateIssue} from './issue'
import {getMergePendingPullRequests, getPullRequest} from './pullRequest'
import {GhContext, IssueInfo, MergeableState, RecordBody} from './type'
import {stringify} from './utils'

async function run(): Promise<void> {
  try {
    const token = core.getInput('token')
    const approvedCount = parseInt(core.getInput('approvedCount'))
    const recordIssueNumber = parseInt(core.getInput('recordIssueNumber'))
    const octokit = github.getOctokit(token)
    const {owner, repo} = github.context.repo
    const ctx: GhContext = {octokit, owner, repo}

    const recordIssue = await getIssue(ctx, recordIssueNumber)
    let recordBody: RecordBody
    try {
      recordBody = JSON.parse(recordIssue.body)
    } catch (e) {
      recordBody = {}
    }
    const editing = recordBody.editing || false
    if (editing) {
      core.info('Editing record issue. Exit.')
      return
    }
    await updateRecordIssueBody(ctx, recordIssue, {
      ...recordBody,
      editing: true
    })
    const waitingPullRequestNumber = recordBody.waitingPullRequestNumber
    if (waitingPullRequestNumber) {
      const waitingPr = await getPullRequest(ctx, waitingPullRequestNumber)
      if (
        !waitingPr.merged &&
        waitingPr.mergeable === MergeableState.MERGEABLE
      ) {
        core.info(`Waiting PR ${waitingPullRequestNumber} to be merge. Exit.`)
        await updateRecordIssueBody(ctx, recordIssue, {
          ...recordBody,
          editing: false
        })
        return
      }
    }

    const pendingPr = await getMergePendingPullRequests(ctx, approvedCount)
    if (pendingPr === undefined) {
      core.info('No merge pending PR. Exit.')
      await updateRecordIssueBody(ctx, recordIssue, {editing: false})
      return
    }
    core.info(
      `Found merge pending PR: ${pendingPr.title}, #${pendingPr.number}.`
    )
    await octokit.pulls.updateBranch({
      owner,
      repo,
      pull_number: pendingPr.number
    })
    await updateRecordIssueBody(ctx, recordIssue, {
      editing: false,
      waitingPullRequestNumber
    })
  } catch (error) {
    core.setFailed(error.message)
  }
}

async function updateRecordIssueBody(
  ctx: GhContext,
  recordIssue: IssueInfo,
  body: RecordBody
): Promise<void> {
  await updateIssue(ctx, {
    ...recordIssue,
    body: stringify(body)
  })
}

run()
