const expoConfig = require('eslint-config-expo/flat');

module.exports = [
  ...expoConfig,
  { ignores: ['dist/*', '.expo/*'] },
  {
    files: ['scripts/**/*.js'],
    languageOptions: {
      globals: { __dirname: 'readonly', process: 'readonly', console: 'readonly' },
    },
  },
];
