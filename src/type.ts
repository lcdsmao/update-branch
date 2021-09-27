import {Octokit} from '@octokit/core'

export interface GhContext {
  octokit: Octokit
  owner: string
  repo: string
}

export interface Condition {
  approvedCount: number
  statusChecks: string[]
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
  number: number
  merged: boolean | undefined
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

export interface StatusCheckRollupInfo {
  state: StatusState
  contexts: {
    nodes: StatusCheckInfo[]
  }
}

export interface StatusCheckInfo {
  // on CheckRun
  name: string | undefined
  conclusion: CheckConclusionState | undefined
  // on StatusContext
  context: string | undefined
  state: StatusState | undefined
}

export interface RepositoryData<T> {
  repository: T
}

export type RepositoryPullRequestsInfo = RepositoryData<{
  pullRequests: {
    nodes: PullRequestInfo[]
  }
}>

export type RepositoryPullRequestInfo = RepositoryData<{
  pullRequest: PullRequestInfo
}>

export type RepositoryIssueInfo = RepositoryData<{
  issue: IssueInfo
}>
