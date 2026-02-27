/**
 * Website Status Checker
 * Pings a URL to determine if the website is active or dead.
 */

/**
 * Check if a website URL is reachable.
 * @param {string} url - The URL to check
 * @param {number} timeout - Timeout in ms (default: 8000)
 * @returns {Promise<{status: 'active'|'dead', statusCode: number|null, message: string}>}
 */
export async function checkWebsiteStatus(url, timeout = 8000) {
    if (!url) {
        return { status: 'none', statusCode: null, message: 'No URL provided' };
    }

    // Ensure URL has protocol
    let normalizedUrl = url;
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
        normalizedUrl = `https://${normalizedUrl}`;
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(normalizedUrl, {
            method: 'HEAD',
            signal: controller.signal,
            redirect: 'follow',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
        });

        clearTimeout(timeoutId);

        if (response.ok || response.status === 301 || response.status === 302) {
            return {
                status: 'active',
                statusCode: response.status,
                message: `Website is reachable (HTTP ${response.status})`,
            };
        }

        return {
            status: 'dead',
            statusCode: response.status,
            message: `Website returned HTTP ${response.status}`,
        };
    } catch (error) {
        return {
            status: 'dead',
            statusCode: null,
            message: error.name === 'AbortError'
                ? 'Request timed out'
                : `Connection failed: ${error.message}`,
        };
    }
}

/**
 * Batch check multiple URLs.
 * @param {Array<{id: string, website_url: string}>} leads - Array of leads with URLs
 * @returns {Promise<Array<{id: string, website_status: string, statusCode: number|null, message: string}>>}
 */
export async function batchCheckWebsites(leads) {
    const results = [];

    for (const lead of leads) {
        const result = await checkWebsiteStatus(lead.website_url);
        results.push({
            id: lead.id,
            website_url: lead.website_url,
            ...result,
        });

        // Small delay between requests to be polite
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    return results;
}

export default { checkWebsiteStatus, batchCheckWebsites };
