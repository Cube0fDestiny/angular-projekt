import * as db from "../db/index.js";
import sharp from "sharp";

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
    res
      .status(500)
      .json({ error: err.message + " Błąd serwera podczas zapisu obrazu." });
  }
};

export const getImageById = async (req, res) => {
  const { id } = req.params;
  const { w, h } = req.query;

  try {
    const result = await db.query(
      `SELECT id, content, mimetype
            FROM "Images"
            WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Nie znaleziono obrazu o id: " + id });
    }

    const { content, mimetype } = result.rows[0];

    res.setHeader("Content-Type", mimetype);

    if (w && h) {
      try {
        const width = parseInt(w, 10);
        const height = parseInt(h, 10);

        if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
          return res
            .status(400)
            .json({ message: "Niepoprawne wymiary obrazu." });
        }

        const resizedBuffer = await sharp(content)
          .resize(width, height)
          .toBuffer();

        return res.send(resizedBuffer);
      } catch (err) {
        console.error(err);
        res
          .status(500)
          .json({
            error:
              err.message +
              " Błąd serwera podczas skalowania obrazu o id: " +
              id,
          });
      }
    }

    return res.send(content);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({
        error:
          err.message + " Błąd serwera podczas pobierania obrazu o id: " + id,
      });
  }
};

export const deleteImage = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      `DELETE FROM "Images" WHERE id = $1 RETURNING id`,
      [id]
    );

    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ message: "Nie znaleziono obrazu o id: " + id });
    }

    console.log(`[Image-Service] Usunięto obraz o id: ${id}`);
    res.status(204).json({ message: "Obraz został usunięty" });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({
        error:
          err.message + " Błąd serwera podczas usuwania obrazu o id: " + id,
      });
  }
};

// TODO: Add authentication to image deleting
