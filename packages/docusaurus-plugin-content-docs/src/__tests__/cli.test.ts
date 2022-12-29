/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {jest} from '@jest/globals';
import fs from 'fs-extra';
import path from 'path';
import {DEFAULT_PLUGIN_ID} from '@docusaurus/utils';
import {cliDocsVersionCommand} from '../cli';
import {
  getVersionDocsDirPath,
  getVersionsFilePath,
  getVersionSidebarsPath,
} from '../versions/files';
import type {PluginOptions} from '@docusaurus/plugin-content-docs';
import type {LoadContext} from '@docusaurus/types';

const fixtureDir = path.join(__dirname, '__fixtures__');

describe('docsVersion', () => {
  const simpleSiteDir = path.join(fixtureDir, 'simple-site');
  const versionedSiteDir = path.join(fixtureDir, 'versioned-site');
  const customI18nSiteDir = path.join(fixtureDir, 'site-with-custom-i18n-path');

  const DEFAULT_OPTIONS = {
    id: 'default',
    path: 'docs',
    sidebarPath: '',
    sidebarCollapsed: true,
    sidebarCollapsible: true,
  } as PluginOptions;

  it('no version tag provided', async () => {
    await expect(() =>
      cliDocsVersionCommand(null, DEFAULT_OPTIONS, {
        siteDir: simpleSiteDir,
      } as LoadContext),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"Versions should be strings. Found type "object" for version null."`,
    );
    await expect(() =>
      cliDocsVersionCommand(undefined, DEFAULT_OPTIONS, {
        siteDir: simpleSiteDir,
      } as LoadContext),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"Versions should be strings. Found type "undefined" for version undefined."`,
    );
    await expect(() =>
      cliDocsVersionCommand('', DEFAULT_OPTIONS, {
        siteDir: simpleSiteDir,
      } as LoadContext),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"Invalid version name "": version name must contain at least one non-whitespace character."`,
    );
  });

  it('version tag should not have slash', async () => {
    await expect(() =>
      cliDocsVersionCommand('foo/bar', DEFAULT_OPTIONS, {
        siteDir: simpleSiteDir,
      } as LoadContext),
    ).rejects.toThrow(
      'Invalid version name "foo/bar": version name should not include slash (/) or backslash (\\).',
    );
    await expect(() =>
      cliDocsVersionCommand('foo\\bar', DEFAULT_OPTIONS, {
        siteDir: simpleSiteDir,
      } as LoadContext),
    ).rejects.toThrow(
      'Invalid version name "foo\\bar": version name should not include slash (/) or backslash (\\).',
    );
  });

  it('version tag should not be too long', async () => {
    await expect(() =>
      cliDocsVersionCommand('a'.repeat(255), DEFAULT_OPTIONS, {
        siteDir: simpleSiteDir,
      } as LoadContext),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"Invalid version name "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa": version name cannot be longer than 32 characters."`,
    );
  });

  it('version tag should not be a dot or two dots', async () => {
    await expect(() =>
      cliDocsVersionCommand('..', DEFAULT_OPTIONS, {
        siteDir: simpleSiteDir,
      } as LoadContext),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"Invalid version name "..": version name should not be "." or ".."."`,
    );
    await expect(() =>
      cliDocsVersionCommand('.', DEFAULT_OPTIONS, {
        siteDir: simpleSiteDir,
      } as LoadContext),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"Invalid version name ".": version name should not be "." or ".."."`,
    );
  });

  it('version tag should be a valid pathname', async () => {
    await expect(() =>
      cliDocsVersionCommand('<foo|bar>', DEFAULT_OPTIONS, {
        siteDir: simpleSiteDir,
      } as LoadContext),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"Invalid version name "<foo|bar>": version name should be a valid file path."`,
    );
    await expect(() =>
      cliDocsVersionCommand('foo\x00bar', DEFAULT_OPTIONS, {
        siteDir: simpleSiteDir,
      } as LoadContext),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"Invalid version name "foo bar": version name should be a valid file path."`,
    );
    await expect(() =>
      cliDocsVersionCommand('foo:bar', DEFAULT_OPTIONS, {
        siteDir: simpleSiteDir,
      } as LoadContext),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"Invalid version name "foo:bar": version name should be a valid file path."`,
    );
  });

  it('version tag already exist', async () => {
    await expect(() =>
      cliDocsVersionCommand('1.0.0', DEFAULT_OPTIONS, {
        siteDir: versionedSiteDir,
      } as LoadContext),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"[docs]: this version already exists! Use a version tag that does not already exist."`,
    );
  });

  it('no docs file to version', async () => {
    const emptySiteDir = path.join(fixtureDir, 'empty-site');
    await expect(() =>
      cliDocsVersionCommand('1.0.0', DEFAULT_OPTIONS, {
        siteDir: emptySiteDir,
        i18n: {
          locales: ['en', 'zh-Hans'],
          defaultLocale: 'en',
          path: 'i18n',
          localeConfigs: {en: {path: 'en'}, 'zh-Hans': {path: 'zh-Hans'}},
        },
      } as unknown as LoadContext),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"[docs]: no docs found in "<PROJECT_ROOT>/packages/docusaurus-plugin-content-docs/src/__tests__/__fixtures__/empty-site/docs"."`,
    );
  });

  it('no docs in custom dir file to version', async () => {
    const emptySiteDir = path.join(fixtureDir, 'empty-site');
    const options = {
      ...DEFAULT_OPTIONS,
      path: 'my-docs',
    };
    await expect(() =>
      cliDocsVersionCommand('1.0.0', options, {
        siteDir: emptySiteDir,
        i18n: {
          locales: ['en', 'zh-Hans'],
          defaultLocale: 'en',
          path: 'i18n',
          localeConfigs: {en: {path: 'en'}, 'zh-Hans': {path: 'zh-Hans'}},
        },
      } as unknown as LoadContext),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"[docs]: no docs found in "<PROJECT_ROOT>/packages/docusaurus-plugin-content-docs/src/__tests__/__fixtures__/empty-site/my-docs"."`,
    );
  });

  it('first time versioning', async () => {
    const copyMock = jest.spyOn(fs, 'copy').mockImplementation(() => {});
    const writeMock = jest.spyOn(fs, 'outputFile');
    let versionedSidebar!: unknown;
    let versionedSidebarPath!: string;
    writeMock.mockImplementationOnce((filepath, content: string) => {
      versionedSidebarPath = filepath;
      versionedSidebar = JSON.parse(content);
    });
    let versionsPath!: string;
    let versions!: unknown;
    writeMock.mockImplementationOnce((filepath, content: string) => {
      versionsPath = filepath;
      versions = JSON.parse(content);
    });
    const consoleMock = jest.spyOn(console, 'log').mockImplementation(() => {});
    const options = {
      ...DEFAULT_OPTIONS,
      sidebarPath: path.join(simpleSiteDir, 'sidebars.json'),
    };
    await cliDocsVersionCommand('1.0.0', options, {
      siteDir: simpleSiteDir,
      i18n: {
        locales: ['en', 'zh-Hans'],
        defaultLocale: 'en',
        path: 'i18n',
        localeConfigs: {en: {path: 'en'}, 'zh-Hans': {path: 'zh-Hans'}},
      },
    } as unknown as LoadContext);
    expect(copyMock).toHaveBeenCalledWith(
      path.join(simpleSiteDir, options.path),
      getVersionDocsDirPath(
        simpleSiteDir,
        DEFAULT_PLUGIN_ID,
        undefined,
        '1.0.0',
      ),
    );
    expect(copyMock).toHaveBeenCalledWith(
      path.join(
        simpleSiteDir,
        'i18n/zh-Hans/docusaurus-plugin-content-docs/current',
      ),
      path.join(
        simpleSiteDir,
        'i18n/zh-Hans/docusaurus-plugin-content-docs/version-1.0.0',
      ),
    );
    expect(versionedSidebar).toMatchSnapshot();
    expect(versionedSidebarPath).toEqual(
      getVersionSidebarsPath(
        simpleSiteDir,
        DEFAULT_PLUGIN_ID,
        undefined,
        '1.0.0',
      ),
    );
    expect(versionsPath).toEqual(
      getVersionsFilePath(simpleSiteDir, DEFAULT_PLUGIN_ID),
    );
    expect(versions).toEqual(['1.0.0']);
    expect(consoleMock).toHaveBeenCalledWith(
      expect.stringMatching(
        /.*\[SUCCESS\].*\[docs\].*: version .*1\.0\.0.* created!.*/,
      ),
    );

    copyMock.mockRestore();
    writeMock.mockRestore();
    consoleMock.mockRestore();
  });

  it('works with custom i18n paths', async () => {
    const copyMock = jest.spyOn(fs, 'copy').mockImplementation(() => {});
    const writeMock = jest.spyOn(fs, 'outputFile');
    let versionedSidebar!: unknown;
    let versionedSidebarPath!: string;
    writeMock.mockImplementationOnce((filepath, content: string) => {
      versionedSidebarPath = filepath;
      versionedSidebar = JSON.parse(content);
    });
    let versionsPath!: string;
    let versions!: unknown;
    writeMock.mockImplementationOnce((filepath, content: string) => {
      versionsPath = filepath;
      versions = JSON.parse(content);
    });
    const consoleMock = jest.spyOn(console, 'log').mockImplementation(() => {});
    const options = {
      ...DEFAULT_OPTIONS,
      sidebarPath: path.join(customI18nSiteDir, 'sidebars.json'),
    };
    await cliDocsVersionCommand('1.0.0', options, {
      siteDir: customI18nSiteDir,
      i18n: {
        locales: ['en', 'zh-Hans'],
        defaultLocale: 'en',
        path: 'i18n-custom',
        localeConfigs: {
          en: {path: 'en-custom'},
          'zh-Hans': {path: 'zh-Hans-custom'},
        },
      },
    } as unknown as LoadContext);
    expect(copyMock).toHaveBeenCalledWith(
      path.join(customI18nSiteDir, options.path),
      getVersionDocsDirPath(
        customI18nSiteDir,
        DEFAULT_PLUGIN_ID,
        undefined,
        '1.0.0',
      ),
    );
    expect(copyMock).toHaveBeenCalledWith(
      path.join(
        customI18nSiteDir,
        'i18n-custom/zh-Hans-custom/docusaurus-plugin-content-docs/current',
      ),
      path.join(
        customI18nSiteDir,
        'i18n-custom/zh-Hans-custom/docusaurus-plugin-content-docs/version-1.0.0',
      ),
    );
    expect(versionedSidebar).toMatchSnapshot();
    expect(versionedSidebarPath).toEqual(
      getVersionSidebarsPath(
        customI18nSiteDir,
        DEFAULT_PLUGIN_ID,
        undefined,
        '1.0.0',
      ),
    );
    expect(versionsPath).toEqual(
      getVersionsFilePath(customI18nSiteDir, DEFAULT_PLUGIN_ID),
    );
    expect(versions).toEqual(['1.0.0']);
    expect(consoleMock).toHaveBeenCalledWith(
      expect.stringMatching(
        /.*\[SUCCESS\].*\[docs\].*: version .*1\.0\.0.* created!.*/,
      ),
    );

    copyMock.mockRestore();
    writeMock.mockRestore();
    consoleMock.mockRestore();
  });

  it('not the first time versioning', async () => {
    const copyMock = jest.spyOn(fs, 'copy').mockImplementation(() => {});
    const writeMock = jest.spyOn(fs, 'outputFile');
    let versionedSidebar!: unknown;
    let versionedSidebarPath!: string;
    writeMock.mockImplementationOnce((filepath, content: string) => {
      versionedSidebarPath = filepath;
      versionedSidebar = JSON.parse(content);
    });
    let versionsPath!: string;
    let versions!: unknown;
    writeMock.mockImplementationOnce((filepath, content: string) => {
      versionsPath = filepath;
      versions = JSON.parse(content);
    });
    const consoleMock = jest.spyOn(console, 'log').mockImplementation(() => {});
    const warnMock = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const options = {
      ...DEFAULT_OPTIONS,
      sidebarPath: path.join(versionedSiteDir, 'sidebars.json'),
    };
    await cliDocsVersionCommand('2.0.0', options, {
      siteDir: versionedSiteDir,
      i18n: {
        locales: ['en', 'zh-Hans'],
        defaultLocale: 'en',
        path: 'i18n',
        localeConfigs: {en: {path: 'en'}, 'zh-Hans': {path: 'zh-Hans'}},
      },
    } as unknown as LoadContext);
    expect(copyMock).toHaveBeenCalledWith(
      path.join(versionedSiteDir, options.path),
      getVersionDocsDirPath(
        versionedSiteDir,
        DEFAULT_PLUGIN_ID,
        undefined,
        '2.0.0',
      ),
    );
    expect(versionedSidebar).toMatchSnapshot();
    expect(versionedSidebarPath).toEqual(
      getVersionSidebarsPath(
        versionedSiteDir,
        DEFAULT_PLUGIN_ID,
        undefined,
        '2.0.0',
      ),
    );
    expect(versionsPath).toEqual(
      getVersionsFilePath(versionedSiteDir, DEFAULT_PLUGIN_ID),
    );
    expect(versions).toEqual(['2.0.0', '1.0.1', '1.0.0', 'withSlugs']);
    expect(consoleMock).toHaveBeenCalledWith(
      expect.stringMatching(
        /.*\[SUCCESS\].*\[docs\].*: version .*2\.0\.0.* created!.*/,
      ),
    );
    expect(warnMock.mock.calls[0]![0]).toMatchInlineSnapshot(
      `"[WARNING] [docs]: no docs found in "<PROJECT_ROOT>/packages/docusaurus-plugin-content-docs/src/__tests__/__fixtures__/versioned-site/i18n/zh-Hans/docusaurus-plugin-content-docs/current". Skipping."`,
    );

    warnMock.mockRestore();
    copyMock.mockRestore();
    writeMock.mockRestore();
    consoleMock.mockRestore();
  });

  it('second docs instance versioning', async () => {
    const pluginId = 'community';

    const copyMock = jest.spyOn(fs, 'copy').mockImplementation(() => {});
    const writeMock = jest.spyOn(fs, 'outputFile');
    let versionedSidebar!: unknown;
    let versionedSidebarPath!: string;
    writeMock.mockImplementationOnce((filepath, content: string) => {
      versionedSidebarPath = filepath;
      versionedSidebar = JSON.parse(content);
    });
    let versionsPath!: string;
    let versions!: unknown;
    writeMock.mockImplementationOnce((filepath, content: string) => {
      versionsPath = filepath;
      versions = JSON.parse(content);
    });
    const consoleMock = jest.spyOn(console, 'log').mockImplementation(() => {});
    const options = {
      ...DEFAULT_OPTIONS,
      id: pluginId,
      path: 'community',
      sidebarPath: path.join(versionedSiteDir, 'community_sidebars.json'),
    };
    await cliDocsVersionCommand('2.0.0', options, {
      siteDir: versionedSiteDir,
      i18n: {
        locales: ['en', 'fr'],
        defaultLocale: 'en',
        path: 'i18n',
        localeConfigs: {en: {path: 'en'}, fr: {path: 'fr'}},
      },
    } as unknown as LoadContext);
    expect(copyMock).toHaveBeenCalledWith(
      path.join(versionedSiteDir, options.path),
      getVersionDocsDirPath(versionedSiteDir, pluginId, undefined, '2.0.0'),
    );
    expect(copyMock).toHaveBeenCalledWith(
      path.join(
        versionedSiteDir,
        'i18n/fr/docusaurus-plugin-content-docs-community/current',
      ),
      path.join(
        versionedSiteDir,
        'i18n/fr/docusaurus-plugin-content-docs-community/version-2.0.0',
      ),
    );
    expect(versionedSidebar).toMatchSnapshot();
    expect(versionedSidebarPath).toEqual(
      getVersionSidebarsPath(versionedSiteDir, pluginId, undefined, '2.0.0'),
    );
    expect(versionsPath).toEqual(
      getVersionsFilePath(versionedSiteDir, pluginId),
    );
    expect(versions).toEqual(['2.0.0', '1.0.0']);
    expect(consoleMock).toHaveBeenCalledWith(
      expect.stringMatching(
        /.*\[SUCCESS\].*\[community\].*: version .*2.0.0.* created!.*/,
      ),
    );

    copyMock.mockRestore();
    writeMock.mockRestore();
    consoleMock.mockRestore();
  });

  describe('custom versions dir', () => {
    const site1Dir = path.join(fixtureDir, 'versioned-sites-2/v-site-1');
    const site2Dir = path.join(fixtureDir, 'versioned-sites-2/v-site-2');
    const site3Dir = path.join(fixtureDir, 'versioned-sites-2/v-site-3');
    // collect calls from mocks
    const addTestResult =
      (source: string, testResults: any[]) =>
      (...args: any[]) =>
        testResults.push([source, ...args]);
    // order of file copy and write is non-deterministic so we sort mock calls to match with snapshot later
    const expectedTestResults = (items: any[]) =>
      items
        .map((i) => JSON.stringify(i))
        .sort()
        .map((i) => JSON.parse(i));

    it('custom versions dir for default docs instance', async () => {
      const testResults: any[] = [];
      const copyMock = jest
        .spyOn(fs, 'copy')
        .mockImplementation(addTestResult('copyMock', testResults));
      const writeMock = jest
        .spyOn(fs, 'outputFile')
        .mockImplementation(addTestResult('writeMock', testResults));
      const consoleMock = jest
        .spyOn(console, 'log')
        .mockImplementation(addTestResult('consoleMock', testResults));

      const siteDir = site1Dir;
      const options = {
        ...DEFAULT_OPTIONS,
        path: '../my-docs-1',
        versionedDocsPath: '../my-versions-1',
        sidebarPath: path.join(siteDir, '../my-sidebars-1.json'),
      };
      const context = {
        siteDir,
        i18n: {
          locales: ['en'],
          defaultLocale: 'en',
          path: 'i18n',
          localeConfigs: {en: {path: 'en'}},
        },
      } as unknown as LoadContext;
      await cliDocsVersionCommand('v500', options, context);

      expect({
        options,
        context,
        testResults: expectedTestResults(testResults),
      }).toMatchSnapshot(
        'create v500 for v-site-1; docs in ../my-docs-1; versionedDocs in ../my-versions-1; ../my-sidebars1.json',
      );

      copyMock.mockRestore();
      writeMock.mockRestore();
      consoleMock.mockRestore();
    });

    it('custom versions dir for non-default docs instance', async () => {
      const testResults: any[] = [];
      const copyMock = jest
        .spyOn(fs, 'copy')
        .mockImplementation(addTestResult('copyMock', testResults));
      const writeMock = jest
        .spyOn(fs, 'outputFile')
        .mockImplementation(addTestResult('writeMock', testResults));
      const consoleMock = jest
        .spyOn(console, 'log')
        .mockImplementation(addTestResult('consoleMock', testResults));

      const siteDir = site2Dir;
      const options = {
        ...DEFAULT_OPTIONS,
        id: 'my-plugin-1',
        path: '../my-docs-2',
        versionedDocsPath: '../my-versions-2',
        sidebarPath: path.join(siteDir, 'sidebars.json'),
      };
      const context = {
        siteDir,
        i18n: {
          locales: ['en'],
          defaultLocale: 'en',
          path: 'i18n',
          localeConfigs: {en: {path: 'en'}},
        },
      } as unknown as LoadContext;
      await cliDocsVersionCommand('v600', options, context);

      expect({
        options,
        context,
        testResults: expectedTestResults(testResults),
      }).toMatchSnapshot(
        'create v600 for v-site-2:my-plugin-1; docs in ../my-docs-2; versionedDocs in ../my-versions-2; ./sidebars.json',
      );

      copyMock.mockRestore();
      writeMock.mockRestore();
      consoleMock.mockRestore();
    });

    it('custom versions dir for site with i18n', async () => {
      // locales don't have custom versioning docs, this is their normal behavior
      const testResults: any[] = [];
      const copyMock = jest
        .spyOn(fs, 'copy')
        .mockImplementation(addTestResult('copyMock', testResults));
      const writeMock = jest
        .spyOn(fs, 'outputFile')
        .mockImplementation(addTestResult('writeMock', testResults));
      const consoleMock = jest
        .spyOn(console, 'log')
        .mockImplementation(addTestResult('consoleMock', testResults));

      const pluginId = 'my-plug-2';
      const siteDir = site3Dir;
      const options = {
        ...DEFAULT_OPTIONS,
        id: pluginId,
        path: '../my-docs-3',
        versionedDocsPath: '../my-versions-3',
        sidebarPath: path.join(siteDir, 'my-sidebars-3.json'),
      };
      const context = {
        siteDir,
        i18n: {
          locales: ['en', 'my-locale-code'],
          defaultLocale: 'en',
          path: '../my-i18n',
          localeConfigs: {
            en: {path: 'en'},
            'my-locale-code': {path: 'my-locale'},
          },
        },
      } as unknown as LoadContext;
      await cliDocsVersionCommand('v800', options, context);

      expect({
        options,
        context,
        testResults: expectedTestResults(testResults),
      }).toMatchSnapshot('create v800 for v-site-3 with i18n');

      copyMock.mockRestore();
      writeMock.mockRestore();
      consoleMock.mockRestore();
    });

    it('locales skipped because of non-existing locale docs', async () => {
      // locales don't have custom versioning docs, this is their normal behavior
      const testResults: any[] = [];
      const copyMock = jest
        .spyOn(fs, 'copy')
        .mockImplementation(addTestResult('copyMock', testResults));
      const writeMock = jest
        .spyOn(fs, 'outputFile')
        .mockImplementation(addTestResult('writeMock', testResults));
      const consoleMock = jest
        .spyOn(console, 'log')
        .mockImplementation(addTestResult('consoleMock', testResults));

      const pluginId = 'my-plug-3';
      const siteDir = site3Dir;
      const options = {
        ...DEFAULT_OPTIONS,
        id: pluginId,
        path: '../my-docs-3',
        versionedDocsPath: '../my-versions-3',
        sidebarPath: path.join(siteDir, 'my-sidebars-3.json'),
      };
      const context = {
        siteDir,
        i18n: {
          locales: ['en', 'my-locale-code'],
          defaultLocale: 'en',
          path: '../my-i18n',
          localeConfigs: {
            en: {path: 'en'},
            'my-locale-code': {path: 'my-locale-2'},
          },
        },
      } as unknown as LoadContext;
      await cliDocsVersionCommand('v900', options, context);

      expect({
        options,
        context,
        testResults: expectedTestResults(testResults),
      }).toMatchSnapshot(
        'try to create v900 for v-site-3 with non-existing locale docs',
      );

      copyMock.mockRestore();
      writeMock.mockRestore();
      consoleMock.mockRestore();
    });
  });
});
