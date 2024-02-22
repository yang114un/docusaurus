/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {removePrefix, addLeadingSlash} from '@docusaurus/utils';
import logger from '@docusaurus/logger';
import collectRedirects from './collectRedirects';
import writeRedirectFiles, {
  toRedirectFiles,
  type RedirectFile,
} from './writeRedirectFiles';
import type {LoadContext, Plugin} from '@docusaurus/types';
import type {PluginContext, RedirectItem} from './types';
import type {PluginOptions, Options} from './options';

export default function pluginClientRedirectsPages(
  context: LoadContext,
  options: PluginOptions,
): Plugin<void> {
  const {trailingSlash, router} = context.siteConfig;

  return {
    name: 'docusaurus-plugin-client-redirects',
    async postBuild(props) {
      if (router === 'hash') {
        logger.warn(
          'The Docusaurus client redirects plugin is automatically disabled when using the Hash router',
        );
        return;
      }

      const pluginContext: PluginContext = {
        relativeRoutesPaths: props.routesPaths.map(
          (path) => `${addLeadingSlash(removePrefix(path, props.baseUrl))}`,
        ),
        baseUrl: props.baseUrl,
        outDir: props.outDir,
        options,
        siteConfig: props.siteConfig,
      };

      const redirects: RedirectItem[] = collectRedirects(
        pluginContext,
        trailingSlash,
      );

      const redirectFiles: RedirectFile[] = toRedirectFiles(
        redirects,
        pluginContext,
        trailingSlash,
      );

      // Write files only at the end: make code more easy to test without IO
      await writeRedirectFiles(redirectFiles);
    },
  };
}

export {validateOptions} from './options';
export type {PluginOptions, Options};
