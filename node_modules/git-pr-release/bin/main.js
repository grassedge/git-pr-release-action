#!/usr/bin/env node
'use strict';

const fs = require('fs');
const minimist = require('minimist');
const gitPrRelease = require('../lib/index');

(async function main(argv) {
  const [ owner, repo ] = (argv._[0] || '').split('/');
  const {
    assign, base, head, host, token,
    labels: labelsCsv,
    template: templatePath,
    dump,
  } = argv;

  if (!owner || !repo) {
    console.error(`{owner}/{repo} is required.`);
    process.exit(1);
  }
  if (!base) {
    console.error(`base branch is required.`);
    process.exit(1);
  }
  const labels = (labelsCsv || '').split(',').map(l => l.trim());
  const template = templatePath ? fs.readFileSync(templatePath, 'utf8') : null;

  const releasePr = await gitPrRelease({
    host, token, owner, repo,
    base, head,
    assign, labels, template,
  });

  if (!releasePr) {
    console.log(`There are no pull-requests to be released.`);
    return;
  }

  if (dump) {
    console.log(releasePr)
  }
})(minimist(process.argv.slice(2), {
  boolean: [
    'assign',
    'dry-run',
    'dump'
  ],
  string: [
    'base',
    'head',
    'host',
    'labels',
    'template',
    'token',
  ],
  alias: {
    'b': 'base',
    'h': 'head',
    'l': 'labels',
    'n': 'dry-run',
    't': 'token',
  },
  default: {
    'base': 'staging',
    'head': 'production',
  }
})).catch(e => console.log(e));
