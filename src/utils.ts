import {
  CheckConclusionState,
  Condition,
  MergeableState,
  MergeStateStatus,
  PullRequestInfo
} from './type'

export function isPendingMergePr(
  pr: PullRequestInfo,
  condition: Condition
): boolean {
  return (
    isApprovedPr(pr, condition) &&
    !pr.merged &&
    pr.mergeable === MergeableState.MERGEABLE &&
    pr.commits.nodes[0].commit.checkSuites.nodes[0].conclusion ===
      CheckConclusionState.ACTION_REQUIRED
  )
}

export function isStatusCheckPassAndBehindPr(
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
  const check = pr.commits.nodes[0].commit.checkSuites.nodes[0]
  if (condition.statusChecks.length) {
    const conclusions = new Map(
      check.checkRuns.nodes.map(i => [i.name, i.conclusion])
    )
    return condition.statusChecks.every(
      name => conclusions.get(name) === CheckConclusionState.SUCCESS
    )
  } else {
    return check.conclusion === CheckConclusionState.SUCCESS
  }
}
