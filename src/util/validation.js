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

const validateeditprofiledata = (req) => {
const allowedits = ['firstname', 'lastname', 'email', 'age', 'gender']
Object.keys(req.body).forEach((key) => {
    if (!allowedits.includes(key)) {
        throw new Error(`Invalid field: ${key}`);
    }
}
);
return true;
};

const validatepasswordchange = (req) => {
  const { oldpass, newpass } = req.body;
  if (!oldpass || !newpass) {
    throw new Error("Old password and New password are required");
  }
  if (!validator.isStrongPassword(newpass)) {
    throw new Error("New password must be strong");
  } 
  return true;
};

module.exports = { validatesignupdata , validateeditprofiledata, validatepasswordchange };