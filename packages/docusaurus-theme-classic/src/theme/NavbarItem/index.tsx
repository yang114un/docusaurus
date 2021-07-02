/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import DefaultNavbarItem from '@theme/NavbarItem/DefaultNavbarItem';
import DropdownNavbarItem, {
  Props as DropdownNavbarItemProps,
} from '@theme/NavbarItem/DropdownNavbarItem';
import LocaleDropdownNavbarItem from '@theme/NavbarItem/LocaleDropdownNavbarItem';
import SearchNavbarItem from '@theme/NavbarItem/SearchNavbarItem';
import type {Types, Props} from '@theme/NavbarItem';

const NavbarItemComponents: Record<
  Exclude<Types, undefined>,
  () => (props) => JSX.Element
> = {
  default: () => DefaultNavbarItem,
  localeDropdown: () => LocaleDropdownNavbarItem,
  search: () => SearchNavbarItem,
  dropdown: () => DropdownNavbarItem,

  // Need to lazy load these items as we don't know for sure the docs plugin is loaded
  // See https://github.com/facebook/docusaurus/issues/3360
  /* eslint-disable @typescript-eslint/no-var-requires, global-require */
  docsVersion: () => require('@theme/NavbarItem/DocsVersionNavbarItem').default,
  docsVersionDropdown: () =>
    require('@theme/NavbarItem/DocsVersionDropdownNavbarItem').default,
  doc: () => require('@theme/NavbarItem/DocNavbarItem').default,
  /* eslint-enable @typescript-eslint/no-var-requires, global-require */
} as const;

const getNavbarItemComponent = (type: Types = 'default') => {
  const navbarItemComponent = NavbarItemComponents[type];
  if (!navbarItemComponent) {
    throw new Error(`No NavbarItem component found for type "${type}".`);
  }
  return navbarItemComponent();
};

export default function NavbarItem({type, ...props}: Props): JSX.Element {
  // Backward compatibility: navbar item with type "default" but containing dropdown items should use the type "dropdown"
  const transformedType =
    (!type || type === 'default') &&
    (props as DropdownNavbarItemProps).items !== undefined
      ? 'dropdown'
      : type;
  const NavbarItemComponent = getNavbarItemComponent(transformedType);
  return <NavbarItemComponent {...props} />;
}
