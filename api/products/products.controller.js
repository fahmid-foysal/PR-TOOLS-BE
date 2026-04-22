const { validationResult } = require("express-validator");

const {
  createProduct,
  updateProduct,
  deleteProduct,
  getProductById,
  getProducts,

  createProductImages,
  getProductImagesByProductIds,
  getProductImagesByProductId,
  getProductImageById,
  deleteProductImage,

  createProductOffer,
  getProductOfferById,
  getProductOffersByProductId,
  deleteProductOffer,

  createHomePageProduct,
  getHomePageProductById,
  getHomePageProductsRaw,
  deleteHomePageProduct,

  getBrandById,
  getCategoryById,
  getOfferCategoryById,
  getHomePageSectionById,
} = require("./products.service");

// =========================
// HELPERS
// =========================
const buildFileUrl = (req, filePath) => {
  if (!filePath) return null;
  return `${req.protocol}://${req.get("host")}/${filePath.replace(/\\/g, "/")}`;
};

const formatImage = (req, image) => ({
  ...image,
  image_full_url: buildFileUrl(req, image.image_url),
});

const attachImagesToProducts = async (req, products = []) => {
  if (!products.length) return [];

  const productIds = products.map((item) => item.id);
  const images = await getProductImagesByProductIds(productIds);

  const imageMap = {};
  for (const image of images) {
    if (!imageMap[image.product_id]) {
      imageMap[image.product_id] = [];
    }
    imageMap[image.product_id].push(formatImage(req, image));
  }

  return products.map((product) => ({
    ...product,
    images: imageMap[product.id] || [],
  }));
};

