const Stripe = require('stripe');

console.log('🔍 Debug Stripe Configuration');
console.log('================================');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('STRIPE_SECRET_KEY exists:', !!process.env.STRIPE_SECRET_KEY);
console.log('STRIPE_SECRET_KEY length:', process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.length : 0);
console.log('STRIPE_SECRET_KEY starts with:', process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.substring(0, 7) : 'UNDEFINED');

if (process.env.STRIPE_SECRET_KEY) {
  try {
    console.log('🧪 Testing Stripe initialization...');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    console.log('✅ Stripe initialized successfully');
    
    // Test a simple API call
    console.log('🧪 Testing Stripe API call...');
    stripe.customers.list({ limit: 1 }).then(() => {
      console.log('✅ Stripe API call successful');
    }).catch(error => {
      console.error('❌ Stripe API call failed:', error.message);
      console.error('Error type:', error.type);
      console.error('Error code:', error.code);
    });
    
  } catch (error) {
    console.error('❌ Failed to initialize Stripe:', error.message);
  }
} else {
  console.log('❌ STRIPE_SECRET_KEY not found');
}

console.log('================================');
