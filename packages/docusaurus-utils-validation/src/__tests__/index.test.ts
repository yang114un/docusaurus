/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as Joi from '@hapi/joi';

import {
  AdmonitionsSchema,
  RehypePluginsSchema,
  RemarkPluginsSchema,
  URISchema,
} from '../index';

function createTestHelpers({
  schema,
  defaultValue,
}: {
  schema: Joi.SchemaLike;
  defaultValue?: unknown;
}) {
  function testOK(value: unknown) {
    expect(Joi.attempt(value, schema)).toEqual(value ?? defaultValue);
  }

  function testFail(value: unknown) {
    expect(() => Joi.attempt(value, schema)).toThrowErrorMatchingSnapshot();
  }

  return {testOK, testFail};
}

function testMarkdownPluginSchemas(schema: Joi.SchemaLike) {
  const {testOK, testFail} = createTestHelpers({
    schema,
    defaultValue: [],
  });

  testOK(undefined);
  testOK([function () {}]);
  testOK([[function () {}, {attr: 'val'}]]);
  testOK([
    [function () {}, {attr: 'val'}],
    function () {},
    [function () {}, {attr: 'val'}],
  ]);

  testFail(null);
  testFail(false);
  testFail(3);
  testFail([null]);
  testFail([false]);
  testFail([3]);
  testFail([[]]);
  testFail([[function () {}, undefined]]);
  testFail([[function () {}, true]]);
}

describe('validation schemas', () => {
  test('AdmonitionsSchema', () => {
    const {testOK, testFail} = createTestHelpers({
      schema: AdmonitionsSchema,
      defaultValue: {},
    });

    testOK(undefined);
    testOK({});
    testOK({attr: 'val'});

    testFail(null);
    testFail(3);
    testFail(true);
    testFail([]);
  });

  test('RemarkPluginsSchema', () => {
    testMarkdownPluginSchemas(RemarkPluginsSchema);
  });

  test('RehypePluginsSchema', () => {
    testMarkdownPluginSchemas(RehypePluginsSchema);
  });

  const useTest = <T>(schema: Joi.Schema) => (value: T) =>
    Joi.attempt(value, schema);

  test('URISchema', () => {
    const validURL = 'https://docusaurus.io';
    const doubleHash = 'https://docusaurus.io#github#/:';
    const invalidURL = 'https://docusaurus.io?search=  ';
    const testURL = useTest(URISchema);
    expect(testURL(validURL)).toBe(validURL);
    expect(testURL(doubleHash)).toBe(doubleHash);
    expect(() => testURL(invalidURL)).toThrowErrorMatchingSnapshot();
  });
});
