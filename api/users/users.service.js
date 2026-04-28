const pool = require("../../config/database");

module.exports = {
  getUserByMail: async (email) => {
    const [rows] = await pool.query(
      `SELECT * FROM users WHERE email = ?`,
      [email]
    );

    return rows[0] || null;
  },

  createUser: async (data) => {
    const [results] = await pool.query(
      `INSERT INTO users 
      (name, email, password, role) 
      VALUES (?, ?, ?, ?)`,
      [
        data.name,
        data.email,
        data.password,
        data.role || "admin",
      ]
    );

    return results;
  },

  changePassword: async (data) => {
    const [results] = await pool.query(
      `UPDATE users SET password = ? WHERE email = ?`,
      [data.password, data.email]
    );

    return results;
  },


};