/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, {useState, useEffect, useRef} from 'react';
import clsx from 'clsx';
import {useThemeConfig, isSamePath} from '@docusaurus/theme-common';
import useUserPreferencesContext from '@theme/hooks/useUserPreferencesContext';
import useLockBodyScroll from '@theme/hooks/useLockBodyScroll';
import useWindowSize, {windowSizes} from '@theme/hooks/useWindowSize';
import useScrollPosition from '@theme/hooks/useScrollPosition';
import Link from '@docusaurus/Link';
import isInternalUrl from '@docusaurus/isInternalUrl';
import type {Props} from '@theme/DocSidebar';
import Logo from '@theme/Logo';

import styles from './styles.module.css';

const MOBILE_TOGGLE_SIZE = 24;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function usePrevious(value) {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}

const isActiveSidebarItem = (item, activePath) => {
  if (item.type === 'link') {
    return isSamePath(item.href, activePath);
  }
  if (item.type === 'category') {
    return item.items.some((subItem) =>
      isActiveSidebarItem(subItem, activePath),
    );
  }
  return false;
};

function DocSidebarItemCategory({
  item,
  onItemClick,
  collapsible,
  activePath,
  autoCollapseCategory,
  autoCollapse,
  ...props
}) {
  const {items, label} = item;

  const isActive = isActiveSidebarItem(item, activePath);
  const wasActive = usePrevious(isActive);

  // active categories are always initialized as expanded
  // the default (item.collapsed) is only used for non-active categories
  const [collapsed, setCollapsed] = useState(() => {
    if (!collapsible) {
      return false;
    }
    return isActive ? false : item.collapsed;
  });

  const menuListRef = useRef<HTMLUListElement>(null);
  const [currentCategory, setCurrentCategory] = useState(item);
  const [menuListHeight, setMenuListHeight] = useState<string | undefined>(
    undefined,
  );
  const handleMenuListHeight = (calc = true) => {
    setMenuListHeight(
      calc ? `${menuListRef.current?.scrollHeight}px` : undefined,
    );
  };

  // If we navigate to a category, it should automatically expand itself
  useEffect(() => {
    const justBecameActive = isActive && !wasActive;
    if (justBecameActive && collapsed) {
      setCollapsed(false);
    }
  }, [isActive, wasActive, collapsed]);

  const handleItemClick = async (category) => {
    if (!menuListHeight) {
      handleMenuListHeight();
    }

    const updatedCategory = await autoCollapseCategory(category);
    setCurrentCategory(updatedCategory);
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <li
      className={clsx('menu__list-item', {
        'menu__list-item--collapsed': currentCategory.collapsed,
      })}
      key={label}>
      <a
        className={clsx('menu__link', {
          'menu__link--sublist': collapsible,
          'menu__link--active': collapsible && isActive,
          [styles.menuLinkText]: !collapsible,
        })}
        onClick={
          collapsible ? () => handleItemClick(currentCategory) : undefined
        }
        href={collapsible ? '#!' : undefined}
        {...props}>
        {label}
      </a>
      <ul
        className="menu__list"
        ref={menuListRef}
        style={{
          height: menuListHeight,
        }}
        onTransitionEnd={() => {
          if (!collapsed) {
            handleMenuListHeight(false);
          }
        }}>
        {items.map((childItem) => (
          <DocSidebarItem
            tabIndex={collapsed ? '-1' : '0'}
            key={childItem.label}
            item={childItem}
            autoCollapse={autoCollapse}
            parent={items}
            onItemClick={onItemClick}
            collapsible={collapsible}
            activePath={activePath}
          />
        ))}
      </ul>
    </li>
  );
}

function DocSidebarItemLink({
  item,
  onItemClick,
  activePath,
  collapsible: _collapsible,
  ...props
}) {
  const {href, label} = item;
  const isActive = isActiveSidebarItem(item, activePath);
  return (
    <li className="menu__list-item" key={label}>
      <Link
        className={clsx('menu__link', {
          'menu__link--active': isActive,
        })}
        to={href}
        {...(isInternalUrl(href)
          ? {
              isNavLink: true,
              exact: true,
              onClick: onItemClick,
            }
          : {
              target: '_blank',
              rel: 'noreferrer noopener',
            })}
        {...props}>
        {label}
      </Link>
    </li>
  );
}

