const router = require("express").Router();
const { body, param, query } = require("express-validator");
const { checkToken } = require("../../middleware/auth");
const createUploader = require("../../utils/fileupload");

const upload = createUploader("uploads/products");

const {
  addProduct,
  getAllProducts,
  getProductAutocomplete,
  getProductDetails,
  editProduct,
  removeProduct,

  addProductImages,
  removeProductImage,

  addProductOffer,
  removeProductOffer,

  addHomePageProduct,
  getHomePageProducts,
  removeHomePageProduct,
} = require("./products.controller");

// =========================
// PRODUCT CRUD
// =========================
router.post(
  "/product/create",
  checkToken("admin"),
  upload.array("images", 10),
  [
    body("product_name")
      .trim()
      .notEmpty()
      .withMessage("product_name cannot be empty")
      .isLength({ min: 2, max: 255 })
      .withMessage("product_name must be between 2 and 255 characters"),

    body("purchase_price")
      .notEmpty()
      .withMessage("purchase_price cannot be empty")
      .isFloat({ min: 0 })
      .withMessage("purchase_price must be a valid non-negative number"),

    body("sell_price")
      .notEmpty()
      .withMessage("sell_price cannot be empty")
      .isFloat({ min: 0 })
      .withMessage("sell_price must be a valid non-negative number"),

    body("brand_id")
      .optional({ nullable: true, checkFalsy: true })
      .isInt({ min: 1 })
      .withMessage("brand_id must be a positive integer"),

    body("category_id")
      .optional({ nullable: true, checkFalsy: true })
      .isInt({ min: 1 })
      .withMessage("category_id must be a positive integer"),

    body("one_liner")
      .optional({ nullable: true, checkFalsy: true })
      .trim()
      .isLength({ max: 500 })
      .withMessage("one_liner cannot exceed 500 characters"),

    body("description")
      .optional({ nullable: true, checkFalsy: true })
      .trim(),

    body("offer_category_id")
      .optional({ nullable: true, checkFalsy: true })
      .isInt({ min: 1 })
      .withMessage("offer_category_id must be a positive integer"),

    body("offer_amount")
      .optional({ nullable: true, checkFalsy: true })
      .isFloat({ min: 0 })
      .withMessage("offer_amount must be a valid non-negative number"),

    body("offer_category_id").custom((value, { req }) => {
      if ((req.body.offer_amount && !value) || (value && !req.body.offer_amount)) {
        throw new Error(
          "offer_category_id and offer_amount must be provided together"
        );
      }
      return true;
    }),
  ],
  addProduct
);

router.get(
  "/product/all",
  [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("page must be a positive integer"),

    query("limit")
      .optional()
      .isInt({ min: 1 })
      .withMessage("limit must be a positive integer"),

    query("category_id")
      .optional()
      .isInt({ min: 1 })
      .withMessage("category_id must be a positive integer"),

    query("brand_id")
      .optional()
      .isInt({ min: 1 })
      .withMessage("brand_id must be a positive integer"),

    query("offer_category_id")
      .optional()
      .isInt({ min: 1 })
      .withMessage("offer_category_id must be a positive integer"),

    query("search_query")
      .optional()
      .trim(),
  ],
  getAllProducts
);

router.get(
  "/product/autocomplete",
  [
    query("search_query")
      .trim()
      .notEmpty()
      .withMessage("search_query cannot be empty"),

    query("limit")
      .optional()
      .isInt({ min: 1, max: 20 })
      .withMessage("limit must be an integer between 1 and 20"),
  ],
  getProductAutocomplete
);

router.get(
  "/product/details/:id",
  [
    param("id")
      .notEmpty()
      .withMessage("id cannot be empty")
      .isInt({ min: 1 })
      .withMessage("id must be a positive integer"),
  ],
  getProductDetails
);

