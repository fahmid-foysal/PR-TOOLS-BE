// middleware/auth.js
const jwt = require("jsonwebtoken");

module.exports = {
  checkToken: (userRole) => {
    return (req, res, next) => {
      let token = req.get("authorization");
      if (!token) {
        return res.status(403).json({
          success: 0,
          message: "Access Denied! Unauthorized user"
        });
      }

      token = token.slice(7); 

      jwt.verify(token, process.env.JWT_USER, (err, decoded) => {
        if (err) {
          return res.status(401).json({ success: 0, message: "Invalid Token" });
        }

        req.user = decoded; 

        if (userRole && req.user.user.role !== userRole) {
          return res.status(401).json({ success: 0, message: "Permission denied" });
        }

        next();
      });
    };
  }
};
