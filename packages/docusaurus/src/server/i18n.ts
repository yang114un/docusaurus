/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import logger from '@docusaurus/logger';
import {getLangDir} from 'rtl-detect';
import type {I18n, DocusaurusConfig, I18nLocaleConfig} from '@docusaurus/types';
import type {LoadContextParams} from './index';

function getDefaultLocaleLabel(locale: string) {
  const languageName = new Intl.DisplayNames(locale, {type: 'language'}).of(
    locale,
  )!;
  return (
    languageName.charAt(0).toLocaleUpperCase(locale) + languageName.substring(1)
  );
}

function getDefaultCalendar(localeStr: string) {
  const locale = new Intl.Locale(localeStr);

  // If the locale name includes -u-ca-xxx the calendar will be defined
  if (locale.calendar) {
    return locale.calendar;
  }

  // Not well-supported but server code can infer a calendar from the locale
  // See https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Global_Objects/Intl/Locale/getCalendars
  // See https://caniuse.com/mdn-javascript_builtins_intl_locale_getcalendars
  const calendars =
    // @ts-expect-error: new std method (Bun/JSC/WebKit)
    locale.getCalendars?.() ??
    // @ts-expect-error: non-std attribute (V8/Chromium/Node)
    locale.calendars;

  if (calendars instanceof Array && calendars[0]) {
    return calendars[0];
  }

  return 'gregory';
}

export function getDefaultLocaleConfig(locale: string): I18nLocaleConfig {
  return {
    label: getDefaultLocaleLabel(locale),
    direction: getLangDir(locale),
    htmlLang: locale,
    calendar: getDefaultCalendar(locale),
    path: locale,
  };
}

export async function loadI18n(
  config: DocusaurusConfig,
  options: Pick<LoadContextParams, 'locale'>,
): Promise<I18n> {
  const {i18n: i18nConfig} = config;

  const currentLocale = options.locale ?? i18nConfig.defaultLocale;

  if (!i18nConfig.locales.includes(currentLocale)) {
    logger.warn`The locale name=${currentLocale} was not found in your site configuration: Available locales are: ${i18nConfig.locales}
Note: Docusaurus only support running one locale at a time.`;
  }

  const locales = i18nConfig.locales.includes(currentLocale)
    ? i18nConfig.locales
    : (i18nConfig.locales.concat(currentLocale) as [string, ...string[]]);

  function getLocaleConfig(locale: string): I18nLocaleConfig {
    return {
      ...getDefaultLocaleConfig(locale),
      ...i18nConfig.localeConfigs[locale],
    };
  }

  const localeConfigs = Object.fromEntries(
    locales.map((locale) => [locale, getLocaleConfig(locale)]),
  );

  return {
    defaultLocale: i18nConfig.defaultLocale,
    locales,
    path: i18nConfig.path,
    currentLocale,
    localeConfigs,
  };
}
