const pool = require("../../config/database");

// =========================
// INTERNAL HELPERS
// =========================
const getLatestOfferJoin = () => `
  LEFT JOIN product_offers po
    ON po.id = (
      SELECT po2.id
      FROM product_offers po2
      WHERE po2.product_id = p.id
      ORDER BY po2.id DESC
      LIMIT 1
    )
  LEFT JOIN offer_categories oc
    ON oc.id = po.offer_category_id
`;

const getBaseProductSelect = () => `
  SELECT
    p.id,
    p.product_name,
    p.purchase_price,
    p.sell_price,
    p.sell_price AS main_price,
    p.brand_id,
    b.brand_name,
    p.category_id,
    c.category_name,
    p.one_liner,
    p.description,
    po.id AS product_offer_id,
    po.offer_amount,
    po.offer_category_id,
    oc.offer_category_name AS offer_category,
    oc.expiry_date AS offer_expires_at,
    CASE
      WHEN po.id IS NOT NULL THEN (p.sell_price - po.offer_amount)
      ELSE NULL
    END AS offered_price
  FROM products p
  LEFT JOIN brands b ON b.id = p.brand_id
  LEFT JOIN categories c ON c.id = p.category_id
  ${getLatestOfferJoin()}
`;

const buildProductFilters = (filters = {}) => {
  const conditions = [];
  const values = [];

  if (filters.category_id) {
    conditions.push("p.category_id = ?");
    values.push(filters.category_id);
  }

  if (filters.brand_id) {
    conditions.push("p.brand_id = ?");
    values.push(filters.brand_id);
  }

  if (filters.offer_category_id) {
    conditions.push("po.offer_category_id = ?");
    values.push(filters.offer_category_id);
  }

  if (filters.search_query) {
    conditions.push(`
      (
        p.product_name LIKE ?
        OR p.one_liner LIKE ?
        OR p.description LIKE ?
        OR b.brand_name LIKE ?
        OR c.category_name LIKE ?
      )
    `);
    const keyword = `%${filters.search_query}%`;
    values.push(keyword, keyword, keyword, keyword, keyword);
  }

  const whereClause = conditions.length ? ` WHERE ${conditions.join(" AND ")}` : "";
  return { whereClause, values };
};

