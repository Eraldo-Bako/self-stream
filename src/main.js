import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { getMovieMetadata, getExternalIds, getTvDetails } from './utils/metadata.js';
import { searchFallbackLink } from './engines/scraper.js';
import { playInVlc } from './utils/player.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
    const win = new BrowserWindow({
        width: 1000, height: 700,
        backgroundColor: '#242424',
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            contextIsolation: true
        }
    });
    win.loadFile(path.join(__dirname, 'ui/index.html'));
}

ipcMain.handle('search-movie', async (event, query) => {
    try { return await getMovieMetadata(query); } catch (err) { return []; }
});

ipcMain.handle('play-item', async (event, item) => {
    try {
        if (item.type === 'movie') {
            event.sender.send('status-update', `Searching mirrors for ${item.title}...`);
            const imdbId = await getExternalIds(item.id, 'movie');
            if (!imdbId) throw new Error("IMDb ID not found");
            
            const url = await searchFallbackLink(imdbId, 'movie');
            if (url) {
                playInVlc(url, item.title);
            } else {
                event.sender.send('status-update', "No stream found.");
            }
        } else {
            // TV Series Logic
            event.sender.send('status-update', `Fetching Season 1 for ${item.title}...`);
            const episodes = await getTvDetails(item.id);
            
            if (episodes.length > 0) {
                // For now, let's just grab the first episode link to test Junction
                const ep = episodes[0];
                const url = await searchFallbackLink(item.id, 'tv', ep.season, ep.number);
                if (url) {
                    playInVlc(url, `${item.title} - S${ep.season}E${ep.number}`);
                }
            }
        }
        return { success: true };
    } catch (err) {
        event.sender.send('status-update', `Error: ${err.message}`);
        return { error: err.message };
    }
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });