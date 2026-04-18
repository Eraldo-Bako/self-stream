import { BrowserWindow } from 'electron';

const PROVIDERS = {
    movie: [
        (id) => `https://vidsrc.me/embed/movie?imdb=${id}`,
        (id) => `https://vidsrc.to/embed/movie/${id}`,
        (id) => `https://vidsrc.xyz/embed/movie/${id}`
    ],
    tv: [
        (id, s, e) => `https://vidsrc.me/embed/tv?tmdb=${id}&sea=${s}&epi=${e}`,
        (id, s, e) => `https://vidsrc.to/embed/tv/${id}/${s}/${e}`,
        (id, s, e) => `https://vidsrc.xyz/embed/tv/${id}-${s}-${e}`
    ]
};

export async function searchFallbackLink(id, type = 'movie', s = 1, e = 1) {
    if (!id) return null;

    const urls = type === 'movie' 
        ? PROVIDERS.movie.map(fn => fn(id)) 
        : PROVIDERS.tv.map(fn => fn(id, s, e));

    for (const targetUrl of urls) {
        console.log(`🕵️ [Scraper] Trying: ${targetUrl}`);

        const result = await new Promise((resolve) => {
            const scraperWin = new BrowserWindow({
                width: 800, height: 600, show: true, autoHideMenuBar: true,
                title: `Streaming ${type}...`
            });

            scraperWin.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

            scraperWin.webContents.session.webRequest.onBeforeRequest((details, callback) => {
                const url = details.url.toLowerCase();
                if (url.includes('.m3u8') || url.includes('.mp4')) {
                    console.log(`✅ [Scraper] Captured Link!`);
                    resolve(details.url);
                    scraperWin.destroy();
                }
                callback({});
            });

            scraperWin.loadURL(targetUrl).catch(() => {});
            setTimeout(() => { if (!scraperWin.isDestroyed()) { scraperWin.destroy(); resolve(null); } }, 25000);
        });

        if (result) return result;
    }
    return null;
}