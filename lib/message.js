const render = require('mustache').render;
const moment = require('moment');

exports.checkedPrNumsFromExistingPrBody = (body) => {
  return body.split("\n").reduce((accum, line) => {
    const matched = line.match(/^- \[([ x])\] #(\d+)/);
    if (matched) {
      const [,checkFlag,num] = matched;
      if (checkFlag === 'x') {
        accum[num] = true;
      }
    }
    return accum;
  }, {});
}

exports.assemble = ({ template, pulls, checkedPrNums = {} }) => {
  const tmpl = template || defaultTemplate;
  const version = moment().format('YYYY-MM-DD HH:mm:ss');
  const text = render(tmpl, {
    version: version,
    pulls: pulls.map(pull => {
      return {
        title: pull.title,
        number: pull.number,
        assignees: pull.assignees,
        user: pull.user,
        checked: checkedPrNums[pull.number],
      }
    })
  });
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
- [{{#checked}}x{{/checked}}{{^checked}} {{/checked}}] #{{number}} {{title}} {{#assignees}}@{{login}}{{/assignees}}{{^assignees}}{{#user}}@{{login}}{{/user}}{{/assignees}}
{{/pulls}}
`;
