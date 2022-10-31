import minimatch from 'minimatch'
import {Condition, IssueInfo, PullRequestInfo, RecordBody} from './type'

export function isPendingMergePr(
  pr: PullRequestInfo,
  condition: Condition
): boolean {
  const check = pr.commits.nodes[0].commit.statusCheckRollup
  if (!check) return false
  const checkNodes = check.contexts.nodes
  return (
    isSatisfyBasicConditionPr(pr, condition) &&
    (checkNodes.some(v => v.state === 'PENDING') || check.state === 'PENDING')
  )
}

export function isStatusCheckPassPr(
  pr: PullRequestInfo,
  condition: Condition
): boolean {
  return (
    isSatisfyBasicConditionPr(pr, condition) &&
    isStatusChecksSuccess(pr, condition)
  )
}

export function stringify<T>(obj: T): string {
  return JSON.stringify(obj, null, 2)
}

// Except status check
function isSatisfyBasicConditionPr(
  pr: PullRequestInfo,
  condition: Condition
): boolean {
  return (
    !pr.merged &&
    pr.mergeable === 'MERGEABLE' &&
    pr.reviews.totalCount >= condition.requiredApprovals &&
    (pr.reviewRequests.totalCount === 0 ||
      !condition.allRequestedReviewersMustApprove) &&
    hasLabels(pr, condition) &&
    minimatch(pr.baseRefName, condition.branchNamePattern ?? '*')
  )
}

function hasLabels(pr: PullRequestInfo, condition: Condition): boolean {
  const labelNames = pr.labels.nodes.map(v => v.name)
  return condition.requiredLabels.every(v => labelNames.includes(v))
}

function isStatusChecksSuccess(
  pr: PullRequestInfo,
  condition: Condition
): boolean {
  const check = pr.commits.nodes[0].commit.statusCheckRollup
  if (!check) return false
  if (condition.requiredStatusChecks.length) {
    const nodeChecks = new Map(
      check.contexts.nodes.map(i => [i.name || i.context, i])
    )
    return condition.requiredStatusChecks.every(name => {
      const check = nodeChecks.get(name)
      return check?.conclusion === 'SUCCESS' || check?.state === 'SUCCESS'
    })
  } else {
    return check.state === 'SUCCESS'
  }
}

export function isIssueOutdated(issue: IssueInfo): boolean {
  const outdatedMillis = 5 * 60 * 1000 // 5 minutes
  const updatedAt = issue.updatedAt ? Date.parse(issue.updatedAt) : 0
  return Date.now() - updatedAt > outdatedMillis
}

export function parseIssueBody(body: string): RecordBody {
  try {
    const json = body
      .split(issueBodyStatusPrefix)
      .filter(e => e)
      .pop()
      ?.split(issueBodyStatusSuffix)
      .filter(e => e)[0]
    return JSON.parse(json ?? '')
  } catch (e) {
    return {}
  }
}

export function createIssueBody(body: RecordBody): string {
  return `
${issueBodyPrefix}
This issue provides [lcdsmao/update-branch](https://github.com/lcdsmao/update-branch) status.

Status:

${issueBodyStatusPrefix}
${stringify(body)}
${issueBodyStatusSuffix}
`
}

export const issueBodyPrefix = '<!-- lcdsmao/update-branch -->'
export const issueBodyStatusPrefix = '```json'
export const issueBodyStatusSuffix = '```'
