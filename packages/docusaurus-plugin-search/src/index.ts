/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {Plugin, Props, LoadContext} from '@docusaurus/types';
import {promisify} from 'util';

import scrap from './scrapper';

import glob from 'glob';
import {pluginOptions} from './types';
import {readFile, writeFile} from 'fs-extra';
import {join, dirname} from 'path';
import Fuse from 'fuse.js';

const flat = <T>(arr: Array<Array<T>>) =>
  arr.reduce((acc, curr) => [...acc, ...curr]);

export default function search(
  _: LoadContext,
  options: pluginOptions,
): Plugin<unknown> {
  console.log(options);
  return {
    name: 'docusaurus-plugin-search',

    getThemePath() {
      return join(__dirname, '..', 'theme');
    },

    getClientModules() {
      const modules = [require.resolve('infima/dist/css/default/default.css')];

      return modules;
    },

    getRootWrapper() {
      return join(__dirname, '..', 'theme', 'wrapRoot.js');
    },

    async postBuild(props: Props) {
      const files = await Promise.all(
        options.include.map((pattern) =>
          promisify(glob)(`${pattern}/index.html`, {
            cwd: props.outDir,
            ignore: options.exclude,
          }),
        ),
      );
      const uniquefiles = new Set(flat(files));
      const scrapedData = await Promise.all(
        Array.from(uniquefiles).map(async (file) => {
          const content = await readFile(join(props.outDir, file));
          return {url: dirname(file), dataNodes: scrap(String(content))};
        }),
      );
      let id = 0;
      const results = flat(
        scrapedData.map((page) => {
          return page.dataNodes.map((dataNode) => {
            id += 1;
            return {
              pageID: page.url,
              id,
              ...dataNode,
            };
          });
        }),
      );
      const index = Fuse.createIndex(['body'], results);
      await writeFile(
        join(props.outDir, 'search_index.json'),
        JSON.stringify(index),
      );
      await writeFile(
        join(props.outDir, 'search_result.json'),
        JSON.stringify(results),
      );
    },
  };
}
