/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {ComponentType} from 'react';
import React from 'react';
import clsx from 'clsx';
import Link, {type Props as LinkProps} from '@docusaurus/Link';

import type {Props} from '@theme/BlogPostItem/Header/Author';
import Twitter from '@theme/Icon/Socials/Twitter';
import Github from '@theme/Icon/Socials/Github';
import X from '@theme/Icon/Socials/X';
import StackOverflow from '@theme/Icon/Socials/StackOverflow';
import LinkedIn from '@theme/Icon/Socials/LinkedIn';
import DefaultSocial from '@theme/Icon/Socials/Default';
import styles from './styles.module.css';

function MaybeLink(props: LinkProps): JSX.Element {
  if (props.href) {
    return <Link {...props} />;
  }
  return <>{props.children}</>;
}

const PlatformIconsMap: Record<string, ComponentType<{className: string}>> = {
  twitter: Twitter,
  github: Github,
  stackoverflow: StackOverflow,
  linkedin: LinkedIn,
  x: X,
};

function PlatformLink({platform, link}: {platform: string; link: string}) {
  const Icon = PlatformIconsMap[platform] ?? DefaultSocial;
  return (
    <Link href={link}>
      <Icon className={clsx(styles.socialIcon)} />
    </Link>
  );
}

export default function BlogPostItemHeaderAuthor({
  author,
  className,
}: Props): JSX.Element {
  const {name, title, url, socials, imageURL, email} = author;
  const link = url || (email && `mailto:${email}`) || undefined;

  const renderSocialMedia = () => (
    <div className={clsx(styles.authorSocial, 'avatar__subtitle')}>
      {Object.entries(socials ?? {}).map(([platform, linkUrl]) => {
        return (
          <PlatformLink key={platform} platform={platform} link={linkUrl} />
        );
      })}
    </div>
  );

  const hasSocialMedia = socials && Object.keys(socials).length > 0;

  return (
    <div className={clsx('avatar margin-bottom--sm', className)}>
      {imageURL && (
        <MaybeLink href={link} className="avatar__photo-link">
          <img className="avatar__photo" src={imageURL} alt={name} />
        </MaybeLink>
      )}

      {name && (
        <div className="avatar__intro">
          <div className="avatar__name">
            <MaybeLink href={link}>
              <span>{name}</span>
            </MaybeLink>
          </div>
          {hasSocialMedia ? (
            renderSocialMedia()
          ) : (
            <small className="avatar__subtitle">{title}</small>
          )}
        </div>
      )}
    </div>
  );
}