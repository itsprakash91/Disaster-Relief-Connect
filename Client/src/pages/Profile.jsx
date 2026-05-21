import React, { useContext, useState, useEffect } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { updateProfile as updateProfileAPI, getProfile } from "../api/auth";
import { useGeoLocation } from "../hooks/useGeoLocation";
import toast from "react-hot-toast";

export default function Profile() {
  const { user, setUser } = useContext(AuthContext);
  const { location, getLocation } = useGeoLocation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    avatar: "",
    role: "",
  });
  const [avatarPreview, setAvatarPreview] = useState("");

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
        avatar: user.avatar || "",
        role: user.role || "",
      });
      setAvatarPreview(user.avatar || "");
    } else {
      // Fetch fresh profile data
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const response = await getProfile();
      if (response.success && response.user) {
        const userData = response.user;
        setFormData({
          name: userData.name || "",
          email: userData.email || "",
          phone: userData.phone || "",
          address: userData.address || "",
          avatar: userData.avatar || "",
          role: userData.role || "",
        });
        setAvatarPreview(userData.avatar || "");
        if (setUser) {
          setUser(userData);
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const compressImage = (file, maxWidth = 400, maxHeight = 400, quality = 0.8) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to base64 with compression
          const compressedBase64 = canvas.toDataURL("image/jpeg", quality);
          resolve(compressedBase64);
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 5MB before compression)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }

      // Check file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }

      try {
        // Compress image before converting to base64
        const compressedBase64 = await compressImage(file);
        
        // Check compressed size (should be much smaller)
        const sizeInMB = (compressedBase64.length * 3) / 4 / 1024 / 1024;
        if (sizeInMB > 2) {
          toast.error("Image is too large even after compression. Please use a smaller image.");
          return;
        }

        setAvatarPreview(compressedBase64);
        setFormData((prev) => ({ ...prev, avatar: compressedBase64 }));
        toast.success("Image loaded successfully!");
      } catch (error) {
        console.error("Error processing image:", error);
        toast.error("Failed to process image. Please try again.");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updateData = {
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        avatar: formData.avatar,
      };

      // Add location if available
      if (location) {
        updateData.location = {
          coordinates: [location.longitude, location.latitude],
        };
      }

      const response = await updateProfileAPI(updateData);

      if (response.success) {
        toast.success("Profile updated successfully!");
        // Update user in context
        if (setUser) {
          setUser(response.user);
        }
        // Refresh profile data
        await fetchProfile();
      } else {
        throw new Error(response.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to update profile"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <p className="text-center mt-8 text-gray-600">
          Please log in to view your profile.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-3xl font-bold text-blue-700 mb-6">My Profile</h2>

      <div className="bg-white shadow-lg rounded-xl p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-500 bg-gray-200 flex items-center justify-center">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-4xl text-gray-400">👤</span>
                )}
              </div>
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-2 cursor-pointer hover:bg-blue-700 transition-all shadow-lg"
              >
                📷
              </label>
              <input
                type="file"
                id="avatar-upload"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Click the camera icon to upload photo
            </p>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Email (Read-only) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              disabled
              className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-100 text-gray-600 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">
              Email cannot be changed
            </p>
          </div>

          {/* Role (Read-only) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Role
            </label>
            <input
              type="text"
              name="role"
              value={formData.role?.toUpperCase() || ""}
              disabled
              className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-100 text-gray-600 cursor-not-allowed capitalize"
            />
            <p className="text-xs text-gray-500 mt-1">Role cannot be changed</p>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+91 1234567890"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Address
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Enter your address"
              rows="3"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Location Section */}
          <div className="border-t pt-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Current Location
            </label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={getLocation}
                className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              >
                📍 Get Current Location
              </button>
              {location && (
                <span className="text-sm text-green-700">
                  Lat: {location.latitude?.toFixed(4)} | Lng:{" "}
                  {location.longitude?.toFixed(4)}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Update your location to help volunteers find you easily
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4 pt-4 border-t">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Updating..." : "Update Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
