import * as core from '@actions/core'
import * as github from '@actions/github'
import {getBranchProtectionRules as getBranchProtectionRule} from './branchProtection'
import {createIssue, findCreatedIssueWithBodyPrefix, updateIssue} from './issue'
import {
  enablePullRequestAutoMerge,
  getPullRequest,
  listAvailablePullRequests,
  mergePullRequest,
  updateBranch
} from './pullRequest'
import {Condition, GhContext, IssueInfo, RecordBody} from './type'
import {getViewerName} from './user'
import {
  createIssueBody,
  isIssueOutdated,
  isPendingMergePr,
  isStatusCheckPassPr,
  issueBodyPrefix,
  parseIssueBody,
  stringify
} from './utils'

async function run(): Promise<void> {
  try {
    const token = core.getInput('token')
    const autoMergeMethod = core.getInput('autoMergeMethod')
    const requiredLabels = core
      .getInput('requiredLabels')
      .split('\n')
      .filter(s => s !== '')
    const requiredApprovals = parseInt(core.getInput('requiredApprovals'))
    const allRequestedReviewersMustApprove =
      core.getInput('allRequestedReviewersMustApprove') === 'true'
    const requiredStatusChecks = core
      .getInput('requiredStatusChecks')
      .split('\n')
      .filter(s => s !== '')
    const protectedBranchNamePattern = core.getInput(
      'protectedBranchNamePattern'
    )

    const octokit = github.getOctokit(token)
    const {owner, repo} = github.context.repo
    const ctx: GhContext = {octokit, owner, repo, autoMergeMethod}

    const branchProtectionRule = await getBranchProtectionRule(
      ctx,
      protectedBranchNamePattern
    )

    const condition: Condition = {
      branchNamePattern: branchProtectionRule?.pattern,
      requiredApprovals:
        requiredApprovals ||
        (branchProtectionRule?.requiredApprovingReviewCount ?? 0),
      allRequestedReviewersMustApprove,
      requiredStatusChecks: [
        ...requiredStatusChecks,
        ...(branchProtectionRule?.requiredStatusCheckContexts ?? [])
      ],
      requiredLabels
    }

    core.info('Condition:')
    core.info(stringify(condition))

    const viewerName = await getViewerName(ctx)
    const {recordIssue, recordBody} = await getRecordIssue(ctx, viewerName)
    const recordIssueOutdated = isIssueOutdated(recordIssue)
    // Sometimes unknown errors may occur, and issue body editing keeps true.
    // We ignore the editing field if the issue is outdated.
    if (recordBody.editing && !recordIssueOutdated) {
      core.info('Other actions are editing record. Exit.')
      return
    }
    await updateRecordIssueBody(ctx, recordIssue, {
      ...recordBody,
      editing: true
    })

    let newRecordBody: RecordBody = {...recordBody, editing: false}
    try {
      newRecordBody = await maybeUpdateBranchAndMerge(
        ctx,
        recordBody,
        condition
      )
    } finally {
      await updateRecordIssueBody(ctx, recordIssue, newRecordBody)
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
      if (
        pendingMergePr.mergeStateStatus === 'BLOCKED' ||
        pendingMergePr.mergeStateStatus === 'UNKNOWN'
      ) {
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
  const cleanPr = passPrs.find(
    // Also allow UNSTABLE as we check via [isStatusCheckPassPr] and some checks maybe ignorable
    pr => pr.mergeStateStatus === 'CLEAN' || pr.mergeStateStatus === 'UNSTABLE'
  )
  if (cleanPr) {
    core.info(`Merge PR #${cleanPr.number}.`)
    await mergePullRequest(ctx, cleanPr.id)
    return {editing: false}
  }

  const behindPr = passPrs.find(pr => pr.mergeStateStatus === 'BEHIND')
  if (behindPr) {
    core.info(
      `Found PR #${behindPr.number} can be merged. Try to update branch and enable auto merge.`
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
    body: createIssueBody(body)
  })
}

async function getRecordIssue(
  ctx: GhContext,
  createdBy: string
): Promise<{recordIssue: IssueInfo; recordBody: RecordBody}> {
  let recordIssue = await findCreatedIssueWithBodyPrefix(
    ctx,
    createdBy,
    issueBodyPrefix
  )
  if (!recordIssue) {
    recordIssue = await createIssue(ctx, issueTitle)
  }
  const recordBody = parseIssueBody(recordIssue.body)
  return {
    recordIssue,
    recordBody
  }
}

const issueTitle = 'Update Branch Dashboard'

run()
