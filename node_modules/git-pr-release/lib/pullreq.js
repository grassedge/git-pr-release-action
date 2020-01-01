module.exports = function({ octokit, owner, repo }) {

  async function prepare({ base, head }) {
    const pullsRes = await octokit.pulls.list({
      owner, repo, base, head,
      state: 'open',
    });
    if (pullsRes.data.length) {
      return pullsRes.data[0];
    }

    const createdRes = await octokit.pulls.create({
      owner, repo, base, head,
      title: 'Preparing release pull request...',
    });
    return createdRes.data;
  }

  return {
    prepare,
  }
};
