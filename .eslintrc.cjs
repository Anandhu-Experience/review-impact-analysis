/* .eslintrc.cjs — ESLint 8 legacy config.
 * The load-bearing rule is the src/services/** override: pure services must be
 * UI-free and store-free (architecture principle). Enforced by no-restricted-imports.
 */
module.exports = {
  root: true,
  env: { browser: true, es2022: true },
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } },
  plugins: ['@typescript-eslint', 'react-hooks'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  settings: {},
  ignorePatterns: ['dist', 'node_modules', 'vite.config.ts', '*.cjs'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
  },
  overrides: [
    {
      // Pure-services boundary — src/services/** must be UI-free and store-free.
      files: ['src/services/**/*.ts'],
      rules: {
        'no-restricted-imports': ['error', {
          paths: [
            { name: 'react', message: 'Services must be pure — no React in src/services/**.' },
            { name: 'react-dom', message: 'Services must be pure — no ReactDOM in src/services/**.' },
            { name: 'antd', message: 'Services must be pure — no UI framework in src/services/**.' },
            { name: '@ant-design/icons', message: 'Services must be pure — no icons in src/services/**.' },
            { name: 'zustand', message: 'Services must be pure — no store library in src/services/**.' },
            { name: 'styled-components', message: 'Services must be pure — no styling in src/services/**.' },
            { name: 'recharts', message: 'Services must be pure — no charts in src/services/**.' },
          ],
          patterns: [
            { group: ['**/store/**', '../store', '../../store'], message: 'Services must not import the store. Pages read the store and inject plain data.' },
            { group: ['**/components/**', '**/pages/**'], message: 'Services must not import components or pages.' },
            { group: ['react', 'react/*', 'react-dom', 'react-dom/*'], message: 'Services must be pure, React-free modules.' },
          ],
        }],
      },
    },
  ],
};
