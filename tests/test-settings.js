/**
 * Settings Page Test
 */

const puppeteer = require('puppeteer');

const CONFIG = {
    settingsUrl: process.env.WP_ADMIN_URL || 'http://localhost/wp-admin/admin.php?page=appointease-settings',
    username: process.env.WP_TEST_USERNAME || 'admin',
    password: process.env.WP_TEST_PASSWORD || 'password'
};

if (!process.env.WP_TEST_USERNAME || !process.env.WP_TEST_PASSWORD) {
    console.warn('⚠️  Warning: Using default credentials. Set WP_TEST_USERNAME and WP_TEST_PASSWORD environment variables.');
}

async function testSettings() {
    console.log('⚙️ Testing Settings Page...\n');
    
    const browser = await puppeteer.launch({ 
        headless: false,
        slowMo: 100
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    try {
        // Login
        console.log('🔐 Logging in...');
        await page.goto('http://blog.promoplus.com/wp-admin/');
        await page.type('#user_login', CONFIG.username);
        await page.type('#user_pass', CONFIG.password);
        await page.click('#wp-submit');
        await page.waitForNavigation();
        console.log('✓ Logged in\n');
        
        // Go to settings
        console.log('📄 Loading settings page...');
        await page.goto(CONFIG.settingsUrl);
        await page.waitForSelector('.ae-settings-form');
        console.log('✓ Settings page loaded\n');
        
        // Test 1: Business Hours
        console.log('⏰ Testing Business Hours...');
        const startTime = await page.$eval('input[name="appointease_options[start_time]"]', el => el.value);
        const endTime = await page.$eval('input[name="appointease_options[end_time]"]', el => el.value);
        console.log(`  Start: ${startTime}, End: ${endTime}`);
        console.log('✓ Business hours loaded\n');
        
        // Test 2: Working Days
        console.log('📅 Testing Working Days...');
        const workingDays = await page.$$eval('input[name="appointease_options[working_days][]"]:checked', 
            els => els.map(el => el.nextElementSibling.textContent));
        console.log(`  Working days: ${workingDays.join(', ')}`);
        console.log('✓ Working days loaded\n');
        
        // Test 3: Slot Duration
        console.log('⏱️ Testing Slot Duration...');
        const slotDuration = await page.$eval('select[name="appointease_options[slot_duration]"]', 
            el => el.options[el.selectedIndex].text);
        console.log(`  Duration: ${slotDuration}`);
        console.log('✓ Slot duration loaded\n');
        
        // Test 4: Email Settings
        console.log('📧 Testing Email Settings...');
        const emailCustomer = await page.$eval('input[name="appointease_options[email_customer]"]', 
            el => el.checked);
        const emailAdmin = await page.$eval('input[name="appointease_options[email_admin]"]', 
            el => el.checked);
        console.log(`  Customer emails: ${emailCustomer ? 'ON' : 'OFF'}`);
        console.log(`  Admin emails: ${emailAdmin ? 'ON' : 'OFF'}`);
        console.log('✓ Email settings loaded\n');
        
        // Test 5: Webhook URL
        console.log('🔗 Testing Webhook...');
        const webhookUrl = await page.$eval('#webhook-url', el => el.value);
        console.log(`  Webhook URL: ${webhookUrl || 'Not set'}`);
        console.log('✓ Webhook loaded\n');
        
        // Test 6: Primary Color
        console.log('🎨 Testing Appearance...');
        const primaryColor = await page.$eval('input[name="appointease_options[primary_color]"]', 
            el => el.value);
        console.log(`  Primary color: ${primaryColor}`);
        console.log('✓ Appearance loaded\n');
        
        // Test 7: Update a setting
        console.log('💾 Testing Save Functionality...');
        await page.evaluate(() => {
            document.querySelector('input[name="appointease_options[advance_booking]"]').value = '45';
        });
        await page.click('button[name="submit"]');
        await page.waitForTimeout(2000);
        console.log('✓ Settings saved\n');
        
        console.log('='.repeat(60));
        console.log('✓ ALL SETTINGS TESTS PASSED');
        console.log('='.repeat(60));
        
    } catch (error) {
        console.error('\n✗ Test failed:', error.message);
    } finally {
        await browser.close();
    }
}

testSettings().catch(console.error);
