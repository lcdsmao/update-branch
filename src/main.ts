import * as core from '@actions/core'
import * as github from '@actions/github'
import {getIssue, updateIssue} from './issue'
import {
  getPullRequest,
  listAvailablePullRequests,
  updateBranch,
  enablePullRequestAutoMerge
} from './pullRequest'
import {
  Condition,
  GhContext,
  IssueInfo,
  MergeStateStatus,
  RecordBody
} from './type'
import {
  isStatusCheckPassAndBehindPr,
  isPendingMergePr,
  stringify
} from './utils'

async function run(): Promise<void> {
  try {
    const recordIssueNumber = parseInt(core.getInput('recordIssueNumber'))
    const approvedCount = parseInt(core.getInput('approvedCount'))
    const statusChecks = core
      .getInput('statusChecks')
      .split('\n')
      .filter(s => s !== '')
    // core.info(JSON.stringify(statusChecks))
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
      core.info('Other actions are editing record. Exit.')
      return
    }
    await updateRecordIssueBody(ctx, recordIssue, {
      ...recordBody,
      editing: true
    })

    let newIssueBody: RecordBody = {editing: false}
    try {
      newIssueBody = await findBehindPrAndUpdateBranch(
        ctx,
        recordBody,
        condition
      )
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

async function findBehindPrAndUpdateBranch(
  ctx: GhContext,
  recordBody: RecordBody,
  condition: Condition
): Promise<RecordBody> {
  const availablePrs = await listAvailablePullRequests(ctx)
  // Get pending merge pr after all pr status become available
  const pendingMergePrNum = recordBody.pendingMergePullRequestNumber
  if (pendingMergePrNum !== undefined) {
    const pendingMergePr = await getPullRequest(ctx, pendingMergePrNum)
    core.info(`Found pending merge PR ${stringify(pendingMergePr)}.`)
    if (isPendingMergePr(pendingMergePr, condition)) {
      if (pendingMergePr.mergeStateStatus === 'BLOCKED') {
        core.info(`Wait PR #${pendingMergePrNum} to be merged.`)
        return {...recordBody, editing: false}
      } else if (pendingMergePr.mergeStateStatus === 'BEHIND') {
        updateBranch(ctx, pendingMergePrNum)
        enablePullRequestAutoMerge(ctx, pendingMergePr.id)
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

  // core.info(JSON.stringify(availablePrs))
  const behindPrs = availablePrs.filter(pr =>
    isStatusCheckPassAndBehindPr(pr, condition)
  )
  const behindPr =
    behindPrs.find(pr => pr.number === pendingMergePrNum) || behindPrs[0]
  if (behindPr === undefined) {
    core.info('Found no PR that needs update branch.')
    return {editing: false}
  }
  core.info(
    `Found PR: ${behindPr.title}, #${behindPr.number} and try to update branch.`
  )
  updateBranch(ctx, behindPr.number)
  enablePullRequestAutoMerge(ctx, behindPr.id)
  return {
    editing: false,
    pendingMergePullRequestNumber: behindPr.number
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
