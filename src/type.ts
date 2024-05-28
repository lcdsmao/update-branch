import {Octokit} from '@octokit/core'

export interface FetchConfig {
  prs: number
  labels: number
  comments: number
  checks: number
  prRunsContextOrder: 'first' | 'last'
}

export interface GhContext {
  octokit: Octokit
  owner: string
  repo: string
  autoMergeMethod: string
  fetchConfig: FetchConfig
}

export interface Condition {
  branchNamePattern?: string
  requiredApprovals: number
  requiredStatusChecks: string[]
  allRequestedReviewersMustApprove: boolean
  requiresConversationResolution: boolean
  requiredLabels: string[]
}

export interface RecordBody {
  editing?: boolean
  pendingMergePullRequestNumber?: number
}

// https://docs.github.com/en/graphql/reference/enums#mergestatestatus
export type MergeStateStatus =
  | 'BEHIND'
  | 'BLOCKED'
  | 'CLEAN'
  | 'DIRTY'
  | 'HAS_HOOKS'
  | 'UNKNOWN'
  | 'UNSTABLE'

// https://docs.github.com/en/graphql/reference/enums#mergeablestate
export type MergeableState = 'CONFLICTING' | 'MERGEABLE' | 'UNKNOWN'

// https://docs.github.com/en/graphql/reference/enums#statusstate
export type StatusState =
  | 'ERROR'
  | 'EXPECTED'
  | 'FAILURE'
  | 'PENDING'
  | 'SUCCESS'

// https://docs.github.com/en/graphql/reference/enums#checkconclusionstate
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
  baseRefName: string
  reviews: {
    totalCount: number
  }
  reviewRequests: {
    totalCount: number
  }
  labels: {
    nodes: LabelInfo[]
  }
  reviewThreads: {
    nodes: ReviewThread[]
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
  updatedAt?: string
}

export interface ReviewThread {
  isResolved: boolean
}

export interface CommitInfo {
  commit: {
    statusCheckRollup?: StatusCheckRollupInfo
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

export interface BranchProtectionRuleInfo {
  pattern: string
  requiredApprovingReviewCount?: number
  requiredStatusCheckContexts: string[]
  requiresConversationResolution: boolean
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

export type RepositoryListIssue = RepositoryData<{
  issues: {
    nodes: IssueInfo[]
  }
}>

export type RepositoryGetIssue = RepositoryData<{
  issue: IssueInfo
}>

export type RepositoryListBranchProtectionRule = RepositoryData<{
  branchProtectionRules: {
    nodes: BranchProtectionRuleInfo[]
  }
}>

export interface ViewerData {
  viewer: {
    login: string
  }
}
