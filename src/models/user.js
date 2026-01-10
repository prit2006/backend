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


const mongoose = require("mongoose");
const validator = require("validator");

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
  }
});

module.exports = mongoose.model("User", userSchema);
