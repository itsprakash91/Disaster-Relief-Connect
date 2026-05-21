import { Router } from "express";
import {
  register,
  login,
  logout,
  getCurrentUser,
  updateProfile,
  getUserById,
  getVictims,
  getVolunteers,
  refreshAccessToken,
} from "../controllers/auth.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Public routes (no auth needed)
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.post("/refresh-token", refreshAccessToken);
router.post("/refresh-token", refreshAccessToken);
router.get("/volunteers", getVolunteers);  // Get all volunteers
router.get("/victims", getVictims);  // Get all victims

// Protected routes (need auth) - MUST come before /:id route
router.get("/me", verifyJWT, getCurrentUser);
router.patch("/profile", verifyJWT, updateProfile);

// public: get user by id (name, phone) - MUST come after /me route
router.get("/:id", getUserById);

export default router;

/* 
API Documentation (Hinglish + examples):

1. Register User (POST /api/auth/register)
   Input:
   {
     "name": "Rohit Kumar",
     "email": "rohit@example.com",
     "password": "securepass123",
     "role": "victim"     // Optional, default: "victim"
   }
   Response:
   {
     "success": true,
     "message": "User registered successfully",
     "user": {
       "_id": "...",
       "name": "Rohit Kumar",
       "email": "rohit@example.com",
       "role": "victim"
     }
   }

2. Login (POST /api/auth/login)
   Input:
   {
     "email": "rohit@example.com",
     "password": "securepass123"
   }
   Response: 
   {
     "success": true,
     "message": "Logged in successfully",
     "user": {
       "_id": "...",
       "name": "Rohit Kumar",
       "email": "rohit@example.com",
       "role": "victim"
     }
   }
   + Sets httpOnly cookies (accessToken, refreshToken)

3. Logout (POST /api/auth/logout)
   - No body needed
   - Clears auth cookies
   Response:
   {
     "success": true,
     "message": "Logged out successfully"
   }

4. Get Current User (GET /api/auth/me)
   - Needs auth token (cookie/header)
   Response:
   {
     "success": true,
     "user": {
       "_id": "...",
       "name": "Rohit Kumar",
       "email": "rohit@example.com",
       "role": "victim"
     }
   }

5. Update Profile (PATCH /api/auth/profile)
   - Needs auth token
   Input:
   {
     "name": "Rohit K",
     "location": {
       "coordinates": [77.5946, 12.9716]
     }
   }
   Response:
   {
     "success": true,
     "message": "Profile updated successfully",
     "user": {
       "_id": "...",
       "name": "Rohit K",
       "email": "rohit@example.com",
       "location": {
         "type": "Point",
         "coordinates": [77.5946, 12.9716]
       }
     }
   }

6. Refresh Token (POST /api/auth/refresh-token)
   - Uses refreshToken cookie to generate new accessToken
   Response:
   {
     "success": true,
     "message": "Access token refreshed"
   }
   + Sets new accessToken cookie

Error Responses:
{
  "success": false,
  "message": "Error message here",
  "error": "Detailed error in development"
}

Frontend Usage Example:
const registerUser = async (userData) => {
  try {
    const { data } = await axios.post('/api/auth/register', userData);
    return data;
  } catch (error) {
    throw error.response.data;
  }
};

const login = async (credentials) => {
  try {
    const { data } = await axios.post('/api/auth/login', credentials, {
      withCredentials: true // Important for cookies
    });
    return data;
  } catch (error) {
    throw error.response.data;
  }
};
*/