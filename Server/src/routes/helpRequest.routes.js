import { Router } from "express";
import {
  createHelpRequest,
  getHelpRequests,
  getHelpRequestById,
  updateHelpRequest,
  rejectHelpRequest,
  adminUpdateHelpRequest,
  adminDeleteHelpRequest,
  getNearbyRequests,
  getMyHelpRequests,
  getMyAssignedRequests
} from "../controllers/helpRequest.controller.js";
import { verifyJWT, optionalAuth } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/roles.middleware.js";

const router = Router();

// Public routes (with optional auth)
router.get("/nearby", optionalAuth, getNearbyRequests);

// Routes that need authentication
// Apply auth middleware to all routes below

router.post("/", verifyJWT, roleMiddleware.victimOnly, createHelpRequest); // Only victims can create

// User specific routes
router.get("/me/requests", verifyJWT, getMyHelpRequests);          // Get my created requests
router.get("/me/assigned", verifyJWT, getMyAssignedRequests);      // Get requests I'm helping with

router.get("/", verifyJWT, getHelpRequests);    // Anyone can list (will be filtered by role)
router.get("/:id", optionalAuth, getHelpRequestById);

// Volunteer/Admin routes
router.patch("/:id/accept",
  verifyJWT,
  roleMiddleware.volunteerOrAdmin,
  updateHelpRequest
);

router.patch("/:id/reject",
  verifyJWT,
  roleMiddleware.volunteerOrAdmin,
  rejectHelpRequest
);

// Admin routes
router.patch("/:id", verifyJWT, roleMiddleware.adminOnly, adminUpdateHelpRequest);
router.delete("/:id", verifyJWT, roleMiddleware.adminOnly, adminDeleteHelpRequest);

export default router;

/* 
API Documentation (Hinglish + examples):

1. Create Help Request (POST /api/help-requests)
   Input:
   {
     "typeOfHelp": "food",              // food/water/medical/shelter/rescue
     "description": "Need food for 5 people",
     "location": {
       "coordinates": [77.5946, 12.9716],  // [longitude, latitude]
       "address": "Optional address"
     }
   }
   Response:
   {
     "success": true,
     "message": "Help request created successfully",
     "helpRequest": {
       "_id": "...",
       "typeOfHelp": "food",
       "status": "pending",
       "location": {...},
       "createdAt": "..."
     }
   }

2. Get Nearby Requests (GET /api/help-requests/nearby)
   Query params:
   - lat: latitude
   - lng: longitude
   - radius: meters (default: 5000)
   Response:
   {
     "success": true,
     "count": 5,
     "helpRequests": [{...}, {...}]
   }

3. Get Help Request (GET /api/help-requests/:id)
   Response:
   {
     "success": true,
     "helpRequest": {
       "_id": "...",
       "typeOfHelp": "food",
       "description": "...",
       "status": "pending",
       "user": {
         "_id": "...",
         "name": "..."
       },
       "location": {...},
       "createdAt": "..."
     }
   }

4. Update/Accept Request (PATCH /api/help-requests/:id/accept)
   Input:
   {
     "status": "accepted",  // pending/accepted/completed
     "assignedVolunteer": "volunteerId"  // required when accepting
   }
   Response:
   {
     "success": true,
     "message": "Help request updated successfully",
     "helpRequest": {...}
   }

5. Get My Requests (GET /api/help-requests/me/requests)
   Response:
   {
     "success": true,
     "count": 2,
     "helpRequests": [{...}, {...}]
   }

6. Get My Assigned Requests (GET /api/help-requests/me/assigned)
   Response:
   {
     "success": true,
     "count": 1,
     "helpRequests": [{...}]
   }

Error Responses:
{
  "success": false,
  "message": "Error message here",
  "error": "Detailed error in development"
}

Socket Events (real-time updates):
- helpRequestCreated: New request created
- helpRequestUpdated: Status/assignment changed

Frontend Usage Example:
// Create request
const createRequest = async (requestData) => {
  const { data } = await axios.post('/api/help-requests', requestData);
  return data;
};

// Get nearby requests
const getNearby = async (lat, lng) => {
  const { data } = await axios.get(
    `/api/help-requests/nearby?lat=${lat}&lng=${lng}&radius=5000`
  );
  return data;
};

// Accept request (volunteer)
const acceptRequest = async (requestId) => {
  const { data } = await axios.patch(
    `/api/help-requests/${requestId}/accept`,
    {
      status: "accepted",
      assignedVolunteer: currentUserId
    }
  );
  return data;
};

// Listen for real-time updates
socket.on('helpRequestCreated', (newRequest) => {
  // Add to map/list if within range
});

socket.on('helpRequestUpdated', (updatedRequest) => {
  // Update UI with new status
});
*/
