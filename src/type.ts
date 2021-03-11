import {Octokit} from '@octokit/core'

export interface GhContext {
  octokit: Octokit
  owner: string
  repo: string
}

export interface RecordBody {
  editing?: boolean
  waitingPullRequestNumber?: number
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
}

export interface IssueInfo {
  id: string
  body: string
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
