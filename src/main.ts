import * as core from '@actions/core'
import * as github from '@actions/github'
import {getIssue, updateIssue} from './issue'
import {getPullRequest, listAvailablePullRequests} from './pullRequest'
import {GhContext, IssueInfo, RecordBody} from './type'
import {isPendingPr, isWaitingMergePr, stringify} from './utils'

async function run(): Promise<void> {
  try {
    const approvedCount = parseInt(core.getInput('approvedCount'))
    const recordIssueNumber = parseInt(core.getInput('recordIssueNumber'))
    const token = core.getInput('token')
    const octokit = github.getOctokit(token)
    const {owner, repo} = github.context.repo
    const ctx: GhContext = {octokit, owner, repo}

    const {recordIssue, recordBody} = await getRecordIssue(
      ctx,
      recordIssueNumber
    )
    if (recordBody.editing) {
      core.info('Editing record issue. Exit.')
      return
    }
    await updateRecordIssueBody(ctx, recordIssue, {
      ...recordBody,
      editing: true
    })

    let availablePrs
    try {
      availablePrs = await listAvailablePullRequests(ctx)
    } catch (e) {
      updateRecordIssueBody(ctx, recordIssue, {editing: false})
      throw e
    }

    // Get after all pr status become available
    const waitingPrNum = recordBody.waitingPullRequestNumber
    if (waitingPrNum !== undefined) {
      const waitingPr = await getPullRequest(ctx, waitingPrNum)
      if (isWaitingMergePr(waitingPr, approvedCount)) {
        core.info(
          `Waiting PR #${waitingPrNum} to be merged. If you have any problem with this PR, please editing issue #${recordIssueNumber} body.`
        )
        updateRecordIssueBody(ctx, recordIssue, {...recordBody, editing: false})
        return
      }
    }

    const pendingPrs = availablePrs.filter(pr => isPendingPr(pr, approvedCount))
    const pendingPr =
      pendingPrs.find(pr => pr.number === waitingPrNum) || pendingPrs[0]
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
      waitingPullRequestNumber: pendingPr.number
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

async function getRecordIssue(
  ctx: GhContext,
  recordIssueNumber: number
): Promise<{recordIssue: IssueInfo; recordBody: RecordBody}> {
  const recordIssue = await getIssue(ctx, recordIssueNumber)
  let recordBody: RecordBody
  try {
    recordBody = JSON.parse(recordIssue.body)
  } catch (e) {
    recordBody = {}
  }
  return {
    recordIssue,
    recordBody
  }
}

run()
