# Trial System

## Requirements

This project requires specific versions of the following tools. To make sure your development setup matches with production follow the recommended installation methods.

- **Node.js**

  Use [nodenv](https://github.com/nodenv/nodenv) to install the [required version](.node-version) of `Node.js`.

  ```sh
  nodenv install
  node --version
  ```

- **Yarn**

  Yarn must be installed using [Corepack](https://yarnpkg.com/getting-started/install), included by default in `Node.js`.

  ```sh
  corepack enable
  yarn --version
  ```

- **Terraform**

  Use [tfenv](https://github.com/tfutils/tfenv) to install the [required version](.terraform-version) of `terraform`.

  ```sh
  tfenv install
  terraform version
  ```

## Tasks

Tasks are defined in the `turbo.json` and `package.json` files. To execute a task, just run the command at the project root:

```sh
yarn <cmd>
```

`Turborepo` will execute the task for all the workspaces that declare the same command in their `package.json` file; it also applies caching policies to the command according to the rules defined in `turbo.json`.

To define a new task:

- add the definition to `turbo.json` under `pipeline`;
- add a script with the same name in `package.json` as `turbo <cmd name>`.

Defined tasks are _lint_, _test_, and _typecheck_.

## Dependencies

```sh
# install all dependencies for the project
yarn

# install a dependency to a workspace
#   (workspace name is the name in the package.json file)
yarn workspace <workspace name> add <package name>
yarn workspace <workspace name> add -D <package name>

# install a dependency for the monorepo
#   (ideally a shared dev dependency)
yarn add -D <package name>
```

To add a dependency to a local workspace, manually edit the target workspace's `package.json` file adding the dependency as

```json
"dependencies": {
    "my-dependency-workspace": "workspace:*"
}
```

## Folder structure

### `/apps`

It contains the applications included in the project.
Each folder is meant to produce a deployable artifact; how and where to deploy it is demanded to a single application.

Each sub-folder is a workspace.

### `/packages`

Packages are reusable TypeScript modules that implement a specific logic of the project. They are meant for sharing implementations across other apps and packages of the same projects, as well as being published in public registries.

Packages that are meant for internal code sharing have `private: true` in their `package.json` file; all the others are meant to be published into the public registry.

Each sub-folder is a workspace.

### `/infra`

It contains the _infrastructure-as-code_ project that defines the resources for the project as well as the executuion environments. Database schemas and migrations are defined here too, in case they are needed.

### `/docs`

Technical documentation about the project. Topics that may be included are architecture overviews, [ADRs](https://adr.github.io/), coding standards, and anything that can be relevant for a developer approaching the project as a contributor or as an auditor.

User documentation doesn't usually go in here. For public packages, it must go in the package's `README` file so that it will also be uploaded to the registry; user-faced documentation websites, when needed by the project, go under the `/apps` folder as they are treated as end-user applications.

## Releases

Releases are handled using [Changeset](https://github.com/changesets/changesets).
Changeset takes care of bumping packages, updating the changelog, and tag the repository accordingly.

#### How it works

- When opening a Pull Request with a change intended to be published, [add a changeset file](https://github.com/changesets/changesets/blob/main/docs/adding-a-changeset.md) to the proposed changes.
- Once the Pull Request is merged, a new Pull Request named `Version Packages` will be automatically opened with all the release changes such as version bumping for each involved app or package and changelog update; if an open `Version Packages` PR already exists, it will be updated and the package versions calculated accordingly (see https://github.com/changesets/changesets/blob/main/docs/decisions.md#how-changesets-are-combined).
  Only apps and packages mentioned in the changeset files will be bumped.
- Review the `Version Packages` PR and merge it when ready. Changeset files will be deleted.
- A Release entry is created for each app or package whose version has been bumped.
