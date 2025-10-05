const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost/wordpress',
    supportFile: 'tests/js/e2e/support/e2e.js',
    specPattern: 'tests/js/e2e/**/*.cy.js',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
  component: {
    devServer: {
      framework: 'react',
      bundler: 'webpack',
    },
    supportFile: 'tests/js/e2e/support/component.js',
    specPattern: 'tests/js/e2e/components/**/*.cy.{js,jsx,ts,tsx}'
  }
});