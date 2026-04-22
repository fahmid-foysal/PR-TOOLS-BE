const router = require("express").Router();
const { body, param } = require("express-validator");
const { checkToken } = require("../../middleware/auth");
const createUploader = require("../../utils/fileupload");

const upload = createUploader("uploads/banners");

const {
  addBrand,
  getBrands,
  editBrand,
  removeBrand,

  addCategory,
  getCategories,
  editCategory,
  removeCategory,

  addOfferCategory,
  getOfferCategories,
  editOfferCategory,
  removeOfferCategory,

  addHomePageSection,
  getHomePageSections,
  editHomePageSection,
  removeHomePageSection,

  addBanner,
  getBanners,
  editBanner,
  removeBanner,
} = require("./configuration.controller");

// =========================
// BRAND
// =========================
router.post(
  "/brand/create",
  checkToken("admin"),
  [
    body("brand_name")
      .trim()
      .notEmpty()
      .withMessage("brand_name cannot be empty")
      .isLength({ min: 2, max: 255 })
      .withMessage("brand_name must be between 2 and 255 characters"),
  ],
  addBrand
);

router.get("/brand/all", checkToken("admin"), getBrands);

router.put(
  "/brand/update/:id",
  checkToken("admin"),
  [
    param("id")
      .notEmpty()
      .withMessage("id cannot be empty")
      .isInt({ min: 1 })
      .withMessage("id must be a positive integer"),
    body("brand_name")
      .trim()
      .notEmpty()
      .withMessage("brand_name cannot be empty")
      .isLength({ min: 2, max: 255 })
      .withMessage("brand_name must be between 2 and 255 characters"),
  ],
  editBrand
);

router.delete(
  "/brand/delete/:id",
  checkToken("admin"),
  [
    param("id")
      .notEmpty()
      .withMessage("id cannot be empty")
      .isInt({ min: 1 })
      .withMessage("id must be a positive integer"),
  ],
  removeBrand
);

// =========================
// CATEGORY
// =========================
router.post(
  "/category/create",
  checkToken("admin"),
  [
    body("category_name")
      .trim()
      .notEmpty()
      .withMessage("category_name cannot be empty")
      .isLength({ min: 2, max: 255 })
      .withMessage("category_name must be between 2 and 255 characters"),
  ],
  addCategory
);

router.get("/category/all", checkToken("admin"), getCategories);

router.put(
  "/category/update/:id",
  checkToken("admin"),
  [
    param("id")
      .notEmpty()
      .withMessage("id cannot be empty")
      .isInt({ min: 1 })
      .withMessage("id must be a positive integer"),
    body("category_name")
      .trim()
      .notEmpty()
      .withMessage("category_name cannot be empty")
      .isLength({ min: 2, max: 255 })
      .withMessage("category_name must be between 2 and 255 characters"),
  ],
  editCategory
);

router.delete(
  "/category/delete/:id",
  checkToken("admin"),
  [
    param("id")
      .notEmpty()
      .withMessage("id cannot be empty")
      .isInt({ min: 1 })
      .withMessage("id must be a positive integer"),
  ],
  removeCategory
);

// =========================
// OFFER CATEGORY
// =========================
router.post(
  "/offer-category/create",
  checkToken("admin"),
  [
    body("offer_category_name")
      .trim()
      .notEmpty()
      .withMessage("offer_category_name cannot be empty")
      .isLength({ min: 2, max: 255 })
      .withMessage("offer_category_name must be between 2 and 255 characters"),

    body("starting_date")
      .notEmpty()
      .withMessage("starting_date cannot be empty")
      .isDate()
      .withMessage("starting_date must be a valid date"),

    body("expiry_date")
      .notEmpty()
      .withMessage("expiry_date cannot be empty")
      .isDate()
      .withMessage("expiry_date must be a valid date")
      .custom((value, { req }) => {
        const start = new Date(req.body.starting_date);
        const end = new Date(value);

        if (start > end) {
          throw new Error(
            "expiry_date must be greater than or equal to starting_date"
          );
        }

        return true;
      }),
  ],
  addOfferCategory
);

