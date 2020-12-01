/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import {Props} from '@theme/IconMenu';
import styles from '../DocSidebar/styles.module.css';

const IconMenu = ({
  width = 30,
  height = 30,
  ...restProps
}: Props): JSX.Element => {
  return (
    <svg
      aria-label="Menu"
      className={styles.sidebarMenuIcon}
      width={width}
      height={height}
      viewBox="0 0 30 30"
      role="img"
      focusable="false"
      {...restProps}>
      <title>Menu</title>
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeMiterlimit="10"
        strokeWidth="2"
        d="M4 7h22M4 15h22M4 23h22"
      />
    </svg>
  );
};

export default IconMenu;
