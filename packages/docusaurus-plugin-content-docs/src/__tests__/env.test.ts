import path from 'path';
import loadEnv from '../env';

describe('loadEnv', () => {
  test('website with versioning disabled', () => {
    const siteDir = path.join(__dirname, '__fixtures__', 'simple-site');
    const env = loadEnv(siteDir);
    expect(env.versioning.enabled).toBe(false);
    expect(env.versioning.versions).toStrictEqual([]);
  });

  test('website with versioning enabled', () => {
    const siteDir = path.join(__dirname, '__fixtures__', 'versioned-site');
    const env = loadEnv(siteDir);
    expect(env.versioning.enabled).toBe(true);
    expect(env.versioning.latestVersion).toBe('1.0.1');
    expect(env.versioning.versions).toStrictEqual(['1.0.1', '1.0.0']);
  });

  test('website with invalid versions.json file', () => {
    const siteDir = path.join(__dirname, '__fixtures__', 'bad-site');
    const env = loadEnv(siteDir);
    expect(env.versioning.enabled).toBe(false);
  });
});
