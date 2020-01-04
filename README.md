# create-release-pull-request-action

Create a pull-request for the production release.

If your team adopts a workflow like 'GitLab flow', you may have two branches, such as production and pre-production (or staging and so on)
This action helps to list up pull-requests related to commits between production and pre-production. And create a new pull-request with the list in the body.

This action is inspired by [motemen/git-pr-release](https://github.com/motemen/git-pr-release) and [uiur/github-pr-release](https://github.com/uiur/github-pr-release).

## Usage

This Action subscribes to Push events.

```workflow
name: Create a release pull-request
on:
  push:
    branches:
      - pre-production
jobs:
  release_pull_request:
    runs-on: ubuntu-latest
    name: plantuml
    steps:
      - name: checkout
        uses: actions/checkout@v1
      - name: create-release-pr
        uses: grassedge/git-pr-release-action@v1.0
        with:
          base: production
          head: pre-production
          token: ${{ secrets.GITHUB_TOKEN }}
          labels: a,b,c
          assign: true
```

*input*

- `owner`: Default is current reopsitory's owner.
- `repo`: Default is current reopsitory's name.
- *required* `base`: Base branch of the release pull-request.
- *required* `head`: Head branch of the release pull-request. Typically, it is the same as a subscribed branch.
- `assign`: If true, assign each pull-req's assignees to the release pull-req
- `labels`: Labels that is added to the release pull-request
- `template`: Path to the template you want to use.
- `tz`: Used to generate the version string.
- *required* `token`: GITHUB_TOKEN for creating a pull request.

Note that this action uses the template file in your repository. So you need 'checkout' step if you specify template option.

## Demo

![](./docs/screenshot.png)

## License

The scripts and documentation in this project are released under the [MIT License](LICENSE).
