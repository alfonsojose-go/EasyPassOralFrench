import React, { useState } from 'react';
import {
  Elements,
  useStripe,
  useElements,
  CardNumberElement, 
  CardExpiryElement, 
  CardCvcElement
} from '@stripe/react-stripe-js';
import { loadStripe,  } from '@stripe/stripe-js';

// Replace with your publishable key from Stripe Dashboard
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const Payment = () => {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm />
    </Elements>
  );
};

const PaymentForm = () => {
  const [amount, setAmount] = useState('10.00');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');

  const stripe = useStripe();
  const elements = useElements();

  const cardNumberElementOptions = {
    style: {
      base: {
        fontSize: "18px",
        color: "#111827",
        fontFamily: "monospace, monospace",
        fontWeight: "600",
        "::placeholder": {
          color: "#9CA3AF",
          fontWeight: "400",
        },
      },
      invalid: {
        color: "#EF4444",
      },
    },
  };

  const cardExpiryElementOptions = {
    style: {
      base: {
        fontSize: "18px",
        color: "#111827",
        fontFamily: "monospace, monospace",
        fontWeight: "600",
        "::placeholder": {
          color: "#9CA3AF",
          fontWeight: "400",
        },
      },
      invalid: {
        color: "#EF4444",
      },
    },
  };

  const cardCvcElementOptions = {
    style: {
      base: {
        fontSize: "18px",
        color: "#111827",
        fontFamily: "monospace, monospace",
        fontWeight: "600",
        "::placeholder": {
          color: "#9CA3AF",
          fontWeight: "400",
        },
      },
      invalid: {
        color: "#EF4444",
      },
    },
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!stripe || !elements) {
    return;
  }

  setLoading(true);
  setStatus(null);
  setMessage('');

  try {
    // Get the card element
    const cardNumberElement = elements.getElement(CardNumberElement);
    
    if (!cardNumberElement) {
      throw new Error('Card details not properly loaded');
    }

    // Step 1: Get client secret from backend
    const response = await fetch('http://localhost:5000/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(parseFloat(amount) * 100), // Convert to cents
        metadata: {
          customer_name: name,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to create payment intent');
    }

    // Step 2: Confirm the payment on the frontend
    const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
      data.clientSecret,
      {
        payment_method: {
          card: cardNumberElement,
          billing_details: {
            name: name,
          },
        },
        return_url: window.location.origin, // Optional
      }
    );

    if (confirmError) {
      throw new Error(confirmError.message);
    }

    // Handle payment intent status
    switch (paymentIntent.status) {
      case 'succeeded':
        setStatus('success');
        setMessage('Payment successful! Your transaction has been processed.');
        
        // Optional: Send receipt email
        await fetch('http://localhost:5000/send-receipt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: amount,
            paymentIntentId: paymentIntent.id,
          }),
        });
        break;
        
      case 'processing':
        setStatus('info');
        setMessage('Your payment is processing. We\'ll update you when complete.');
        break;
        
      case 'requires_payment_method':
        setStatus('error');
        setMessage('Payment failed. Please try another payment method.');
        break;
        
      default:
        setStatus('error');
        setMessage('Something went wrong. Please try again.');
    }
    
  } catch (error) {
    setStatus('error');
    setMessage(error.message || 'Payment failed. Please try again.');
    console.error('Payment error:', error);
  } finally {
    setLoading(false);
  }
};

  // SVG Icons
  const CreditCardIcon = () => (
    <svg 
      width="32" 
      height="32" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
      <line x1="1" y1="10" x2="23" y2="10"></line>
    </svg>
  );

  const CheckCircleIcon = () => (
    <svg 
      width="20" 
      height="20" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
  );

  const AlertCircleIcon = () => (
    <svg 
      width="20" 
      height="20" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
  );

  const LoaderIcon = () => (
    <svg 
      width="20" 
      height="20" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className="animate-spin"
    >
      <line x1="12" y1="2" x2="12" y2="6"></line>
      <line x1="12" y1="18" x2="12" y2="22"></line>
      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
      <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
      <line x1="2" y1="12" x2="6" y2="12"></line>
      <line x1="18" y1="12" x2="22" y2="12"></line>
      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
      <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
    </svg>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
          {/* Header */}
          <div className="px-8 pt-8 pb-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Payment Details
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-6 bg-gray-300 rounded-sm"></div>
                <div className="w-10 h-6 bg-gray-200 rounded-sm"></div>
                <div className="w-10 h-6 bg-gray-100 rounded-sm"></div>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <form onSubmit={handleSubmit} className="px-8 pb-8">
              {/* Card Details Section */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-900">
                    Card Information 
                  </label>
                </div>

                {/* Card Details - Using separate Stripe elements */}
                <div className="mb-4">
                  <div className="relative">
                    <span className="absolute left-3 top-3.5 text-gray-400">
                      <CreditCardIcon />
                    </span>
                    <div className="space-y-4">
                      <div className="pl-10 pr-4 py-3 border border-black rounded-lg focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600">
                        <span className='absolute left-0 top-3.5 text-gray-400'>Card Number <CardNumberElement options={cardNumberElementOptions} /></span>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="min-w-0 pl-10 pr-4 py-3 border border-black rounded-lg focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600">
                          <span className='absolute left-0 top-3.5 text-gray-400'>Expiry <CardExpiryElement
                            options={cardExpiryElementOptions}
                          /></span>
                        </div>

                        <div className="min-w-0 pl-10 pr-4 py-3 border border-black rounded-lg focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600">
                          <span className='absolute left-0 top-3.5 text-gray-400'>CVC <CardCvcElement options={cardCvcElementOptions} /></span>
                        </div>
                      </div>

                      {/* Name */}
                      <div className="mb-4">
                        <label className="block text-xs font-medium text-gray-700 mb-2">
                          Name on Card
                        </label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="John M. Smith"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>{" "}
              {/* Closing div for Card Details Section */}
              {/* Amount Section */}
              <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Payment Amount (USD)
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="10.00"
                    step="0.01"
                    min="0.50"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none"
                    required
                  />
                </div>

                <div className="text-xs text-gray-500 mt-2">
                  <p>USD • Secure transaction</p>
                </div>
              </div>
            {/* Closing div for Billing Information Section */}
            {/* Status Messages */}
            {status && (
              <div
                className={`mb-6 p-4 rounded-lg border ${
                  status === "success"
                    ? "bg-green-50 border-green-200 text-green-800"
                    : "bg-red-50 border-red-200 text-red-800"
                }`}
              >
                <div className="flex items-center gap-3">
                  {status === "success" ? (
                    <CheckCircleIcon />
                  ) : (
                    <AlertCircleIcon />
                  )}
                  <p className="text-sm">{message}</p>
                </div>
              </div>
            )}
            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !stripe}
              className="w-full bg-gray-900 text-white py-3.5 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
            >
              {loading ? (
                <>
                  <LoaderIcon />
                  Processing Payment...
                </>
              ) : (
                <>Complete Payment • ${amount}</>
              )}
            </button>
            {/* Security Footer */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-center gap-2 text-gray-600 text-xs">
                <span>🔒</span>
                <span>Secured by</span>
                <span className="font-semibold">Stripe</span>
                <span className="mx-1">•</span>
                <span>PCI DSS compliant</span>
              </div>
              <p className="text-center text-xs text-gray-500 mt-3">
                Your payment information is encrypted and never stored on our
                servers.
              </p>
            </div>
            {/* Test Card Notice */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
              <p className="text-xs text-blue-800">
                <span className="font-medium">Test Mode:</span> 4242 4242 4242
                4242 • 12/34 • 123
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Payment;