router.put(
  "/product/update/:id",
  checkToken("admin"),
  [
    param("id")
      .notEmpty()
      .withMessage("id cannot be empty")
      .isInt({ min: 1 })
      .withMessage("id must be a positive integer"),

    body("product_name")
      .trim()
      .notEmpty()
      .withMessage("product_name cannot be empty")
      .isLength({ min: 2, max: 255 })
      .withMessage("product_name must be between 2 and 255 characters"),

    body("purchase_price")
      .notEmpty()
      .withMessage("purchase_price cannot be empty")
      .isFloat({ min: 0 })
      .withMessage("purchase_price must be a valid non-negative number"),

    body("sell_price")
      .notEmpty()
      .withMessage("sell_price cannot be empty")
      .isFloat({ min: 0 })
      .withMessage("sell_price must be a valid non-negative number"),

    body("brand_id")
      .optional({ nullable: true, checkFalsy: true })
      .isInt({ min: 1 })
      .withMessage("brand_id must be a positive integer"),

    body("category_id")
      .optional({ nullable: true, checkFalsy: true })
      .isInt({ min: 1 })
      .withMessage("category_id must be a positive integer"),

    body("one_liner")
      .optional({ nullable: true, checkFalsy: true })
      .trim()
      .isLength({ max: 500 })
      .withMessage("one_liner cannot exceed 500 characters"),

    body("description")
      .optional({ nullable: true, checkFalsy: true })
      .trim(),
  ],
  editProduct
);

router.delete(
  "/product/delete/:id",
  checkToken("admin"),
  [
    param("id")
      .notEmpty()
      .withMessage("id cannot be empty")
      .isInt({ min: 1 })
      .withMessage("id must be a positive integer"),
  ],
  removeProduct
);

// =========================
// PRODUCT IMAGES
// =========================
router.post(
  "/product-image/create",
  checkToken("admin"),
  upload.array("images", 10),
  [
    body("product_id")
      .notEmpty()
      .withMessage("product_id cannot be empty")
      .isInt({ min: 1 })
      .withMessage("product_id must be a positive integer"),
  ],
  addProductImages
);

router.delete(
  "/product-image/delete/:id",
  checkToken("admin"),
  [
    param("id")
      .notEmpty()
      .withMessage("id cannot be empty")
      .isInt({ min: 1 })
      .withMessage("id must be a positive integer"),
  ],
  removeProductImage
);

// =========================
// PRODUCT OFFERS
// =========================
router.post(
  "/product-offer/create",
  checkToken("admin"),
  [
    body("product_id")
      .notEmpty()
      .withMessage("product_id cannot be empty")
      .isInt({ min: 1 })
      .withMessage("product_id must be a positive integer"),

    body("offer_category_id")
      .notEmpty()
      .withMessage("offer_category_id cannot be empty")
      .isInt({ min: 1 })
      .withMessage("offer_category_id must be a positive integer"),

    body("offer_amount")
      .notEmpty()
      .withMessage("offer_amount cannot be empty")
      .isFloat({ min: 0 })
      .withMessage("offer_amount must be a valid non-negative number"),
  ],
  addProductOffer
);

router.delete(
  "/product-offer/delete/:id",
  checkToken("admin"),
  [
    param("id")
      .notEmpty()
      .withMessage("id cannot be empty")
      .isInt({ min: 1 })
      .withMessage("id must be a positive integer"),
  ],
  removeProductOffer
);

// =========================
// HOME PAGE PRODUCTS
// =========================
router.post(
  "/home-page-product/create",
  checkToken("admin"),
  [
    body("product_id")
      .notEmpty()
      .withMessage("product_id cannot be empty")
      .isInt({ min: 1 })
      .withMessage("product_id must be a positive integer"),

    body("home_page_section_id")
      .notEmpty()
      .withMessage("home_page_section_id cannot be empty")
      .isInt({ min: 1 })
      .withMessage("home_page_section_id must be a positive integer"),

    body("section_rank")
      .optional({ nullable: true, checkFalsy: true })
      .isInt({ min: 0 })
      .withMessage("section_rank must be a non-negative integer"),
  ],
  addHomePageProduct
);

router.get("/home-page-product/all", getHomePageProducts);

router.delete(
  "/home-page-product/delete/:id",
  checkToken("admin"),
  [
    param("id")
      .notEmpty()
      .withMessage("id cannot be empty")
      .isInt({ min: 1 })
      .withMessage("id must be a positive integer"),
  ],
  removeHomePageProduct
);

module.exports = router;
