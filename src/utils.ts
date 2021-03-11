import {MergeableState, MergeStateStatus, PullRequestInfo} from './type'

export function isPendingPr(
  pr: PullRequestInfo,
  approvedCount: number
): boolean {
  const isOutOfDate = (status: MergeStateStatus): boolean => {
    return status === MergeStateStatus.BEHIND
  }
  const isMergeable = (state: MergeableState): boolean => {
    return state === MergeableState.MERGEABLE
  }
  return (
    isMergeable(pr.mergeable) &&
    isOutOfDate(pr.mergeStateStatus) &&
    pr.reviews.totalCount >= approvedCount &&
    pr.reviews.totalCount >= pr.reviewRequests.totalCount
  )
}

export function stringify<T>(obj: T): string {
  return JSON.stringify(obj)
}
