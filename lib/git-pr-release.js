const core = require("@actions/core");
const detect = require("./detect");
const octokitWithThrottling = require("./octokitWithThrottling");
const messageUtils = require("./message");

const RELEASE_TO_MASTER_PR_TITLE = "🚀 Release Train: release -> main";

module.exports = async function ({
  host,
  token,
  owner,
  repo,
  base,
  head,
  assign,
  requestReviewers,
  labels,
  template,
}) {
  const octokit = octokitWithThrottling({
    auth: token,
    ...(host ? { baseUrl: host } : {}),
  });

  const pulls = await detect({ octokit, token, owner, repo, base, head });

  if (pulls.length === 0) {
    core.info("No PRs found between base and head");
    return;
  }

  core.info("Getting list of PRs satisfying the following criteria");
  core.info(`owner: ${owner}`);
  core.info(`repo: ${repo}`);
  core.info(`base (destination): ${base}`);
  core.info(`head (source): ${head}`);
  core.info("state: open");
  const pullsRes = await octokit.pulls.list({
    owner,
    repo,
    base,
    head,
    state: "open",
  });

  let releasePr;
  const existingReleasePR = pullsRes.data.find((pr) => pr.title === RELEASE_TO_MASTER_PR_TITLE);
  if (!existingReleasePR) {
    core.info("No preexisting PR found, will proceed to creation");
    // create
    const content = messageUtils.assemble({ template, pulls });
    const createdRes = await octokit.pulls.create({
      owner,
      repo,
      base,
      head,
      title: content.title,
      body: content.body,
    });
    releasePr = createdRes.data;
  } else {
    core.info(`Preexisting Release PR found: ${existingReleasePR.number}: ${existingReleasePR.title}`);
    core.info("Will proceed to update.");
    const checkedPrNums = messageUtils.checkedPrNumsFromExistingPrBody(
      existingReleasePR.body
    );
    const content = messageUtils.assemble({ template, pulls, checkedPrNums });
    const updatedRes = await octokit.pulls.update({
      owner,
      repo,
      pull_number: existingReleasePR.number,
      title: content.title,
      body: content.body,
    });
    releasePr = updatedRes.data;
  }

  if (labels.length) {
    core.info("Adding labels to the PR");
    await octokit.issues.addLabels({
      owner,
      repo,
      issue_number: releasePr.number,
      labels,
    });
  }

  if (assign) {
    core.info("Assigning stakeholders to the PR");
    const assignees = pulls
      .reduce((accum, p) => accum.concat(p.assignees, p.user), [])
      .filter((user) => user.type === "User")
      .map((user) => user.login);

    await octokit.issues.addAssignees({
      owner,
      repo,
      issue_number: releasePr.number,
      assignees,
    });
  }

  if (requestReviewers) {
    core.info("Assigning pull request reviewers to the PR");
    const assignees = pulls
      .reduce((accum, p) => accum.concat(p.assignees, p.user), [])
      .filter((user) => user.type === "User")
      .map((user) => user.login);

    octokit.pulls.requestReviewers({
      owner,
      repo,
      pull_number: releasePr.number,
      reviewers: assignees,
    });
  }

  core.info("Returning the release object");
  return releasePr;
};
