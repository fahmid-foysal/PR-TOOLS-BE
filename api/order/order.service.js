const pool = require("../../config/database");

module.exports = {
  getCustomerByPhone: async (phone) => {
    const [rows] = await pool.query(
      `SELECT * FROM customers WHERE phone = ? LIMIT 1`,
      [phone]
    );
    return rows[0] || null;
  },

  createCustomer: async (data) => {
    const [result] = await pool.query(
      `
        INSERT INTO customers
        (
          name,
          phone,
          address,
          map_link,
          latitude,
          longitude
        )
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        data.name,
        data.phone,
        data.address || null,
        data.map_link || null,
        data.latitude || null,
        data.longitude || null,
      ]
    );
    return result;
  },

  updateCustomer: async (id, data) => {
    const [result] = await pool.query(
      `
        UPDATE customers
        SET
          name = ?,
          phone = ?,
          address = ?,
          map_link = ?,
          latitude = ?,
          longitude = ?
        WHERE id = ?
      `,
      [
        data.name,
        data.phone,
        data.address || null,
        data.map_link || null,
        data.latitude || null,
        data.longitude || null,
        id,
      ]
    );
    return result;
  },

  getProductById: async (id) => {
    const [rows] = await pool.query(
      `
        SELECT
          p.id,
          p.product_name,
          p.sell_price,
          p.brand_id,
          p.category_id
        FROM products p
        WHERE p.id = ?
      `,
      [id]
    );
    return rows[0] || null;
  },

  createOrderWithItems: async (data) => {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      let customerId = null;

      const [existingCustomers] = await connection.query(
        `SELECT * FROM customers WHERE phone = ? LIMIT 1`,
        [data.customer.phone]
      );

      if (existingCustomers.length) {
        customerId = existingCustomers[0].id;

        await connection.query(
          `
            UPDATE customers
            SET
              name = ?,
              phone = ?,
              address = ?,
              map_link = ?,
              latitude = ?,
              longitude = ?
            WHERE id = ?
          `,
          [
            data.customer.name,
            data.customer.phone,
            data.customer.address || null,
            data.customer.map_link || null,
            data.customer.latitude || null,
            data.customer.longitude || null,
            customerId,
          ]
        );
      } else {
        const [customerResult] = await connection.query(
          `
            INSERT INTO customers
            (
              name,
              phone,
              address,
              map_link,
              latitude,
              longitude
            )
            VALUES (?, ?, ?, ?, ?, ?)
          `,
          [
            data.customer.name,
            data.customer.phone,
            data.customer.address || null,
            data.customer.map_link || null,
            data.customer.latitude || null,
            data.customer.longitude || null,
          ]
        );

        customerId = customerResult.insertId;
      }

      const [orderResult] = await connection.query(
        `
          INSERT INTO orders
          (
            customer_id,
            payment_method,
            account_number,
            transaction_no,
            paid_amount,
            notes,
            delivery_address,
            map_link,
            latitude,
            longitude,
            customer_notes,
            status,
            admin_notes
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          customerId,
          data.order.payment_method,
          data.order.account_number,
          data.order.transaction_no,
          data.order.paid_amount || 0,
          data.order.notes || null,
          data.order.delivery_address || null,
          data.order.map_link || null,
          data.order.latitude || null,
          data.order.longitude || null,
          data.order.customer_notes || null,
          data.order.status || "pending",
          data.order.admin_notes || null,
        ]
      );

      const orderId = orderResult.insertId;

      const itemValues = data.items.map((item) => [
        item.product_id,
        orderId,
        item.quantity,
        item.rate,
        item.status || "pending",
        item.notes || null,
      ]);

      await connection.query(
        `
          INSERT INTO order_products
          (
            product_id,
            order_id,
            quantity,
            rate,
            status,
            notes
          )
          VALUES ?
        `,
        [itemValues]
      );

      await connection.commit();

      return {
        order_id: orderId,
        customer_id: customerId,
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  getOrderById: async (id) => {
    const [rows] = await pool.query(
      `
        SELECT
          o.*,
          c.name AS customer_name,
          c.phone,
          c.address AS customer_address,
          c.map_link AS customer_map_link,
          c.latitude AS customer_latitude,
          c.longitude AS customer_longitude
        FROM orders o
        INNER JOIN customers c ON c.id = o.customer_id
        WHERE o.id = ?
      `,
      [id]
    );

    return rows[0] || null;
  },

  getOrderItemsByOrderId: async (order_id) => {
    const [rows] = await pool.query(
      `
        SELECT
          op.*,
          p.product_name,
          p.sell_price
        FROM order_products op
        INNER JOIN products p ON p.id = op.product_id
        WHERE op.order_id = ?
        ORDER BY op.id ASC
      `,
      [order_id]
    );

    return rows;
  },

  getOrders: async (filters = {}, pagination = {}) => {
    const page = Number(pagination.page) > 0 ? Number(pagination.page) : 1;
    const limit = Number(pagination.limit) > 0 ? Number(pagination.limit) : 10;
    const offset = (page - 1) * limit;

    const conditions = [];
    const values = [];

    if (filters.status) {
      conditions.push("o.status = ?");
      values.push(filters.status);
    }

    if (filters.search_query) {
      conditions.push(`
        (
          c.name LIKE ?
          OR c.phone LIKE ?
          OR CAST(o.id AS CHAR) LIKE ?
          OR EXISTS (
            SELECT 1
            FROM order_products op2
            INNER JOIN products p2 ON p2.id = op2.product_id
            WHERE op2.order_id = o.id
              AND (
                p2.product_name LIKE ?
                OR CAST(p2.id AS CHAR) LIKE ?
              )
          )
        )
      `);

      const search = `%${filters.search_query}%`;
      values.push(search, search, search, search, search);
    }

    if (filters.from_date) {
      conditions.push("DATE(o.created_at) >= ?");
      values.push(filters.from_date);
    }

    if (filters.to_date) {
      conditions.push("DATE(o.created_at) <= ?");
      values.push(filters.to_date);
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    const [rows] = await pool.query(
      `
        SELECT
          o.id,
          o.customer_id,
          o.payment_method,
          o.account_number,
          o.transaction_no,
          o.paid_amount,
          o.notes,
          o.delivery_address,
          o.map_link,
          o.latitude,
          o.longitude,
          o.customer_notes,
          o.status,
          o.admin_notes,
          o.created_at,
          c.name AS customer_name,
          c.phone
        FROM orders o
        INNER JOIN customers c ON c.id = o.customer_id
        ${whereClause}
        ORDER BY o.id DESC
        LIMIT ? OFFSET ?
      `,
      [...values, limit, offset]
    );

    const [countRows] = await pool.query(
      `
        SELECT COUNT(*) AS total
        FROM orders o
        INNER JOIN customers c ON c.id = o.customer_id
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

  getOrderItemsByOrderIds: async (orderIds = []) => {
    if (!orderIds.length) return [];

    const [rows] = await pool.query(
      `
        SELECT
          op.*,
          p.product_name
        FROM order_products op
        INNER JOIN products p ON p.id = op.product_id
        WHERE op.order_id IN (?)
        ORDER BY op.id ASC
      `,
      [orderIds]
    );

    return rows;
  },

  updateOrderStatus: async (id, status, admin_notes = null) => {
    const [result] = await pool.query(
      `
        UPDATE orders
        SET
          status = ?,
          admin_notes = ?
        WHERE id = ?
      `,
      [status, admin_notes, id]
    );

    return result;
  },
};