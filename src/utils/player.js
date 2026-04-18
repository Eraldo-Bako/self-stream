import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * @param {string} content - Either a single URL or a full M3U8 string
 * @param {string} title - The name of the movie or series
 * @param {boolean} isRaw - Set to true if sending a pre-built M3U8 string
 */
export function playInVlc(content, title, isRaw = false) {
    const tempDir = os.tmpdir();
    const filePath = path.join(tempDir, `stream_${Date.now()}.m3u8`);
    
    // Build the playlist content if it's just a single URL
    const fileBody = isRaw ? content : `#EXTM3U\n#EXTINF:-1,${title}\n${content}`;

    try {
        fs.writeFileSync(filePath, fileBody);
        console.log(`🎬 [Launcher] Prepared playlist for: ${title}`);

        // Try launching Junction Flatpak first, then fallback to native, then xdg-open
        const launchCommand = `flatpak run re.sonny.Junction "${filePath}" || re.sonny.Junction "${filePath}" || xdg-open "${filePath}"`;

        exec(launchCommand, (error) => {
            if (error) {
                console.error(`❌ [Launcher] All launch methods failed: ${error.message}`);
            }
        });

        // Cleanup: Delete the temp file after 3 hours
        setTimeout(() => {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }, 10800000);

    } catch (err) {
        console.error("Failed to write playlist file:", err);
    }
}