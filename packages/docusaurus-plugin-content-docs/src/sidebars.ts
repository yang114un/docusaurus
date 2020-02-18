/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import fs from 'fs-extra';
import importFresh from 'import-fresh';
import {
  Sidebar,
  SidebarRaw,
  SidebarItem,
  SidebarItemCategoryRaw,
  SidebarItemRaw,
  SidebarItemLink,
  SidebarItemDoc,
} from './types';

/**
 * Check that item contains only allowed keys.
 */
function assertItem(item: Object, keys: string[]): void {
  const unknownKeys = Object.keys(item).filter(
    key => !keys.includes(key) && key !== 'type',
  );

  if (unknownKeys.length) {
    throw new Error(
      `Unknown sidebar item keys: ${unknownKeys}. Item: ${JSON.stringify(
        item,
      )}`,
    );
  }
}

function assertIsCategory(item: any): asserts item is SidebarItemCategoryRaw {
  assertItem(item, ['items', 'label']);
  if (typeof item.label !== 'string') {
    throw new Error(
      `Error loading ${JSON.stringify(item)}. "label" must be a string.`,
    );
  }
  if (!Array.isArray(item.items)) {
    throw new Error(
      `Error loading ${JSON.stringify(item)}. "items" must be an array.`,
    );
  }
}

function assertIsDoc(item: any): asserts item is SidebarItemDoc {
  assertItem(item, ['id']);
  if (typeof item.id !== 'string') {
    throw new Error(
      `Error loading ${JSON.stringify(item)}. "id" must be a string.`,
    );
  }
}

function assertIsLink(item: any): asserts item is SidebarItemLink {
  assertItem(item, ['href', 'label']);
  if (typeof item.href !== 'string') {
    throw new Error(
      `Error loading ${JSON.stringify(item)}. "href" must be a string.`,
    );
  }
  if (typeof item.label !== 'string') {
    throw new Error(
      `Error loading ${JSON.stringify(item)}. "label" must be a string.`,
    );
  }
}

/**
 * Normalizes recursively item and all its children. Ensures that at the end
 * each item will be an object with the corresponding type.
 */
function normalizeItem(item: SidebarItemRaw): SidebarItem {
  if (typeof item === 'string') {
    return {
      type: 'doc',
      id: item,
    };
  }
  if (!item.type) {
    throw new Error(`Unknown sidebar item "${JSON.stringify(item)}".`);
  }
  switch (item.type) {
    case 'category':
      assertIsCategory(item);
      return {...item, items: item.items.map(normalizeItem)};
    case 'link':
      assertIsLink(item);
      return item;
    case 'ref':
    case 'doc':
      assertIsDoc(item);
      return item;
    default:
      throw new Error(`Unknown sidebar item type: ${item.type}`);
  }
}

/**
 * Converts sidebars object to mapping to arrays of sidebar item objects.
 */
function normalizeSidebar(sidebars: SidebarRaw): Sidebar {
  return Object.entries(sidebars).reduce(
    (acc: Sidebar, [sidebarId, sidebar]) => {
      let normalizedSidebar: SidebarItemRaw[];

      if (!Array.isArray(sidebar)) {
        // Convert sidebar to a more generic structure.
        normalizedSidebar = Object.entries(sidebar).map(([label, items]) => ({
          type: 'category',
          label,
          items,
        }));
      } else {
        normalizedSidebar = sidebar;
      }

      acc[sidebarId] = normalizedSidebar.map(normalizeItem);

      return acc;
    },
    {},
  );
}

export default function loadSidebars(sidebarPaths?: string[]): Sidebar {
  // We don't want sidebars to be cached because of hot reloading.
  let allSidebars: SidebarRaw = {};

  if (!sidebarPaths || !sidebarPaths.length) {
    return {} as Sidebar;
  }

  sidebarPaths.map(sidebarPath => {
    if (sidebarPath && fs.existsSync(sidebarPath)) {
      const sidebar = importFresh(sidebarPath) as SidebarRaw;
      Object.assign(allSidebars, sidebar);
    }
  });

  return normalizeSidebar(allSidebars);
}
