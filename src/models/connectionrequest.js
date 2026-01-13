const mongoose = require('mongoose');

const connectionRequestSchema = new mongoose.Schema({
    senderId:
    { type: mongoose.Schema.Types.ObjectId,
         ref: 'User',
         required: true },
    receiverId:
    { type: mongoose.Schema.Types.ObjectId,
         ref: 'User',
         required: true },
    status:
    { type: String,
        required: true,
        enum:
        {
            values: ['ignored', 'interested', 'accepted', 'rejected'],
            message: '{VALUE} is not supported'
        }
    }
    }, { 
    timestamps: true
 });

connectionRequestSchema.index({ senderId: 1, receiverId: 1 }, { unique: true });

connectionRequestSchema.pre('save', function () {
  if (this.senderId.equals(this.receiverId)) {
    throw new Error("Sender and Receiver cannot be the same user");
  }
});

module.exports = mongoose.model('ConnectionRequest', connectionRequestSchema);