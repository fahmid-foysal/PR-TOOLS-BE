const {
  getUserByMail, createUser, changePassword, getVerificationByEmail, createVerification, updateVerificationOtp, verifyOtpRecord, markOtpVerified, getVerifiedOtpRecord, deleteVerificationByEmail,
  changeProfile,
  createFcmToken,
} = require("./users.service");

const { genSaltSync, hashSync, compareSync } = require("bcrypt");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");

module.exports = {
  registerUser: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: "error",
          message: errors.array(),
        });
      }


      const body = req.body;

      const existingUser = await getUserByMail(body.email);

      if (existingUser) {
        return res.status(409).json({
          status: "error",
          message: "User already exists! please login",
        });
      }

      const salt = genSaltSync(10);
      body.password = hashSync(body.password, salt);
      body.role = body.role || "user";

      const results = await createUser(body);


      return res.status(200).json({
        status: "success",
        message: "User registered successfully",
        data: results,
      });
    } catch (error) {
      console.log("registerUser error:", error);
      return res.status(500).json({
        status: "error",
        message: error.message || "Registration failed",
      });
    }
  },

  loginUser: async (req, res) => {
    try {
      const body = req.body;

      if (!body.email || !body.password) {
        return res.status(400).json({
          status: "error",
          message: "Email and password required",
        });
      }

      const user = await getUserByMail(body.email);

      if (!user) {
        return res.status(404).json({
          status: "error",
          message: "User not found",
        });
      }

      const isPasswordCorrect = compareSync(body.password, user.password);

      if (!isPasswordCorrect) {
        return res.status(401).json({
          status: "error",
          message: "Invalid password",
        });
      }

      user.password = undefined;

      const token = jwt.sign({ user }, process.env.JWT_USER, {
        expiresIn: "30d",
      });

      return res.json({
        status: "success",
        message: "Login successful",
        token: token,
        user: user,
      });
    } catch (error) {
      console.log("loginUser error:", error);
      return res.status(500).json({
        status: "error",
        message: "Database error",
      });
    }
  },





getUserProfile: async (req, res) => {
  try {
    const userData = req.user.user;

    const user = await getUserByMail(userData.email);

    if (!user) {
      return res.status(404).json({
        success: 0,
        message: "User not found"
      });
    }

    user.password = undefined;

    return res.status(200).json({
      success: 1,
      data: user
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: 0,
      message: "Database error"
    });
  }
},




};