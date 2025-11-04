/**
 * Playwright E2E Test Configuration
 */

module.exports = {
    testDir: './tests/e2e',
    timeout: 30000,
    retries: 2,
    use: {
        baseURL: 'http://localhost/wordpress',
        headless: true,
        viewport: { width: 1280, height: 720 },
        screenshot: 'only-on-failure',
        video: 'retain-on-failure'
    },
    projects: [
        {
            name: 'chromium',
            use: { browserName: 'chromium' }
        },
        {
            name: 'firefox',
            use: { browserName: 'firefox' }
        }
    ],
    webServer: {
        command: 'php -S localhost:8080 -t /path/to/wordpress',
        port: 8080,
        timeout: 120000,
        reuseExistingServer: true
    }
};
