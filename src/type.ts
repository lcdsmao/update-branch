import {Octokit} from '@octokit/core'

export interface GhContext {
  octokit: Octokit
  owner: string
  repo: string
  autoMergeMethod: string
}

export interface Condition {
  requiredApprovals: number
  requiredStatusChecks: string[]
  requiredLabels: string[]
}

export interface RecordBody {
  editing?: boolean
  pendingMergePullRequestNumber?: number
}

export type MergeStateStatus =
  | 'BEHIND'
  | 'BLOCKED'
  | 'CLEAN'
  | 'DIRTY'
  | 'HAS_HOOKS'
  | 'UNKNOWN'
  | 'UNSTABLE'

export type MergeableState = 'CONFLICTING' | 'MERGEABLE' | 'UNKNOWN'

export type StatusState =
  | 'ERROR'
  | 'EXPECTED'
  | 'FAILURE'
  | 'PENDING'
  | 'SUCCESS'

export type CheckConclusionState =
  | 'ACTION_REQUIRED'
  | 'CANCELLED'
  | 'FAILURE'
  | 'NEUTRAL'
  | 'SKIPPED'
  | 'STALE'
  | 'STARTUP_FAILURE'
  | 'SUCCESS'
  | 'TIMED_OUT'

export interface PullRequestInfo {
  id: string
  title: string
  reviews: {
    totalCount: number
  }
  reviewRequests: {
    totalCount: number
  }
  labels: {
    nodes: LabelInfo[]
  }
  number: number
  merged: boolean
  mergeable: MergeableState
  mergeStateStatus: MergeStateStatus
  commits: {
    nodes: CommitInfo[]
  }
}

export interface IssueInfo {
  id: string
  body: string
}

export interface CommitInfo {
  commit: {
    statusCheckRollup: StatusCheckRollupInfo
  }
}

export interface LabelInfo {
  name: string
}

export interface StatusCheckRollupInfo {
  state: StatusState
  contexts: {
    nodes: StatusCheckInfo[]
  }
}

export interface StatusCheckInfo {
  // on CheckRun
  name?: string
  conclusion?: CheckConclusionState
  // on StatusContext
  context?: string
  state?: StatusState
}

export interface RepositoryData<T> {
  repository: T
}

export type RepositoryListPullRequest = RepositoryData<{
  pullRequests: {
    nodes: PullRequestInfo[]
  }
}>

export type RepositoryGetPullRequest = RepositoryData<{
  pullRequest: PullRequestInfo
}>

export type RepositoryGetIssue = RepositoryData<{
  issue: IssueInfo
}>
