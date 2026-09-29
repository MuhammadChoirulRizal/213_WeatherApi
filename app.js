require("dotenv").config();

const express = require("express");
const axios = require("axios");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));

app.get("/api/lokasi", async (req, res) => {
    // Ambil input pencarian dari query string, default "Bandung City"
    const searchQuery = req.query.q || "Bandung City";
    const apiKey = process.env.MAPTILER_API_KEY;
    const baseUrl = process.env.MAPTILER_BASE_URL;

    const url = `${baseUrl}/${encodeURIComponent(searchQuery)}.json?key=${apiKey}`;

    try {
        const response = await axios.get(url);
        const data = response.data;

        if (!data.features || data.features.length === 0) {
            return res.status(404).json({ message: "Lokasi tidak ditemukan di MapTiler" });
        }

        const feature = data.features[0];
        const [longitude, latitude] = feature.geometry.coordinates;
        const lokasi = feature.place_name || feature.text || searchQuery;

        // Ekstraksi data wilayah dari objek context
        let negara = "-";
        let provinsi = "-";
        let kecamatan = "-";

        if (feature.context) {
            feature.context.forEach((item) => {
                if (item.id.startsWith("country")) negara = item.text;
                if (item.id.startsWith("region")) provinsi = item.text;
                if (item.id.startsWith("place") || item.id.startsWith("district") || item.id.startsWith('locality')) {
                    kecamatan = item.text;
                }
            });
        }

        if (kecamatan === "-") kecamatan = feature.text || "-";

        res.json({
            lokasi: lokasi,
            negara: negara,
            provinsi: provinsi,
            kecamatan: kecamatan,
            longitude: longitude,
            latitude: latitude,
            // Properti fallback sesuai format awal
            kota: lokasi,
            koordinat: `Longitude: ${longitude}, Latitude:${latitude}`
        });
    } catch (error) {
        console.error("Error MapTiler API:", error.message);
        res.status(500).json({ message: "gagal mengambil data dari maptiler" });
    }
});

app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});