const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 280,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    imageUrl: {
      type: String,
      default: null,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    comments: [
      {
        _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
        author: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        text: {
          type: String,
          required: true,
          trim: true,
          maxlength: 200,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        isFlagged: {
          type: Boolean,
          default: false,
        },
        moderationCategories: [
          {
            category: { type: String, required: true },
            detail: { type: String, required: true },
          },
        ],
      },
    ],
    isFlagged: {
      type: Boolean,
      default: false,
    },
    moderationCategories: [
      {
        category: { type: String, required: true },
        detail: { type: String, required: true },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Post', PostSchema);

