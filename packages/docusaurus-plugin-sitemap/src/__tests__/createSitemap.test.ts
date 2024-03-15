/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import {EnumChangefreq} from 'sitemap';
import {fromPartial} from '@total-typescript/shoehorn';
import createSitemap from '../createSitemap';
import type {PluginOptions} from '../options';
import type {DocusaurusConfig, RouteConfig} from '@docusaurus/types';

const siteConfig: DocusaurusConfig = fromPartial({
  url: 'https://example.com',
});

const options: PluginOptions = {
  changefreq: EnumChangefreq.DAILY,
  priority: 0.7,
  ignorePatterns: [],
  filename: 'sitemap.xml',
};

const route = (routePath: string, routePaths?: string[]): RouteConfig => {
  return fromPartial({
    path: routePath,
    routes: routePaths?.map((p) => route(p)),
  });
};

const routes = (routePaths: string[]): RouteConfig[] => {
  return routePaths.map((p) => route(p));
};

describe('createSitemap', () => {
  it('simple site', async () => {
    const sitemap = await createSitemap({
      siteConfig,
      routes: routes(['/', '/test']),
      head: {},
      options,
    });
    expect(sitemap).toContain(
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">`,
    );
  });

  it('empty site', () =>
    expect(async () => {
      await createSitemap({
        siteConfig: fromPartial({}),
        routes: [],
        head: {},
        options,
      });
    }).rejects.toThrow(
      'URL in docusaurus.config.js cannot be empty/undefined.',
    ));

  it('excludes patterns configured to be ignored', async () => {
    const sitemap = await createSitemap({
      siteConfig,
      routes: routes([
        '/',
        '/search/',
        '/tags/',
        '/search/foo',
        '/tags/foo/bar',
      ]),
      head: {},
      options: {
        ...options,
        ignorePatterns: [
          // Shallow ignore
          '/search/',
          // Deep ignore
          '/tags/**',
        ],
      },
    });

    expect(sitemap).not.toContain('/search/</loc>');
    expect(sitemap).toContain('/search/foo');
    expect(sitemap).not.toContain('/tags');
  });

  it('keep trailing slash unchanged', async () => {
    const sitemap = await createSitemap({
      siteConfig,
      routes: routes(['/', '/test', '/nested/test', '/nested/test2/']),
      head: {},
      options,
    });

    expect(sitemap).toContain('<loc>https://example.com/</loc>');
    expect(sitemap).toContain('<loc>https://example.com/test</loc>');
    expect(sitemap).toContain('<loc>https://example.com/nested/test</loc>');
    expect(sitemap).toContain('<loc>https://example.com/nested/test2/</loc>');
  });

  it('add trailing slash', async () => {
    const sitemap = await createSitemap({
      siteConfig: {...siteConfig, trailingSlash: true},
      routes: routes(['/', '/test', '/nested/test', '/nested/test2/']),
      head: {},
      options,
    });

    expect(sitemap).toContain('<loc>https://example.com/</loc>');
    expect(sitemap).toContain('<loc>https://example.com/test/</loc>');
    expect(sitemap).toContain('<loc>https://example.com/nested/test/</loc>');
    expect(sitemap).toContain('<loc>https://example.com/nested/test2/</loc>');
  });

  it('remove trailing slash', async () => {
    const sitemap = await createSitemap({
      siteConfig: {
        ...siteConfig,
        url: 'https://example.com',
        trailingSlash: false,
      },
      routes: routes(['/', '/test', '/nested/test', '/nested/test2/']),
      head: {},
      options,
    });

    expect(sitemap).toContain('<loc>https://example.com/</loc>');
    expect(sitemap).toContain('<loc>https://example.com/test</loc>');
    expect(sitemap).toContain('<loc>https://example.com/nested/test</loc>');
    expect(sitemap).toContain('<loc>https://example.com/nested/test2</loc>');
  });

  it('filters pages with noindex', async () => {
    const sitemap = await createSitemap({
      siteConfig,
      routesPaths: ['/', '/noindex', '/nested/test', '/nested/test2/'],
      routes: routes(['/', '/noindex', '/nested/test', '/nested/test2/']),
      head: {
        '/noindex': {
          meta: {
            // @ts-expect-error: bad lib def
            toComponent: () => [
              React.createElement('meta', {
                name: 'robots',
                content: 'NoFolloW, NoiNDeX',
              }),
            ],
          },
        },
      },
      options,
    });

    expect(sitemap).not.toContain('/noindex');
  });

  it('does not generate anything for all pages with noindex', async () => {
    const sitemap = await createSitemap({
      siteConfig,
      routesPaths: ['/', '/noindex'],
      routes: routes(['/', '/noindex']),
      head: {
        '/': {
          meta: {
            // @ts-expect-error: bad lib def
            toComponent: () => [
              React.createElement('meta', {name: 'robots', content: 'noindex'}),
            ],
          },
        },
        '/noindex': {
          meta: {
            // @ts-expect-error: bad lib def
            toComponent: () => [
              React.createElement('meta', {name: 'robots', content: 'noindex'}),
            ],
          },
        },
      },
      options,
    });

    expect(sitemap).toBeNull();
  });
});
