const axios = require('axios');

const uploadToBunny = async (fileBuffer, fileName) => {
    const storageZoneName = process.env.BUNNY_STORAGE_ZONE_NAME;
    const apiKey = process.env.BUNNY_STORAGE_API_KEY;
    const pullZoneHostname = process.env.BUNNY_PULL_ZONE_HOSTNAME;

    const url = `https://storage.bunnycdn.com/${storageZoneName}/${fileName}`;

    try {
        await axios.put(url, fileBuffer, {
            headers: {
                'AccessKey': apiKey,
                'Content-Type': 'application/octet-stream'
            }
        });
        // Vraćamo javni URL preko Pull Zone (CDN-a)
        return `https://${pullZoneHostname}/${fileName}`;
    } catch (error) {
        console.error("Greška pri uploadu na Bunny.net:", error.response?.data || error.message);
        throw new Error('Bunny.net upload failed');
    }
};

module.exports = uploadToBunny;