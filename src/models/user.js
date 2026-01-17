const mongoose = require("mongoose");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
  firstname: { type: String, required: true },
  lastname: { type: String, required: true },

  email: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: (value) => validator.isEmail(value),
      message: "Invalid email format"
    }
  },

  pass: {
    type: String,
    required: true,
    validate: {
      validator: (value) => validator.isStrongPassword(value),
      message: "Password is not strong enough"
    }
  },

  age: { type: Number, min: 0 },

  gender: {
    type: String,
    enum: ["Male", "Female", "Other"]
  },

  skills: {
    type: [String],
    default: []
  },

  photoURL: {
    type: String
  }
});

userSchema.methods.getJwtToken = function () {
  const token = jwt.sign(
    { userId: this._id },
    "Prit@2006",
    { expiresIn: "7d" }
  );
  return token;
};

userSchema.methods.validatePassword = function (pass) {
  return bcrypt.compare(pass, this.pass);
};

userSchema.pre("findOneAndUpdate", function () {
  const update = this.getUpdate();

  // Handle $addToSet + $each
  if (update?.$addToSet?.skills?.$each) {
    update.$addToSet.skills.$each = [
      ...new Set(update.$addToSet.skills.$each)
    ];
  }

  // Handle direct skills replacement
  if (update.skills && Array.isArray(update.skills)) {
    update.skills = [...new Set(update.skills)];
  }

  this.setUpdate(update);
});


module.exports = mongoose.model("User", userSchema);

// const mongoose = require('mongoose');
// const validator = require('validator');

// const userSchema = new mongoose.Schema({
//   firstname: { type: String, required: true },
//   lastname: { type: String, required: true },
//   email: { type: String, required: true, unique: true,
//   validator(value) {
//     if (!validator.isEmail(value)) {
//       throw new Error('Invalid email format');
//     }
//   },
//   pass: { type: String, required: true,
//     validate: {
//     validator: function(value) {
//       if (!validator.isStrongPassword(value)) {
//         throw new Error('Password is not strong enough');
//       }
//     }
//    }
//   },
//   age: { type: Number, min: 0 },
//   gender: { 
//     type: String, 
//     enum: ['Male', 'Female', 'Other'],
//     validate: {
//       validator: function(value) {
//         return ['Male', 'Female', 'Other'].includes(value);
//       },
//       message: 'Gender must be Male, Female, or Other.'
//     }
//   }
//   }
// });


// const User = mongoose.model('User', userSchema);

// module.exports = User;
