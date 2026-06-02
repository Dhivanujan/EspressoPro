// app/cashier_management/page.tsx

"use client";

import { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import { apiGet, apiPost, apiPut, apiDelete } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Edit3,
  Trash2,
  X,
  Loader2,
  AlertCircle,
  UserCheck,
  UserX,
  Shield,
  Key,
  Users
} from "lucide-react";

interface User {
  id: string;
  username: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function CashierManagementPage() {
  const { user: currentUser } = useAuth();
  const router = useRouter();

  // Protect route
  useEffect(() => {
    if (currentUser && currentUser.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [currentUser, router]);

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [formUsername, setFormUsername] = useState("");
  const [formFullName, setFormFullName] = useState("");
  const [formRole, setFormRole] = useState("cashier");
  const [formPassword, setFormPassword] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);

  async function loadUsers() {
    setLoading(true);
    try {
      const fetchedUsers = await apiGet<User[]>("/api/v1/auth/users");
      setUsers(fetchedUsers);
    } catch (err) {
      console.error("Failed to load staff/users list", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormUsername("");
    setFormFullName("");
    setFormRole("cashier");
    setFormPassword("");
    setFormIsActive(true);
    setErrorMsg(null);
    setShowModal(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setFormUsername(user.username);
    setFormFullName(user.full_name);
    setFormRole(user.role);
    setFormPassword(""); // Clear password field for security
    setFormIsActive(user.is_active);
    setErrorMsg(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    setErrorMsg(null);

    try {
      if (editingUser) {
        // Edit User
        const payload: any = {
          full_name: formFullName,
          role: formRole,
          is_active: formIsActive,
        };
        if (formPassword.trim()) {
          payload.password = formPassword;
        }
        await apiPut(`/api/v1/auth/users/${editingUser.id}`, payload);
      } else {
        // Add User
        if (!formPassword.trim()) {
          throw new Error("Password is required for new accounts");
        }
        const payload = {
          username: formUsername,
          full_name: formFullName,
          role: formRole,
          password: formPassword,
          is_active: formIsActive,
        };
        await apiPost("/api/v1/auth/register", payload);
      }

      setShowModal(false);
      await loadUsers();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update staff member details.");
    } finally {
      setModalLoading(false);
    }
  };

  const toggleStatus = async (user: User) => {
    if (user.id === currentUser?.id) {
      alert("You cannot deactivate your own admin session.");
      return;
    }

    try {
      const updatedUser = await apiPut<User>(`/api/v1/auth/users/${user.id}`, {
        is_active: !user.is_active,
      });

      // Update state locally
      setUsers(users.map((u) => (u.id === user.id ? updatedUser : u)));
    } catch (err: any) {
      alert(err.message || "Failed to toggle active status.");
    }
  };

  const handleDelete = async (user: User) => {
    if (user.id === currentUser?.id) {
      alert("You cannot delete your own admin session.");
      return;
    }

    if (!confirm(`Are you sure you want to permanently delete the account for '${user.full_name}'?`)) {
      return;
    }

    try {
      await apiDelete(`/api/v1/auth/users/${user.id}`);
      await loadUsers();
    } catch (err: any) {
      alert(err.message || "Failed to delete staff member.");
    }
  };

  const filteredUsers = users.filter((u) => {
    const query = searchQuery.toLowerCase();
    return (
      u.full_name.toLowerCase().includes(query) ||
      u.username.toLowerCase().includes(query) ||
      u.role.toLowerCase().includes(query)
    );
  });

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f9ff]">
      {/* Sidebar */}
      <Sidebar />

      {/* Content Area */}
      <main className="flex-1 overflow-y-auto flex flex-col font-sans">
        {/* Header */}
        <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/80 backdrop-blur-lg px-8 shrink-0">
          <div className="flex items-center justify-between py-5">
            <div>
              <h1 className="text-xl font-bold text-[#170f0a]">Staff Registry</h1>
              <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">
                Manage POS Cashiers & System Administrators
              </p>
            </div>

            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 rounded-xl bg-[#170f0a] px-5 py-2.5 font-bold text-white transition hover:opacity-90 active:scale-[0.98] text-sm shadow-sm"
            >
              <Plus size={18} />
              Add Cashier/Staff
            </button>
          </div>
        </header>

        {/* Filters and List */}
        <div className="p-8 flex-1">
          <div className="mb-8 flex flex-col md:flex-row gap-4 md:items-center justify-between">
            <div className="relative w-full max-w-sm">
              <Search
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search staff registry by name or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[#82542a] focus:ring-4 focus:ring-[#82542a]/10"
              />
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-gray-500 bg-white border px-4 py-2 rounded-xl">
              <Users size={14} className="text-[#82542a]" />
              <span>Total registered staff: {users.length}</span>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="animate-spin text-[#82542a]" size={36} />
              <p className="text-gray-500 font-medium">Fetching active store staff...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-20 bg-white border border-dashed rounded-2xl p-8">
              <p className="text-gray-500 font-semibold">No registered staff match your search query.</p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 font-extrabold uppercase border-b border-gray-100">
                      <th className="px-6 py-4">Full Name</th>
                      <th className="px-6 py-4">Username</th>
                      <th className="px-6 py-4">System Role</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Registered Date</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((item) => {
                      const isSelf = item.id === currentUser?.id;
                      return (
                        <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold ${
                                item.role === "admin" 
                                  ? "bg-[#febf8c]/25 text-[#82542a]" 
                                  : "bg-blue-50 text-blue-700"
                              }`}>
                                {item.full_name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 text-sm">{item.full_name}</span>
                                {isSelf && (
                                  <span className="ml-2 px-2 py-0.5 rounded-full text-[9px] bg-slate-100 text-slate-500 border font-bold">
                                    YOU
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-mono font-semibold text-gray-500">
                            @{item.username}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl font-bold uppercase tracking-wider text-[9px] border ${
                              item.role === "admin"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-blue-50 text-blue-700 border-blue-200"
                            }`}>
                              <Shield size={10} />
                              {item.role}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => toggleStatus(item)}
                              disabled={isSelf}
                              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border transition ${
                                item.is_active
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                  : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                              } ${isSelf ? "cursor-not-allowed opacity-80" : ""}`}
                            >
                              {item.is_active ? (
                                <>
                                  <UserCheck size={11} />
                                  Active Status
                                </>
                              ) : (
                                <>
                                  <UserX size={11} />
                                  Deactivated
                                </>
                              )}
                            </button>
                          </td>
                          <td className="px-6 py-4 text-gray-400 font-semibold">
                            {new Date(item.created_at).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => handleOpenEdit(item)}
                                className="rounded-lg p-1.5 transition text-gray-400 hover:text-black hover:bg-gray-100"
                              >
                                <Edit3 size={15} />
                              </button>
                              <button
                                onClick={() => handleDelete(item)}
                                disabled={isSelf}
                                className={`rounded-lg p-1.5 transition text-gray-400 hover:text-red-600 hover:bg-red-50 ${
                                  isSelf ? "cursor-not-allowed opacity-30" : ""
                                }`}
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal Add/Edit User */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6.5 shadow-2xl animate-scale-up border">
            <div className="flex justify-between items-center pb-4 border-b">
              <h2 className="text-lg font-bold text-gray-900">
                {editingUser ? `Edit Staff: ${editingUser.full_name}` : "Register New Cashier / Staff"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-black p-1 hover:bg-gray-50 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formFullName}
                  onChange={(e) => setFormFullName(e.target.value)}
                  placeholder="e.g. Liam Martinez"
                  className="w-full text-sm rounded-xl border border-gray-200 bg-white px-4 py-2.5 outline-none focus:border-[#82542a]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Username
                </label>
                <input
                  type="text"
                  required
                  disabled={!!editingUser}
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value)}
                  placeholder="e.g. liam_pos"
                  className="w-full text-sm rounded-xl border border-gray-200 bg-white px-4 py-2.5 outline-none focus:border-[#82542a] disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
                />
                {editingUser && (
                  <p className="text-[10px] text-gray-400 mt-1 font-medium pl-1">
                    Username cannot be changed after registration.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    System Role
                  </label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    disabled={editingUser?.id === currentUser?.id}
                    className="w-full text-sm rounded-xl border border-gray-200 bg-white px-4 py-2.5 outline-none focus:border-[#82542a] disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    <option value="cashier">Cashier</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer pb-3">
                    <input
                      type="checkbox"
                      checked={formIsActive}
                      disabled={editingUser?.id === currentUser?.id}
                      onChange={(e) => setFormIsActive(e.target.checked)}
                      className="rounded border-gray-300 text-[#82542a] focus:ring-[#82542a] disabled:cursor-not-allowed"
                    />
                    <span className="text-xs font-bold text-gray-600 uppercase tracking-wider select-none">
                      Active Access
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                    Password
                  </label>
                  {editingUser && (
                    <span className="text-[10px] font-bold text-amber-600 flex items-center gap-0.5">
                      <Key size={11} /> Leave empty to keep existing
                    </span>
                  )}
                </div>
                <input
                  type="password"
                  required={!editingUser}
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder={editingUser ? "••••••••" : "Min 6 characters"}
                  className="w-full text-sm rounded-xl border border-gray-200 bg-white px-4 py-2.5 outline-none focus:border-[#82542a]"
                />
              </div>

              {errorMsg && (
                <div className="flex items-center gap-2 bg-red-50 text-red-700 p-2.5 rounded-xl border border-red-100 text-xs font-semibold animate-scale-up">
                  <AlertCircle size={14} className="shrink-0 text-red-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-500 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#170f0a] text-sm font-bold text-white hover:opacity-90 active:scale-[0.98] transition shadow-xs disabled:opacity-50"
                >
                  {modalLoading && <Loader2 className="animate-spin" size={14} />}
                  {editingUser ? "Save Details" : "Register Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
