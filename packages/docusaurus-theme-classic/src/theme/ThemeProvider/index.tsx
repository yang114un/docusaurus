/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, {ReactNode} from 'react';

import useTheme from '@theme/hooks/useTheme';
import ThemeContext from '@theme/ThemeContext';

export type Props = {readonly children: ReactNode};

function ThemeProvider(props: Props): JSX.Element {
  const {isDarkTheme, setLightTheme, setDarkTheme} = useTheme();

  return (
    <ThemeContext.Provider value={{isDarkTheme, setLightTheme, setDarkTheme}}>
      {props.children}
    </ThemeContext.Provider>
  );
}

export default ThemeProvider;
