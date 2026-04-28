const router = require("express").Router();
const { body, param, query } = require("express-validator");
const { checkToken } = require("../../middleware/auth");
const {
  createOrder,
  getOrdersForAdmin,
  updateOrderStatusService,
} = require("./order.controller");

router.post(
  "/create",
  [
    body("customer_name")
      .trim()
      .notEmpty()
      .withMessage("customer_name cannot be empty"),

    body("phone")
      .trim()
      .notEmpty()
      .withMessage("phone cannot be empty")
      .isLength({ min: 6, max: 30 })
      .withMessage("phone must be between 6 and 30 characters"),

    body("address")
      .optional({ nullable: true, checkFalsy: true })
      .trim(),

    body("payment_method")
      .trim()
      .notEmpty()
      .withMessage("payment_method cannot be empty"),

    body("account_number")
      .trim()
      .notEmpty()
      .withMessage("account_number cannot be empty"),

    body("transaction_no")
      .trim()
      .notEmpty()
      .withMessage("transaction_no cannot be empty"),

    body("paid_amount")
      .optional({ nullable: true, checkFalsy: true })
      .isFloat({ min: 0 })
      .withMessage("paid_amount must be a non-negative number"),

    body("map_link")
      .optional({ nullable: true, checkFalsy: true })
      .trim(),

    body("latitude")
      .optional({ nullable: true, checkFalsy: true })
      .isFloat()
      .withMessage("latitude must be a valid number"),

    body("longitude")
      .optional({ nullable: true, checkFalsy: true })
      .isFloat()
      .withMessage("longitude must be a valid number"),

    body("items")
      .notEmpty()
      .withMessage("items cannot be empty")
      .custom((value) => {
        let parsed = value;

        if (typeof value === "string") {
          parsed = JSON.parse(value);
        }

        if (!Array.isArray(parsed) || !parsed.length) {
          throw new Error("items must be a non-empty array");
        }

        for (const item of parsed) {
          if (!item.product_id) {
            throw new Error("Each item must have product_id");
          }
          if (item.rate === undefined || item.rate === null || item.rate === "") {
            throw new Error("Each item must have rate");
          }
          if (
            item.quantity === undefined ||
            item.quantity === null ||
            item.quantity === ""
          ) {
            throw new Error("Each item must have quantity");
          }
        }

        return true;
      }),
  ],
  createOrder
);

router.get(
  "/admin/all",
  checkToken("admin"),
  [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("page must be a positive integer"),

    query("limit")
      .optional()
      .isInt({ min: 1 })
      .withMessage("limit must be a positive integer"),

    query("status")
      .optional()
      .trim(),

    query("search_query")
      .optional()
      .trim(),

    query("from_date")
      .optional()
      .isDate()
      .withMessage("from_date must be a valid date"),

    query("to_date")
      .optional()
      .isDate()
      .withMessage("to_date must be a valid date"),
  ],
  getOrdersForAdmin
);

router.put(
  "/admin/status-update/:id",
  checkToken("admin"),
  [
    param("id")
      .notEmpty()
      .withMessage("id cannot be empty")
      .isInt({ min: 1 })
      .withMessage("id must be a positive integer"),

    body("status")
      .trim()
      .notEmpty()
      .withMessage("status cannot be empty"),

    body("admin_notes")
      .optional({ nullable: true, checkFalsy: true })
      .trim(),
  ],
  updateOrderStatusService
);

module.exports = router;