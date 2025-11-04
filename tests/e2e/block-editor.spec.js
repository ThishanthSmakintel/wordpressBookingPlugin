/**
 * E2E tests for Gutenberg Block Editor
 * Run with: npm run test:e2e
 */

describe('AppointEase Gutenberg Block', () => {
    beforeAll(async () => {
        await page.goto('http://localhost/wordpress/wp-admin/post-new.php');
        await page.waitForSelector('.block-editor');
    });

    it('should insert AppointEase block', async () => {
        // Click add block button
        await page.click('.block-editor-inserter__toggle');
        
        // Search for block
        await page.type('.block-editor-inserter__search-input', 'AppointEase');
        
        // Click block
        await page.click('.editor-block-list-item-appointease-booking-form');
        
        // Verify block is inserted
        const block = await page.$('.wp-block-appointease-booking-form');
        expect(block).toBeTruthy();
    });

    it('should display block preview in editor', async () => {
        const header = await page.$('.appointease-booking-header');
        expect(header).toBeTruthy();
        
        const steps = await page.$('.appointease-steps');
        expect(steps).toBeTruthy();
        
        const services = await page.$$('.service-card');
        expect(services.length).toBeGreaterThan(0);
    });

    it('should show inspector controls', async () => {
        // Click block to select
        await page.click('.wp-block-appointease-booking-form');
        
        // Check sidebar controls
        const columnsControl = await page.$('text=Columns');
        expect(columnsControl).toBeTruthy();
        
        const widthControl = await page.$('text=Width');
        expect(widthControl).toBeTruthy();
    });

    it('should update columns setting', async () => {
        await page.click('.wp-block-appointease-booking-form');
        
        // Change columns
        const columnsInput = await page.$('input[aria-label="Columns"]');
        await columnsInput.clear();
        await columnsInput.type('3');
        
        // Verify change
        const value = await columnsInput.evaluate(el => el.value);
        expect(value).toBe('3');
    });

    it('should save block with attributes', async () => {
        // Save post
        await page.click('.editor-post-publish-button');
        await page.waitForSelector('.editor-post-publish-button[aria-disabled="true"]');
        
        // Verify saved
        const notice = await page.$('.components-snackbar__content');
        expect(notice).toBeTruthy();
    });
});
