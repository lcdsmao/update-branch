import * as core from '@actions/core'
import * as github from '@actions/github'
import {getIssue, updateIssue} from './issue'
import {getPullRequest, listAvailablePullRequests} from './pullRequest'
import {Condition, GhContext, IssueInfo, RecordBody} from './type'
import {isPendingPr, isWaitingMergePr, stringify} from './utils'

async function run(): Promise<void> {
  try {
    const recordIssueNumber = parseInt(core.getInput('recordIssueNumber'))
    const approvedCount = parseInt(core.getInput('approvedCount'))
    const statusChecks = core
      .getInput('statusChecks')
      .split('\n')
      .filter(s => s !== '')
    const token = core.getInput('token')
    const condition: Condition = {
      approvedCount,
      statusChecks
    }

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

    let updatedIssueBody: RecordBody = {editing: false}
    try {
      updatedIssueBody = await updateBranch(ctx, recordBody, condition)
    } finally {
      await updateRecordIssueBody(ctx, recordIssue, updatedIssueBody)
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}

async function updateBranch(
  ctx: GhContext,
  recordBody: RecordBody,
  condition: Condition
): Promise<RecordBody> {
  const availablePrs = await listAvailablePullRequests(ctx)
  // Get waiting merge pr after all pr status become available
  const waitingPrNum = recordBody.waitingMergePullRequestNumber
  if (waitingPrNum !== undefined) {
    const waitingPr = await getPullRequest(ctx, waitingPrNum)
    core.info(`Found recorded PR ${stringify(waitingPr)}.`)
    if (isWaitingMergePr(waitingPr, condition)) {
      core.info(`Waiting PR #${waitingPrNum} to be merged.`)
      return {...recordBody, editing: false}
    }
  }

  const pendingPrs = availablePrs.filter(pr => isPendingPr(pr, condition))
  const pendingPr =
    pendingPrs.find(pr => pr.number === waitingPrNum) || pendingPrs[0]
  if (pendingPr === undefined) {
    core.info('No merge pending PR. Exit.')
    return {editing: false}
  }
  core.info(`Found merge pending PR: ${pendingPr.title}, #${pendingPr.number}.`)
  await ctx.octokit.pulls.updateBranch({
    owner: ctx.owner,
    repo: ctx.repo,
    pull_number: pendingPr.number
  })
  return {
    editing: false,
    waitingMergePullRequestNumber: pendingPr.number
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
