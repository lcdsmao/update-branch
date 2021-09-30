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

export function isStatusCheckPassPr(
  pr: PullRequestInfo,
  condition: Condition
): boolean {
  return (
    isApprovedPr(pr, condition) &&
    !pr.merged &&
    pr.mergeable === 'MERGEABLE' &&
    isStatusCheckSuccess(pr, condition)
  )
}

export function stringify<T>(obj: T): string {
  return JSON.stringify(obj)
}

function isApprovedPr(pr: PullRequestInfo, condition: Condition): boolean {
  return (
    pr.reviews.totalCount >= condition.approvedCount &&
    pr.reviewRequests.totalCount === 0
  )
}

function isStatusCheckSuccess(
  pr: PullRequestInfo,
  condition: Condition
): boolean {
  const check = pr.commits.nodes[0].commit.statusCheckRollup
  if (condition.statusChecks.length) {
    const nodeChecks = new Map(
      check.contexts.nodes.map(i => [i.name || i.context, i])
    )
    return condition.statusChecks.every(name => {
      const check = nodeChecks.get(name)
      return check?.conclusion === 'SUCCESS' || check?.state === 'SUCCESS'
    })
  } else {
    return check.state === 'SUCCESS'
  }
}
