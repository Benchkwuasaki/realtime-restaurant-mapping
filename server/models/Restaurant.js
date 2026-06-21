const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, default: '' },
  rating: { type: Number, min: 1, max: 5, default: null },
  notes: { type: String, default: '' },
  visited: { type: Boolean, default: false },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }
  }
}, { timestamps: true });

restaurantSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Restaurant', restaurantSchema);