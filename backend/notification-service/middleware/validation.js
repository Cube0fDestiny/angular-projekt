import { body, validationResult } from "express-validator";

export const registerValidation = [
  body("email").isEmail().withMessage("Podaj poprawny adres email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Hasło musi mieć minimum 6 znaków")
];

export const loginValidation = [
  body("email").isEmail().withMessage("Podaj poprawny email"),
  body("password").notEmpty().withMessage("Hasło nie może być puste"),
];

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};