module.exports = {
  // =========================
  // PRODUCT CRUD
  // =========================
  createProduct: async (data, imagePaths = []) => {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [productResult] = await connection.query(
        `
          INSERT INTO products
          (
            product_name,
            purchase_price,
            sell_price,
            brand_id,
            category_id,
            one_liner,
            description
          )
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [
          data.product_name,
          data.purchase_price,
          data.sell_price,
          data.brand_id || null,
          data.category_id || null,
          data.one_liner || null,
          data.description || null,
        ]
      );

      const productId = productResult.insertId;

      if (imagePaths.length) {
        const imageValues = imagePaths.map((imageUrl) => [productId, imageUrl]);
        await connection.query(
          `INSERT INTO product_images (product_id, image_url) VALUES ?`,
          [imageValues]
        );
      }

      if (data.offer_category_id && data.offer_amount) {
        await connection.query(
          `
            INSERT INTO product_offers
            (
              offer_amount,
              offer_category_id,
              product_id
            )
            VALUES (?, ?, ?)
          `,
          [data.offer_amount, data.offer_category_id, productId]
        );
      }

      await connection.commit();
      return { insertId: productId };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  updateProduct: async (id, data) => {
    const [result] = await pool.query(
      `
        UPDATE products
        SET
          product_name = ?,
          purchase_price = ?,
          sell_price = ?,
          brand_id = ?,
          category_id = ?,
          one_liner = ?,
          description = ?
        WHERE id = ?
      `,
      [
        data.product_name,
        data.purchase_price,
        data.sell_price,
        data.brand_id || null,
        data.category_id || null,
        data.one_liner || null,
        data.description || null,
        id,
      ]
    );

    return result;
  },

  deleteProduct: async (id) => {
    const [result] = await pool.query(`DELETE FROM products WHERE id = ?`, [id]);
    return result;
  },

  getProductById: async (id) => {
    const [rows] = await pool.query(
      `
        ${getBaseProductSelect()}
        WHERE p.id = ?
      `,
      [id]
    );

    return rows[0] || null;
  },

  getProducts: async (filters = {}, pagination = {}) => {
    const page = Number(pagination.page) > 0 ? Number(pagination.page) : 1;
    const limit = Number(pagination.limit) > 0 ? Number(pagination.limit) : 10;
    const offset = (page - 1) * limit;

    const { whereClause, values } = buildProductFilters(filters);

    const [rows] = await pool.query(
      `
        ${getBaseProductSelect()}
        ${whereClause}
        ORDER BY p.id DESC
        LIMIT ? OFFSET ?
      `,
      [...values, limit, offset]
    );

    const [countRows] = await pool.query(
      `
        SELECT COUNT(*) AS total
        FROM products p
        LEFT JOIN brands b ON b.id = p.brand_id
        LEFT JOIN categories c ON c.id = p.category_id
        ${getLatestOfferJoin()}
        ${whereClause}
      `,
      values
    );

    return {
      data: rows,
      pagination: {
        page,
        limit,
        total: countRows[0].total,
        total_pages: Math.ceil(countRows[0].total / limit),
      },
    };
  },

  // =========================
  // PRODUCT IMAGES
  // =========================
  createProductImages: async (product_id, imagePaths = []) => {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const values = imagePaths.map((imageUrl) => [product_id, imageUrl]);

      if (values.length) {
        await connection.query(
          `INSERT INTO product_images (product_id, image_url) VALUES ?`,
          [values]
        );
      }

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  getProductImagesByProductIds: async (productIds = []) => {
    if (!productIds.length) return [];

    const [rows] = await pool.query(
      `SELECT * FROM product_images WHERE product_id IN (?) ORDER BY id ASC`,
      [productIds]
    );

    return rows;
  },

  getProductImagesByProductId: async (product_id) => {
    const [rows] = await pool.query(
      `SELECT * FROM product_images WHERE product_id = ? ORDER BY id ASC`,
      [product_id]
    );

    return rows;
  },

  getProductImageById: async (id) => {
    const [rows] = await pool.query(
      `SELECT * FROM product_images WHERE id = ?`,
      [id]
    );

    return rows[0] || null;
  },

  deleteProductImage: async (id) => {
    const [result] = await pool.query(
      `DELETE FROM product_images WHERE id = ?`,
      [id]
    );

    return result;
  },

  // =========================
  // PRODUCT OFFERS
  // =========================
  createProductOffer: async (data) => {
    const [result] = await pool.query(
      `
        INSERT INTO product_offers
        (
          offer_amount,
          offer_category_id,
          product_id
        )
        VALUES (?, ?, ?)
      `,
      [data.offer_amount, data.offer_category_id, data.product_id]
    );

    return result;
  },

  getProductOfferById: async (id) => {
    const [rows] = await pool.query(
      `
        SELECT
          po.*,
          oc.offer_category_name,
          oc.starting_date,
          oc.expiry_date
        FROM product_offers po
        LEFT JOIN offer_categories oc ON oc.id = po.offer_category_id
        WHERE po.id = ?
      `,
      [id]
    );

    return rows[0] || null;
  },

  getProductOffersByProductId: async (product_id) => {
    const [rows] = await pool.query(
      `
        SELECT
          po.*,
          oc.offer_category_name,
          oc.starting_date,
          oc.expiry_date
        FROM product_offers po
        LEFT JOIN offer_categories oc ON oc.id = po.offer_category_id
        WHERE po.product_id = ?
        ORDER BY po.id DESC
      `,
      [product_id]
    );

    return rows;
  },

  deleteProductOffer: async (id) => {
    const [result] = await pool.query(
      `DELETE FROM product_offers WHERE id = ?`,
      [id]
    );

    return result;
  },

  // =========================
  // HOME PAGE PRODUCTS
  // =========================
  createHomePageProduct: async (data) => {
    const [result] = await pool.query(
      `
        INSERT INTO home_page_products
        (
          product_id,
          home_page_section_id,
          section_rank
        )
        VALUES (?, ?, ?)
      `,
      [data.product_id, data.home_page_section_id, data.section_rank || 0]
    );

    return result;
  },

  getHomePageProductById: async (id) => {
    const [rows] = await pool.query(
      `SELECT * FROM home_page_products WHERE id = ?`,
      [id]
    );

    return rows[0] || null;
  },

  getHomePageProductsRaw: async () => {
    const [rows] = await pool.query(
      `
        SELECT
          hpp.id,
          hpp.product_id,
          hpp.home_page_section_id,
          hpp.section_rank,
          hps.section_name,
          hps.one_liner
        FROM home_page_products hpp
        INNER JOIN home_page_sections hps
          ON hps.id = hpp.home_page_section_id
        ORDER BY hpp.home_page_section_id ASC, hpp.section_rank ASC, hpp.id DESC
      `
    );

    return rows;
  },

  deleteHomePageProduct: async (id) => {
    const [result] = await pool.query(
      `DELETE FROM home_page_products WHERE id = ?`,
      [id]
    );

    return result;
  },

  // =========================
  // REFERENCE LOOKUPS
  // =========================
  getBrandById: async (id) => {
    const [rows] = await pool.query(`SELECT * FROM brands WHERE id = ?`, [id]);
    return rows[0] || null;
  },

  getCategoryById: async (id) => {
    const [rows] = await pool.query(`SELECT * FROM categories WHERE id = ?`, [
      id,
    ]);
    return rows[0] || null;
  },

  getOfferCategoryById: async (id) => {
    const [rows] = await pool.query(
      `SELECT * FROM offer_categories WHERE id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  getHomePageSectionById: async (id) => {
    const [rows] = await pool.query(
      `SELECT * FROM home_page_sections WHERE id = ?`,
      [id]
    );
    return rows[0] || null;
  },
};