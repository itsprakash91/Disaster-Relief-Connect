// Role-based middleware for fine-grained access control

// Define role hierarchy and permissions
const ROLE_HIERARCHY = {
    admin: {
        can: ["manage_all", "view_dashboard", "manage_users", "manage_donations", "manage_camps"],
        inherits: ["volunteer"]
    },
    volunteer: {
        can: ["accept_requests", "update_request_status", "view_nearby_requests", "chat_with_victim"],
        inherits: ["victim"]
    },
    victim: {
        can: ["create_request", "view_own_requests", "chat_with_volunteer", "make_donation"],
        inherits: []
    }
};

// Check if role has permission (including inherited permissions)
const hasPermission = (role, permission) => {
    if (!ROLE_HIERARCHY[role]) {
        return false;
    }

    // Check direct permissions
    if (ROLE_HIERARCHY[role].can.includes(permission)) {
        return true;
    }

    // Check inherited permissions
    for (const inheritedRole of ROLE_HIERARCHY[role].inherits) {
        if (hasPermission(inheritedRole, permission)) {
            return true;
        }
    }

    return false;
};

// Main permission checker middleware
export const requirePermission = (permission) => {
    return (req, res, next) => {
        try {
            // Check if user exists and has a role
            if (!req.user || !req.user.role) {
                return res.status(401).json({
                    success: false,
                    message: "Authentication required"
                });
            }

            // Check permission
            if (!hasPermission(req.user.role, permission)) {
                return res.status(403).json({
                    success: false,
                    message: `Permission denied: ${permission} required`
                });
            }

            next();
        } catch (error) {
            console.error("Permission check error:", error);
            return res.status(500).json({
                success: false,
                message: "Error checking permissions",
                error: error.message
            });
        }
    };
};

// Helper middleware for common scenarios
export const roleMiddleware = {
    // Admin only routes
    adminOnly: (req, res, next) => {
        if (req.user?.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Admin access required"
            });
        }
        next();
    },

    // Victim only routes
    victimOnly: (req, res, next) => {
        if (req.user?.role !== "victim") {
            return res.status(403).json({
                success: false,
                message: "Only victims can perform this action"
            });
        }
        next();
    },

    // Volunteer or admin routes
    volunteerOrAdmin: (req, res, next) => {
        if (!["volunteer", "admin"].includes(req.user?.role)) {
            return res.status(403).json({
                success: false,
                message: "Volunteer or admin access required"
            });
        }
        next();
    },

    // Resource owner or admin check
    isOwnerOrAdmin: (paramIdPath = "userId") => {
        return (req, res, next) => {
            const resourceId = req.params[paramIdPath];
            if (req.user.role === "admin" || req.user._id.toString() === resourceId) {
                next();
            } else {
                return res.status(403).json({
                    success: false,
                    message: "Access denied: Not the owner"
                });
            }
        };
    },

    // Check if user can manage help request
    canManageHelpRequest: async (req, res, next) => {
        try {
            const requestId = req.params.requestId;
            const helpRequest = await HelpRequest.findById(requestId);

            if (!helpRequest) {
                return res.status(404).json({
                    success: false,
                    message: "Help request not found"
                });
            }

            // Allow if admin
            if (req.user.role === "admin") {
                return next();
            }

            // Allow if user is the creator
            if (helpRequest.user?.toString() === req.user._id.toString()) {
                return next();
            }

            // Allow if user is the assigned volunteer
            if (helpRequest.assignedVolunteer?.toString() === req.user._id.toString()) {
                return next();
            }

            return res.status(403).json({
                success: false,
                message: "You don't have permission to manage this request"
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Error checking request permissions",
                error: error.message
            });
        }
    }
};

// Export specific permission checks (for convenience)
export const permissions = {
    MANAGE_ALL: "manage_all",
    VIEW_DASHBOARD: "view_dashboard",
    MANAGE_USERS: "manage_users",
    MANAGE_DONATIONS: "manage_donations",
    MANAGE_CAMPS: "manage_camps",
    ACCEPT_REQUESTS: "accept_requests",
    UPDATE_REQUEST_STATUS: "update_request_status",
    VIEW_NEARBY_REQUESTS: "view_nearby_requests",
    CHAT_WITH_VICTIM: "chat_with_volunteer",
    CREATE_REQUEST: "create_request",
    VIEW_OWN_REQUESTS: "view_own_requests",
    MAKE_DONATION: "make_donation"
};

// Usage examples:
/*
router.get("/admin/dashboard", 
    verifyJWT, 
    requirePermission(permissions.VIEW_DASHBOARD),
    getDashboardStats
);

router.post("/help-requests/:requestId/accept",
    verifyJWT,
    requirePermission(permissions.ACCEPT_REQUESTS),
    acceptHelpRequest
);

router.patch("/users/:userId",
    verifyJWT,
    roleMiddleware.isOwnerOrAdmin("userId"),
    updateUser
);

router.get("/help-requests/:requestId/chat",
    verifyJWT,
    roleMiddleware.canManageHelpRequest,
    getChatHistory
);
*/