router.get("/offer-category/all", checkToken("admin"), getOfferCategories);

router.put(
  "/offer-category/update/:id",
  checkToken("admin"),
  [
    param("id")
      .notEmpty()
      .withMessage("id cannot be empty")
      .isInt({ min: 1 })
      .withMessage("id must be a positive integer"),

    body("offer_category_name")
      .trim()
      .notEmpty()
      .withMessage("offer_category_name cannot be empty")
      .isLength({ min: 2, max: 255 })
      .withMessage("offer_category_name must be between 2 and 255 characters"),

    body("starting_date")
      .notEmpty()
      .withMessage("starting_date cannot be empty")
      .isDate()
      .withMessage("starting_date must be a valid date"),

    body("expiry_date")
      .notEmpty()
      .withMessage("expiry_date cannot be empty")
      .isDate()
      .withMessage("expiry_date must be a valid date")
      .custom((value, { req }) => {
        const start = new Date(req.body.starting_date);
        const end = new Date(value);

        if (start > end) {
          throw new Error(
            "expiry_date must be greater than or equal to starting_date"
          );
        }

        return true;
      }),
  ],
  editOfferCategory
);

router.delete(
  "/offer-category/delete/:id",
  checkToken("admin"),
  [
    param("id")
      .notEmpty()
      .withMessage("id cannot be empty")
      .isInt({ min: 1 })
      .withMessage("id must be a positive integer"),
  ],
  removeOfferCategory
);

// =========================
// HOME PAGE SECTION
// =========================
router.post(
  "/home-page-section/create",
  checkToken("admin"),
  [
    body("section_name")
      .trim()
      .notEmpty()
      .withMessage("section_name cannot be empty")
      .isLength({ min: 2, max: 255 })
      .withMessage("section_name must be between 2 and 255 characters"),

    body("one_liner")
      .optional({ nullable: true, checkFalsy: true })
      .trim()
      .isLength({ max: 500 })
      .withMessage("one_liner cannot exceed 500 characters"),
  ],
  addHomePageSection
);

router.get("/home-page-section/all", checkToken("admin"), getHomePageSections);

router.put(
  "/home-page-section/update/:id",
  checkToken("admin"),
  [
    param("id")
      .notEmpty()
      .withMessage("id cannot be empty")
      .isInt({ min: 1 })
      .withMessage("id must be a positive integer"),

    body("section_name")
      .trim()
      .notEmpty()
      .withMessage("section_name cannot be empty")
      .isLength({ min: 2, max: 255 })
      .withMessage("section_name must be between 2 and 255 characters"),

    body("one_liner")
      .optional({ nullable: true, checkFalsy: true })
      .trim()
      .isLength({ max: 500 })
      .withMessage("one_liner cannot exceed 500 characters"),
  ],
  editHomePageSection
);

router.delete(
  "/home-page-section/delete/:id",
  checkToken("admin"),
  [
    param("id")
      .notEmpty()
      .withMessage("id cannot be empty")
      .isInt({ min: 1 })
      .withMessage("id must be a positive integer"),
  ],
  removeHomePageSection
);

// =========================
// BANNER
// =========================
router.post(
  "/banner/create",
  checkToken("admin"),
  upload.single("image"),
  [],
  addBanner
);

router.get("/banner/all", checkToken("admin"), getBanners);

router.put(
  "/banner/update/:id",
  checkToken("admin"),
  upload.single("image"),
  [
    param("id")
      .notEmpty()
      .withMessage("id cannot be empty")
      .isInt({ min: 1 })
      .withMessage("id must be a positive integer"),
  ],
  editBanner
);

router.delete(
  "/banner/delete/:id",
  checkToken("admin"),
  [
    param("id")
      .notEmpty()
      .withMessage("id cannot be empty")
      .isInt({ min: 1 })
      .withMessage("id must be a positive integer"),
  ],
  removeBanner
);

module.exports = router;