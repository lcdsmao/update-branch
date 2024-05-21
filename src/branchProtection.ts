import {
  BranchProtectionRuleInfo,
  GhContext,
  RepositoryListBranchProtectionRule
} from './type'

export async function getBranchProtectionRules(
  ctx: GhContext,
  pattern: string
): Promise<BranchProtectionRuleInfo | undefined> {
  const response: RepositoryListBranchProtectionRule =
    await ctx.octokit.graphql(
      `query ($owner: String!, $repo: String!) {
        repository(name: $repo, owner: $owner) {
          branchProtectionRules(first: ${branchProtectionRuleCount}) {
            nodes {
              requiredApprovingReviewCount
              requiredStatusCheckContexts
              requiresConversationResolution
              pattern
            }
          }
        }
      }`,
      {
        owner: ctx.owner,
        repo: ctx.repo
      }
    )
  return response.repository.branchProtectionRules.nodes.find(v =>
    pattern
      ? v.pattern === pattern
      : v.pattern === 'main' || v.pattern === 'master'
  )
}

const branchProtectionRuleCount = 10
