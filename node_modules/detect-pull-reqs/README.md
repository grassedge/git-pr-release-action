# detect-pull-reqs
Detect pull requests between two branches.

*example.js*

```javascript
const detect = require('detect-pull-reqs');

(async function main([ name, base, head ]) {
  const [ owner, repo ] = name.split('/');

  const pulls = await detect({
    token: process.env.GITHUB_TOKEN,
    owner,
    repo,
    base,
    head
  });

  // or pass octokit instance.
  const Octokit = require('@octokit/rest')
  const pulls = await detect({
    octokit: Octokit({
      ...
    }),
    owner,
    repo,
    base,
    head
  });

  console.log(pulls.map(p => p.html_url));

})(process.argv.slice(2)).catch(e => console.log(e));
```

```shell
$ GITHUB_TOKEN=... node index.js grassedge/detect-pull-reqs production master
# --> [ 'https://github.com/grassedge/detect-pull-reqs/pull/1' ]
```
