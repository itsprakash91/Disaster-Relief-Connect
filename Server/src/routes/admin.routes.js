import { Router } from "express";
import {
  adminLogin,
  getDashboardStats,
  getHeatmapData,
  getRequestAnalytics,
  getVolunteerMetrics,
  updateRequestStatus,
  getAuditLogs,
  getAllUsers,
  createUser,
  updateUser,
  getDetailedVolunteers,
  updateUserRole,
  deactivateUser
} from "../controllers/admin.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/roles.middleware.js";

const router = Router();

// Public admin auth route
router.post("/login", adminLogin);

// All admin routes need auth and admin role
router.use(verifyJWT, roleMiddleware.adminOnly);

// Dashboard & Analytics
router.get("/dashboard", getDashboardStats);
router.get("/heatmap", getHeatmapData);
router.get("/analytics/requests", getRequestAnalytics);
router.get("/analytics/volunteers", getVolunteerMetrics);

// Help Request Management
router.patch("/requests/:id/status", updateRequestStatus);

// Audit & Logs
router.get("/audit-logs", getAuditLogs);

// User Management
router.get("/users", getAllUsers);
router.post("/users", createUser);
router.patch("/users/:userId", updateUser);
router.patch("/users/:userId/role", updateUserRole);
router.patch("/users/:userId/deactivate", deactivateUser);
router.delete("/users/:userId", deactivateUser);

// Volunteer Management
router.get("/volunteers", getDetailedVolunteers);

export default router;

/*
API Documentation (Hinglish + examples):

1. Get Dashboard Stats (GET /api/admin/dashboard)
   Response:
   {
     "success": true,
     "stats": {
       "totalHelpRequests": 150,
       "pendingRequests": 25,
       "completedRequests": 100,
       "totalVolunteers": 50,
       "totalVictims": 200,
       "totalAmount": 75000,     // Total donations
       "totalDonations": 45      // Number of donations
     },
     "recentRequests": [{...}, {...}]  // Latest 5 requests
   }

2. Get Heatmap Data (GET /api/admin/heatmap)
   Query params:
   - status: pending/accepted/completed
   Response:
   {
     "success": true,
     "heatmapData": [
       {
         "location": [77.5946, 12.9716],
         "type": "food",
         "weight": 5    // Number of requests in this area
       },
       {...}
     ]
   }

3. Get Request Analytics (GET /api/admin/analytics/requests)
   Response:
   {
     "success": true,
     "analytics": {
       "byType": [
         { "_id": "food", "count": 50 },
         { "_id": "medical", "count": 30 }
       ],
       "byStatus": [
         { "_id": "pending", "count": 25 },
         { "_id": "completed", "count": 100 }
       ],
       "daily": [
         { "_id": "2025-11-01", "count": 15 },
         { "_id": "2025-10-31", "count": 12 }
       ]
     }
   }

4. Get Volunteer Metrics (GET /api/admin/analytics/volunteers)
   Response:
   {
     "success": true,
     "volunteerStats": [
       {
         "name": "Amit Kumar",
         "totalRequests": 20,
         "completedRequests": 18,
         "completionRate": 90
       },
       {...}
     ]
   }

5. Update Request Status (PATCH /api/admin/requests/:id/status)
   Input:
   {
     "status": "completed",
     "assignedVolunteer": "volunteerId",  // Optional
     "adminNotes": "Marked as completed after verification"
   }
   Response:
   {
     "success": true,
     "message": "Help request updated successfully",
     "helpRequest": {...}
   }

6. Get Audit Logs (GET /api/admin/audit-logs)
   Query params:
   - startDate: YYYY-MM-DD
   - endDate: YYYY-MM-DD
   - type: request/donation/user
   Response:
   {
     "success": true,
     "logs": [
       {
         "action": "UPDATE_STATUS",
         "entityType": "HELP_REQUEST",
         "entityId": "...",
         "changes": {...},
         "performedBy": "adminId",
         "createdAt": "..."
       },
       {...}
     ]
   }

Frontend Integration Example:

// Dashboard stats
const getDashboard = async () => {
  const { data } = await axios.get('/api/admin/dashboard');
  return data.stats;
};

// Heatmap with filters
const getHeatmapData = async (status) => {
  const { data } = await axios.get(`/api/admin/heatmap?status=${status}`);
  return data.heatmapData;
};

// Charts data
const getAnalytics = async () => {
  const { data } = await axios.get('/api/admin/analytics/requests');
  return data.analytics;
};

// Example Chart Component:
const RequestTypeChart = ({ data }) => {
  // Using Chart.js/Recharts
  return (
    <PieChart data={data.byType.map(item => ({
      name: item._id,
      value: item.count
    }))} />
  );
};

// Admin action
const updateRequest = async (requestId, updates) => {
  const { data } = await axios.patch(
    `/api/admin/requests/${requestId}/status`,
    updates
  );
  return data;
};

// Real-time updates
socket.on('helpRequestUpdated', (request) => {
  // Update dashboard stats
  // Refresh charts
  // Update request list
});
*/
