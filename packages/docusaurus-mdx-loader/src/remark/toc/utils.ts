/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Node} from 'unist';
import type {
  MdxjsEsm,
  // @ts-expect-error: TODO see https://github.com/microsoft/TypeScript/issues/49721
} from 'mdast-util-mdx';
import type {TOCItem, TOCSlice} from './types';
import type {SpreadElement, ImportDeclaration} from 'estree';

export function isTOCSlice(item: TOCItem | TOCSlice): item is TOCSlice {
  return 'slice' in item;
}

export function spreadTOCSlice(tocSlice: TOCSlice): SpreadElement {
  return {
    type: 'SpreadElement',
    argument: {type: 'Identifier', name: tocSlice.name},
  };
}

export const isImport = (child: Node): child is MdxjsEsm => {
  if (child.type === 'mdxjsEsm') {
    return (child as MdxjsEsm).value.startsWith('import');
  }
  return false;
};

export const hasImports = (index: number): boolean => index > -1;

export const isExport = (child: Node): child is MdxjsEsm => {
  if (child.type === 'mdxjsEsm') {
    return (child as MdxjsEsm).value.startsWith('export');
  }
  return false;
};

export function isMarkdownImport(
  importDeclaration: ImportDeclaration,
): boolean {
  const importPath = importDeclaration.source.value;
  return typeof importPath === 'string' && /\.mdx?$/.test(importPath);
}

export function findDefaultImportName(
  importDeclaration: ImportDeclaration,
): string | undefined {
  return importDeclaration.specifiers.find(
    (o: Node) => o.type === 'ImportDefaultSpecifier',
  )?.local.name;
}

export async function createTOCExportNode(
  name: string,
  tocItems: (TOCItem | TOCSlice)[],
): Promise<MdxjsEsm> {
  const {valueToEstree} = await import('estree-util-value-to-estree');

  const tocObject = tocItems.map((item) => {
    if (isTOCSlice(item)) {
      return spreadTOCSlice(item);
    }

    return valueToEstree(item);
  });

  return {
    type: 'mdxjsEsm',
    value: '',
    data: {
      estree: {
        type: 'Program',
        body: [
          {
            type: 'ExportNamedDeclaration',
            declaration: {
              type: 'VariableDeclaration',
              declarations: [
                {
                  type: 'VariableDeclarator',
                  id: {
                    type: 'Identifier',
                    name,
                  },
                  init: {
                    type: 'ArrayExpression',
                    elements: tocObject,
                  },
                },
              ],
              kind: 'const',
            },
            specifiers: [],
            source: null,
          },
        ],
        sourceType: 'module',
      },
    },
  };
}
