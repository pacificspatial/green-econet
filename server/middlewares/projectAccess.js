// authMiddleware.js
const { axiosAPI } = require("../utils/axiosAPI");
require("dotenv").config();
const { extractTokenFromHeader, decodeToken } = require("./auth");
const cognitoService = require("../services/awsUserService");

const filterProjectsByUser = async (req, res, next) => {
  // Assuming user information is stored in req.user
  const userId = req.query.userId;
  // Assuming admin status is also stored here
  const isAdmin = req.query.isAdmin;

  if (isAdmin) {
    // Admins get no filter, retrieving all projects
    req.queryFilter = "";
  } else {
    // Filter to retrieve only user's projects
    req.queryFilter = `WHERE user_id = '${userId}'`;
  }

  next();
};

const projectAuth = async (req, res, next) => {
  const token = extractTokenFromHeader(req);
  const decodedToken = decodeToken(token);
  const userId = decodedToken?.payload?.username;
  const userData = await cognitoService.getUser(req, res);

  // Get isAdmin from userData
  const isAdmin =
    userData.UserAttributes.find((attr) => attr.Name === "custom:isAdmin")
      ?.Value === "true";
  const projectId = req.params.cartodb_id || req.params.project_id;

  try {
    const cacheBuster = `&_=${new Date().getTime()}`;
    const query = `SELECT user_id FROM ${process.env.CARTO_TABLE_PREFIX}${process.env.CARTO_TABLE_VERSION_PREFIX}projects WHERE project_id = ${projectId}`;

    const response = await axiosAPI.get(`/query?q=${query}${cacheBuster}`);

    if (response.data.rows.length === 0) {
      return res.status(404).json({ message: "Project not found" });
    }

    const projectUserId = response.data.rows[0].user_id;

    if (userId === projectUserId || isAdmin) {
      // User is authorized
      next();
    } else {
      res.status(403).json({ message: "Unauthorized access to the project" });
    }
  } catch (error) {
    console.error("Authorization error:", error.message);
    res.status(500).json({ message: "Error checking project authorization" });
  }
};

module.exports = {
  filterProjectsByUser,
  projectAuth,
};
