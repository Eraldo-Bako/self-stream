import dotenv from 'dotenv';
dotenv.config();

const TMDB_KEY = process.env.TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';

export async function getMovieMetadata(query) {
    const url = `${BASE_URL}/search/multi?api_key=${TMDB_KEY}&query=${encodeURIComponent(query)}`;
    const response = await fetch(url);
    const data = await response.json();

    return data.results
        .filter(item => item.media_type === 'movie' || item.media_type === 'tv')
        .map(item => ({
            id: item.id,
            title: item.title || item.name,
            year: (item.release_date || item.first_air_date || "").split('-')[0],
            type: item.media_type,
            poster: `https://image.tmdb.org/t/p/w500${item.poster_path}`
        }));
}

// New function to get the IMDb ID needed for the scraper
export async function getExternalIds(id, type) {
    try {
        const url = `${BASE_URL}/${type}/${id}/external_ids?api_key=${TMDB_KEY}`;
        const response = await fetch(url);
        const data = await response.json();
        return data.imdb_id; // Returns 'ttXXXXX'
    } catch (err) {
        console.error("Error fetching IMDb ID:", err);
        return null;
    }
}

// New function for TV details
export async function getTvDetails(tvId) {
    const url = `${BASE_URL}/tv/${tvId}?api_key=${TMDB_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    
    let episodes = [];
    // Just get the first season for now to test
    if (data.seasons && data.seasons.length > 0) {
        const seasonNum = data.seasons[0].season_number || 1;
        const sUrl = `${BASE_URL}/tv/${tvId}/season/${seasonNum}?api_key=${TMDB_KEY}`;
        const sRes = await fetch(sUrl);
        const sData = await sRes.json();
        episodes = sData.episodes.map(ep => ({
            title: ep.name,
            season: ep.season_number,
            number: ep.episode_number,
            tmdbId: tvId
        }));
    }
    return episodes;
}