const core = require("@actions/core");
const detect = require("./detect");
const octokitWithThrottling = require("./octokitWithThrottling");
const messageUtils = require("./message");

module.exports = async function ({
  host,
  token,
  owner,
  repo,
  base,
  head,
  assign,
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

  const pullsRes = await octokit.pulls.list({
    owner,
    repo,
    base,
    head,
    state: "open",
  });

  let releasePr;
  if (pullsRes.data.length === 0) {
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
    core.info("Preexisting PR found, will proceed to update");
    // update
    const existing = pullsRes.data[0];
    const checkedPrNums = messageUtils.checkedPrNumsFromExistingPrBody(
      existing.body
    );
    const content = messageUtils.assemble({ template, pulls, checkedPrNums });
    const updatedRes = await octokit.pulls.update({
      owner,
      repo,
      pull_number: existing.number,
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

  core.info("Returning the release object");
  return releasePr;
};