// =========================
// PRODUCT CRUD
// =========================
module.exports = {
  addProduct: async (req, res) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: "error",
          message: errors.array(),
        });
      }

      if (!req.files || !req.files.length) {
        return res.status(400).json({
          status: "error",
          message: "At least one product image is required",
        });
      }

      if (req.body.brand_id) {
        const brand = await getBrandById(req.body.brand_id);
        if (!brand) {
          return res.status(404).json({
            status: "error",
            message: "Brand not found",
          });
        }
      }

      if (req.body.category_id) {
        const category = await getCategoryById(req.body.category_id);
        if (!category) {
          return res.status(404).json({
            status: "error",
            message: "Category not found",
          });
        }
      }

      if (req.body.offer_category_id) {
        const offerCategory = await getOfferCategoryById(req.body.offer_category_id);
        if (!offerCategory) {
          return res.status(404).json({
            status: "error",
            message: "Offer category not found",
          });
        }
      }

      const payload = {
        product_name: req.body.product_name.trim(),
        purchase_price: req.body.purchase_price,
        sell_price: req.body.sell_price,
        brand_id: req.body.brand_id || null,
        category_id: req.body.category_id || null,
        one_liner: req.body.one_liner ? req.body.one_liner.trim() : null,
        description: req.body.description ? req.body.description.trim() : null,
        offer_category_id: req.body.offer_category_id || null,
        offer_amount: req.body.offer_amount || null,
      };

      const imagePaths = req.files.map((file) => file.path.replace(/\\/g, "/"));

      const result = await createProduct(payload, imagePaths);

      return res.status(200).json({
        status: "success",
        message: "Product created successfully",
        data: {
          insertId: result.insertId,
        },
      });
    } catch (error) {
      console.error("addProduct error:", error);
      return res.status(500).json({
        status: "error",
        message: "Failed to create product",
      });
    }
  },

  getAllProducts: async (req, res) => {
    try {
      const filters = {
        category_id: req.query.category_id || null,
        brand_id: req.query.brand_id || null,
        offer_category_id: req.query.offer_category_id || null,
        search_query: req.query.search_query || null,
      };

      const pagination = {
        page: req.query.page || 1,
        limit: req.query.limit || 10,
      };

      const result = await getProducts(filters, pagination);
      const formattedProducts = await attachImagesToProducts(req, result.data);

      return res.status(200).json({
        status: "success",
        data: formattedProducts,
        pagination: result.pagination,
      });
    } catch (error) {
      console.error("getAllProducts error:", error);
      return res.status(500).json({
        status: "error",
        message: "Failed to fetch products",
      });
    }
  },

  getProductDetails: async (req, res) => {
    try {
      const { id } = req.params;

      const product = await getProductById(id);
      if (!product) {
        return res.status(404).json({
          status: "error",
          message: "Product not found",
        });
      }

      const images = await getProductImagesByProductId(id);
      const offers = await getProductOffersByProductId(id);

      return res.status(200).json({
        status: "success",
        data: {
          ...product,
          images: images.map((image) => formatImage(req, image)),
          product_offers: offers,
        },
      });
    } catch (error) {
      console.error("getProductDetails error:", error);
      return res.status(500).json({
        status: "error",
        message: "Failed to fetch product details",
      });
    }
  },

  editProduct: async (req, res) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: "error",
          message: errors.array(),
        });
      }

      const { id } = req.params;
      const product = await getProductById(id);

      if (!product) {
        return res.status(404).json({
          status: "error",
          message: "Product not found",
        });
      }

      if (req.body.brand_id) {
        const brand = await getBrandById(req.body.brand_id);
        if (!brand) {
          return res.status(404).json({
            status: "error",
            message: "Brand not found",
          });
        }
      }

      if (req.body.category_id) {
        const category = await getCategoryById(req.body.category_id);
        if (!category) {
          return res.status(404).json({
            status: "error",
            message: "Category not found",
          });
        }
      }

      const payload = {
        product_name: req.body.product_name.trim(),
        purchase_price: req.body.purchase_price,
        sell_price: req.body.sell_price,
        brand_id: req.body.brand_id || null,
        category_id: req.body.category_id || null,
        one_liner: req.body.one_liner ? req.body.one_liner.trim() : null,
        description: req.body.description ? req.body.description.trim() : null,
      };

      await updateProduct(id, payload);

      return res.status(200).json({
        status: "success",
        message: "Product updated successfully",
      });
    } catch (error) {
      console.error("editProduct error:", error);
      return res.status(500).json({
        status: "error",
        message: "Failed to update product",
      });
    }
  },

  removeProduct: async (req, res) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: "error",
          message: errors.array(),
        });
      }

      const { id } = req.params;
      const product = await getProductById(id);

      if (!product) {
        return res.status(404).json({
          status: "error",
          message: "Product not found",
        });
      }

      await deleteProduct(id);

      return res.status(200).json({
        status: "success",
        message: "Product deleted successfully",
      });
    } catch (error) {
      console.error("removeProduct error:", error);
      return res.status(500).json({
        status: "error",
        message: "Failed to delete product",
      });
    }
  },

  // =========================
  // PRODUCT IMAGES
  // =========================
  addProductImages: async (req, res) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: "error",
          message: errors.array(),
        });
      }

      if (!req.files || !req.files.length) {
        return res.status(400).json({
          status: "error",
          message: "At least one image is required",
        });
      }

      const product = await getProductById(req.body.product_id);
      if (!product) {
        return res.status(404).json({
          status: "error",
          message: "Product not found",
        });
      }

      const imagePaths = req.files.map((file) => file.path.replace(/\\/g, "/"));
      await createProductImages(req.body.product_id, imagePaths);

      return res.status(200).json({
        status: "success",
        message: "Product images added successfully",
      });
    } catch (error) {
      console.error("addProductImages error:", error);
      return res.status(500).json({
        status: "error",
        message: "Failed to add product images",
      });
    }
  },

  removeProductImage: async (req, res) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: "error",
          message: errors.array(),
        });
      }

      const image = await getProductImageById(req.params.id);
      if (!image) {
        return res.status(404).json({
          status: "error",
          message: "Product image not found",
        });
      }

      await deleteProductImage(req.params.id);

      return res.status(200).json({
        status: "success",
        message: "Product image deleted successfully",
      });
    } catch (error) {
      console.error("removeProductImage error:", error);
      return res.status(500).json({
        status: "error",
        message: "Failed to delete product image",
      });
    }
  },

  // =========================
  // PRODUCT OFFERS
  // =========================
  addProductOffer: async (req, res) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: "error",
          message: errors.array(),
        });
      }

      const product = await getProductById(req.body.product_id);
      if (!product) {
        return res.status(404).json({
          status: "error",
          message: "Product not found",
        });
      }

      const offerCategory = await getOfferCategoryById(req.body.offer_category_id);
      if (!offerCategory) {
        return res.status(404).json({
          status: "error",
          message: "Offer category not found",
        });
      }

      const result = await createProductOffer({
        product_id: req.body.product_id,
        offer_category_id: req.body.offer_category_id,
        offer_amount: req.body.offer_amount,
      });

      return res.status(200).json({
        status: "success",
        message: "Product offer created successfully",
        data: {
          insertId: result.insertId,
        },
      });
    } catch (error) {
      console.error("addProductOffer error:", error);
      return res.status(500).json({
        status: "error",
        message: "Failed to create product offer",
      });
    }
  },

  removeProductOffer: async (req, res) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: "error",
          message: errors.array(),
        });
      }

      const offer = await getProductOfferById(req.params.id);
      if (!offer) {
        return res.status(404).json({
          status: "error",
          message: "Product offer not found",
        });
      }

      await deleteProductOffer(req.params.id);

      return res.status(200).json({
        status: "success",
        message: "Product offer deleted successfully",
      });
    } catch (error) {
      console.error("removeProductOffer error:", error);
      return res.status(500).json({
        status: "error",
        message: "Failed to delete product offer",
      });
    }
  },

  // =========================
  // HOME PAGE PRODUCTS
  // =========================
  addHomePageProduct: async (req, res) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: "error",
          message: errors.array(),
        });
      }

      const product = await getProductById(req.body.product_id);
      if (!product) {
        return res.status(404).json({
          status: "error",
          message: "Product not found",
        });
      }

      const section = await getHomePageSectionById(req.body.home_page_section_id);
      if (!section) {
        return res.status(404).json({
          status: "error",
          message: "Home page section not found",
        });
      }

      const result = await createHomePageProduct({
        product_id: req.body.product_id,
        home_page_section_id: req.body.home_page_section_id,
        section_rank: req.body.section_rank || 0,
      });

      return res.status(200).json({
        status: "success",
        message: "Home page product created successfully",
        data: {
          insertId: result.insertId,
        },
      });
    } catch (error) {
      console.error("addHomePageProduct error:", error);
      return res.status(500).json({
        status: "error",
        message: "Failed to create home page product",
      });
    }
  },

  getHomePageProducts: async (req, res) => {
    try {
      const rows = await getHomePageProductsRaw();
      const productIds = [...new Set(rows.map((item) => item.product_id))];

      if (!productIds.length) {
        return res.status(200).json({
          status: "success",
          data: [],
        });
      }

      const allProductsResult = await getProducts({}, { page: 1, limit: 1000000 });
      const filteredProducts = allProductsResult.data.filter((item) =>
        productIds.includes(item.id)
      );
      const formattedProducts = await attachImagesToProducts(req, filteredProducts);

      const productMap = {};
      for (const product of formattedProducts) {
        productMap[product.id] = product;
      }

      const grouped = {};
      for (const row of rows) {
        if (!grouped[row.home_page_section_id]) {
          grouped[row.home_page_section_id] = {
            home_page_section_id: row.home_page_section_id,
            section_name: row.section_name,
            one_liner: row.one_liner,
            products: [],
          };
        }

        if (productMap[row.product_id]) {
          grouped[row.home_page_section_id].products.push(productMap[row.product_id]);
        }
      }

      return res.status(200).json({
        status: "success",
        data: Object.values(grouped),
      });
    } catch (error) {
      console.error("getHomePageProducts error:", error);
      return res.status(500).json({
        status: "error",
        message: "Failed to fetch home page products",
      });
    }
  },

  removeHomePageProduct: async (req, res) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: "error",
          message: errors.array(),
        });
      }

      const homePageProduct = await getHomePageProductById(req.params.id);
      if (!homePageProduct) {
        return res.status(404).json({
          status: "error",
          message: "Home page product not found",
        });
      }

      await deleteHomePageProduct(req.params.id);

      return res.status(200).json({
        status: "success",
        message: "Home page product deleted successfully",
      });
    } catch (error) {
      console.error("removeHomePageProduct error:", error);
      return res.status(500).json({
        status: "error",
        message: "Failed to delete home page product",
      });
    }
  },
};