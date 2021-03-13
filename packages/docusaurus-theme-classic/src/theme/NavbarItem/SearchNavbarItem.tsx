/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import SearchBar from '@theme/SearchBar';
import styles from './styles.module.css';

export type Props = {readonly mobile?: boolean};

export default function SearchNavbarItem({mobile}: Props): JSX.Element | null {
  if (mobile) {
    return null;
  }

  return (
    <div className={styles.searchWrapper}>
      <SearchBar />
    </div>
  );
}
