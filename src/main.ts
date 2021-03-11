import * as core from '@actions/core'
import * as github from '@actions/github'
import {getMergePendingPullRequests} from './pullRequest'
import {GhContext} from './type'

async function run(): Promise<void> {
  try {
    const token = core.getInput('token')
    const approvedCount = parseInt(core.getInput('approvedCount'))
    const octokit = github.getOctokit(token)
    const {owner, repo} = github.context.repo
    const ctx: GhContext = {
      octokit,
      owner,
      repo
    }
    const pending = await getMergePendingPullRequests(ctx, approvedCount)
    if (pending === undefined) {
      core.info('No merge pending PR. Exit.')
      return
    }
    core.info(`Found merge pending PR: ${pending.title}, #${pending.number}.`)
    await octokit.pulls.updateBranch({
      owner,
      repo,
      pull_number: pending.number
    })
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
