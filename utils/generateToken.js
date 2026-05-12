// utils/generateToken.js

import jwt from "jsonwebtoken";

const generateToken = (id, expiresIn = "30d") => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET,
    { expiresIn }
  );
};

export default generateToken;