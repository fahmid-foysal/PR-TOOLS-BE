const router = require("express").Router();
const { body } = require("express-validator");

const {
  registerUser,
  loginUser,
  getUserProfile,
} = require("./users.controller");

const { checkToken } = require("../../middleware/auth");
const createUploader = require("../../utils/fileupload");

const upload = createUploader("uploads");



router.post(
  "/register",
  [
    body("name").notEmpty().withMessage("name is required"),
    body("email")
      .notEmpty()
      .withMessage("email is required")
      .isEmail()
      .withMessage("Invalid email format"),
    body("password")
      .notEmpty()
      .withMessage("password is required")
  ],
  registerUser
);


router.post(
  "/login",
  [
    body("email")
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Invalid email format"),
    body("password")
      .notEmpty()
      .withMessage("Password is required"),
  ],
  loginUser
);

router.get("/profile", checkToken(), getUserProfile);

// router.put(
//   "/upload-profile",
//   upload.single("image_path"),
//   checkToken(),
//   addProfileImage
// );


module.exports = router;