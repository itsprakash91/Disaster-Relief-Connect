import { Router } from "express";
import {
    getAllCamps,
    getCampById,
    createCamp,
    updateCamp,
    deleteCamp,
    getCampsNearby,
    getCampStats,
} from "../controllers/camp.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/roles.middleware.js";

const router = Router();

// Public routes
router.get("/", getAllCamps);
router.get("/nearby", getCampsNearby);
router.get("/stats", getCampStats);
router.get("/:id", getCampById);

// Protected routes - Admin only
router.use(verifyJWT, roleMiddleware.adminOnly);

router.post("/", createCamp);
router.patch("/:id", updateCamp);
router.delete("/:id", deleteCamp);

export default router;

/*
API Documentation:

1. Get All Camps (GET /api/camps)
   Response:
   {
     "success": true,
     "data": {
       "camps": [
         {
           "_id": "...",
           "name": "Relief Camp - Patna",
           "address": "Patna, Bihar",
           "capacity": 150,
           "occupancy": 85,
           "contact": "9998887777",
           "status": "Active",
           "location": {
             "type": "Point",
             "coordinates": [85.1376, 25.5941]
           },
           "createdAt": "2025-11-01T...",
           "updatedAt": "2025-11-01T..."
         }
       ]
     }
   }

2. Get Camp by ID (GET /api/camps/:id)
   Response: Same as single camp object

3. Create Camp (POST /api/camps) - Admin Only
   Input:
   {
     "name": "Relief Camp - Delhi",
     "address": "Delhi, India",
     "capacity": 200,
     "contact": "9876543210",
     "coordinator": "Amit Kumar",
     "description": "Main relief center",
     "location": {
       "coordinates": [77.2090, 28.6139]  // [longitude, latitude]
     }
   }

4. Update Camp (PATCH /api/camps/:id) - Admin Only
   Input: (any of the above fields)

5. Delete Camp (DELETE /api/camps/:id) - Admin Only

6. Get Nearby Camps (GET /api/camps/nearby)
   Query params:
   - longitude: number
   - latitude: number
   - maxDistance: number (meters, default 10000)

7. Get Camp Statistics (GET /api/camps/stats)
   Response:
   {
     "success": true,
     "data": {
       "totalCamps": 5,
       "activeCamps": 4,
       "totalCapacity": 750,
       "totalOccupancy": 450,
       "occupancyPercentage": 60
     }
   }
*/
