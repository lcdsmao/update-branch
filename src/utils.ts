import {
  CheckConclusionState,
  Condition,
  MergeableState,
  MergeStateStatus,
  PullRequestInfo,
  StatusState
} from './type'

export function isWaitingMergePr(
  pr: PullRequestInfo,
  condition: Condition
): boolean {
  return (
    isApprovedPr(pr, condition) &&
    !pr.merged &&
    pr.mergeable === MergeableState.MERGEABLE &&
    pr.commits.nodes[0].commit.statusCheckRollup.state === StatusState.PENDING
  )
}

export function isPendingPr(
  pr: PullRequestInfo,
  condition: Condition
): boolean {
  return (
    isApprovedPr(pr, condition) &&
    !pr.merged &&
    pr.mergeable === MergeableState.MERGEABLE &&
    pr.mergeStateStatus === MergeStateStatus.BEHIND &&
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
      name => conclusions.get(name) === CheckConclusionState.SUCCESS
    )
  } else {
    return check.state === StatusState.SUCCESS
  }
}
