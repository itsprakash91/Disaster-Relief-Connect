import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createUser, deactivateUser, getAllUsers, updateUser } from "../../api/admin";

const creatableRoles = ["volunteer", "admin"];

const getDefaultCreateRole = (role) =>
  creatableRoles.includes(role) ? role : "volunteer";

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  address: "",
  role: "victim",
};

const emptyCreateForm = {
  ...emptyForm,
  role: "volunteer",
  password: "",
};

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [activeRole, setActiveRole] = useState("volunteer");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [creatingUser, setCreatingUser] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getAllUsers({ role: activeRole });
      setUsers(response);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(err.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [activeRole]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return users;

    return users.filter((user) =>
      [user.name, user.email, user.phone, user.address]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query))
    );
  }, [users, searchTerm]);

  const openEdit = (user) => {
    setEditingUser(user);
    setForm({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      address: user.address || "",
      role: user.role || activeRole,
    });
    setError("");
    setSuccess("");
  };

  const closeEdit = () => {
    setEditingUser(null);
    setForm(emptyForm);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateChange = (event) => {
    const { name, value } = event.target;
    setCreateForm((prev) => ({ ...prev, [name]: value }));
  };

  const openCreate = () => {
    setCreatingUser(true);
    setCreateForm({ ...emptyCreateForm, role: getDefaultCreateRole(activeRole) });
    setError("");
    setSuccess("");
  };

  const closeCreate = () => {
    setCreatingUser(false);
    setCreateForm(emptyCreateForm);
  };

  const handleCreate = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      await createUser(createForm);
      setSuccess("User created successfully");
      closeCreate();
      if (createForm.role !== activeRole) {
        setActiveRole(createForm.role);
      } else {
        await fetchUsers();
      }
    } catch (err) {
      console.error("Error creating user:", err);
      setError(err.response?.data?.message || "Failed to create user");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (event) => {
    event.preventDefault();

    if (!editingUser) return;

    try {
      setSaving(true);
      setError("");
      await updateUser(editingUser._id, form);
      setSuccess("User updated successfully");
      closeEdit();
      await fetchUsers();
    } catch (err) {
      console.error("Error updating user:", err);
      setError(err.response?.data?.message || "Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user) => {
    const confirmed = window.confirm(
      `Delete ${user.name}? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setSaving(true);
      setError("");
      await deactivateUser(user._id);
      setSuccess("User deleted successfully");
      await fetchUsers();
    } catch (err) {
      console.error("Error deleting user:", err);
      setError(err.response?.data?.message || "Failed to delete user");
    } finally {
      setSaving(false);
    }
  };

  const roleTabs = [
    { key: "volunteer", label: "Volunteers" },
    { key: "victim", label: "Victims" },
    { key: "admin", label: "Admins" },
  ];

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-3xl font-bold text-blue-800">User Management</h2>
          <p className="text-gray-600 mt-1">
            Manage volunteer and victim accounts from one admin panel.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row">
          <input
            type="search"
            placeholder="Search name, email, phone, address"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full md:w-80 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={openCreate}
            className="rounded-md bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
          >
            Create User
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-md mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-300 text-green-700 px-4 py-3 rounded-md mb-4">
          {success}
        </div>
      )}

      <div className="flex gap-2 mb-5">
        {roleTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => {
              setActiveRole(tab.key);
              setSearchTerm("");
            }}
            className={`px-4 py-2 rounded-md font-semibold border transition ${
              activeRole === tab.key
                ? "bg-blue-600 border-blue-600 text-white"
                : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <p className="text-sm text-gray-500">Current List</p>
          <p className="text-2xl font-bold text-blue-700 capitalize">
            {activeRole}s
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <p className="text-sm text-gray-500">Showing</p>
          <p className="text-2xl font-bold text-gray-900">
            {filteredUsers.length} of {users.length}
          </p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <p className="p-6 text-center text-gray-600">Loading users...</p>
        ) : filteredUsers.length === 0 ? (
          <p className="p-6 text-center text-gray-600">No users found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Phone
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Address
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Joined
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                      {user.name || "No name"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {user.email}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {user.phone || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">
                      {user.address || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                          user.role === "volunteer"
                            ? "bg-blue-100 text-blue-800"
                            : user.role === "admin"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-green-100 text-green-800"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openEdit(user)}
                        disabled={saving}
                        className="px-3 py-1.5 text-sm font-semibold rounded-md border border-blue-200 text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(user)}
                        disabled={saving}
                        className="ml-2 px-3 py-1.5 text-sm font-semibold rounded-md border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {creatingUser && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h3 className="text-xl font-bold text-gray-900">Create User</h3>
              <button
                type="button"
                onClick={closeCreate}
                className="text-gray-500 hover:text-gray-900 text-2xl leading-none"
              >
                x
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6">
              <div className="grid md:grid-cols-2 gap-4">
                <label className="block">
                  <span className="block text-sm font-semibold text-gray-700 mb-1">Name</span>
                  <input
                    name="name"
                    value={createForm.name}
                    onChange={handleCreateChange}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </label>

                <label className="block">
                  <span className="block text-sm font-semibold text-gray-700 mb-1">Email</span>
                  <input
                    name="email"
                    type="email"
                    value={createForm.email}
                    onChange={handleCreateChange}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </label>

                <label className="block">
                  <span className="block text-sm font-semibold text-gray-700 mb-1">Password</span>
                  <input
                    name="password"
                    type="password"
                    value={createForm.password}
                    onChange={handleCreateChange}
                    minLength={6}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </label>

                <label className="block">
                  <span className="block text-sm font-semibold text-gray-700 mb-1">Role</span>
                  <select
                    name="role"
                    value={createForm.role}
                    onChange={handleCreateChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="volunteer">Volunteer</option>
                    <option value="admin">Admin</option>
                  </select>
                </label>

                <label className="block">
                  <span className="block text-sm font-semibold text-gray-700 mb-1">Phone</span>
                  <input
                    name="phone"
                    value={createForm.phone}
                    onChange={handleCreateChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="block text-sm font-semibold text-gray-700 mb-1">Address</span>
                  <textarea
                    name="address"
                    value={createForm.address}
                    onChange={handleCreateChange}
                    rows="3"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </label>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={closeCreate}
                  className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h3 className="text-xl font-bold text-gray-900">Edit User</h3>
              <button
                type="button"
                onClick={closeEdit}
                className="text-gray-500 hover:text-gray-900 text-2xl leading-none"
              >
                x
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6">
              <div className="grid md:grid-cols-2 gap-4">
                <label className="block">
                  <span className="block text-sm font-semibold text-gray-700 mb-1">Name</span>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </label>

                <label className="block">
                  <span className="block text-sm font-semibold text-gray-700 mb-1">Email</span>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </label>

                <label className="block">
                  <span className="block text-sm font-semibold text-gray-700 mb-1">Phone</span>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </label>

                <label className="block">
                  <span className="block text-sm font-semibold text-gray-700 mb-1">Role</span>
                  <select
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {editingUser?.role === "victim" && (
                      <option value="victim">Victim</option>
                    )}
                    <option value="volunteer">Volunteer</option>
                    <option value="admin">Admin</option>
                  </select>
                </label>

                <label className="block md:col-span-2">
                  <span className="block text-sm font-semibold text-gray-700 mb-1">Address</span>
                  <textarea
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    rows="3"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </label>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={closeEdit}
                  className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
