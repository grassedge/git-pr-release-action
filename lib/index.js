const fs = require('fs');
const core = require('@actions/core');
const github = require('@actions/github');
const gitPrRelease = require('git-pr-release');

(async function main() {
  const {
    owner = core.getInput('owner'),
    repo = core.getInput('repo'),
  } = github.context.repo;

  const base = core.getInput('base');
  const head = core.getInput('head');
  // Currently, GitHub Actions does not support GHE.
  const host = core.getInput('host');
  const token = core.getInput('token');
  const assign = core.getInput('assign');
  const labelsCsv = core.getInput('labels');
  const templatePath = core.getInput('template');

  const labels = (labelsCsv || '').split(',').map(l => l.trim());
  const template = templatePath ? fs.readFileSync(templatePath, 'utf8') : null;

  const tz = core.getInput('tz');
  if (tz) {
    process.env.TZ = tz;
  }

  const releasePr = await gitPrRelease({
    host, token, owner, repo,
    base, head,
    assign, labels, template,
  });

})().catch(e => {
  core.setFailed(e.message);
});
