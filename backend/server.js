// server.js
const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// Database
const connectDB = require("./config/db");

// Routes
const userRoutes = require("./routes/LoginRoutes");
const taskRoutes = require("./routes/TaskRoutes");
const listRoutes = require("./routes/ListRoutes");



const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static assets
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Register API routes
app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/lists", listRoutes);

// Grammar check route MUST be above app.listen
app.post("/api/grammar-check", async (req, res) => {
  try {
    const { text, language = "fr" } = req.body;
    if (!text) return res.status(400).json({ success: false, message: "Text is required" });

    const response = await fetch("https://api.languagetool.org/v2/check", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ text, language })
    });

    const data = await response.json();
    res.json({ success: true, data });

  } catch (error) {
    res.status(500).json({ success: false, message: "Grammar check failed" });
  }
});

// Payment routes
// Create Payment Intent
app.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount, email, paymentMethodId, metadata } = req.body;

    // Create or retrieve customer
    let customer;
    const customers = await stripe.customers.list({
      email: email,
      limit: 1
    });

    if (customers.data.length > 0) {
      customer = customers.data[0];
    } else {
      customer = await stripe.customers.create({
        email: email,
        name: metadata.customer_name,
        metadata: metadata
      });
    }

    // Create Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'usd',
      customer: customer.id,
      payment_method: paymentMethodId,
      confirm: true,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never'
      },
      metadata: {
        customer_email: email,
        customer_name: metadata.customer_name
      }
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: error.message });
  }
});

// Send receipt email (optional)
app.post('/send-receipt', async (req, res) => {
  try {
    const { email, amount, paymentIntentId } = req.body;
    
    // Here you would integrate with your email service
    // For example, using SendGrid, Mailgun, etc.
    console.log(`Receipt sent to ${email} for payment ${paymentIntentId} ($${amount})`);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error sending receipt:', error);
    res.status(500).json({ error: error.message });
  }
});


// Base route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Error middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Server error" });
});

// Start server
const PORT = process.env.PORT || 5000;

connectDB();  // connect AFTER declaring routes is fine

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
