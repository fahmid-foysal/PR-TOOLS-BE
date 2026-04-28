const https = require("https");
const { validationResult } = require("express-validator");
const {
  getProductById,
  createOrderWithItems,
  getOrderById,
  getOrderItemsByOrderId,
  getOrders,
  getOrderItemsByOrderIds,
  updateOrderStatus,
} = require("./order.service");

const parseItems = (items) => {
  if (Array.isArray(items)) return items;
  if (typeof items === "string") {
    return JSON.parse(items);
  }
  return [];
};

const sendSms = (number, message) => {
  return new Promise((resolve, reject) => {
    const url =
      "https://bulksmsbd.net/api/smsapi" +
      `?api_key=${encodeURIComponent("djTjRrejLhDsdKUounqJ")}` +
      `&type=${encodeURIComponent("text")}` +
      `&number=${encodeURIComponent(number)}` +
      `&senderid=${encodeURIComponent("8809617624926")}` +
      `&message=${encodeURIComponent(message)}`;

    https
      .get(url, (response) => {
        let data = "";

        response.on("data", (chunk) => {
          data += chunk;
        });

        response.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            resolve({
              raw_response: data,
            });
          }
        });
      })
      .on("error", (error) => {
        reject(error);
      });
  });
};

const buildOrderSmsMessage = (order, items) => {
  const itemLines = items
    .map(
      (item, index) =>
        `${index + 1}. ${item.product_name} x${item.quantity} = ${Number(
          item.rate
        ) * Number(item.quantity)}`
    )
    .join("\n");

  const totalAmount = items.reduce(
    (sum, item) => sum + Number(item.rate) * Number(item.quantity),
    0
  );

  return [
    `PR TOOLS Order Confirmed`,
    `Order ID: ${order.id}`,
    `Customer: ${order.customer_name}`,
    `Phone: ${order.phone}`,
    `Payment: ${order.payment_method}`,
    `Txn: ${order.transaction_no}`,
    `Items:`,
    itemLines,
    `Total: ${totalAmount}`,
    `Status: ${order.status}`,
    `Thanks for your order.`,
  ].join("\n");
};

module.exports = {
  createOrder: async (req, res) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: "error",
          message: errors.array(),
        });
      }

      let items = [];
      try {
        items = parseItems(req.body.items);
      } catch (error) {
        return res.status(400).json({
          status: "error",
          message: "items must be a valid array or JSON string",
        });
      }

      if (!Array.isArray(items) || !items.length) {
        return res.status(400).json({
          status: "error",
          message: "items cannot be empty",
        });
      }

      for (const item of items) {
        if (!item.product_id || !item.rate || !item.quantity) {
          return res.status(400).json({
            status: "error",
            message: "Each item must include product_id, rate and quantity",
          });
        }

        const product = await getProductById(item.product_id);
        if (!product) {
          return res.status(404).json({
            status: "error",
            message: `Product not found for product_id ${item.product_id}`,
          });
        }
      }

      const payload = {
        customer: {
          name: req.body.customer_name.trim(),
          phone: req.body.phone.trim(),
          address: req.body.address ? req.body.address.trim() : null,
          map_link: req.body.map_link ? req.body.map_link.trim() : null,
          latitude: req.body.latitude || null,
          longitude: req.body.longitude || null,
        },
        order: {
          payment_method: req.body.payment_method,
          account_number: req.body.account_number,
          transaction_no: req.body.transaction_no,
          paid_amount: req.body.paid_amount || 0,
          notes: req.body.notes || null,
          delivery_address: req.body.delivery_address || req.body.address || null,
          map_link: req.body.map_link || null,
          latitude: req.body.latitude || null,
          longitude: req.body.longitude || null,
          customer_notes: req.body.customer_notes || null,
          status: "pending",
          admin_notes: req.body.admin_notes || null,
        },
        items: items.map((item) => ({
          product_id: item.product_id,
          rate: item.rate,
          quantity: item.quantity,
          status: item.status || "pending",
          notes: item.notes || null,
        })),
      };

      const result = await createOrderWithItems(payload);
      const order = await getOrderById(result.order_id);
      const orderItems = await getOrderItemsByOrderId(result.order_id);

      let smsResponse = null;
      try {
        const smsMessage = buildOrderSmsMessage(order, orderItems);
        smsResponse = await sendSms(order.phone, smsMessage);
      } catch (smsError) {
        smsResponse = {
          status: "failed",
          message: smsError.message,
        };
      }

      return res.status(200).json({
        status: "success",
        message: "Order created successfully",
        data: {
          order,
          items: orderItems,
          sms_response: smsResponse,
        },
      });
    } catch (error) {
      console.error("createOrder error:", error);
      return res.status(500).json({
        status: "error",
        message: "Failed to create order",
      });
    }
  },

  getOrdersForAdmin: async (req, res) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: "error",
          message: errors.array(),
        });
      }

      const filters = {
        status: req.query.status || null,
        search_query: req.query.search_query || null,
        from_date: req.query.from_date || null,
        to_date: req.query.to_date || null,
      };

      const pagination = {
        page: req.query.page || 1,
        limit: req.query.limit || 10,
      };

      const result = await getOrders(filters, pagination);
      const orderIds = result.data.map((item) => item.id);
      const orderItems = await getOrderItemsByOrderIds(orderIds);

      const itemsMap = {};
      for (const item of orderItems) {
        if (!itemsMap[item.order_id]) {
          itemsMap[item.order_id] = [];
        }
        itemsMap[item.order_id].push(item);
      }

      const formatted = result.data.map((order) => ({
        ...order,
        items: itemsMap[order.id] || [],
      }));

      return res.status(200).json({
        status: "success",
        data: formatted,
        pagination: result.pagination,
      });
    } catch (error) {
      console.error("getOrdersForAdmin error:", error);
      return res.status(500).json({
        status: "error",
        message:
          "Failed to fetch orders. If you are using date filters, make sure orders.created_at exists.",
      });
    }
  },

  updateOrderStatusService: async (req, res) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: "error",
          message: errors.array(),
        });
      }

      const order = await getOrderById(req.params.id);
      if (!order) {
        return res.status(404).json({
          status: "error",
          message: "Order not found",
        });
      }

      await updateOrderStatus(
        req.params.id,
        req.body.status,
        req.body.admin_notes || null
      );

      return res.status(200).json({
        status: "success",
        message: "Order status updated successfully",
      });
    } catch (error) {
      console.error("updateOrderStatus error:", error);
      return res.status(500).json({
        status: "error",
        message: "Failed to update order status",
      });
    }
  },
};