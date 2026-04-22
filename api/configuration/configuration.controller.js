const { validationResult } = require("express-validator");

const {
  // brand
  createBrand,
  getAllBrands,
  getBrandById,
  getBrandByName,
  updateBrand,
  deleteBrand,

  // category
  createCategory,
  getAllCategories,
  getCategoryById,
  getCategoryByName,
  updateCategory,
  deleteCategory,

  // offer category
  createOfferCategory,
  getAllOfferCategories,
  getOfferCategoryById,
  updateOfferCategory,
  deleteOfferCategory,

  // home page section
  createHomePageSection,
  getAllHomePageSections,
  getHomePageSectionById,
  updateHomePageSection,
  deleteHomePageSection,

  // banner
  createBanner,
  getAllBanners,
  getBannerById,
  updateBanner,
  deleteBanner,
} = require("./configuration.service");

const buildFileUrl = (req, filePath) => {
  if (!filePath) return null;
  return `${req.protocol}://${req.get("host")}/${filePath.replace(/\\/g, "/")}`;
};

module.exports = {
  // =========================
  // BRAND
  // =========================
  addBrand: async (req, res) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: "error",
          message: errors.array(),
        });
      }

      const brand_name = req.body.brand_name.trim();

      const existing = await getBrandByName(brand_name);
      if (existing) {
        return res.status(409).json({
          status: "error",
          message: "Brand already exists",
        });
      }

      const result = await createBrand(brand_name);

      return res.status(200).json({
        status: "success",
        message: "Brand created successfully",
        data: {
          insertId: result.insertId,
        },
      });
    } catch (error) {
      console.error("addBrand error:", error);
      return res.status(500).json({
        status: "error",
        message: "Failed to create brand",
      });
    }
  },

  getBrands: async (req, res) => {
    try {
      const data = await getAllBrands();

      return res.status(200).json({
        status: "success",
        data,
      });
    } catch (error) {
      console.error("getBrands error:", error);
      return res.status(500).json({
        status: "error",
        message: "Failed to fetch brands",
      });
    }
  },

  editBrand: async (req, res) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: "error",
          message: errors.array(),
        });
      }

      const { id } = req.params;
      const brand_name = req.body.brand_name.trim();

      const existingBrand = await getBrandById(id);
      if (!existingBrand) {
        return res.status(404).json({
          status: "error",
          message: "Brand not found",
        });
      }

      const duplicate = await getBrandByName(brand_name);
      if (duplicate && duplicate.id !== Number(id)) {
        return res.status(409).json({
          status: "error",
          message: "Another brand with this name already exists",
        });
      }

      await updateBrand(id, brand_name);

      return res.status(200).json({
        status: "success",
        message: "Brand updated successfully",
      });
    } catch (error) {
      console.error("editBrand error:", error);
      return res.status(500).json({
        status: "error",
        message: "Failed to update brand",
      });
    }
  },

  removeBrand: async (req, res) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: "error",
          message: errors.array(),
        });
      }

      const { id } = req.params;

      const existingBrand = await getBrandById(id);
      if (!existingBrand) {
        return res.status(404).json({
          status: "error",
          message: "Brand not found",
        });
      }

      await deleteBrand(id);

      return res.status(200).json({
        status: "success",
        message: "Brand deleted successfully",
      });
    } catch (error) {
      console.error("removeBrand error:", error);
      return res.status(500).json({
        status: "error",
        message: "Failed to delete brand. It may be used in products.",
      });
    }
  },

  // =========================
  // CATEGORY
  // =========================
  addCategory: async (req, res) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: "error",
          message: errors.array(),
        });
      }

      const category_name = req.body.category_name.trim();

      const existing = await getCategoryByName(category_name);
      if (existing) {
        return res.status(409).json({
          status: "error",
          message: "Category already exists",
        });
      }

      const result = await createCategory(category_name);

      return res.status(200).json({
        status: "success",
        message: "Category created successfully",
        data: {
          insertId: result.insertId,
        },
      });
    } catch (error) {
      console.error("addCategory error:", error);
      return res.status(500).json({
        status: "error",
        message: "Failed to create category",
      });
    }
  },

  getCategories: async (req, res) => {
    try {
      const data = await getAllCategories();

      return res.status(200).json({
        status: "success",
        data,
      });
    } catch (error) {
      console.error("getCategories error:", error);
      return res.status(500).json({
        status: "error",
        message: "Failed to fetch categories",
      });
    }
  },

  editCategory: async (req, res) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: "error",
          message: errors.array(),
        });
      }

      const { id } = req.params;
      const category_name = req.body.category_name.trim();

      const existingCategory = await getCategoryById(id);
      if (!existingCategory) {
        return res.status(404).json({
          status: "error",
          message: "Category not found",
        });
      }

      const duplicate = await getCategoryByName(category_name);
      if (duplicate && duplicate.id !== Number(id)) {
        return res.status(409).json({
          status: "error",
          message: "Another category with this name already exists",
        });
      }

      await updateCategory(id, category_name);

      return res.status(200).json({
        status: "success",
        message: "Category updated successfully",
      });
    } catch (error) {
      console.error("editCategory error:", error);
      return res.status(500).json({
        status: "error",
        message: "Failed to update category",
      });
    }
  },

  removeCategory: async (req, res) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: "error",
          message: errors.array(),
        });
      }

      const { id } = req.params;

      const existingCategory = await getCategoryById(id);
      if (!existingCategory) {
        return res.status(404).json({
          status: "error",
          message: "Category not found",
        });
      }

      await deleteCategory(id);

      return res.status(200).json({
        status: "success",
        message: "Category deleted successfully",
      });
    } catch (error) {
      console.error("removeCategory error:", error);
      return res.status(500).json({
        status: "error",
        message: "Failed to delete category. It may be used in products.",
      });
    }
  },

  // =========================
  // OFFER CATEGORY
  // =========================
  addOfferCategory: async (req, res) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: "error",
          message: errors.array(),
        });
      }

      const payload = {
        offer_category_name: req.body.offer_category_name.trim(),
        starting_date: req.body.starting_date,
        expiry_date: req.body.expiry_date,
      };

      const result = await createOfferCategory(payload);

      return res.status(200).json({
        status: "success",
        message: "Offer category created successfully",
        data: {
          insertId: result.insertId,
        },
      });
    } catch (error) {
      console.error("addOfferCategory error:", error);
      return res.status(500).json({
        status: "error",
        message: "Failed to create offer category",
      });
    }
  },

  getOfferCategories: async (req, res) => {
    try {
      const data = await getAllOfferCategories();

      return res.status(200).json({
        status: "success",
        data,
      });
    } catch (error) {
      console.error("getOfferCategories error:", error);
      return res.status(500).json({
        status: "error",
        message: "Failed to fetch offer categories",
      });
    }
  },

  editOfferCategory: async (req, res) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: "error",
          message: errors.array(),
        });
      }

      const { id } = req.params;

      const existing = await getOfferCategoryById(id);
      if (!existing) {
        return res.status(404).json({
          status: "error",
          message: "Offer category not found",
        });
      }

      const payload = {
        offer_category_name: req.body.offer_category_name.trim(),
        starting_date: req.body.starting_date,
        expiry_date: req.body.expiry_date,
      };

      await updateOfferCategory(id, payload);

      return res.status(200).json({
        status: "success",
        message: "Offer category updated successfully",
      });
    } catch (error) {
      console.error("editOfferCategory error:", error);
      return res.status(500).json({
        status: "error",
        message: "Failed to update offer category",
      });
    }
  },

  removeOfferCategory: async (req, res) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: "error",
          message: errors.array(),
        });
      }

      const { id } = req.params;

      const existing = await getOfferCategoryById(id);
      if (!existing) {
        return res.status(404).json({
          status: "error",
          message: "Offer category not found",
        });
      }

      await deleteOfferCategory(id);

      return res.status(200).json({
        status: "success",
        message: "Offer category deleted successfully",
      });
    } catch (error) {
      console.error("removeOfferCategory error:", error);
      return res.status(500).json({
        status: "error",
        message:
          "Failed to delete offer category. It may be used in product_offers.",
      });
    }
  },

  // =========================
  // HOME PAGE SECTION
  // =========================
  addHomePageSection: async (req, res) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: "error",
          message: errors.array(),
        });
      }

      const payload = {
        section_name: req.body.section_name.trim(),
        one_liner: req.body.one_liner ? req.body.one_liner.trim() : null,
      };

      const result = await createHomePageSection(payload);

      return res.status(200).json({
        status: "success",
        message: "Home page section created successfully",
        data: {
          insertId: result.insertId,
        },
      });
    } catch (error) {
      console.error("addHomePageSection error:", error);
      return res.status(500).json({
        status: "error",
        message: "Failed to create home page section",
      });
    }
  },

  getHomePageSections: async (req, res) => {
    try {
      const data = await getAllHomePageSections();

      return res.status(200).json({
        status: "success",
        data,
      });
    } catch (error) {
      console.error("getHomePageSections error:", error);
      return res.status(500).json({
        status: "error",
        message: "Failed to fetch home page sections",
      });
    }
  },

  editHomePageSection: async (req, res) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: "error",
          message: errors.array(),
        });
      }

      const { id } = req.params;

      const existing = await getHomePageSectionById(id);
      if (!existing) {
        return res.status(404).json({
          status: "error",
          message: "Home page section not found",
        });
      }

      const payload = {
        section_name: req.body.section_name.trim(),
        one_liner: req.body.one_liner ? req.body.one_liner.trim() : null,
      };

      await updateHomePageSection(id, payload);

      return res.status(200).json({
        status: "success",
        message: "Home page section updated successfully",
      });
    } catch (error) {
      console.error("editHomePageSection error:", error);
      return res.status(500).json({
        status: "error",
        message: "Failed to update home page section",
      });
    }
  },

  removeHomePageSection: async (req, res) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: "error",
          message: errors.array(),
        });
      }

      const { id } = req.params;

      const existing = await getHomePageSectionById(id);
      if (!existing) {
        return res.status(404).json({
          status: "error",
          message: "Home page section not found",
        });
      }

      await deleteHomePageSection(id);

      return res.status(200).json({
        status: "success",
        message: "Home page section deleted successfully",
      });
    } catch (error) {
      console.error("removeHomePageSection error:", error);
      return res.status(500).json({
        status: "error",
        message:
          "Failed to delete home page section. It may be used in home_page_products.",
      });
    }
  },

  // =========================
  // BANNER
  // =========================
  addBanner: async (req, res) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: "error",
          message: errors.array(),
        });
      }

      if (!req.file) {
        return res.status(400).json({
          status: "error",
          message: "image is required",
        });
      }

      const image_url = req.file.path.replace(/\\/g, "/");
      const result = await createBanner(image_url);

      return res.status(200).json({
        status: "success",
        message: "Banner created successfully",
        data: {
          insertId: result.insertId,
          image_url,
          image_full_url: buildFileUrl(req, image_url),
        },
      });
    } catch (error) {
      console.error("addBanner error:", error);
      return res.status(500).json({
        status: "error",
        message: "Failed to create banner",
      });
    }
  },

  getBanners: async (req, res) => {
    try {
      const data = await getAllBanners();

      const formatted = data.map((item) => ({
        ...item,
        image_full_url: buildFileUrl(req, item.image_url),
      }));

      return res.status(200).json({
        status: "success",
        data: formatted,
      });
    } catch (error) {
      console.error("getBanners error:", error);
      return res.status(500).json({
        status: "error",
        message: "Failed to fetch banners",
      });
    }
  },

  editBanner: async (req, res) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: "error",
          message: errors.array(),
        });
      }

      const { id } = req.params;

      const existing = await getBannerById(id);
      if (!existing) {
        return res.status(404).json({
          status: "error",
          message: "Banner not found",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          status: "error",
          message: "image is required",
        });
      }

      const image_url = req.file.path.replace(/\\/g, "/");
      await updateBanner(id, image_url);

      return res.status(200).json({
        status: "success",
        message: "Banner updated successfully",
        data: {
          image_url,
          image_full_url: buildFileUrl(req, image_url),
        },
      });
    } catch (error) {
      console.error("editBanner error:", error);
      return res.status(500).json({
        status: "error",
        message: "Failed to update banner",
      });
    }
  },

  removeBanner: async (req, res) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: "error",
          message: errors.array(),
        });
      }

      const { id } = req.params;

      const existing = await getBannerById(id);
      if (!existing) {
        return res.status(404).json({
          status: "error",
          message: "Banner not found",
        });
      }

      await deleteBanner(id);

      return res.status(200).json({
        status: "success",
        message: "Banner deleted successfully",
      });
    } catch (error) {
      console.error("removeBanner error:", error);
      return res.status(500).json({
        status: "error",
        message: "Failed to delete banner",
      });
    }
  },
};