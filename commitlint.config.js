module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat', // New feature
        'fix', // Fix bugs/errors
        'improve', // Improve code
        'refactor', // Refactor code
        'docs', // Add documents
        'chore', // Update a bit in development progress
        'style', // Fix errors about font, format (not involve affect logic)
        'test', // Write test
        'revert', // Revert commit before
        'ci', // Change config CI/CD
        'build', // Build files
      ],
    ],
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],
    'scope-empty': [2, 'never'],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'header-max-length': [2, 'always', 150],
  },
};
