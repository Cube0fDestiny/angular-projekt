import express from "express";
import multer from "multer";
import axios from "axios";
import FormData from "form-data";
import { requireAuth } from "../middleware/auth.js";

const storage = multer.memoryStorage();
const upload = multer({ storage });
const router = express.Router();

const uploadFile = async (file, req, log) => {
  const form = new FormData();
  form.append("image", file.buffer, { filename: file.originalname });

  try {
    const response = await axios.post("http://image-service:3004/images", form, {
      headers: {
        ...form.getHeaders(),
        "x-user-data": req.headers["x-user-data"],
      },
      timeout: 10000,
    });
    return response.data.id;
  } catch (err) {
    log?.warn(
      { filename: file.originalname, error: err.message },
      "Nie udało się przesłać obrazu - pomijam.",
    );
    return null;
  }
};

const parseImagesField = (raw) => {
  if (!raw) return [];
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    return [];
  }
};

router.put(
  "/users/:id/profile-with-image",
  requireAuth,
  upload.fields([
    { name: "profile_picture", maxCount: 1 },
    { name: "header_picture", maxCount: 1 },
  ]),
  async (req, res) => {
    const log = req.log;
    const { id: targetUserId } = req.params;
    const textualData = req.body;

    try {
      const imageUploads = {};
      log.info("Rozpoczynanie orkiestracji: aktualizacja profilu z obrazami.");

      if (req.files) {
        if (req.files.profile_picture) {
          const imageId = await uploadFile(
            req.files.profile_picture[0],
            req,
            log,
          );
          if (imageId) {
            imageUploads.profile_picture_id = imageId;
            log.info(
              { imageId },
              "Przesłano zdjęcie profilowe.",
            );
          }
        }
        if (req.files.header_picture) {
          const imageId = await uploadFile(
            req.files.header_picture[0],
            req,
            log,
          );
          if (imageId) {
            imageUploads.header_picture_id = imageId;
            log.info(
              { imageId },
              "Przesłano zdjęcie w tle.",
            );
          }
        }
      }

      const finalPayload = { ...textualData, ...imageUploads };
      log.info(
        { payload: finalPayload },
        "Przygotowano dane dla user-service.",
      );

      const userUpdateResponse = await axios.put(
        `http://user-service:3001/users/${targetUserId}`,
        finalPayload,
        {
          headers: {
            "x-user-data": req.headers["x-user-data"],
          },
        },
      );

      res.status(userUpdateResponse.status).json(userUpdateResponse.data);
    } catch (error) {
      const errorInfo = error.isAxiosError
        ? {
            message: error.message,
            url: error.config.url,
            status: error.response?.status,
            data: error.response?.data,
          }
        : { message: error.message, stack: error.stack };

      log.error(
        { err: errorInfo },
        "Błąd podczas orkiestracji aktualizacji profilu.",
      );

      const status = error.response?.status || 500;
      res.status(status).json(errorInfo);
    }
  },
);

router.post(
  "/posts/with-images",
  requireAuth,
  upload.array("images"),
  async (req, res) => {
    const log = req.log;
    const textualData = req.body;

    try {
      const uploadedImages = [];
      const files = req.files || [];

      log.info(
        { files: files.length },
        "Rozpoczynanie orkiestracji: tworzenie posta z obrazami.",
      );

      for (let i = 0; i < files.length; i += 1) {
        const file = files[i];
        const imageId = await uploadFile(file, req, log);
        if (imageId) {
          uploadedImages.push({ image_id: imageId, image_order: uploadedImages.length });
          log.info({ imageId }, "Przesłano obraz posta.");
        }
      }

      const payloadImages =
        uploadedImages.length > 0
          ? uploadedImages
          : parseImagesField(textualData.images);

      const finalPayload = {
        ...textualData,
        images: payloadImages,
      };

      log.info({ payload: finalPayload }, "Przygotowano dane dla post-service.");

      const postResponse = await axios.post(
        "http://post-service:3002/posts",
        finalPayload,
        {
          headers: {
            "x-user-data": req.headers["x-user-data"],
          },
        },
      );

      res.status(postResponse.status).json(postResponse.data);
    } catch (error) {
      const errorInfo = error.isAxiosError
        ? {
            message: error.message,
            url: error.config.url,
            status: error.response?.status,
            data: error.response?.data,
          }
        : { message: error.message, stack: error.stack };

      log.error({ err: errorInfo }, "Błąd podczas orkiestracji tworzenia posta.");

      const status = error.response?.status || 500;
      res.status(status).json(errorInfo);
    }
  },
);

