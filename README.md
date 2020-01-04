# create-release-pull-request-action

Create a pull-request for the production release.

If your team takes up a workflow like 'GitLab flow', you must have two branches, production and pre-production (or staging and so on)
This action helps to list pull-requests included in commits between production and pre-production. And create a new pull-request with the list in the body.

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

- owner: Default is current reopsitory's owner.
- repo: Default is current reopsitory's name.
- *required* base: Base branch of the release pull-request.
- *required* head: Head branch of the release pull-request.
- assign: If true, assign each pull-req's assignees to the release pull-req
- labels: Labels that is added to the release pull-request
- template: Path to the template you want to use.
- *required* token: GITHUB_TOKEN for creating a pull request.

Note that this action uses the template file in your repository. So you need 'checkout' step if you specify template option.

## Demo



## License

The scripts and documentation in this project are released under the [MIT License](LICENSE).
