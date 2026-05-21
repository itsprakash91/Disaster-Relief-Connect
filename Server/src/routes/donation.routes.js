// import { Router } from "express";
// import {
//   createDonation,
//   verifyPayment,
//   getMyDonations,
//   getAllDonations
// } from "../controllers/donation.controller.js";
// import { verifyJWT } from "../middlewares/auth.middleware.js";
// import { roleMiddleware } from "../middlewares/roles.middleware.js";

// const router = Router();

// // Routes that need authentication
// router.use(verifyJWT);

// // Donation routes
// router.post("/", createDonation);           // Create new donation
// router.post("/verify", verifyPayment);      // Verify Razorpay payment
// router.get("/my-donations", getMyDonations); // Get user's donations

// // Admin only routes
// router.get("/all", roleMiddleware.adminOnly, getAllDonations);

// export default router;

// /*
// API Documentation (Hinglish + examples):

// 1. Create Donation (POST /api/donations)
//    Input:
//    {
//      "amount": 1000,           // In rupees (minimum 100)
//      "currency": "INR"         // Optional, default: "INR"
//    }
//    Response:
//    {
//      "success": true,
//      "key": "rzp_test_xxx",    // Razorpay key for frontend
//      "order": {
//        "id": "order_xxx",
//        "amount": 100000,       // In paise
//        "currency": "INR"
//      },
//      "donation": {
//        "_id": "...",
//        "amount": 1000,
//        "status": "pending",
//        "orderId": "order_xxx"
//      }
//    }

// 2. Verify Payment (POST /api/donations/verify)
//    Input:
//    {
//      "orderId": "order_xxx",
//      "paymentId": "pay_xxx",
//      "signature": "xxx"        // From Razorpay response
//    }
//    Response:
//    {
//      "success": true,
//      "message": "Payment verified successfully",
//      "donation": {
//        "_id": "...",
//        "amount": 1000,
//        "status": "completed",
//        "paymentId": "pay_xxx",
//        "completedAt": "..."
//      }
//    }

// 3. Get My Donations (GET /api/donations/my-donations)
//    Response:
//    {
//      "success": true,
//      "count": 2,
//      "donations": [
//        {
//          "_id": "...",
//          "amount": 1000,
//          "status": "completed",
//          "createdAt": "...",
//          "completedAt": "..."
//        },
//        {...}
//      ]
//    }

// 4. Get All Donations (GET /api/donations/all) - Admin Only
//    Response:
//    {
//      "success": true,
//      "stats": {
//        "total": 50,           // Total completed donations
//        "amount": 75000        // Total amount collected
//      },
//      "donations": [{...}, {...}]
//    }

// Error Responses:
// {
//   "success": false,
//   "message": "Error message here",
//   "error": "Detailed error in development"
// }

// Frontend Integration Example:

// // 1. Create donation order
// const createOrder = async (amount) => {
//   const { data } = await axios.post('/api/donations', { amount });
//   return data;
// };

// // 2. Initialize Razorpay
// const initPayment = (orderData) => {
//   const options = {
//     key: orderData.key,
//     amount: orderData.order.amount,
//     currency: "INR",
//     name: "Disaster Relief Connect",
//     description: "Donation for disaster relief",
//     order_id: orderData.order.id,
//     handler: async (response) => {
//       try {
//         // 3. Verify payment
//         await axios.post('/api/donations/verify', {
//           orderId: response.razorpay_order_id,
//           paymentId: response.razorpay_payment_id,
//           signature: response.razorpay_signature
//         });
        
//         // 4. Show success message
//         alert("Thank you for your donation!");
        
//       } catch (error) {
//         alert("Payment verification failed");
//       }
//     },
//     prefill: {
//       name: user.name,
//       email: user.email
//     },
//     theme: {
//       color: "#3399cc"
//     }
//   };

//   const rzp = new window.Razorpay(options);
//   rzp.open();
// };

// // Complete flow
// const handleDonate = async (amount) => {
//   try {
//     const orderData = await createOrder(amount);
//     initPayment(orderData);
//   } catch (error) {
//     alert("Could not create donation order");
//   }
// };

// // Get donation history
// const getMyDonationHistory = async () => {
//   const { data } = await axios.get('/api/donations/my-donations');
//   return data.donations;
// };

// Socket Events:
// socket.on('donationCompleted', ({ donation }) => {
//   // Update UI, show thank you message, etc
// });
// */