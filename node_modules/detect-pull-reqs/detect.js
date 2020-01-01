const Octokit = require('@octokit/rest');

module.exports = async function detect({ octokit, token, owner, repo, base, head }) {
  if (!octokit) {
    octokit = Octokit({
      auth: token,
      // TODO: Support GitHub Enterprise.
    });
  }

  const compareRes = await octokit.repos.compareCommits({
    owner,
    repo,
    base,
    head,
  });
  const merge_commits = compareRes.data.commits.filter(c => c.parents.length > 1);

  if (merge_commits.length == 0) {
    return [];
  }

  const pulls = await octokit.search.issuesAndPullRequests({
    q: [ 'is:pr', 'is:merged', ...(merge_commits.map(c => c.sha)) ].join("+")
  });

  const pullsPromises = pulls.data.items.map(pull => octokit.pulls.get({
    owner,
    repo,
    pull_number: pull.number
  }));

  return (await Promise.all(pullsPromises)).map(pullRes => pullRes.data);
};
