const fs = require('fs');
const core = require('@actions/core');
const github = require('@actions/github');
const gitPrRelease = require('./git-pr-release');

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

  const areLabelsDefined = labelsCsv && labelsCsv.length;
  const labels = areLabelsDefined ? labelsCsv.split(',').map(l => l.trim()) : [];
  const template = templatePath ? fs.readFileSync(templatePath, 'utf8') : null;

  const tz = core.getInput('tz');
  if (tz) {
    process.env.TZ = tz;
  }

  core.info(`Starting creation of PR from ${head} to ${base}`);
  core.info(`host: ${host}`);
  core.info(`token: ${token}`);
  core.info(`owner: ${owner}`);
  core.info(`repo: ${repo}`);
  core.info(`assign: ${assign}`);
  core.info(`labels: ${labels}`);
  core.info(`template: ${template}`);

  const releasePr = await gitPrRelease({
    host, token, owner, repo,
    base, head,
    assign, labels, template,
  });

  core.info('Returned PR:');
  for(let key in releasePr) {
    if (releasePr.hasOwnProperty(key)) {
      core.info(`${key}: ${releasePr[key]}`);
    }
  }

})().catch(e => {
  core.setFailed(e.message);
});
