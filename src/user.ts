import {GhContext, ViewerData} from './type'

export async function getViewerName(ctx: GhContext): Promise<string> {
  const data: ViewerData = await ctx.octokit.graphql(`
    query {
      viewer {
        login
      }
    }`)
  return data.viewer.login
}