router.post(
  "/events/with-image",
  requireAuth,
  upload.fields([
    { name: "profile_picture", maxCount: 1 },
    { name: "header_picture", maxCount: 1 },
  ]),
  async (req, res) => {
    const log = req.log;
    const textualData = req.body;

    try {
      const imageUploads = {};
      log.info("Rozpoczynanie orkiestracji: tworzenie wydarzenia z obrazami.");

      if (req.files) {
        if (req.files.profile_picture) {
          const imageId = await uploadFile(
            req.files.profile_picture[0],
            req,
            log,
          );
          if (imageId) {
            imageUploads.profile_picture_id = imageId;
            log.info(
              { imageId },
              "Przesłano zdjęcie profilowe wydarzenia.",
            );
          }
        }
        if (req.files.header_picture) {
          const imageId = await uploadFile(
            req.files.header_picture[0],
            req,
            log,
          );
          if (imageId) {
            imageUploads.header_picture_id = imageId;
            log.info(
              { imageId },
              "Przesłano zdjęcie w tle wydarzenia.",
            );
          }
        }
      }

      const finalPayload = { ...textualData, ...imageUploads };
      log.info({ payload: finalPayload }, "Przygotowano dane dla event-service.");

      const eventResponse = await axios.post(
        "http://event-service:3003/events",
        finalPayload,
        {
          headers: {
            "x-user-data": req.headers["x-user-data"],
          },
        },
      );

      res.status(eventResponse.status).json(eventResponse.data);
    } catch (error) {
      const errorInfo = error.isAxiosError
        ? {
            message: error.message,
            url: error.config.url,
            status: error.response?.status,
            data: error.response?.data,
          }
        : { message: error.message, stack: error.stack };

      log.error({ err: errorInfo }, "Błąd podczas orkiestracji tworzenia wydarzenia.");

      const status = error.response?.status || 500;
      res.status(status).json(errorInfo);
    }
  },
);

router.put(
  "/events/:id/with-image",
  requireAuth,
  upload.fields([
    { name: "profile_picture", maxCount: 1 },
    { name: "header_picture", maxCount: 1 },
  ]),
  async (req, res) => {
    const log = req.log;
    const { id } = req.params;
    const textualData = req.body;

    try {
      const imageUploads = {};
      log.info({ eventId: id }, "Rozpoczynanie orkiestracji: aktualizacja wydarzenia z obrazami.");

      if (req.files) {
        if (req.files.profile_picture) {
          const imageId = await uploadFile(
            req.files.profile_picture[0],
            req,
            log,
          );
          if (imageId) {
            imageUploads.profile_picture_id = imageId;
            log.info(
              { imageId },
              "Przesłano nowe zdjęcie profilowe wydarzenia.",
            );
          }
        }
        if (req.files.header_picture) {
          const imageId = await uploadFile(
            req.files.header_picture[0],
            req,
            log,
          );
          if (imageId) {
            imageUploads.header_picture_id = imageId;
            log.info(
              { imageId },
              "Przesłano nowe zdjęcie w tle wydarzenia.",
            );
          }
        }
      }

      const finalPayload = { ...textualData, ...imageUploads };
      log.info({ payload: finalPayload }, "Przygotowano dane dla event-service (aktualizacja).");

      const eventResponse = await axios.put(
        `http://event-service:3003/events/${id}`,
        finalPayload,
        {
          headers: {
            "x-user-data": req.headers["x-user-data"],
          },
        },
      );

      res.status(eventResponse.status).json(eventResponse.data);
    } catch (error) {
      const errorInfo = error.isAxiosError
        ? {
            message: error.message,
            url: error.config.url,
            status: error.response?.status,
            data: error.response?.data,
          }
        : { message: error.message, stack: error.stack };

      log.error({ err: errorInfo }, "Błąd podczas orkiestracji aktualizacji wydarzenia.");

      const status = error.response?.status || 500;
      res.status(status).json(errorInfo);
    }
  },
);

router.post(
  "/chats/:chatId/messages/with-images",
  requireAuth,
  upload.array("images", 10),
  async (req, res) => {
    const log = req.log;
    const { chatId } = req.params;
    const textualData = req.body;

    try {
      log.info(
        { chatId, files: req.files?.length || 0 },
        "Rozpoczynanie orkiestracji: tworzenie wiadomości z obrazami.",
      );

      const imageIds = [];
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const imageId = await uploadFile(file, req, log);
          if (imageId) {
            imageIds.push(imageId);
            log.info({ imageId, filename: file.originalname }, "Przesłano obraz wiadomości.");
          }
        }
      }

      const parsedImages = parseImagesField(textualData.images);
      const finalImages = [
        ...parsedImages,
        ...imageIds.map((id, idx) => ({
          image_id: id,
          image_order: parsedImages.length + idx,
        })),
      ];

      const finalPayload = { ...textualData, images: finalImages };
      log.info({ payload: finalPayload }, "Przygotowano dane dla chat-service.");

      const messageResponse = await axios.post(
        `http://chat-service:3006/chats/${chatId}/messages`,
        finalPayload,
        {
          headers: {
            "x-user-data": req.headers["x-user-data"],
          },
        },
      );

      res.status(messageResponse.status).json(messageResponse.data);
    } catch (error) {
      const errorInfo = error.isAxiosError
        ? {
            message: error.message,
            url: error.config.url,
            status: error.response?.status,
            data: error.response?.data,
          }
        : { message: error.message, stack: error.stack };

      log.error(
        { err: errorInfo },
        "Błąd podczas orkiestracji tworzenia wiadomości.",
      );

      const status = error.response?.status || 500;
      res.status(status).json(errorInfo);
    }
  },
);

export default router;
