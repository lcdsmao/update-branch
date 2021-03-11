import {
  MergeableState,
  MergeStateStatus,
  PullRequestInfo,
  StatusState
} from './type'

export function isApprovedPr(
  pr: PullRequestInfo,
  approvedCount: number
): boolean {
  return (
    pr.reviews.totalCount >= approvedCount &&
    pr.reviews.totalCount >= pr.reviewRequests.totalCount
  )
}

export function isWaitingMergePr(
  pr: PullRequestInfo,
  approvedCount: number
): boolean {
  return (
    isApprovedPr(pr, approvedCount) &&
    !pr.merged &&
    pr.mergeable === MergeableState.MERGEABLE &&
    pr.mergeStateStatus === MergeStateStatus.BLOCKED &&
    pr.commits.nodes[0].statusCheckRollup === StatusState.PENDING
  )
}

export function isPendingPr(
  pr: PullRequestInfo,
  approvedCount: number
): boolean {
  return (
    isApprovedPr(pr, approvedCount) &&
    !pr.merged &&
    pr.mergeable === MergeableState.MERGEABLE &&
    pr.mergeStateStatus === MergeStateStatus.BEHIND &&
    pr.commits.nodes[0].statusCheckRollup === StatusState.SUCCESS
  )
}

export function stringify<T>(obj: T): string {
  return JSON.stringify(obj)
}
