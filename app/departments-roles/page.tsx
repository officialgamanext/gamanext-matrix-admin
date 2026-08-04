"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminLayout from "../components/AdminLayout";
import {
  getDepartmentsFromStorage,
  saveDepartmentToStorage,
  deleteDepartmentFromStorage,
  getRolesFromStorage,
  saveRoleToStorage,
  deleteRoleFromStorage,
  getEmployeesFromStorage,
  DepartmentItem,
  RoleItem,
  EmployeeData,
} from "@/lib/firebase";
import {
  Building2,
  Briefcase,
  Plus,
  Trash2,
  ArrowLeft,
  Search,
  Loader2,
} from "lucide-react";

export default function DepartmentsRolesPage() {
  const [activeTab, setActiveTab] = useState<"departments" | "roles">("departments");

  // Storage Data
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [employees, setEmployees] = useState<EmployeeData[]>([]);

  const [loading, setLoading] = useState(true);

  // New item inputs
  const [newDepartmentName, setNewDepartmentName] = useState("");
  const [newRoleName, setNewRoleName] = useState("");
  const [adding, setAdding] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");

  // Load data on mount
  useEffect(() => {
    async function loadAllData() {
      setLoading(true);
      try {
        const [deptsData, rolesData, empData] = await Promise.all([
          getDepartmentsFromStorage(),
          getRolesFromStorage(),
          getEmployeesFromStorage(),
        ]);
        setDepartments(deptsData);
        setRoles(rolesData);
        setEmployees(empData);
      } catch (err) {
        console.error("Failed to load departments & roles data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadAllData();
  }, []);

  // Add Department handler
  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDepartmentName.trim()) return;

    setAdding(true);
    try {
      const created = await saveDepartmentToStorage(newDepartmentName.trim());
      setDepartments((prev) => [...prev, created]);
      setNewDepartmentName("");
    } catch (err) {
      console.error("Failed to add department:", err);
    } finally {
      setAdding(false);
    }
  };

  // Add Role handler
  const handleAddRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;

    setAdding(true);
    try {
      const created = await saveRoleToStorage(newRoleName.trim());
      setRoles((prev) => [...prev, created]);
      setNewRoleName("");
    } catch (err) {
      console.error("Failed to add role:", err);
    } finally {
      setAdding(false);
    }
  };

  // Delete Department
  const handleDeleteDepartment = async (id?: string) => {
    if (!id) return;
    if (confirm("Are you sure you want to delete this department?")) {
      await deleteDepartmentFromStorage(id);
      setDepartments((prev) => prev.filter((d) => d.id !== id));
    }
  };

  // Delete Role
  const handleDeleteRole = async (id?: string) => {
    if (!id) return;
    if (confirm("Are you sure you want to delete this employee role?")) {
      await deleteRoleFromStorage(id);
      setRoles((prev) => prev.filter((r) => r.id !== id));
    }
  };

  // Filtered lists
  const filteredDepartments = departments.filter((d) =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRoles = roles.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-4">
        {/* Page Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200/80 shadow-2xs">
          <div className="flex items-center space-x-3">
            <Link
              href="/employees"
              className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                  Departments & Employee Roles
                </h1>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Configure dynamic departments and roles used in employee onboarding & search filters.
              </p>
            </div>
          </div>

          <Link
            href="/employees/add"
            className="px-3.5 py-1.5 bg-[#0B4FBA] hover:bg-[#003882] text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center space-x-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Employee</span>
          </Link>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl border border-gray-200/80 p-2 flex items-center justify-between shadow-2xs">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setActiveTab("departments");
                setSearchQuery("");
              }}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center space-x-2 ${
                activeTab === "departments"
                  ? "bg-[#0B4FBA] text-white shadow-xs"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Departments ({departments.length})</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("roles");
                setSearchQuery("");
              }}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center space-x-2 ${
                activeTab === "roles"
                  ? "bg-[#0B4FBA] text-white shadow-xs"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>Employee Roles ({roles.length})</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="relative w-48 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${activeTab}...`}
              className="w-full pl-8 pr-3 py-1 text-xs border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#0B4FBA]/30 bg-white"
            />
          </div>
        </div>

        {/* TAB 1: DEPARTMENTS SECTION */}
        {activeTab === "departments" && (
          <div className="space-y-4">
            {/* Add Department Inline Form */}
            <form
              onSubmit={handleAddDepartment}
              className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-2xs flex flex-col sm:flex-row items-center gap-3"
            >
              <div className="flex-1 w-full">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Add New Department
                </label>
                <input
                  type="text"
                  required
                  autoComplete="off"
                  spellCheck={false}
                  value={newDepartmentName}
                  onChange={(e) => setNewDepartmentName(e.target.value)}
                  placeholder="e.g. Marketing & Growth / Quality Assurance / Legal"
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#0B4FBA]/30 bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={adding || !newDepartmentName.trim()}
                className="px-4 py-2 bg-[#0B4FBA] hover:bg-[#003882] text-white text-xs font-semibold rounded-lg shadow-xs transition-all flex items-center space-x-1.5 self-end disabled:opacity-50"
              >
                {adding ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                <span>Save Department</span>
              </button>
            </form>

            {/* Department List Table */}
            <div className="bg-white rounded-xl border border-gray-200/80 shadow-2xs overflow-hidden">
              {loading ? (
                <div className="p-8 text-center text-xs text-gray-500">Loading departments...</div>
              ) : filteredDepartments.length === 0 ? (
                <div className="p-12 text-center space-y-2">
                  <Building2 className="w-8 h-8 text-gray-300 mx-auto" />
                  <div className="text-sm font-semibold text-gray-700">No departments found</div>
                  <p className="text-xs text-gray-400">
                    Use the form above to add your first department.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-[10px] font-bold border-b border-gray-200">
                      <tr>
                        <th className="py-3 px-4">Department Name</th>
                        <th className="py-3 px-4">Assigned Employees</th>
                        <th className="py-3 px-4">Created Date</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredDepartments.map((dept) => {
                        const count = employees.filter((e) => e.department === dept.name).length;
                        return (
                          <tr key={dept.id || dept.name} className="hover:bg-gray-50/70 transition-colors">
                            <td className="py-3 px-4 font-bold text-gray-900 flex items-center space-x-2">
                              <Building2 className="w-4 h-4 text-[#0B4FBA]" />
                              <span>{dept.name}</span>
                            </td>

                            <td className="py-3 px-4">
                              <span className="bg-blue-50 text-[#0B4FBA] font-semibold px-2 py-0.5 rounded border border-blue-200/60">
                                {count} Employees
                              </span>
                            </td>

                            <td className="py-3 px-4 text-gray-500">
                              {dept.createdAt
                                ? new Date(dept.createdAt).toLocaleDateString()
                                : "Created"}
                            </td>

                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => handleDeleteDepartment(dept.id)}
                                className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors"
                                title="Delete Department"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: EMPLOYEE ROLES SECTION */}
        {activeTab === "roles" && (
          <div className="space-y-4">
            {/* Add Role Inline Form */}
            <form
              onSubmit={handleAddRole}
              className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-2xs flex flex-col sm:flex-row items-center gap-3"
            >
              <div className="flex-1 w-full">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Add New Employee Role
                </label>
                <input
                  type="text"
                  required
                  autoComplete="off"
                  spellCheck={false}
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="e.g. Lead System Architect / QA Engineer / Talent Acquisition Specialist"
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#0B4FBA]/30 bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={adding || !newRoleName.trim()}
                className="px-4 py-2 bg-[#0B4FBA] hover:bg-[#003882] text-white text-xs font-semibold rounded-lg shadow-xs transition-all flex items-center space-x-1.5 self-end disabled:opacity-50"
              >
                {adding ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                <span>Save Role</span>
              </button>
            </form>

            {/* Roles List Table */}
            <div className="bg-white rounded-xl border border-gray-200/80 shadow-2xs overflow-hidden">
              {loading ? (
                <div className="p-8 text-center text-xs text-gray-500">Loading roles...</div>
              ) : filteredRoles.length === 0 ? (
                <div className="p-12 text-center space-y-2">
                  <Briefcase className="w-8 h-8 text-gray-300 mx-auto" />
                  <div className="text-sm font-semibold text-gray-700">No employee roles found</div>
                  <p className="text-xs text-gray-400">
                    Use the form above to add your first employee role.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-[10px] font-bold border-b border-gray-200">
                      <tr>
                        <th className="py-3 px-4">Role Name</th>
                        <th className="py-3 px-4">Active Staff</th>
                        <th className="py-3 px-4">Created Date</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredRoles.map((role) => {
                        const count = employees.filter((e) => e.employeeRole === role.name).length;
                        return (
                          <tr key={role.id || role.name} className="hover:bg-gray-50/70 transition-colors">
                            <td className="py-3 px-4 font-bold text-gray-900 flex items-center space-x-2">
                              <Briefcase className="w-4 h-4 text-[#0B4FBA]" />
                              <span>{role.name}</span>
                            </td>

                            <td className="py-3 px-4">
                              <span className="bg-blue-50 text-[#0B4FBA] font-semibold px-2 py-0.5 rounded border border-blue-200/60">
                                {count} Members
                              </span>
                            </td>

                            <td className="py-3 px-4 text-gray-500">
                              {role.createdAt
                                ? new Date(role.createdAt).toLocaleDateString()
                                : "Created"}
                            </td>

                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => handleDeleteRole(role.id)}
                                className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors"
                                title="Delete Role"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
