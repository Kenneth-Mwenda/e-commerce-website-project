const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/supermarket', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

// ====== MODELS ======
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
});
const User = mongoose.model('User', userSchema);

const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  category: String,
  image: String,
  stock: Number,
});
const Product = mongoose.model('Product', productSchema);

const orderSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  items: [
    {
      productId: mongoose.Schema.Types.ObjectId,
      quantity: Number,
    }
  ],
  total: Number,
  createdAt: { type: Date, default: Date.now },
});
const Order = mongoose.model('Order', orderSchema);

// ====== EMAIL FUNCTION ======
const sendEmail = async (to, subject, text) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,       // your Gmail address
      pass: process.env.EMAIL_PASS,       // your Gmail app password
    },
  });

  await transporter.sendMail({
    from: `"Supermarket" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
  });
};

// ====== ROUTES ======

// Register User
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const user = await User.create({ name, email, password });
    await sendEmail(email, 'Welcome to Supermarket', `Hi ${name}, thanks for registering!`);
    res.status(201).json({ message: 'User registered and email sent' });
  } catch (err) {
    res.status(400).json({ error: 'Registration failed', details: err.message });
  }
});

// Get All Products
app.get('/api/products', async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

// Place Order
app.post('/api/orders', async (req, res) => {
  const { userId, items, total, email } = req.body;
  try {
    const order = await Order.create({ userId, items, total });
    await sendEmail(email, 'Order Confirmation', `Your order of KES ${total} has been placed.`);
    res.status(201).json({ message: 'Order placed and email sent' });
  } catch (err) {
    res.status(400).json({ error: 'Order failed', details: err.message });
  }
});

// ====== START SERVER ======
app.listen(5000, () => console.log('Server running on port 5000'));
