const detect = require('detect-pull-reqs');
const Octokit = require('@octokit/rest');
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

  const pullsRes = await octokit.pulls.list({
    owner, repo, base, head,
    state: 'open',
  });

  let releasePr;
  if (pullsRes.data.length === 0) {
    // create
    const content = messageUtils({ template, pulls });
    const createdRes = await octokit.pulls.create({
      owner, repo, base, head,
      title: content.title,
      body: content.body,
    });
    releasePr = createdRes.data;
  } else {
    // update
    const existing = pullsRes.data[0];
    // TODO: search checked pull-requests and keep them.
    const content = messageUtils({ template, pulls });
    const updatedRes = await octokit.pulls.update({
      owner, repo,
      pull_number: existing.number,
      title: content.title,
      body: content.body,
    });
    releasePr = updatedRes.data;
  }

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

  return releasePr;
};
