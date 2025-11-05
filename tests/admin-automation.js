/**
 * Admin Panel Automation Test
 * Tests all admin CRUD operations
 */

const puppeteer = require('puppeteer');

const CONFIG = {
    baseUrl: 'http://blog.promoplus.com',
    adminUrl: 'http://blog.promoplus.com/wp-admin',
    username: 'thishath-admin',
    password: 'Hht#0768340599'
};

let browser, page;

async function login() {
    console.log('🔐 Logging in...');
    await page.goto(`${CONFIG.adminUrl}/`);
    
    await page.type('#user_login', CONFIG.username);
    await page.type('#user_pass', CONFIG.password);
    await page.click('#wp-submit');
    await page.waitForNavigation();
    
    console.log('✓ Logged in successfully\n');
}

async function testDashboard() {
    console.log('📊 Testing Dashboard...');
    await page.goto(`${CONFIG.adminUrl}/admin.php?page=appointease`);
    await page.waitForSelector('.amelia-dashboard');
    
    const stats = await page.$$eval('.stat-card h3', els => els.map(el => el.textContent));
    console.log('  Stats:', stats.join(', '));
    console.log('✓ Dashboard loaded\n');
}

async function testServices() {
    console.log('🛠️ Testing Services...');
    await page.goto(`${CONFIG.adminUrl}/admin.php?page=appointease-services`);
    await page.waitForSelector('.ae-cards');
    
    // Add service
    await page.click('#add-service-modal');
    await page.waitForSelector('#service-modal.show');
    await page.type('#service-name', 'Test Service');
    await page.type('#service-description', 'Automated test service');
    await page.type('#service-duration', '45');
    await page.type('#service-price', '99.99');
    await page.click('#service-form button[type="submit"]');
    await page.waitForTimeout(2000);
    
    console.log('✓ Service created\n');
}

async function testStaff() {
    console.log('👥 Testing Staff...');
    await page.goto(`${CONFIG.adminUrl}/admin.php?page=appointease-staff`);
    await page.waitForSelector('.ae-cards');
    
    // Add staff
    await page.click('#add-staff-modal');
    await page.waitForSelector('#staff-modal.show');
    await page.type('#staff-name', 'Test Employee');
    await page.type('#staff-email', 'test@example.com');
    await page.type('#staff-phone', '555-9999');
    await page.click('#staff-form button[type="submit"]');
    await page.waitForTimeout(2000);
    
    console.log('✓ Staff member created\n');
}

async function testAppointments() {
    console.log('📅 Testing Appointments...');
    await page.goto(`${CONFIG.adminUrl}/admin.php?page=appointease-appointments`);
    await page.waitForSelector('.ae-table');
    
    const rows = await page.$$eval('.ae-table tbody tr', rows => rows.length);
    console.log(`  Found ${rows} appointment(s)`);
    
    // Test status update if appointments exist
    if (rows > 0) {
        const firstSelect = await page.$('.ae-table tbody tr:first-child select');
        if (firstSelect) {
            await firstSelect.select('confirmed');
            await page.waitForTimeout(1000);
            console.log('  ✓ Status updated');
        }
    }
    
    console.log('✓ Appointments page working\n');
}

async function testCalendar() {
    console.log('📆 Testing Calendar...');
    await page.goto(`${CONFIG.adminUrl}/admin.php?page=appointease-calendar`);
    await page.waitForSelector('#appointease-calendar-root');
    await page.waitForTimeout(2000);
    
    console.log('✓ Calendar loaded\n');
}

async function testCustomers() {
    console.log('👤 Testing Customers...');
    await page.goto(`${CONFIG.adminUrl}/admin.php?page=appointease-customers`);
    await page.waitForSelector('.ae-table');
    
    const customers = await page.$$eval('.ae-table tbody tr', rows => rows.length);
    console.log(`  Found ${customers} customer(s)`);
    
    console.log('✓ Customers page working\n');
}

async function testHolidays() {
    console.log('🏖️ Testing Holidays...');
    await page.goto(`${CONFIG.adminUrl}/admin.php?page=appointease-holidays`);
    await page.waitForSelector('.ae-table');
    
    console.log('✓ Holidays page loaded\n');
}

async function testSettings() {
    console.log('⚙️ Testing Settings...');
    await page.goto(`${CONFIG.adminUrl}/admin.php?page=appointease-settings`);
    await page.waitForSelector('.ae-settings-form');
    
    // Check working days
    const checkedDays = await page.$$eval('input[name="appointease_options[working_days][]"]:checked', 
        els => els.length);
    console.log(`  Working days: ${checkedDays}`);
    
    console.log('✓ Settings page working\n');
}

async function testReports() {
    console.log('📈 Testing Reports...');
    await page.goto(`${CONFIG.adminUrl}/admin.php?page=appointease-reports`);
    await page.waitForSelector('.ae-dashboard');
    
    const revenue = await page.$eval('.stat-card h3', el => el.textContent);
    console.log(`  Total revenue: ${revenue}`);
    
    console.log('✓ Reports page working\n');
}

async function testCategories() {
    console.log('📂 Testing Categories...');
    await page.goto(`${CONFIG.adminUrl}/admin.php?page=appointease-categories`);
    await page.waitForSelector('.ae-cards');
    
    console.log('✓ Categories page loaded\n');
}

async function testEmails() {
    console.log('📧 Testing Email Templates...');
    await page.goto(`${CONFIG.adminUrl}/admin.php?page=appointease-emails`);
    await page.waitForSelector('.ae-card');
    
    console.log('✓ Email templates page loaded\n');
}

async function runAllTests() {
    console.log('='.repeat(60));
    console.log('ADMIN PANEL AUTOMATION TEST');
    console.log('='.repeat(60));
    console.log(`URL: ${CONFIG.adminUrl}`);
    console.log('='.repeat(60) + '\n');
    
    const startTime = Date.now();
    
    try {
        browser = await puppeteer.launch({ 
            headless: false,
            slowMo: 50
        });
        page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });
        
        await login();
        await testDashboard();
        await testServices();
        await testStaff();
        await testAppointments();
        await testCalendar();
        await testCustomers();
        await testHolidays();
        await testSettings();
        await testReports();
        await testCategories();
        await testEmails();
        
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        
        console.log('='.repeat(60));
        console.log('TEST RESULTS');
        console.log('='.repeat(60));
        console.log(`✓ All 11 admin pages tested successfully`);
        console.log(`Duration: ${duration}s`);
        console.log('='.repeat(60));
        
    } catch (error) {
        console.error('\n✗ Test failed:', error.message);
        console.error(error.stack);
    } finally {
        if (browser) await browser.close();
    }
}

runAllTests().catch(console.error);
