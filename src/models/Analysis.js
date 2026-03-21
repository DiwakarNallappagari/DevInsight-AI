const mongoose = require('mongoose');

const analysisSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
    },
    language: {
      type: String,
      required: false,
      default: 'unknown',
    },
    prompt: {
      type: String,
      required: true,
    },
    aiProvider: {
      type: String,
      default: 'openai',
    },
    aiModel: {
      type: String,
      default: 'gpt-4.1-mini',
    },
    result: {
      type: Object,
      required: true,
    },
    score: {
      type: Number,
      default: 100,
    },
    complexity: {
      type: String,
      default: 'O(n)',
    },
    bugs: {
      type: [String],
      default: [],
    },
    improvements: {
      type: [String],
      default: [],
    },
    security: {
      type: [String],
      default: [],
    },
    suggestions: {
      type: [String],
      default: [],
    },
    usage: {
      inputTokens: {
        type: Number,
        default: 0,
      },
      outputTokens: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

const Analysis = mongoose.model('Analysis', analysisSchema);

module.exports = Analysis;


