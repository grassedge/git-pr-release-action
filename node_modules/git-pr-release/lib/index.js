const detect = require('detect-pull-reqs');
const Octokit = require('@octokit/rest');
const pullreqUtils = require('../lib/pullreq');
const messageUtils = require('../lib/message');

module.exports = async function({ host, token, owner, repo, base, head, assign, labels, template }) {
  const octokitConfig = { auth: token };
  if (host) {
    octokitConfig.baseUrl = host;
  }
  const octokit = Octokit(octokitConfig);
  const pulls = await detect({ octokit, owner, repo, base, head });

  if (pulls.length === 0) {
    return;
  }

  const content = messageUtils({ template, pulls });

  const pullreq = pullreqUtils({ octokit, owner, repo });

  const releasePr = await pullreq.prepare({ base, head });

  const updated = await octokit.pulls.update({
    owner, repo,
    pull_number: releasePr.number,
    title: content.title,
    body: content.body,
  });

  if (labels.length) {
    await octokit.issues.addLabels({
      owner, repo,
      issue_number: releasePr.number,
      labels,
    });
  }

  if (assign) {
    const assignees = pulls
          .reduce((accum, p) => accum.concat(p.assignees, p.user), [])
          .filter(user => user.type === 'User')
          .map(user => user.login);

    await octokit.issues.addAssignees({
      owner, repo,
      issue_number: releasePr.number,
      assignees,
    });
  }

  return updated.data;
};
