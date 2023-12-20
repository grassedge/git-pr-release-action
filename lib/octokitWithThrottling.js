const { Octokit } = require("@octokit/rest");
const { throttling } = require("@octokit/plugin-throttling");
const THROTTLING_RETRY_LIMIT = 3;

export default (config) => {
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

  return new OctokitWithPlugin({
    ...config,
    throttle: {
      onRateLimit: retryFunction,
      onSecondaryRateLimit: retryFunction,
    },
  });
};
