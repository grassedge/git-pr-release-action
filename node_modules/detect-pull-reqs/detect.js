const Octokit = require('@octokit/rest');
const { toChunk } = require('./utils');

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

  // To avoid 422 error -- 'The search is longer than 256 characters',
  // Divide 'pulls' to chunks.
  const chunkedCommits = toChunk(merge_commits, 20);

  const pulls = await chunkedCommits.reduce(async (accum, chunk) => {
    const pulls = await accum;
    const pullChunk = await octokit.search.issuesAndPullRequests({
      q: [
        `repo:${owner}/${repo}`,
        'is:pr',
        'is:merged',
        ...(chunk.map(c => c.sha.substring(0, 7)))
      ].join("+")
    });
    return pulls.concat(pullChunk.data.items);
  }, []);

  return Object.values(pulls.reduce((accum, pull) => { // uniq.
    accum[pull.number] = pull
    return accum;
  }, {}));
};
