// const OFF = 0;
// const WARNING = 1;
const ERROR = 2;

module.exports = {
  env: { node: true, jest: true },
  overrides: [
    {
      files: ['.eslintrc.{js,cjs}'],
      parserOptions: {
        sourceType: 'script'
      }
    },
    {
      ...require('./config/eslint/base.json'),
      files: ['packages/**/*.js', 'tests/**/*.js']
    },
    {
      ...require('./config/eslint/base.ts.json'),
      files: ['packages/**/*.ts']
    }
  ],
  plugins: ['jest'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json'],
    tsconfigRootDir: __dirname
  }
};
