module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.vue$': '@vue/vue3-jest',
    '^.+\\.[jt]sx?$': 'babel-jest'
  },
  moduleFileExtensions: ['vue', 'js', 'json', 'jsx'],
  testMatch: [
    '**/tests/unit/**/*.spec.[jt]s?(x)'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/etc/js/$1'
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(@vue|vue-router))'
  ],
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons']
  }
}