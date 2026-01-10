const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstname: { type: String, required: true },
  lastname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  age: { type: Number, min: 0 },
  gender: { 
    type: String, 
    enum: ['Male', 'Female', 'Other'],
    validate: {
      validator: function(value) {
        return ['Male', 'Female', 'Other'].includes(value);
      },
      message: 'Gender must be Male, Female, or Other.'
    }
  }
});


const User = mongoose.model('User', userSchema);

module.exports = User;