import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { getMovieMetadata } from './utils/metadata.js';
import { searchFallbackLink } from './engines/scraper.js';
import { playInVlc } from './utils/player.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function createWindow() {
    const win = new BrowserWindow({
        width: 900,
        height: 700,
        backgroundColor: '#1e1e1e',
        titleBarStyle: 'hidden', // Matches GNOME Adwaita style
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    win.loadFile('src/ui/index.html');
}

// This is where the magic happens
ipcMain.handle('search-movie', async (event, query) => {
    const movie = await getMovieMetadata(query);
    if (!movie) return { error: "Movie not found" };

    // Update UI status
    event.sender.send('status-update', `Hunting for ${movie.title}...`);

    const url = await searchFallbackLink(movie.imdbId);
    
    if (url) {
        playInVlc(url, movie.title);
        return { success: true, title: movie.title };
    } else {
        return { error: "No stream found. Try another provider." };
    }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});