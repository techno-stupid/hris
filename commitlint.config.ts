import type { UserConfig } from '@commitlint/types';

const Configuration: UserConfig = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'body-leading-blank': [2, 'always'], // Enforce blank line before body
    'body-max-line-length': [2, 'always', 100], // Enforce max length of 100
    'body-min-length': [2, 'always', 10], // Enforce minimum body length
    'footer-leading-blank': [2, 'always'], // Enforce blank line before footer
    'footer-max-line-length': [2, 'always', 100], // Enforce footer max length
    'header-max-length': [2, 'always', 100], // Limit commit header to 100 chars
    'scope-case': [2, 'always', 'lower-case'], // Ensure scope is lowercase
    'scope-empty': [2, 'never'], // Prevent empty scopes
    'subject-case': [2, 'always', 'lower-case'], // Enforce lowercase subject
    'subject-empty': [2, 'never'], // Prevent empty commit messages
    'subject-full-stop': [2, 'never', '.'], // No full stops at the end
    'type-case': [2, 'always', 'lower-case'], // Ensure type is lowercase
    'type-empty': [2, 'never'], // Prevent empty commit type
    'signed-off-by': [2, 'always', 'Signed-off-by:'], //Enforce Signed-off-by
    'type-enum': [
      2,
      'always',
      [
        'build',
        'chore',
        'ci',
        'docs',
        'feat',
        'fix',
        'perf',
        'refactor',
        'revert',
        'style',
        'test',
        'translation',
        'security',
        'changeset',
        'wip',
        'config',
        'api'
      ]
    ]
  }
};

export default Configuration;
