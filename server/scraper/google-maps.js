import { chromium } from 'playwright';

/**
 * Scrape Google Maps for business listings based on keyword and location.
 * 
 * @param {string} keyword - Business keyword (e.g., "Bengkel Las")
 * @param {string} location - Location/city (e.g., "Surabaya")
 * @param {number} maxResults - Maximum number of results to scrape (default: 20)
 * @returns {Promise<Array>} - Array of lead objects
 */
export async function scrapeGoogleMaps(keyword, location, maxResults = 20) {
    const searchQuery = `${keyword} ${location}`;
    const results = [];
    const seenNames = new Set(); // Track duplicates

    let browser;
    try {
        browser = await chromium.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
            ],
        });

        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            locale: 'id-ID',
            viewport: { width: 1280, height: 900 },
        });

        const page = await context.newPage();
        page.setDefaultTimeout(45000);

        // Navigate to Google Maps search
        const url = `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`;
        console.log(`🔍 Navigating to: ${url}`);
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
        console.log('📄 Page loaded, waiting for Maps content...');

        // Handle consent dialog
        try {
            const consentBtn = await page.$('button[aria-label*="Accept"], button[aria-label*="Terima"], form[action*="consent"] button');
            if (consentBtn) {
                await consentBtn.click();
                console.log('🍪 Accepted cookie consent');
                await page.waitForTimeout(2000);
            }
        } catch {
            // No consent dialog
        }

        // Wait for the results feed
        console.log('⏳ Waiting for results feed...');
        let feedFound = false;
        try {
            await page.waitForSelector('[role="feed"]', { timeout: 20000 });
            feedFound = true;
            console.log('✅ Results feed found');
        } catch {
            console.log('⚠️  Feed selector not found, trying alternative...');
            try {
                await page.waitForSelector('a[href*="/maps/place/"]', { timeout: 10000 });
                feedFound = true;
            } catch {
                const debugInfo = await page.evaluate(() => ({
                    title: document.title,
                    url: window.location.href,
                    bodyText: document.body?.innerText?.substring(0, 500),
                }));
                console.log('📸 Debug:', JSON.stringify(debugInfo, null, 2));
            }
        }

        if (!feedFound) {
            throw new Error('Google Maps did not load results.');
        }

        // Scroll to load more results
        const feed = await page.$('[role="feed"]');
        if (feed) {
            let previousCount = 0;
            let stuckCount = 0;
            // More scrolls = more results. Google Maps loads ~7-10 per scroll.
            const maxScrollAttempts = Math.max(15, Math.ceil(maxResults / 6));
            for (let i = 0; i < maxScrollAttempts; i++) {
                await feed.evaluate(el => el.scrollTo(0, el.scrollHeight));
                await page.waitForTimeout(2000);

                // Check if we reached the end of list
                const endOfList = await page.$('p.fontBodyMedium > span > span')
                    || await page.$('div.PbZDve') // "You've reached the end of the list" message
                    || await page.evaluate(() => {
                        const el = document.querySelector('[role="feed"]');
                        return el && Math.abs(el.scrollHeight - el.scrollTop - el.clientHeight) < 5;
                    });

                const currentCount = await page.$$eval(
                    '[role="feed"] a[href*="/maps/place/"]',
                    links => links.length
                );
                console.log(`  📜 Scroll ${i + 1}: ${currentCount} listings loaded${endOfList ? ' (end of list)' : ''}`);

                if (currentCount >= maxResults) {
                    console.log(`  ✅ Reached target of ${maxResults} listings`);
                    break;
                }
                if (currentCount === previousCount) {
                    stuckCount++;
                    if (stuckCount >= 3 || endOfList) {
                        console.log(`  📋 No more listings available (total: ${currentCount})`);
                        break;
                    }
                    // Extra wait and retry scroll
                    await page.waitForTimeout(1500);
                } else {
                    stuckCount = 0;
                }
                previousCount = currentCount;
            }
        }

        // ============================================
        // STRATEGY: Collect all listing hrefs first,
        // then navigate to each one individually.
        // This avoids the "click stays on same item" bug.
        // ============================================
        const listingHrefs = await page.$$eval(
            '[role="feed"] a[href*="/maps/place/"]',
            anchors => anchors.map(a => a.href)
        );

        // Deduplicate hrefs
        const uniqueHrefs = [...new Set(listingHrefs)];
        const totalToProcess = Math.min(uniqueHrefs.length, maxResults);
        console.log(`📋 Found ${uniqueHrefs.length} unique listings, will process ${totalToProcess}`);

        for (let i = 0; i < totalToProcess; i++) {
            try {
                const href = uniqueHrefs[i];

                // Navigate directly to listing page
                await page.goto(href, { waitUntil: 'domcontentloaded', timeout: 20000 });

                // Wait for business name to appear
                try {
                    await page.waitForSelector('h1.DUwDvf, h1.fontHeadlineLarge', { timeout: 8000 });
                } catch {
                    await page.waitForTimeout(3000);
                }

                // Extract data from the detail panel
                const data = await page.evaluate(() => {
                    const nameEl = document.querySelector('h1.DUwDvf') || document.querySelector('h1.fontHeadlineLarge');
                    const categoryEl = document.querySelector('button[jsaction*="category"]') || document.querySelector('.DkEaL');

                    // Address
                    const addressBtn = document.querySelector('button[data-item-id="address"]');
                    const addressText = addressBtn?.querySelector('.fontBodyMedium')?.textContent?.trim()
                        || addressBtn?.textContent?.trim() || null;

                    // Phone
                    const phoneBtn = document.querySelector('button[data-item-id*="phone"]');
                    const phoneText = phoneBtn?.querySelector('.fontBodyMedium')?.textContent?.trim()
                        || phoneBtn?.textContent?.trim() || null;

                    // Website
                    const websiteLink = document.querySelector('a[data-item-id="authority"]');
                    const websiteUrl = websiteLink?.href || null;

                    return {
                        company_name: nameEl?.textContent?.trim() || null,
                        category: categoryEl?.textContent?.trim() || null,
                        address: addressText,
                        phone_number: phoneText,
                        website_url: websiteUrl,
                        google_maps_url: window.location.href,
                    };
                });

                if (data.company_name && !seenNames.has(data.company_name)) {
                    seenNames.add(data.company_name);

                    // Clean phone number
                    if (data.phone_number) {
                        data.phone_number = data.phone_number.replace(/[^\d+\-\s()]/g, '').trim();
                    }

                    results.push({
                        ...data,
                        category: data.category || keyword,
                        website_status: data.website_url ? 'active' : 'none', // Only 'active', 'dead', 'none' are valid
                        status: 'new',
                        scraped_at: new Date().toISOString(),
                    });
                    console.log(`  ✅ [${results.length}/${totalToProcess}] ${data.company_name} ${data.website_url ? '🌐' : '🚫'}`);
                } else if (seenNames.has(data.company_name)) {
                    console.log(`  ⏭️  [${i + 1}] Duplicate: ${data.company_name}, skipping`);
                } else {
                    console.log(`  ⚠️  [${i + 1}] No name found, skipping`);
                }
            } catch (err) {
                console.log(`  ⚠️  Skipping listing ${i + 1}: ${err.message}`);
            }
        }

    } catch (error) {
        console.error('❌ Scraping error:', error.message);
        throw error;
    } finally {
        if (browser) await browser.close();
    }

    console.log(`\n🏁 Scraping complete. Total unique results: ${results.length}`);
    return results;
}

export default scrapeGoogleMaps;
