"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminLayout from "../components/AdminLayout";
import CustomDropdown from "../components/CustomDropdown";
import {
  getEmployeesFromStorage,
  deleteEmployeeFromStorage,
  getDepartmentsFromStorage,
  EmployeeData,
  DepartmentItem,
} from "@/lib/firebase";
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  Calendar,
  Eye,
  Trash2,
  X,
  CreditCard,
  Building2,
  ShieldCheck,
  Briefcase,
} from "lucide-react";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("All");
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeData | null>(null);

  // Load employees & departments from Firebase / Storage
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [empData, deptsData] = await Promise.all([
          getEmployeesFromStorage(),
          getDepartmentsFromStorage(),
        ]);
        setEmployees(empData);
        setDepartments(deptsData);
      } catch (err) {
        console.error("Failed to load employees:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Delete employee handler
  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (confirm("Are you sure you want to delete this employee record?")) {
      await deleteEmployeeFromStorage(id);
      setEmployees((prev) => prev.filter((emp) => emp.id !== id));
      if (selectedEmployee?.id === id) {
        setSelectedEmployee(null);
      }
    }
  };

  // Filtered employees list
  const filteredEmployees = employees.filter((emp) => {
    const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      fullName.includes(query) ||
      emp.employeeId.toLowerCase().includes(query) ||
      emp.email.toLowerCase().includes(query) ||
      emp.mobileNumber.includes(query) ||
      emp.department.toLowerCase().includes(query);

    const matchesDept =
      selectedDepartment === "All" || emp.department === selectedDepartment;

    return matchesSearch && matchesDept;
  });

  const departmentDropdownOptions = ["All", ...departments.map((d) => d.name)];

  return (
    <AdminLayout>
      <div className="space-y-4">
        {/* Top Header & Actions Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#0B4FBA]/10 border border-[#0B4FBA]/20 rounded-lg text-[#0B4FBA]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">Employees</h1>
                <span className="bg-emerald-100 text-emerald-800 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
                  {employees.length} Active
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Manage staff profiles, documents, bank details, and emergency contacts.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            <Link
              href="/departments-roles"
              className="px-3.5 py-1.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center space-x-1.5"
            >
              <Building2 className="w-3.5 h-3.5 text-[#0B4FBA]" />
              <span>Departments & Roles</span>
            </Link>
            <Link
              href="/employees/add"
              className="px-3.5 py-1.5 bg-[#0B4FBA] hover:bg-[#003882] text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Employee</span>
            </Link>
          </div>
        </div>

        {/* KPI / Stats Overview Row */}
        <div className="bg-white rounded-xl border border-gray-200/80 shadow-2xs p-4 grid grid-cols-1 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-gray-200">
          <div className="pt-2 sm:pt-0 sm:pr-4">
            <div className="text-xs text-gray-500 font-medium">Total Staff</div>
            <div className="text-xl font-bold text-gray-900 mt-1">{employees.length}</div>
            <div className="text-[11px] text-gray-400 mt-0.5">Registered members</div>
          </div>

          <div className="pt-2 sm:pt-0 sm:px-4">
            <div className="text-xs text-gray-500 font-medium">Engineering & Tech</div>
            <div className="text-xl font-bold text-gray-900 mt-1">
              {employees.filter((e) => e.department === "Engineering").length}
            </div>
            <div className="text-[11px] text-gray-400 mt-0.5">Developers & Tech</div>
          </div>

          <div className="pt-2 sm:pt-0 sm:px-4">
            <div className="text-xs text-gray-500 font-medium">Design & Product</div>
            <div className="text-xl font-bold text-gray-900 mt-1">
              {employees.filter((e) => e.department === "UI/UX Design").length}
            </div>
            <div className="text-[11px] text-gray-400 mt-0.5">Product designers</div>
          </div>

          <div className="pt-2 sm:pt-0 sm:pl-4">
            <div className="text-xs text-gray-500 font-medium">Other Departments</div>
            <div className="text-xl font-bold text-gray-900 mt-1">
              {employees.filter((e) => e.department !== "Engineering" && e.department !== "UI/UX Design").length}
            </div>
            <div className="text-[11px] text-gray-400 mt-0.5">HR, Sales, Operations</div>
          </div>
        </div>

        {/* Main Data Container: Filter Toolbar & Employees List Table */}
        <div className="bg-white rounded-xl border border-gray-200/80 shadow-2xs overflow-hidden">
          {/* Search & Custom Department Filter */}
          <div className="p-3 border-b border-gray-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50/40">
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <span className="text-xs font-semibold text-gray-600 shrink-0">Filter Dept:</span>
              <div className="w-48">
                <CustomDropdown
                  options={departmentDropdownOptions}
                  value={selectedDepartment}
                  onChange={(val) => setSelectedDepartment(val)}
                  placeholder="All Departments"
                />
              </div>
            </div>

            <div className="relative flex-1 sm:w-64 w-full">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, ID, phone, email..."
                className="w-full pl-8 pr-3 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B4FBA]/30 bg-white"
              />
            </div>
          </div>

          {/* Table View */}
          {loading ? (
            <div className="p-12 text-center text-xs text-gray-500">Loading employees list...</div>
          ) : filteredEmployees.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Users className="w-10 h-10 text-gray-300 mx-auto" />
              <div className="text-sm font-semibold text-gray-700">No employees found</div>
              <p className="text-xs text-gray-500">Add your first employee to get started.</p>
              <Link
                href="/employees/add"
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#0B4FBA] text-white text-xs font-semibold rounded-lg"
              >
                <Plus className="w-4 h-4" />
                <span>Add Employee</span>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-[10px] font-bold border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Employee ID & Role</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Contact Details</th>
                    <th className="py-3 px-4">Date of Joining</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredEmployees.map((emp) => (
                    <tr key={emp.id || emp.employeeId} className="hover:bg-gray-50/70 transition-colors">
                      {/* Photo & Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <img
                            src={emp.profilePhotoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80"}
                            alt={`${emp.firstName} ${emp.lastName}`}
                            className="w-9 h-9 rounded-full object-cover border border-gray-200 shadow-2xs"
                          />
                          <div>
                            <div className="font-bold text-gray-900 text-sm">
                              {emp.firstName} {emp.lastName}
                            </div>
                            <div className="text-[11px] text-gray-500 font-mono">@{emp.username}</div>
                          </div>
                        </div>
                      </td>

                      {/* ID & Role */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-mono text-xs font-semibold text-[#0B4FBA] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {emp.employeeId}
                          </span>
                          <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200">
                            {emp.jobType || "Full-Time"}
                          </span>
                        </div>
                        <div className="text-gray-700 font-medium mt-1">{emp.employeeRole}</div>
                      </td>

                      {/* Department */}
                      <td className="py-3 px-4">
                        <span className="bg-gray-100 text-gray-700 font-medium px-2.5 py-1 rounded-md text-[11px]">
                          {emp.department}
                        </span>
                      </td>

                      {/* Contact */}
                      <td className="py-3 px-4 space-y-0.5">
                        <div className="flex items-center space-x-1.5 text-gray-700">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          <span>{emp.mobileNumber}</span>
                        </div>
                        <div className="flex items-center space-x-1.5 text-gray-500 text-[11px]">
                          <Mail className="w-3.5 h-3.5 text-gray-400" />
                          <span>{emp.email}</span>
                        </div>
                      </td>

                      {/* Date of Joining */}
                      <td className="py-3 px-4 text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          <span>{emp.dateOfJoining}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right space-x-1">
                        <button
                          onClick={() => setSelectedEmployee(emp)}
                          className="p-1.5 bg-blue-50 text-[#0B4FBA] hover:bg-blue-100 rounded-lg transition-colors"
                          title="View Employee Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(emp.id)}
                          className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors"
                          title="Delete Employee"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Employee Details Modal Drawer */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-xl overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-4 bg-gradient-to-r from-[#003882] to-[#0B4FBA] text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img
                  src={selectedEmployee.profilePhotoUrl}
                  alt={selectedEmployee.firstName}
                  className="w-12 h-12 rounded-full object-cover border-2 border-white"
                />
                <div>
                  <h3 className="text-base font-bold">
                    {selectedEmployee.firstName} {selectedEmployee.lastName}
                  </h3>
                  <div className="text-xs text-blue-100 flex items-center space-x-2">
                    <span className="font-mono bg-blue-900/60 px-1.5 py-0.5 rounded">
                      {selectedEmployee.employeeId}
                    </span>
                    <span className="bg-emerald-500/30 border border-emerald-300/40 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                      {selectedEmployee.jobType || "Full-Time"}
                    </span>
                    <span>• {selectedEmployee.employeeRole} ({selectedEmployee.department})</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedEmployee(null)}
                className="p-1 text-blue-100 hover:text-white hover:bg-blue-800/50 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-gray-700">
              {/* Personal & Contact Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div>
                  <span className="text-gray-400 font-semibold block text-[10px] uppercase">Mobile Number</span>
                  <span className="font-medium text-gray-900">{selectedEmployee.mobileNumber}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-semibold block text-[10px] uppercase">Email</span>
                  <span className="font-medium text-gray-900">{selectedEmployee.email}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-semibold block text-[10px] uppercase">Date of Birth</span>
                  <span className="font-medium text-gray-900">{selectedEmployee.dateOfBirth || "N/A"}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-semibold block text-[10px] uppercase">Aadhar Number</span>
                  <span className="font-mono font-medium text-gray-900">{selectedEmployee.aadharNumber}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-semibold block text-[10px] uppercase">PAN Number</span>
                  <span className="font-mono font-medium text-gray-900">{selectedEmployee.panCardNumber}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-semibold block text-[10px] uppercase">Address</span>
                  <span className="font-medium text-gray-900">{selectedEmployee.address}, {selectedEmployee.city} ({selectedEmployee.pincode})</span>
                </div>
              </div>

              {/* Uploaded ImageKit Documents */}
              <div className="space-y-3">
                <h4 className="font-bold text-gray-900 text-sm flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#0B4FBA]" />
                  <span>Uploaded Documents (ImageKit CDN)</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="border border-gray-200 rounded-lg p-2 text-center bg-gray-50">
                    <span className="font-semibold block mb-1 text-[11px]">Aadhar Front</span>
                    <img src={selectedEmployee.aadharFrontUrl} alt="Aadhar Front" className="w-full h-28 object-cover rounded" />
                  </div>
                  <div className="border border-gray-200 rounded-lg p-2 text-center bg-gray-50">
                    <span className="font-semibold block mb-1 text-[11px]">Aadhar Back</span>
                    <img src={selectedEmployee.aadharBackUrl} alt="Aadhar Back" className="w-full h-28 object-cover rounded" />
                  </div>
                  <div className="border border-gray-200 rounded-lg p-2 text-center bg-gray-50">
                    <span className="font-semibold block mb-1 text-[11px]">PAN Card</span>
                    <img src={selectedEmployee.panCardUrl} alt="PAN Card" className="w-full h-28 object-cover rounded" />
                  </div>
                </div>
              </div>

              {/* Bank Account Information */}
              <div className="space-y-2 border-t border-gray-200 pt-4">
                <h4 className="font-bold text-gray-900 text-sm flex items-center space-x-1.5">
                  <CreditCard className="w-4 h-4 text-[#0B4FBA]" />
                  <span>Bank Account Information</span>
                </h4>
                <div className="grid grid-cols-3 gap-3 bg-blue-50/50 p-3 rounded-lg border border-blue-200/60">
                  <div>
                    <span className="text-gray-500 text-[10px] block">Bank Name</span>
                    <span className="font-semibold text-gray-900">{selectedEmployee.bankName || "Not Provided"}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 text-[10px] block">Account Number</span>
                    <span className="font-mono font-semibold text-gray-900">{selectedEmployee.bankAccountNumber || "Not Provided"}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 text-[10px] block">IFSC Code</span>
                    <span className="font-mono font-semibold text-gray-900">{selectedEmployee.bankIfscCode || "Not Provided"}</span>
                  </div>
                </div>
              </div>

              {/* Emergency Contacts */}
              <div className="space-y-2 border-t border-gray-200 pt-4">
                <h4 className="font-bold text-gray-900 text-sm flex items-center space-x-1.5">
                  <Phone className="w-4 h-4 text-[#0B4FBA]" />
                  <span>Emergency Contacts</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-1">
                    <div className="font-bold text-[#0B4FBA]">Contact 1: {selectedEmployee.emergencyContact1.name || "N/A"}</div>
                    <div>Relation: {selectedEmployee.emergencyContact1.relation}</div>
                    <div>Mobile: {selectedEmployee.emergencyContact1.mobileNumber}</div>
                    <div>Occupation: {selectedEmployee.emergencyContact1.occupation}</div>
                    <div className="text-gray-500">{selectedEmployee.emergencyContact1.address}</div>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-1">
                    <div className="font-bold text-[#0B4FBA]">Contact 2: {selectedEmployee.emergencyContact2.name || "N/A"}</div>
                    <div>Relation: {selectedEmployee.emergencyContact2.relation}</div>
                    <div>Mobile: {selectedEmployee.emergencyContact2.mobileNumber}</div>
                    <div>Occupation: {selectedEmployee.emergencyContact2.occupation}</div>
                    <div className="text-gray-500">{selectedEmployee.emergencyContact2.address}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
