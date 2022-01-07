/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable import/no-extraneous-dependencies */

import fs from 'fs-extra';
import shell from 'shelljs';

const NODE_MAJOR_VERSION = parseInt(process.versions.node.split('.')[0], 10);
if (NODE_MAJOR_VERSION < 16) {
  throw new Error(
    'This generateExamples Docusaurus script requires at least Node.js 16 and npm 7. See why here: https://github.com/facebook/docusaurus/pull/5722#issuecomment-948847891',
  );
}

// Generate one example per init template
// We use those generated examples as CodeSandbox projects
// See https://github.com/facebook/docusaurus/issues/1699
async function generateTemplateExample(template) {
  try {
    console.log(
      `generating ${template} template for codesandbox in the examples folder...`,
    );

    // run the docusaurus script to bootstrap the template in the examples folder
    const command = template.endsWith('-typescript')
      ? template.replace('-typescript', ' -- --typescript')
      : template;
    shell.exec(
      // /!\ we use the published init script on purpose,
      // because using the local init script is too early and could generate upcoming/unavailable config options
      // remember CodeSandbox templates will use the published version, not the repo version
      `npm init docusaurus@latest examples/${template} ${command}`,
      // `node ./packages/docusaurus-init/bin/index.js init examples/${template} ${template}`,
    );

    // read the content of the package.json
    const templatePackageJson = JSON.parse(
      await fs.readFile(`examples/${template}/package.json`, 'utf8'),
    );

    // attach the dev script which would be used in code sandbox by default
    templatePackageJson.scripts.dev = 'docusaurus start';

    // these example projects are not meant to be published to npm
    templatePackageJson.private = true;

    // make sure package.json name is not "examples-classic"
    // the package.json name appear in CodeSandbox UI so let's display a good name!
    // unfortunately we can't use uppercase or spaces
    // see also https://github.com/codesandbox/codesandbox-client/pull/5136#issuecomment-763521662
    templatePackageJson.name =
      template === 'classic' ? 'docusaurus' : `docusaurus-${template}`;
    templatePackageJson.description =
      template === 'classic'
        ? 'Docusaurus example project'
        : `Docusaurus example project (${template} template)`;

    // rewrite the package.json file with the new edit
    await fs.writeFile(
      `./examples/${template}/package.json`,
      `${JSON.stringify(templatePackageJson, null, 2)}\n`,
    );

    // create sandbox.config.json file at the root of template
    const codeSanboxConfig = {
      infiniteLoopProtection: true,
      hardReloadOnChange: true,
      view: 'browser',
      template: 'docusaurus',
      node: '14',
      container: {
        node: '14',
      },
    };
    await fs.writeFile(
      `./examples/${template}/sandbox.config.json`,
      `${JSON.stringify(codeSanboxConfig, null, 2)}\n`,
    );

    const stackBlitzConfig = {
      installDependencies: true,
      startCommand: 'npm start',
    };
    await fs.writeFile(
      `./examples/${template}/.stackblitzrc`,
      `${JSON.stringify(stackBlitzConfig, null, 2)}\n`,
    );

    console.log(`Generated example for template ${template}`);
  } catch (error) {
    console.error(`Failed to generated example for template ${template}`);
    throw error;
  }
}

/*
Starters are repositories/branches that only contains a newly initialized Docusaurus site
Those are useful for users to inspect (may be more convenient than "examples/classic)
Also some tools like Netlify deploy button currently require using the main branch of a dedicated repo
See https://github.com/jamstack/jamstack.org/pull/609
Button visible here: https://jamstack.org/generators/
 */
function updateStarters() {
  function forcePushGitSubtree({subfolder, remote, remoteBranch}) {
    console.log('');
    // See https://stackoverflow.com/questions/33172857/how-do-i-force-a-subtree-push-to-overwrite-remote-changes
    const command = `git push ${remote} \`git subtree split --prefix ${subfolder}\`:${remoteBranch} --force`;
    try {
      console.log(`forcePushGitSubtree command: ${command}`);
      shell.exec(command);
      console.log('forcePushGitSubtree success!');
    } catch (e) {
      console.error(
        `Can't force push to git subtree with command '${command}'`,
      );
      console.error(`If it's a permission problem, ask @slorber`);
      console.error(e);
    }
    console.log('');
  }

  console.log('');

  console.log('Updating https://github.com/facebook/docusaurus/tree/starter');
  forcePushGitSubtree({
    subfolder: 'examples/classic',
    remote: 'origin',
    remoteBranch: 'starter',
  });

  console.log('');
  console.log('');

  // TODO replace by starter repo in Docusaurus-community org (if we get it)
  console.log('Updating https://github.com/slorber/docusaurus-starter');
  forcePushGitSubtree({
    subfolder: 'examples/classic',
    remote: 'git@github.com:slorber/docusaurus-starter.git',
    remoteBranch: 'main',
  });

  console.log('');
}

const branch = shell.exec('git rev-parse --abbrev-ref HEAD').stdout;
if (branch === 'main') {
  throw new Error(
    "Please don't generate Docusaurus examples from the main branch!\nWe are going to commit during this process!",
  );
}
if (shell.exec('git diff --exit-code').code !== 0) {
  throw new Error(
    'Please run the generate examples command with a clean Git state and no uncommitted local changes. git diff should display nothing!',
  );
}

console.log(`
# Generate examples start!
`);

// delete the examples directories if they exists
console.log(`-------
## Removing example folders...
`);
await fs.rm('./examples/classic', {recursive: true, force: true});
await fs.rm('./examples/classic-typescript', {recursive: true, force: true});
await fs.rm('./examples/facebook', {recursive: true, force: true});

// get the list of all available templates
console.log(`
-------
## Generate example folders...
`);
const excludes = ['README.md', 'shared'];
const templates = (await fs.readdir(
  './packages/create-docusaurus/templates',
)).filter((name) => !excludes.includes(name));
console.log(`Will generate examples for templates: ${templates.join(',')}`);
// eslint-disable-next-line no-restricted-syntax
for (const template of templates) {
  await generateTemplateExample(template);
}
console.log('Commiting changes');
shell.exec('git add examples');
shell.exec("git commit -am 'update examples' --allow-empty");

// update starters
console.log(`
-------
# Updating starter repos and branches ...
It can take some time... please wait until done...
`);
updateStarters();

console.log(`
-------
Generate examples end!
Don't forget to push and merge your pull request!
`);
