import WebTorrent from 'webtorrent';

const client = new WebTorrent();

export function startP2pStream(magnetUri) {
    return new Promise((resolve, reject) => {
        client.on('error', (err) => {
            console.error('[WebTorrent Client Error]:', err.message);
        }); 
        client.add(magnetUri, (torrent) => {
            const interval = setInterval(() => {
                console.log(
                    `[P2P] Progress: ${(torrent.progress * 100).toFixed(1)}% | ` +
                    `Peers: ${torrent.numPeers} | ` +
                    `Speed: ${(torrent.downloadSpeed / 1024 / 1024).toFixed(2)} MB/s`
                );
            }, 2000);
            const file = torrent.files.find(f => 
                f.name.endsWith('.mp4') || 
                f.name.endsWith('.mkv') || 
                f.name.endsWith('.avi')
            );

            if (!file) {
                return reject(new Error("No video file found in torrent."));
            }

            const server = torrent.createServer();
            const port = 9000;
            
            server.listen(port, () => {
                const streamUrl = `http://localhost:${port}/0`;
                console.log(`[P2P] Torrent ready: ${torrent.name}`);
                resolve(streamUrl);
            });

            torrent.on('error', (err) => {
                console.error('[P2P] Torrent error:', err);
                reject(err);
            });

            torrent.on('done', () => {
                clearInterval(interval);
                console.log('[P2P] Download complete');
            });
        });
    });
}