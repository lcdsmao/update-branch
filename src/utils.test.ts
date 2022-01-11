import {createIssueBody, parseIssueBody} from './utils'

test('parseIssueBody', () => {
  const rawBody = `
<!-- lcdsmao/update-branch -->
This issue provides [lcdsmao/update-branch](https://github.com/lcdsmao/update-branch) status.

Status:

\`\`\`json
{
  "editing": false,
  "pendingMergePullRequestNumber": 1234
}
\`\`\`

`
  const body = parseIssueBody(rawBody)
  expect(body).toEqual({editing: false, pendingMergePullRequestNumber: 1234})
})

test('createIssueBody', () => {
  const body = createIssueBody({
    editing: true,
    pendingMergePullRequestNumber: 2048
  })
  expect(body).toEqual(`
<!-- lcdsmao/update-branch -->
This issue provides [lcdsmao/update-branch](https://github.com/lcdsmao/update-branch) status.

Status:

\`\`\`json
{
  "editing": true,
  "pendingMergePullRequestNumber": 2048
}
\`\`\`
`)
})
