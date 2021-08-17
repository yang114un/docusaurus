/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {kebabCase} from 'lodash';
import {normalizeUrl} from './normalizeUrl';

export type Tag = {
  label: string;
  permalink: string;
};

export type FrontMatterTag = string | Tag;

export function normalizeFrontMatterTag(
  tagsPath: string,
  tag: FrontMatterTag,
): Tag {
  if (typeof tag === 'string') {
    const normalizedTag = kebabCase(tag);
    const permalink = normalizeUrl([tagsPath, normalizedTag]);
    return {
      label: tag,
      permalink,
    };
  }
  return tag;
}

export function normalizeFrontMatterTags(
  tagsPath: string,
  frontMatterTags: FrontMatterTag[] | undefined,
): Tag[] {
  return (
    frontMatterTags?.map((tag) => normalizeFrontMatterTag(tagsPath, tag)) ?? []
  );
}

export type TaggedItemGroup<Item> = {
  tag: Tag;
  items: Item[];
};

export function groupTaggedItems<Item>(
  items: Item[],
  getItemTags: (item: Item) => Tag[],
): Record<string, TaggedItemGroup<Item>> {
  const result: Record<string, TaggedItemGroup<Item>> = {};

  function handleItemTag(item: Item, tag: Tag) {
    // Init missing tag groups
    // TODO: it's not really clear what should be the behavior if 2 items have the same tag but the permalink is different for each
    // For now, the first tag found wins
    result[tag.label] = result[tag.label] ?? {
      tag,
      items: [],
    };

    // Add item to group
    result[tag.label].items.push(item);
  }

  items.forEach((item) => {
    getItemTags(item).forEach((tag) => {
      handleItemTag(item, tag);
    });
  });

  return result;
}
