export enum MergeStateStatus {
  BEHIND = 'BEHIND',
  BLOCKED = 'BLOCKED',
  CLEAN = 'CLEAN',
  DIRTY = 'DIRTY',
  HAS_HOOKS = 'HAS_HOOKS',
  UNKNOWN = 'UNKNOWN',
  UNSTABLE = 'UNSTABLE'
}

export interface PullRequestInfo {
  title: string
  reviews: {
    totalCount: number
  }
  number: number
  mergeable: MergeStateStatus
}

export interface RepositoryPullRequestsInfo {
  repository: {
    pullRequests: {
      nodes: PullRequestInfo[]
    }
  }
}
