const render = require('mustache').render;
const moment = require('moment');

module.exports = function assemble({ template, pulls }) {
  const tmpl = template || defaultTemplate;
  const version = moment().format('YYYY-MM-DD HH:mm:ss');
  const text = render(tmpl, { version: version, pulls: pulls });
  const lines = text.split('\n');
  const title = lines[0];
  const body = lines.slice(1);

  return {
    title: title,
    body: body.join('\n')
  };
}

const defaultTemplate = `Release {{version}}
{{#pulls}}
- [ ] #{{number}} {{title}} {{#assignee}}@{{login}}{{/assignee}}{{^assignee}}{{#user}}@{{login}}{{/user}}{{/assignee}}
{{/pulls}}
`;
