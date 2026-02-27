#!/usr/bin/env node

/**
 * Lead Finder Scraper CLI
 * 
 * Usage:
 *   npm run scrape -- --keyword "Bengkel Las" --location "Surabaya" --max 40
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { scrapeGoogleMaps } from '../server/scraper/google-maps.js';
import { batchCheckWebsites } from '../server/services/website-checker.js';

dotenv.config();

// Parse CLI arguments
function parseArgs() {
    const args = process.argv.slice(2);
    const params = { keyword: '', location: '', max: 40 };

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--keyword' && args[i + 1]) params.keyword = args[++i];
        else if (args[i] === '--location' && args[i + 1]) params.location = args[++i];
        else if (args[i] === '--max' && args[i + 1]) params.max = parseInt(args[++i]);
        else if (args[i] === '--help') {
            console.log(`
  🔍 Lead Finder Scraper CLI

  Usage:
    npm run scrape -- --keyword "Bengkel Las" --location "Surabaya" --max 40

  Options:
    --keyword   Keyword bisnis (wajib)
    --location  Lokasi/kota (wajib)  
    --max       Jumlah maksimal leads (default: 40)
    --help      Tampilkan bantuan
            `);
            process.exit(0);
        }
    }

    return params;
}

async function main() {
    const { keyword, location, max } = parseArgs();

    if (!keyword || !location) {
        console.error('❌ --keyword dan --location wajib diisi!');
        console.log('   Contoh: npm run scrape -- --keyword "Bengkel Las" --location "Surabaya"');
        process.exit(1);
    }

    // Setup Supabase
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY harus di-set di file .env');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`
╔══════════════════════════════════════════════╗
║        🔍 Lead Finder Scraper CLI           ║
╠══════════════════════════════════════════════╣
║  Keyword  : ${keyword.padEnd(32)}║
║  Location : ${location.padEnd(32)}║
║  Max Leads: ${String(max).padEnd(32)}║
╚══════════════════════════════════════════════╝
    `);

    // Step 1: Scrape
    console.log('📡 Step 1/3: Scraping Google Maps...\n');
    const results = await scrapeGoogleMaps(keyword, location, max);

    if (results.length === 0) {
        console.log('❌ Tidak ada hasil yang ditemukan.');
        process.exit(0);
    }

    // Step 2: Check websites
    const leadsWithUrls = results.filter(r => r.website_url);
    if (leadsWithUrls.length > 0) {
        console.log(`\n🌐 Step 2/3: Checking ${leadsWithUrls.length} website statuses...\n`);
        const statusResults = await batchCheckWebsites(leadsWithUrls);
        statusResults.forEach(sr => {
            const lead = results.find(r => r.website_url === sr.website_url);
            if (lead) lead.website_status = sr.status;
        });
    } else {
        console.log('\n🌐 Step 2/3: Skip (tidak ada website untuk dicek)\n');
    }

    // Step 3: Save to database
    console.log(`\n💾 Step 3/3: Menyimpan ${results.length} leads ke database...\n`);
    const { data, error } = await supabase.from('leads').insert(results).select();

    if (error) {
        console.error('❌ Gagal menyimpan ke database:', error.message);
        console.log('\nData yang berhasil di-scrape (tidak tersimpan):');
        results.forEach((r, i) => {
            console.log(`  ${i + 1}. ${r.company_name} | ${r.phone_number || '-'} | ${r.website_url ? '🌐' : '🚫'}`);
        });
        process.exit(1);
    }

    // Summary
    const noWebsite = results.filter(r => r.website_status === 'none').length;
    const withWebsite = results.filter(r => r.website_status === 'active').length;
    const deadWebsite = results.filter(r => r.website_status === 'dead').length;

    console.log(`
╔══════════════════════════════════════════════╗
║           ✅ SCRAPING SELESAI!              ║
╠══════════════════════════════════════════════╣
║  Total Leads     : ${String(data.length).padEnd(25)}║
║  Tanpa Website 🚫: ${String(noWebsite).padEnd(25)}║
║  Website Aktif 🌐: ${String(withWebsite).padEnd(25)}║
║  Website Mati  💀: ${String(deadWebsite).padEnd(25)}║
╠══════════════════════════════════════════════╣
║  Buka dashboard untuk mengelola leads.      ║
╚══════════════════════════════════════════════╝
    `);

    process.exit(0);
}

main().catch(err => {
    console.error('❌ Fatal error:', err.message);
    process.exit(1);
});
