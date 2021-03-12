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
  waitingMergePullRequestNumber?: number
}

export enum MergeStateStatus {
  BEHIND = 'BEHIND',
  BLOCKED = 'BLOCKED',
  CLEAN = 'CLEAN',
  DIRTY = 'DIRTY',
  HAS_HOOKS = 'HAS_HOOKS',
  UNKNOWN = 'UNKNOWN',
  UNSTABLE = 'UNSTABLE'
}

export enum MergeableState {
  CONFLICTING = 'CONFLICTING',
  MERGEABLE = 'MERGEABLE',
  UNKNOWN = 'UNKNOWN'
}

export enum StatusState {
  ERROR = 'ERROR',
  EXPECTED = 'EXPECTED',
  FAILURE = 'FAILURE',
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS'
}

export enum CheckConclusionState {
  ACTION_REQUIRED = 'ACTION_REQUIRED',
  CANCELLED = 'CANCELLED',
  FAILURE = 'FAILURE',
  NEUTRAL = 'NEUTRAL',
  SKIPPED = 'SKIPPED',
  STALE = 'STALE',
  STARTUP_FAILURE = 'STARTUP_FAILURE',
  SUCCESS = 'SUCCESS',
  TIMED_OUT = 'TIMED_OUT'
}

export interface PullRequestInfo {
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
    nodes: CheckRunInfo[]
  }
}

export interface CheckRunInfo {
  name: string
  conclusion: CheckConclusionState
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
