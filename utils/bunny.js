// backend/utils/bunny.js
const axios = require('axios');

const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID;
const apiKey = process.env.BUNNY_STREAM_API_KEY;

const bunnyAPI = axios.create({
    baseURL: 'https://video.bunnycdn.com',
    headers: { 'AccessKey': apiKey }
});

// Kreira prazan video objekat i vraća njegov GUID
const createVideo = async (title) => {
    try {
        const { data } = await bunnyAPI.post(`/library/${libraryId}/videos`, { title });
        return data;
    } catch (error) {
        console.error("Bunny API greška (createVideo):", error.response?.data);
        throw error;
    }
};

// Uploaduje fajl na dobijeni GUID
const uploadVideo = async (videoGuid, fileBuffer) => {
    try {
        await axios.put(`https://video.bunnycdn.com/library/${libraryId}/videos/${videoGuid}`, fileBuffer, {
            headers: {
                'AccessKey': apiKey,
                'Content-Type': 'application/octet-stream'
            }
        });
        console.log(`Video sa GUID ${videoGuid} je uspešno uploadovan.`);
    } catch (error) {
        console.error("Bunny API greška (uploadVideo):", error.response?.data);
        throw error;
    }
};

// Generiše jednostavan, javni link za prikazivanje videa
const getPlayerUrl = (videoId) => {
    // Ovo je ispravan URL za ugrađivanje u ReactPlayer
    return `https://iframe.mediadelivery.net/play/${libraryId}/${videoId}`;
};

module.exports = { createVideo, uploadVideo, getPlayerUrl };