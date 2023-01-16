const Octokit = require('@octokit/rest');
const core = require('@actions/core');
const { toChunk, sleep } = require('./utils');
const { throttling } = require("@octokit/plugin-throttling");

const DELAY_BETWEEN_CALLS = 2000;
const THROTTLING_RETRY_LIMIT = 3;

module.exports = async function detect({ octokit, token, owner, repo, base, head }) {
  if (!octokit) {
    const OctokitWithPlugin = Octokit.plugin(throttling);
    const retryFunction = (retryAfter, options, octokit) => {
      octokit.log.warn(
          `Quota exhausted for request ${options.method} ${options.url}`
      );
      // Retry after hitting a rate limit error, then give up
      if (options.request.retryCount <= THROTTLING_RETRY_LIMIT) {
        console.log(`Retrying after ${retryAfter} seconds!`);
        return true;
      }
    };
    octokit = new OctokitWithPlugin({
      auth: token,
      // TODO: Support GitHub Enterprise.
      throttle: {
        onRateLimit: retryFunction,
        onSecondaryRateLimit: retryFunction,
      },
    });
  }

  const compareRes = await octokit.repos.compareCommits({
    owner,
    repo,
    base,
    head,
  });
  core.info(`Found ${compareRes.data.commits.length} commits between head and base`);
  // FIXME This line removes the fast forward PR merges from the game, which is not correct
  const merge_commits = compareRes.data.commits.filter(c => c.parents.length > 1);
  core.info(`${merge_commits.length} commits remain after filtering out commits with a single parent`);

  if (merge_commits.length === 0) {
    core.info("Returning empty array")
    return [];
  }

  // To avoid 422 error -- 'The search is longer than 256 characters',
  // Divide 'pulls' to chunks.
  const chunkedCommits = toChunk(merge_commits, 20);
  core.info(`Created an array of ${chunkedCommits.length} chunks`);
  const pulls = await chunkedCommits.reduce(async (accum, chunk, index) => {
    // Awaiting accum because the function passed to reduce is async, therefore returns a promise
    const acc = await accum;
    // Avoid making too many calls too fast to keep below GitHub's search rate limit
    // This will cause the calls to be made with a delay between them
    const timeToSleep = (index + 1) * DELAY_BETWEEN_CALLS;
    await sleep(timeToSleep);
    const q = [
      `repo:${owner}/${repo}`,
      'is:pr',
      'is:merged',
      ...(chunk.map(c => c.sha.substring(0, 7)))
    ].join("+");
    core.info(`Calling search API with ${q}`);
    const pullChunk = await octokit.search.issuesAndPullRequests({ q });
    return acc.concat(pullChunk.data.items);
  }, []);

  return Object.values(pulls.reduce((accum, pull) => { // uniq.
    accum[pull.number] = pull
    return accum;
  }, {}));
};
