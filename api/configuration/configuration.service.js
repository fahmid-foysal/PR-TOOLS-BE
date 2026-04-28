const pool = require("../../config/database");

module.exports = {
  // =========================
  // BRAND
  // =========================
  createBrand: async (brand_name) => {
    const [result] = await pool.query(
      `INSERT INTO brands (brand_name) VALUES (?)`,
      [brand_name]
    );
    return result;
  },

  getAllBrands: async () => {
    const [rows] = await pool.query(`SELECT * FROM brands ORDER BY id DESC`);
    return rows;
  },

  getBrandById: async (id) => {
    const [rows] = await pool.query(`SELECT * FROM brands WHERE id = ?`, [id]);
    return rows[0] || null;
  },

  getBrandByName: async (brand_name) => {
    const [rows] = await pool.query(
      `SELECT * FROM brands WHERE brand_name = ?`,
      [brand_name]
    );
    return rows[0] || null;
  },

  updateBrand: async (id, brand_name) => {
    const [result] = await pool.query(
      `UPDATE brands SET brand_name = ? WHERE id = ?`,
      [brand_name, id]
    );
    return result;
  },

  deleteBrand: async (id) => {
    const [result] = await pool.query(`DELETE FROM brands WHERE id = ?`, [id]);
    return result;
  },

  // =========================
  // CATEGORY
  // =========================
  createCategory: async (category_name) => {
    const [result] = await pool.query(
      `INSERT INTO categories (category_name) VALUES (?)`,
      [category_name]
    );
    return result;
  },

  getAllCategories: async () => {
    const [rows] = await pool.query(
      `SELECT * FROM categories ORDER BY id DESC`
    );
    return rows;
  },

  getCategoryById: async (id) => {
    const [rows] = await pool.query(`SELECT * FROM categories WHERE id = ?`, [
      id,
    ]);
    return rows[0] || null;
  },

  getCategoryByName: async (category_name) => {
    const [rows] = await pool.query(
      `SELECT * FROM categories WHERE category_name = ?`,
      [category_name]
    );
    return rows[0] || null;
  },

  updateCategory: async (id, category_name) => {
    const [result] = await pool.query(
      `UPDATE categories SET category_name = ? WHERE id = ?`,
      [category_name, id]
    );
    return result;
  },

  deleteCategory: async (id) => {
    const [result] = await pool.query(`DELETE FROM categories WHERE id = ?`, [
      id,
    ]);
    return result;
  },

  // =========================
  // OFFER CATEGORY
  // =========================
  createOfferCategory: async (data) => {
    const [result] = await pool.query(
      `INSERT INTO offer_categories (offer_category_name, starting_date, expiry_date)
       VALUES (?, ?, ?)`,
      [data.offer_category_name, data.starting_date, data.expiry_date]
    );
    return result;
  },

  getAllOfferCategories: async () => {
    const [rows] = await pool.query(
      `SELECT * FROM offer_categories ORDER BY id DESC`
    );
    return rows;
  },

  getOfferCategoryById: async (id) => {
    const [rows] = await pool.query(
      `SELECT * FROM offer_categories WHERE id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  updateOfferCategory: async (id, data) => {
    const [result] = await pool.query(
      `UPDATE offer_categories
       SET offer_category_name = ?, starting_date = ?, expiry_date = ?
       WHERE id = ?`,
      [data.offer_category_name, data.starting_date, data.expiry_date, id]
    );
    return result;
  },

  deleteOfferCategory: async (id) => {
    const [result] = await pool.query(
      `DELETE FROM offer_categories WHERE id = ?`,
      [id]
    );
    return result;
  },

  // =========================
  // HOME PAGE SECTION
  // =========================
  createHomePageSection: async (data) => {
    const [result] = await pool.query(
      `INSERT INTO home_page_sections (section_name, one_liner)
       VALUES (?, ?)`,
      [data.section_name, data.one_liner || null]
    );
    return result;
  },

  getAllHomePageSections: async () => {
    const [rows] = await pool.query(
      `SELECT * FROM home_page_sections ORDER BY id DESC`
    );
    return rows;
  },

  getHomePageSectionById: async (id) => {
    const [rows] = await pool.query(
      `SELECT * FROM home_page_sections WHERE id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  updateHomePageSection: async (id, data) => {
    const [result] = await pool.query(
      `UPDATE home_page_sections
       SET section_name = ?, one_liner = ?
       WHERE id = ?`,
      [data.section_name, data.one_liner || null, id]
    );
    return result;
  },

  deleteHomePageSection: async (id) => {
    const [result] = await pool.query(
      `DELETE FROM home_page_sections WHERE id = ?`,
      [id]
    );
    return result;
  },

  // =========================
  // BANNER
  // =========================
  createBanner: async (image_url) => {
    const [result] = await pool.query(
      `INSERT INTO banners (image_url) VALUES (?)`,
      [image_url]
    );
    return result;
  },

  getAllBanners: async () => {
    const [rows] = await pool.query(`SELECT * FROM banners ORDER BY id DESC`);
    return rows;
  },

  getBannerById: async (id) => {
    const [rows] = await pool.query(`SELECT * FROM banners WHERE id = ?`, [id]);
    return rows[0] || null;
  },

  updateBanner: async (id, image_url) => {
    const [result] = await pool.query(
      `UPDATE banners SET image_url = ? WHERE id = ?`,
      [image_url, id]
    );
    return result;
  },

  deleteBanner: async (id) => {
    const [result] = await pool.query(`DELETE FROM banners WHERE id = ?`, [id]);
    return result;
  },
};