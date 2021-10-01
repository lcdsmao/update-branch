import * as core from '@actions/core'
import * as github from '@actions/github'
import {getIssue, updateIssue} from './issue'
import {
  enablePullRequestAutoMerge,
  getPullRequest,
  listAvailablePullRequests,
  mergePullRequest,
  updateBranch
} from './pullRequest'
import {Condition, GhContext, IssueInfo, RecordBody} from './type'
import {isPendingMergePr, isStatusCheckPassPr, stringify} from './utils'

async function run(): Promise<void> {
  try {
    const token = core.getInput('token')
    const autoMergeMethod = core.getInput('autoMergeMethod')
    const recordIssueNumber = parseInt(core.getInput('recordIssueNumber'))
    const requiredApprovals = parseInt(core.getInput('requiredApprovals'))
    const requiredStatusChecks = core
      .getInput('requiredStatusChecks')
      .split('\n')
      .filter(s => s !== '')
    const requiredLabels = core
      .getInput('requiredLabels')
      .split('\n')
      .filter(s => s !== '')
    const condition: Condition = {
      requiredApprovals,
      requiredStatusChecks,
      requiredLabels
    }

    core.info('Condition:')
    core.info(stringify(condition))

    const octokit = github.getOctokit(token)
    const {owner, repo} = github.context.repo
    const ctx: GhContext = {octokit, owner, repo, autoMergeMethod}

    const {recordIssue, recordBody} = await getRecordIssue(
      ctx,
      recordIssueNumber
    )
    if (recordBody.editing) {
      core.info('Other actions are editing record. Exit.')
      return
    }
    await updateRecordIssueBody(ctx, recordIssue, {
      ...recordBody,
      editing: true
    })

    let newIssueBody: RecordBody = {editing: false}
    try {
      newIssueBody = await maybeUpdateBranchAndMerge(ctx, recordBody, condition)
    } finally {
      await updateRecordIssueBody(ctx, recordIssue, newIssueBody)
    }
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    } else if (typeof error === 'string') {
      core.setFailed(error)
    }
  }
}

async function maybeUpdateBranchAndMerge(
  ctx: GhContext,
  recordBody: RecordBody,
  condition: Condition
): Promise<RecordBody> {
  const availablePrs = await listAvailablePullRequests(ctx)
  // Get pending merge pr after all pr status become available
  const pendingMergePrNum = recordBody.pendingMergePullRequestNumber
  if (pendingMergePrNum !== undefined) {
    const pendingMergePr = await getPullRequest(ctx, pendingMergePrNum)
    if (isPendingMergePr(pendingMergePr, condition)) {
      if (pendingMergePr.mergeStateStatus === 'BLOCKED') {
        core.info(`Wait PR #${pendingMergePrNum} to be merged.`)
        return {...recordBody, editing: false}
      } else if (pendingMergePr.mergeStateStatus === 'BEHIND') {
        await enablePullRequestAutoMerge(ctx, pendingMergePr.id)
        await updateBranch(ctx, pendingMergePrNum)
        core.info(
          `Update branch and wait PR #${pendingMergePrNum} to be merged.`
        )
        return {...recordBody, editing: false}
      }
    }
    core.info(
      `Pending merge PR #${pendingMergePrNum} can not be merged. Try to find other PR that needs update branch.`
    )
  }

  const passPrs = availablePrs.filter(pr => isStatusCheckPassPr(pr, condition))
  const cleanPr = passPrs.find(pr => pr.mergeStateStatus === 'CLEAN')
  if (cleanPr) {
    core.info(`Merge PR #${cleanPr.number}.`)
    await mergePullRequest(ctx, cleanPr.id)
    return {editing: false}
  }

  const behindPr = passPrs.find(pr => pr.mergeStateStatus === 'BEHIND')
  if (behindPr) {
    core.info(
      `Found PR #${behindPr.number} and try to update branch enable auto merge and.`
    )
    await updateBranch(ctx, behindPr.number)
    await enablePullRequestAutoMerge(ctx, behindPr.id)
    return {
      editing: false,
      pendingMergePullRequestNumber: behindPr.number
    }
  }

  core.info('Found no PR that needs update branch.')
  return {editing: false}
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
