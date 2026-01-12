import * as db from "../db/index.js";

export const uploadImage = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "Nie przesłano pliku obrazu." });
    }

    const { buffer, mimetype } = req.file;

    try {
        const result = await db.query(
            `INSERT INTO "Images" (content, mimetype) VALUES ($1, $2) RETURNING id`,
            [buffer, mimetype]
        );
        
        const imageId = result.rows[0].id;
        console.log(`[Image-Service] Zapisano obraz o id: ${imageId}`);
        res.status(201).json({ id: imageId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message + " Błąd serwera podczas zapisu obrazu." });
    }
}

export const getImageById = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await db.query(
            `SELECT id, content, mimetype
            FROM "Images"
            WHERE id = $1 AND deleted = false`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Nie znaleziono obrazu o id: " + id });
        }

        res.setHeader("Content-Type", mimetype);
        res.send(content);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message + " Błąd serwera podczas pobierania obrazu o id: " + id });
    }
}