function DocSidebarItem(props) {
  const {autoCollapse, parent} = props;

  const autoCollapseCategory = async (item) => {
    const isCollapsed = item.collapsed;

    if (!isCollapsed) {
      item.collapsed = !item.collapsed;
    } else {
      if (autoCollapse) {
        for (const s in parent) {
          if (parent[s].type !== 'link') {
            parent[s].collapsed = true;
          } else {
            parent[s].collapsed = false;
          }
        }
      }
      item.collapsed = !item.collapsed;
    }
    await sleep(100);
    return item;
  };

  switch (props.item.type) {
    case 'category':
      return (
        <DocSidebarItemCategory
          {...props}
          autoCollapseCategory={autoCollapseCategory}
        />
      );
    case 'link':
    default:
      return <DocSidebarItemLink {...props} />;
  }
}

function DocSidebar({
  path,
  sidebar,
  sidebarCollapsible = true,
  autoCollapseSidebar,
  onCollapse,
  isHidden,
}: Props): JSX.Element | null {
  const [showResponsiveSidebar, setShowResponsiveSidebar] = useState(false);
  const {
    navbar: {hideOnScroll},
    hideableSidebar,
  } = useThemeConfig();
  const {isAnnouncementBarClosed} = useUserPreferencesContext();
  const {scrollY} = useScrollPosition();

  useLockBodyScroll(showResponsiveSidebar);
  const windowSize = useWindowSize();

  useEffect(() => {
    if (windowSize === windowSizes.desktop) {
      setShowResponsiveSidebar(false);
    }
  }, [windowSize]);

  return (
    <div
      className={clsx(styles.sidebar, {
        [styles.sidebarWithHideableNavbar]: hideOnScroll,
        [styles.sidebarHidden]: isHidden,
      })}>
      {hideOnScroll && <Logo tabIndex={-1} className={styles.sidebarLogo} />}
      <div
        className={clsx(
          'menu',
          'menu--responsive',
          'thin-scrollbar',
          styles.menu,
          {
            'menu--show': showResponsiveSidebar,
            [styles.menuWithAnnouncementBar]:
              !isAnnouncementBarClosed && scrollY === 0,
          },
        )}>
        <button
          aria-label={showResponsiveSidebar ? 'Close Menu' : 'Open Menu'}
          aria-haspopup="true"
          className="button button--secondary button--sm menu__button"
          type="button"
          onClick={() => {
            setShowResponsiveSidebar(!showResponsiveSidebar);
          }}>
          {showResponsiveSidebar ? (
            <span
              className={clsx(
                styles.sidebarMenuIcon,
                styles.sidebarMenuCloseIcon,
              )}>
              &times;
            </span>
          ) : (
            <svg
              aria-label="Menu"
              className={styles.sidebarMenuIcon}
              xmlns="http://www.w3.org/2000/svg"
              height={MOBILE_TOGGLE_SIZE}
              width={MOBILE_TOGGLE_SIZE}
              viewBox="0 0 32 32"
              role="img"
              focusable="false">
              <title>Menu</title>
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeMiterlimit="10"
                strokeWidth="2"
                d="M4 7h22M4 15h22M4 23h22"
              />
            </svg>
          )}
        </button>
        <ul className="menu__list">
          {sidebar.map((item) => (
            <DocSidebarItem
              key={item.label}
              item={item}
              onItemClick={(e) => {
                e.target.blur();
                setShowResponsiveSidebar(false);
              }}
              collapsible={sidebarCollapsible}
              parent={sidebar}
              autoCollapse={autoCollapseSidebar}
              activePath={path}
            />
          ))}
        </ul>
      </div>
      {hideableSidebar && (
        <button
          type="button"
          title="Collapse sidebar"
          aria-label="Collapse sidebar"
          className={clsx(
            'button button--secondary button--outline',
            styles.collapseSidebarButton,
          )}
          onClick={onCollapse}
        />
      )}
    </div>
  );
}

export default DocSidebar;
