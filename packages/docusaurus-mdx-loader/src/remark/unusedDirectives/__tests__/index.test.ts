/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import path from 'path';
import remark2rehype from 'remark-rehype';
import stringify from 'rehype-stringify';
import vfile from 'to-vfile';
import plugin from '../index';
import admonition from '../../admonitions';

const processFixture = async (name: string) => {
  const {remark} = await import('remark');
  const {default: directives} = await import('remark-directive');

  const filePath = path.join(__dirname, '__fixtures__', `${name}.md`);
  const file = await vfile.read(filePath);

  const result = await remark()
    .use(directives)
    .use(admonition)
    .use(plugin)
    .use(remark2rehype)
    .use(stringify)
    .process(file);

  return result.value;
};

describe('directives remark plugin', () => {
  let consoleMock;

  beforeEach(() => {
    consoleMock = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleMock.mockRestore();
  });

  it('default behavior for container directives', async () => {
    const result = await processFixture('containerDirectives');

    expect(result).toMatchSnapshot();

    expect(consoleMock.mock.calls).toMatchSnapshot();
  });

  it('default behavior for leaf directives', async () => {
    const result = await processFixture('leafDirectives');

    expect(result).toMatchSnapshot();

    expect(consoleMock.mock.calls).toMatchSnapshot();
  });

  it('default behavior for text directives', async () => {
    const result = await processFixture('textDirectives');

    expect(result).toMatchSnapshot();

    expect(consoleMock.mock.calls).toMatchSnapshot();
  });
});
