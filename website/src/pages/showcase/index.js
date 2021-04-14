/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, {useState, useMemo} from 'react';

import Image from '@theme/IdealImage';
import Layout from '@theme/Layout';
import ToggleTags from '@site/src/components/ToggleTags';

import clsx from 'clsx';
import styles from './styles.module.css';
import users from '../../data/users';

const TITLE = 'Showcase';
const DESCRIPTION =
  'See the awesome websites people are building with Docusaurus';
const EDIT_URL =
  'https://github.com/facebook/docusaurus/edit/master/website/src/data/users.js';
const TAGS = [
  'Highlight',
  'Design',
  'i18n',
  'Versioning',
  'Large',
  'Facebook Projects',
  'Personal Sites',
  'With RTL direction',
];

function Showcase() {
  const [selectedTags, setSelectedTags] = useState([]);
  const filteredUsers = useMemo(
    () =>
      users.filter((user) => {
        for (let i = 0; i < selectedTags.length; i++) {
          if (!user.tags.includes(selectedTags[i])) {
            return false;
          }
        }
        return true;
      }),
    [selectedTags, users],
  );

  const toggleTag = (tag) => {
    const tagIndex = selectedTags.findIndex((selectedTag) => {
      return selectedTag === tag;
    });
    let selectedTagsUpdate = [...selectedTags];
    if (tagIndex === -1) {
      selectedTagsUpdate.push(tag);
    } else {
      selectedTagsUpdate.splice(tagIndex, 1);
    }
    setSelectedTags(selectedTagsUpdate);
  };

  return (
    <Layout title={TITLE} description={DESCRIPTION}>
      <main className="container margin-vert--lg">
        <div className="text--center margin-bottom--xl">
          <h1>{TITLE}</h1>
          <p>{DESCRIPTION}</p>
          <p>
            <a
              className={'button button--primary'}
              href={EDIT_URL}
              target={'_blank'}>
              Add your site!
            </a>
          </p>
          {TAGS.map((tag) => (
            <ToggleTags
              tag={tag}
              key={tag}
              change={() => toggleTag(tag)}
              selectedTags={selectedTags}
            />
          ))}
        </div>
        <div className="row">
          {filteredUsers.map((user) => (
            <div key={user.title} className="col col--4 margin-bottom--lg">
              <div className={clsx('card', styles.showcaseUser)}>
                <div className="card__image">
                  <Image img={user.preview} alt={user.title} />
                </div>
                <div className="card__body">
                  <div className="avatar">
                    <div className="avatar__intro margin-left--none">
                      <h4 className="avatar__name">{user.title}</h4>
                      <small className="avatar__subtitle">
                        {user.description}
                      </small>
                    </div>
                  </div>
                </div>
                {(user.website || user.source) && (
                  <div className="card__footer">
                    <div className="button-group button-group--block">
                      {user.website && (
                        <a
                          className="button button--small button--secondary button--block"
                          href={user.website}
                          target="_blank"
                          rel="noreferrer noopener">
                          Website
                        </a>
                      )}
                      {user.source && (
                        <a
                          className="button button--small button--secondary button--block"
                          href={user.source}
                          target="_blank"
                          rel="noreferrer noopener">
                          Source
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </Layout>
  );
}

export default Showcase;
