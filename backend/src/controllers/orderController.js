const Order = require("../models/Order");
const Product = require("../models/Product");

// POST /api/orders
const createOrder = async (req, res) => {
  const { items, shippingAddress } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ message: "No items in order" });
  }

  // Fetch product prices from DB to prevent client-side price tampering
  let totalAmount = 0;
  const orderItems = [];

  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (!product) {
      return res.status(404).json({ message: `Product not found: ${item.productId}` });
    }
    orderItems.push({
      product: product._id,
      quantity: item.quantity || 1,
      price: product.price,
    });
    totalAmount += product.price * (item.quantity || 1);
  }

  const order = await Order.create({
    user: req.user._id,
    items: orderItems,
    totalAmount,
    shippingAddress,
  });

  res.status(201).json({ success: true, order });
};

// GET /api/orders — current user's orders
const getUserOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user._id })
    .populate("items.product", "name brand price imageUrl")
    .sort({ createdAt: -1 });

  res.json({ success: true, orders });
};

// GET /api/orders/:id
const getOrderById = async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("items.product", "name brand price imageUrl");

  if (!order) return res.status(404).json({ message: "Order not found" });

  // Users can only see their own orders
  if (order.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Not authorized" });
  }

  res.json({ success: true, order });
};

module.exports = { createOrder, getUserOrders, getOrderById };
