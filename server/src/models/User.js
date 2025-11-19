const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 32,
    },
    usernameLower: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      minlength: 3,
      maxlength: 32,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 160,
      default: '',
    },
    location: {
      type: String,
      trim: true,
      maxlength: 50,
      default: '',
    },
    website: {
      type: String,
      trim: true,
      maxlength: 100,
      default: '',
    },
    profilePicture: {
      type: String,
      default: null,
    },
    bannerImage: {
      type: String,
      default: null,
    },
    followers: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      default: [],
    },
    following: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      default: [],
    },
  },
  { timestamps: true }
);

UserSchema.pre('validate', function setLowercase(next) {
  if (this.username) {
    this.usernameLower = this.username.toLowerCase();
  }
  next();
});

UserSchema.index({ usernameLower: 1 }, { unique: true });

module.exports = mongoose.model('User', UserSchema);

