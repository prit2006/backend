const validator = require("validator");

const validatesignupdata = (req) => {
  const { firstname, lastname, email, pass } = req.body;

  if (!firstname || !lastname) {
    throw new Error("Firstname and Lastname are required");
  }

  if (!email || !validator.isEmail(email)) {
    throw new Error("Valid email required");
  }

  if (!pass || !validator.isStrongPassword(pass)) {
    throw new Error("Strong password required");
  }

  return true;
};

module.exports = { validatesignupdata };
