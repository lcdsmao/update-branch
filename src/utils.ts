import {Condition, PullRequestInfo} from './type'

export function isPendingMergePr(
  pr: PullRequestInfo,
  condition: Condition
): boolean {
  return (
    isApprovedPr(pr, condition) &&
    !pr.merged &&
    pr.mergeable === 'MERGEABLE' &&
    pr.commits.nodes[0].commit.statusCheckRollup.state === 'PENDING'
  )
}

export function isStatusCheckPassAndBehindPr(
  pr: PullRequestInfo,
  condition: Condition
): boolean {
  return (
    isApprovedPr(pr, condition) &&
    !pr.merged &&
    pr.mergeable === 'MERGEABLE' &&
    pr.mergeStateStatus === 'BEHIND' &&
    isStatusCheckSuccess(pr, condition)
  )
}

export function stringify<T>(obj: T): string {
  return JSON.stringify(obj)
}

function isApprovedPr(pr: PullRequestInfo, condition: Condition): boolean {
  return (
    pr.reviews.totalCount >= condition.approvedCount &&
    pr.reviews.totalCount >= pr.reviewRequests.totalCount
  )
}

function isStatusCheckSuccess(
  pr: PullRequestInfo,
  condition: Condition
): boolean {
  const check = pr.commits.nodes[0].commit.statusCheckRollup
  if (condition.statusChecks.length) {
    const conclusions = new Map(
      check.contexts.nodes.map(i => [i.name, i.conclusion])
    )
    return condition.statusChecks.every(
      name => conclusions.get(name) === 'SUCCESS'
    )
  } else {
    return check.state === 'SUCCESS'
  }
}
