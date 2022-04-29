/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type React from 'react';
import {useCallback, useRef} from 'react';
import {useHistory} from '@docusaurus/router';
import {useLocationChange} from './useLocationChange';

function programmaticFocus(el: HTMLElement) {
  el.setAttribute('tabindex', '-1');
  el.focus();
  el.removeAttribute('tabindex');
}

export function useSkipToContent() {
  const containerRef = useRef<HTMLDivElement>(null);
  const {action} = useHistory();
  const handleSkip = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();

    const targetElement: HTMLElement | null =
      document.querySelector('main:first-of-type') ||
      document.querySelector('.main-wrapper');

    if (targetElement) {
      programmaticFocus(targetElement);
    }
  }, []);

  useLocationChange(({location}) => {
    if (containerRef.current && !location.hash && action === 'PUSH') {
      programmaticFocus(containerRef.current);
    }
  });

  return {containerRef, handleSkip};
}
