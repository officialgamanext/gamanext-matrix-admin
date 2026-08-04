"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminLayout from "../../components/AdminLayout";
import CustomDropdown from "../../components/CustomDropdown";
import CustomDatePicker from "../../components/CustomDatePicker";
import {
  getEmployeeByIdFromStorage,
  updateEmployeeInStorage,
  getProjectsForEmployee,
  saveProjectForEmployee,
  getLeavesForEmployee,
  saveLeaveForEmployee,
  updateLeaveStatusInStorage,
  getWFHForEmployee,
  saveWFHForEmployee,
  updateWFHStatusInStorage,
  getTimesheetsForEmployee,
  saveTimesheetForEmployee,
  getDepartmentsFromStorage,
  getRolesFromStorage,
  getMasterProjectsFromStorage,
  EmployeeData,
  ProjectAllocation,
  LeaveRequest,
  WFHRequest,
  TimesheetEntry,
  MasterProjectItem,
} from "@/lib/firebase";
import {
  ArrowLeft,
  User,
  Briefcase,
  Calendar,
  Home,
  Clock,
  DollarSign,
  ShieldCheck,
  CreditCard,
  PhoneCall,
  Edit3,
  Plus,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Building2,
  Save,
  Lock,
  FolderKanban,
} from "lucide-react";

// Helper to determine fiscal quarter based on month (1-indexed)
// Q1: Apr (4), May (5), Jun (6)
// Q2: Jul (7), Aug (8), Sep (9)
// Q3: Oct (10), Nov (11), Dec (12)
// Q4: Jan (1), Feb (2), Mar (3)
function getQuarterFromDateStr(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "Q1";
  const month = date.getMonth() + 1; // 1 to 12

  if (month >= 4 && month <= 6) return "Q1";
  if (month >= 7 && month <= 9) return "Q2";
  if (month >= 10 && month <= 12) return "Q3";
  return "Q4"; // 1, 2, 3
}

export default function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const employeeIdParam = resolvedParams.id;
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<
    "profile" | "projects" | "leaves" | "wfh" | "timesheet" | "salary"
  >("profile");

  const [employee, setEmployee] = useState<EmployeeData | null>(null);
  const [loading, setLoading] = useState(true);

  // Dynamic Options
  const [departments, setDepartments] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [masterProjects, setMasterProjects] = useState<MasterProjectItem[]>([]);

  // Profile Edit Mode state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<EmployeeData>>({});
  const [savingProfile, setSavingProfile] = useState(false);

  // Tab 2: Projects
  const [projects, setProjects] = useState<ProjectAllocation[]>([]);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectRole, setNewProjectRole] = useState("");
  const [newProjectStartDate, setNewProjectStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [addingProject, setAddingProject] = useState(false);

  // Tab 3: Leaves
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [leaveFromDate, setLeaveFromDate] = useState("");
  const [leaveToDate, setLeaveToDate] = useState("");
  const [leaveType, setLeaveType] = useState<
    "Casual Leave" | "Sick Leave" | "Maternity Leave" | "Paternity Leave"
  >("Casual Leave");
  const [leaveReason, setLeaveReason] = useState("");
  const [addingLeave, setAddingLeave] = useState(false);

  // Tab 4: Work From Home
  const [wfhList, setWfhList] = useState<WFHRequest[]>([]);
  const [wfhFromDate, setWfhFromDate] = useState("");
  const [wfhToDate, setWfhToDate] = useState("");
  const [wfhMonth, setWfhMonth] = useState("Current Month");
  const [wfhReason, setWfhReason] = useState("");
  const [addingWfh, setAddingWfh] = useState(false);

  // Tab 5: Timesheet
  const [timesheets, setTimesheets] = useState<TimesheetEntry[]>([]);
  const todayStr = new Date().toISOString().split("T")[0];
  const [tsProject, setTsProject] = useState("");
  const [tsHours, setTsHours] = useState("8");
  const [tsTasks, setTsTasks] = useState("");
  const [addingTs, setAddingTs] = useState(false);

  // Load employee details and tab datasets
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const emp = await getEmployeeByIdFromStorage(employeeIdParam);
        if (emp) {
          setEmployee(emp);
          setEditFormData(emp);

          const empKey = emp.id || emp.employeeId;
          const [projData, leaveData, wfhData, tsData, deptsData, rolesData, mProjects] =
            await Promise.all([
              getProjectsForEmployee(empKey),
              getLeavesForEmployee(empKey),
              getWFHForEmployee(empKey),
              getTimesheetsForEmployee(empKey),
              getDepartmentsFromStorage(),
              getRolesFromStorage(),
              getMasterProjectsFromStorage(),
            ]);

          setProjects(projData);
          setLeaves(leaveData);
          setWfhList(wfhData);
          setTimesheets(tsData);
          setDepartments(deptsData.map((d) => d.name));
          setRoles(rolesData.map((r) => r.name));
          setMasterProjects(mProjects);

          if (mProjects.length > 0) {
            setNewProjectName(mProjects[0].name);
            setTsProject(mProjects[0].name);
          } else if (projData.length > 0) {
            setTsProject(projData[0].projectName);
          }
        }
      } catch (err) {
        console.error("Failed to load employee details:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [employeeIdParam]);

  // Profile Save Handler
  const handleSaveProfile = async () => {
    if (!employee) return;
    setSavingProfile(true);
    try {
      const empKey = employee.id || employee.employeeId;
      await updateEmployeeInStorage(empKey, editFormData);
      setEmployee((prev) => (prev ? { ...prev, ...editFormData } : null));
      setIsEditingProfile(false);
      alert("Employee profile updated successfully!");
    } catch (err) {
      console.error("Update profile error:", err);
      alert("Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  // Assign Project Handler
  const handleAssignProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee || !newProjectName.trim()) return;

    setAddingProject(true);
    try {
      const empKey = employee.id || employee.employeeId;
      const created = await saveProjectForEmployee({
        employeeId: empKey,
        projectName: newProjectName.trim(),
        role: newProjectRole || employee.employeeRole,
        startDate: newProjectStartDate,
        status: "Active",
      });
      setProjects((prev) => [created, ...prev]);
      setNewProjectRole("");
      if (!tsProject) setTsProject(created.projectName);
    } catch (err) {
      console.error("Assign project error:", err);
    } finally {
      setAddingProject(false);
    }
  };

  // Submit Leave Request Handler
  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee || !leaveFromDate || !leaveToDate || !leaveReason.trim()) {
      alert("Please fill in leave dates and reason.");
      return;
    }

    const quarter = getQuarterFromDateStr(leaveFromDate);
    const start = new Date(leaveFromDate);
    const end = new Date(leaveToDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const daysCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const quarterLeaves = leaves.filter(
      (l) => l.quarter === quarter && l.status !== "Rejected"
    );

    const casualCount = quarterLeaves
      .filter((l) => l.leaveType === "Casual Leave")
      .reduce((acc, l) => acc + l.daysCount, 0);

    const sickCount = quarterLeaves
      .filter((l) => l.leaveType === "Sick Leave")
      .reduce((acc, l) => acc + l.daysCount, 0);

    if (leaveType === "Casual Leave" && casualCount + daysCount > 2) {
      alert(
        `Quota Exceeded! Maximum 2 Casual Leaves allowed in ${quarter}. (Current count: ${casualCount} days)`
      );
      return;
    }

    if (leaveType === "Sick Leave" && sickCount + daysCount > 2) {
      alert(
        `Quota Exceeded! Maximum 2 Sick Leaves allowed in ${quarter}. (Current count: ${sickCount} days)`
      );
      return;
    }

    setAddingLeave(true);
    try {
      const empKey = employee.id || employee.employeeId;
      const created = await saveLeaveForEmployee({
        employeeId: empKey,
        fromDate: leaveFromDate,
        toDate: leaveToDate,
        leaveType,
        reason: leaveReason.trim(),
        status: "Pending",
        quarter,
        daysCount,
      });

      setLeaves((prev) => [created, ...prev]);
      setLeaveFromDate("");
      setLeaveToDate("");
      setLeaveReason("");
    } catch (err) {
      console.error("Apply leave error:", err);
    } finally {
      setAddingLeave(false);
    }
  };

  // Leave Approval Handler
  const handleLeaveStatus = async (
    leaveId?: string,
    status?: "Approved" | "Rejected"
  ) => {
    if (!leaveId || !status) return;
    await updateLeaveStatusInStorage(leaveId, status);
    setLeaves((prev) =>
      prev.map((l) => (l.id === leaveId ? { ...l, status } : l))
    );
  };

  // Submit WFH Handler
  const handleApplyWfh = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee || !wfhFromDate || !wfhToDate || !wfhReason.trim()) {
      alert("Please fill in WFH dates and reason.");
      return;
    }

    setAddingWfh(true);
    try {
      const empKey = employee.id || employee.employeeId;
      const created = await saveWFHForEmployee({
        employeeId: empKey,
        fromDate: wfhFromDate,
        toDate: wfhToDate,
        month: wfhMonth,
        reason: wfhReason.trim(),
        status: "Pending",
      });

      setWfhList((prev) => [created, ...prev]);
      setWfhFromDate("");
      setWfhToDate("");
      setWfhReason("");
    } catch (err) {
      console.error("Apply WFH error:", err);
    } finally {
      setAddingWfh(false);
    }
  };

  // WFH Approval Handler
  const handleWfhStatus = async (
    wfhId?: string,
    status?: "Approved" | "Rejected"
  ) => {
    if (!wfhId || !status) return;
    await updateWFHStatusInStorage(wfhId, status);
    setWfhList((prev) =>
      prev.map((w) => (w.id === wfhId ? { ...w, status } : w))
    );
  };

  // Save Timesheet Handler
  const handleSaveTimesheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee || !tsTasks.trim()) {
      alert("Please describe your work tasks for today.");
      return;
    }

    setAddingTs(true);
    try {
      const empKey = employee.id || employee.employeeId;
      const created = await saveTimesheetForEmployee({
        employeeId: empKey,
        date: todayStr,
        projectName: tsProject || "Internal / Operations",
        billingHours: parseFloat(tsHours) || 8,
        tasks: tsTasks.trim(),
      });

      setTimesheets((prev) => [created, ...prev]);
      setTsTasks("");
    } catch (err) {
      console.error("Save timesheet error:", err);
    } finally {
      setAddingTs(false);
    }
  };

  // Combine master projects and assigned projects for dropdowns
  const masterProjectNames = masterProjects.map((mp) => mp.name);
  const projectDropdownOptions =
    masterProjectNames.length > 0
      ? masterProjectNames
      : ["GamaNext Core ERP", "CRM Redesign", "Mobile App Dev"];

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-12 text-center text-xs text-gray-500 flex flex-col items-center space-y-2">
          <Loader2 className="w-6 h-6 animate-spin text-[#0B4FBA]" />
          <span>Loading employee profile...</span>
        </div>
      </AdminLayout>
    );
  }

  if (!employee) {
    return (
      <AdminLayout>
        <div className="p-12 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-base font-bold text-gray-900">Employee Not Found</h2>
          <p className="text-xs text-gray-500">The employee record could not be retrieved.</p>
          <Link
            href="/employees"
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#0B4FBA] text-white text-xs font-semibold rounded-lg"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Employees</span>
          </Link>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-4 pb-12">
        {/* Page Top Header Card */}
        <div className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <Link
              href="/employees"
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <img
              src={
                employee.profilePhotoUrl ||
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80"
              }
              alt={employee.firstName}
              className="w-14 h-14 rounded-full object-cover border-2 border-[#0B4FBA]/20 shadow-xs shrink-0"
            />
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                  {employee.firstName} {employee.lastName}
                </h1>
                <span className="font-mono text-xs font-bold text-[#0B4FBA] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {employee.employeeId}
                </span>
                <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                  {employee.jobType || "Full-Time"}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1 flex flex-wrap items-center gap-3">
                <span>
                  <strong className="text-gray-700">Role:</strong> {employee.employeeRole}
                </span>
                <span>•</span>
                <span>
                  <strong className="text-gray-700">Dept:</strong> {employee.department}
                </span>
                <span>•</span>
                <span>
                  <strong className="text-gray-700">Username:</strong> @{employee.username}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsEditingProfile(!isEditingProfile)}
              className="px-3.5 py-1.5 bg-blue-50 text-[#0B4FBA] border border-blue-200 hover:bg-blue-100 text-xs font-semibold rounded-lg transition-all flex items-center space-x-1.5 shadow-2xs"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditingProfile ? "Cancel Edit" : "Edit Profile"}</span>
            </button>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="bg-white rounded-xl border border-gray-200/80 p-1.5 flex items-center space-x-1 overflow-x-auto shadow-2xs">
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === "profile"
                ? "bg-[#0B4FBA] text-white shadow-xs"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile Details</span>
          </button>

          <button
            onClick={() => setActiveTab("projects")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === "projects"
                ? "bg-[#0B4FBA] text-white shadow-xs"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Project Allocation ({projects.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("leaves")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === "leaves"
                ? "bg-[#0B4FBA] text-white shadow-xs"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Leaves ({leaves.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("wfh")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === "wfh"
                ? "bg-[#0B4FBA] text-white shadow-xs"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Work From Home ({wfhList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("timesheet")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === "timesheet"
                ? "bg-[#0B4FBA] text-white shadow-xs"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Timesheet ({timesheets.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("salary")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === "salary"
                ? "bg-[#0B4FBA] text-white shadow-xs"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Salary & Payroll</span>
          </button>
        </div>

        {/* TAB 1: PROFILE DETAILS & EDIT */}
        {activeTab === "profile" && (
          <div className="space-y-4">
            {isEditingProfile ? (
              /* EDIT PROFILE FORM */
              <div className="bg-white p-6 rounded-xl border border-gray-200/80 shadow-2xs space-y-6">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <h2 className="text-base font-bold text-gray-900 flex items-center space-x-2">
                    <Edit3 className="w-4 h-4 text-[#0B4FBA]" />
                    <span>Edit Employee Profile</span>
                  </h2>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setIsEditingProfile(false)}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      disabled={savingProfile}
                      className="px-3.5 py-1.5 bg-[#0B4FBA] hover:bg-[#003882] text-white text-xs font-semibold rounded-lg shadow-sm flex items-center space-x-1.5 disabled:opacity-50"
                    >
                      {savingProfile ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Save className="w-3.5 h-3.5" />
                      )}
                      <span>Save Changes</span>
                    </button>
                  </div>
                </div>

                {/* Edit Form Fields Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">First Name</label>
                    <input
                      type="text"
                      value={editFormData.firstName || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B4FBA]/30 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      value={editFormData.lastName || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B4FBA]/30 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Mobile Number</label>
                    <input
                      type="tel"
                      value={editFormData.mobileNumber || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, mobileNumber: e.target.value })}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B4FBA]/30 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={editFormData.email || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B4FBA]/30 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      value={editFormData.city || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B4FBA]/30 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Pincode</label>
                    <input
                      type="text"
                      value={editFormData.pincode || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, pincode: e.target.value })}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B4FBA]/30 outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-gray-700 mb-1">Address</label>
                    <input
                      type="text"
                      value={editFormData.address || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B4FBA]/30 outline-none"
                    />
                  </div>

                  {/* Bank Details Edit */}
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={editFormData.bankName || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, bankName: e.target.value })}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B4FBA]/30 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Bank Account No</label>
                    <input
                      type="text"
                      value={editFormData.bankAccountNumber || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, bankAccountNumber: e.target.value })}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B4FBA]/30 outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Bank IFSC Code</label>
                    <input
                      type="text"
                      value={editFormData.bankIfscCode || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, bankIfscCode: e.target.value })}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B4FBA]/30 outline-none uppercase font-mono"
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* VIEW PROFILE CARD */
              <div className="space-y-4 text-xs text-gray-700">
                {/* Personal & Contact Grid */}
                <div className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-2xs space-y-3">
                  <div className="flex items-center space-x-2 border-b border-gray-100 pb-2.5">
                    <User className="w-4 h-4 text-[#0B4FBA]" />
                    <h2 className="text-sm font-bold text-gray-900">Personal Information</h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-4 bg-gray-50/70 p-4 rounded-xl border border-gray-200/60">
                    <div>
                      <span className="text-gray-400 font-semibold block text-[10px] uppercase">Mobile Number</span>
                      <span className="font-medium text-gray-900">{employee.mobileNumber}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-semibold block text-[10px] uppercase">Email Address</span>
                      <span className="font-medium text-gray-900">{employee.email}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-semibold block text-[10px] uppercase">Date of Birth</span>
                      <span className="font-medium text-gray-900">{employee.dateOfBirth || "Not Provided"}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-semibold block text-[10px] uppercase">Date of Joining</span>
                      <span className="font-medium text-gray-900">{employee.dateOfJoining}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-semibold block text-[10px] uppercase">Aadhar Number</span>
                      <span className="font-mono font-medium text-gray-900">{employee.aadharNumber}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-semibold block text-[10px] uppercase">PAN Card Number</span>
                      <span className="font-mono font-medium text-gray-900">{employee.panCardNumber}</span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-gray-400 font-semibold block text-[10px] uppercase">Address</span>
                      <span className="font-medium text-gray-900">{employee.address}, {employee.city} ({employee.pincode})</span>
                    </div>
                  </div>
                </div>

                {/* Document Uploads from ImageKit */}
                <div className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-2xs space-y-3">
                  <div className="flex items-center space-x-2 border-b border-gray-100 pb-2.5">
                    <ShieldCheck className="w-4 h-4 text-[#0B4FBA]" />
                    <h2 className="text-sm font-bold text-gray-900">Uploaded Verification Documents (ImageKit CDN)</h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="border border-gray-200 rounded-lg p-2.5 text-center bg-gray-50">
                      <span className="font-semibold block mb-1.5 text-[11px] text-gray-700">Aadhar Card (Front)</span>
                      <img
                        src={employee.aadharFrontUrl}
                        alt="Aadhar Front"
                        className="w-full h-36 object-cover rounded-md border border-gray-200"
                      />
                    </div>
                    <div className="border border-gray-200 rounded-lg p-2.5 text-center bg-gray-50">
                      <span className="font-semibold block mb-1.5 text-[11px] text-gray-700">Aadhar Card (Back)</span>
                      <img
                        src={employee.aadharBackUrl}
                        alt="Aadhar Back"
                        className="w-full h-36 object-cover rounded-md border border-gray-200"
                      />
                    </div>
                    <div className="border border-gray-200 rounded-lg p-2.5 text-center bg-gray-50">
                      <span className="font-semibold block mb-1.5 text-[11px] text-gray-700">PAN Card Photo</span>
                      <img
                        src={employee.panCardUrl}
                        alt="PAN Card"
                        className="w-full h-36 object-cover rounded-md border border-gray-200"
                      />
                    </div>
                  </div>
                </div>

                {/* Bank Account Info */}
                <div className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-2xs space-y-3">
                  <div className="flex items-center space-x-2 border-b border-gray-100 pb-2.5">
                    <CreditCard className="w-4 h-4 text-[#0B4FBA]" />
                    <h2 className="text-sm font-bold text-gray-900">Bank Account Information</h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-blue-50/40 p-4 rounded-xl border border-blue-200/50">
                    <div>
                      <span className="text-gray-500 text-[10px] block font-semibold uppercase">Bank Name</span>
                      <span className="font-semibold text-gray-900 text-sm">{employee.bankName || "Not Provided"}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 text-[10px] block font-semibold uppercase">Account Number</span>
                      <span className="font-mono font-semibold text-gray-900 text-sm">{employee.bankAccountNumber || "Not Provided"}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 text-[10px] block font-semibold uppercase">IFSC Code</span>
                      <span className="font-mono font-semibold text-gray-900 text-sm">{employee.bankIfscCode || "Not Provided"}</span>
                    </div>
                  </div>
                </div>

                {/* Emergency Contacts */}
                <div className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-2xs space-y-3">
                  <div className="flex items-center space-x-2 border-b border-gray-100 pb-2.5">
                    <PhoneCall className="w-4 h-4 text-[#0B4FBA]" />
                    <h2 className="text-sm font-bold text-gray-900">Emergency Contacts</h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                      <div className="font-bold text-[#0B4FBA] text-sm">Contact 1: {employee.emergencyContact1.name || "N/A"}</div>
                      <div><strong className="text-gray-600">Relation:</strong> {employee.emergencyContact1.relation}</div>
                      <div><strong className="text-gray-600">Mobile:</strong> {employee.emergencyContact1.mobileNumber}</div>
                      <div><strong className="text-gray-600">Occupation:</strong> {employee.emergencyContact1.occupation}</div>
                      <div className="text-gray-500 mt-1">{employee.emergencyContact1.address}</div>
                    </div>

                    <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                      <div className="font-bold text-[#0B4FBA] text-sm">Contact 2: {employee.emergencyContact2.name || "N/A"}</div>
                      <div><strong className="text-gray-600">Relation:</strong> {employee.emergencyContact2.relation}</div>
                      <div><strong className="text-gray-600">Mobile:</strong> {employee.emergencyContact2.mobileNumber}</div>
                      <div><strong className="text-gray-600">Occupation:</strong> {employee.emergencyContact2.occupation}</div>
                      <div className="text-gray-500 mt-1">{employee.emergencyContact2.address}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PROJECT ALLOCATION */}
        {activeTab === "projects" && (
          <div className="space-y-4">
            {/* Assign Project Form */}
            <form
              onSubmit={handleAssignProject}
              className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-2xs space-y-3"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <div className="flex items-center space-x-2">
                  <Briefcase className="w-4 h-4 text-[#0B4FBA]" />
                  <h2 className="text-sm font-bold text-gray-900">Assign New Project</h2>
                </div>
                <Link
                  href="/projects"
                  className="text-xs text-[#0B4FBA] hover:underline font-semibold flex items-center space-x-1"
                >
                  <FolderKanban className="w-3.5 h-3.5" />
                  <span>+ Manage Projects</span>
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Select Project</label>
                  <CustomDropdown
                    options={projectDropdownOptions}
                    value={newProjectName}
                    onChange={(val) => setNewProjectName(val)}
                    placeholder="Select project"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Role in Project</label>
                  <input
                    type="text"
                    autoComplete="off"
                    value={newProjectRole}
                    onChange={(e) => setNewProjectRole(e.target.value)}
                    placeholder={`e.g. ${employee.employeeRole}`}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#0B4FBA]/30 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Allocation Start Date</label>
                  <CustomDatePicker
                    value={newProjectStartDate}
                    onChange={(val) => setNewProjectStartDate(val)}
                    placeholder="Select start date"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={addingProject || !newProjectName.trim()}
                  className="px-4 py-1.5 bg-[#0B4FBA] hover:bg-[#003882] text-white text-xs font-semibold rounded-lg shadow-xs transition-all flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {addingProject ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  <span>Assign Project</span>
                </button>
              </div>
            </form>

            {/* Assignment History Table */}
            <div className="bg-white rounded-xl border border-gray-200/80 shadow-2xs overflow-hidden">
              <div className="p-3 border-b border-gray-100 font-bold text-xs text-gray-800 bg-gray-50/50">
                Project Assignment History ({projects.length})
              </div>

              {projects.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-400">
                  No projects assigned yet. Use the form above to assign a project.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-[10px] font-bold border-b border-gray-200">
                      <tr>
                        <th className="py-3 px-4">Project Name</th>
                        <th className="py-3 px-4">Role</th>
                        <th className="py-3 px-4">Start Date</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {projects.map((proj, idx) => (
                        <tr key={proj.id || idx} className="hover:bg-gray-50/70 transition-colors">
                          <td className="py-3 px-4 font-bold text-gray-900 flex items-center space-x-2">
                            <FolderKanban className="w-4 h-4 text-[#0B4FBA]" />
                            <span>{proj.projectName}</span>
                          </td>
                          <td className="py-3 px-4 text-gray-700">{proj.role}</td>
                          <td className="py-3 px-4 text-gray-600">{proj.startDate}</td>
                          <td className="py-3 px-4">
                            <span className="bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                              {proj.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: LEAVES (Quarter Quota & Approval Workflow) */}
        {activeTab === "leaves" && (
          <div className="space-y-4">
            {/* Quarter Allowance Information Card */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-xl p-4 text-xs text-blue-900 space-y-2">
              <div className="font-bold text-sm text-[#0B4FBA] flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-[#0B4FBA]" />
                <span>Quarter-Based Leave Rules & Quotas</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-1">
                <div className="bg-white/80 p-2 rounded-lg border border-blue-100">
                  <strong className="block text-[#0B4FBA]">Q1 (Apr, May, Jun)</strong>
                  <span>Max 2 Casual, 2 Sick</span>
                </div>
                <div className="bg-white/80 p-2 rounded-lg border border-blue-100">
                  <strong className="block text-[#0B4FBA]">Q2 (Jul, Aug, Sep)</strong>
                  <span>Max 2 Casual, 2 Sick</span>
                </div>
                <div className="bg-white/80 p-2 rounded-lg border border-blue-100">
                  <strong className="block text-[#0B4FBA]">Q3 (Oct, Nov, Dec)</strong>
                  <span>Max 2 Casual, 2 Sick</span>
                </div>
                <div className="bg-white/80 p-2 rounded-lg border border-blue-100">
                  <strong className="block text-[#0B4FBA]">Q4 (Jan, Feb, Mar)</strong>
                  <span>Max 2 Casual, 2 Sick</span>
                </div>
              </div>
            </div>

            {/* Apply Leave Form */}
            <form
              onSubmit={handleApplyLeave}
              className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-2xs space-y-3"
            >
              <div className="flex items-center space-x-2 border-b border-gray-100 pb-2">
                <Calendar className="w-4 h-4 text-[#0B4FBA]" />
                <h2 className="text-sm font-bold text-gray-900">Apply for Leave</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">From Date</label>
                  <CustomDatePicker
                    value={leaveFromDate}
                    onChange={(val) => setLeaveFromDate(val)}
                    placeholder="Select start date"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">To Date</label>
                  <CustomDatePicker
                    value={leaveToDate}
                    onChange={(val) => setLeaveToDate(val)}
                    placeholder="Select end date"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Leave Type</label>
                  <CustomDropdown
                    options={[
                      "Casual Leave",
                      "Sick Leave",
                      "Maternity Leave",
                      "Paternity Leave",
                    ]}
                    value={leaveType}
                    onChange={(val: any) => setLeaveType(val)}
                    placeholder="Select leave type"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Reason for Leave</label>
                  <input
                    type="text"
                    required
                    autoComplete="off"
                    value={leaveReason}
                    onChange={(e) => setLeaveReason(e.target.value)}
                    placeholder="e.g. Family function / Medical checkup"
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#0B4FBA]/30 bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={addingLeave || !leaveFromDate || !leaveToDate || !leaveReason.trim()}
                  className="px-4 py-1.5 bg-[#0B4FBA] hover:bg-[#003882] text-white text-xs font-semibold rounded-lg shadow-xs transition-all flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {addingLeave ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  <span>Submit Leave Request</span>
                </button>
              </div>
            </form>

            {/* Leaves List & Approvals Table */}
            <div className="bg-white rounded-xl border border-gray-200/80 shadow-2xs overflow-hidden">
              <div className="p-3 border-b border-gray-100 font-bold text-xs text-gray-800 bg-gray-50/50 flex justify-between items-center">
                <span>Leave Requests & Status ({leaves.length})</span>
                <span className="text-[11px] text-gray-500 font-normal">
                  Approve or Reject pending leave applications
                </span>
              </div>

              {leaves.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-400">
                  No leave applications recorded yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-[10px] font-bold border-b border-gray-200">
                      <tr>
                        <th className="py-3 px-4">Leave Type</th>
                        <th className="py-3 px-4">Duration & Dates</th>
                        <th className="py-3 px-4">Quarter</th>
                        <th className="py-3 px-4">Reason</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Approval Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {leaves.map((leave) => (
                        <tr key={leave.id} className="hover:bg-gray-50/70 transition-colors">
                          <td className="py-3 px-4 font-bold text-gray-900">
                            {leave.leaveType}
                          </td>
                          <td className="py-3 px-4 text-gray-700">
                            <div>{leave.fromDate} to {leave.toDate}</div>
                            <div className="text-[10px] text-gray-400">{leave.daysCount} Day(s)</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-[10px]">
                              {leave.quarter}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-600 max-w-xs truncate">
                            {leave.reason}
                          </td>
                          <td className="py-3 px-4">
                            {leave.status === "Approved" && (
                              <span className="bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded border border-emerald-200 text-[10px] flex items-center space-x-1 w-fit">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Approved</span>
                              </span>
                            )}
                            {leave.status === "Rejected" && (
                              <span className="bg-rose-50 text-rose-700 font-semibold px-2 py-0.5 rounded border border-rose-200 text-[10px] flex items-center space-x-1 w-fit">
                                <XCircle className="w-3 h-3" />
                                <span>Rejected</span>
                              </span>
                            )}
                            {leave.status === "Pending" && (
                              <span className="bg-amber-50 text-amber-700 font-semibold px-2 py-0.5 rounded border border-amber-200 text-[10px] flex items-center space-x-1 w-fit">
                                <Clock className="w-3 h-3" />
                                <span>Pending</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right space-x-1">
                            {leave.status === "Pending" ? (
                              <>
                                <button
                                  onClick={() => handleLeaveStatus(leave.id, "Approved")}
                                  className="px-2.5 py-1 bg-emerald-600 text-white rounded text-[11px] font-semibold hover:bg-emerald-700 transition-colors shadow-2xs"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleLeaveStatus(leave.id, "Rejected")}
                                  className="px-2.5 py-1 bg-rose-600 text-white rounded text-[11px] font-semibold hover:bg-rose-700 transition-colors shadow-2xs"
                                >
                                  Reject
                                </button>
                              </>
                            ) : (
                              <span className="text-[11px] text-gray-400 italic">Dismissed</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: WORK FROM HOME (WFH) */}
        {activeTab === "wfh" && (
          <div className="space-y-4">
            {/* Apply WFH Form */}
            <form
              onSubmit={handleApplyWfh}
              className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-2xs space-y-3"
            >
              <div className="flex items-center space-x-2 border-b border-gray-100 pb-2">
                <Home className="w-4 h-4 text-[#0B4FBA]" />
                <h2 className="text-sm font-bold text-gray-900">Apply for Work From Home (WFH)</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">From Date</label>
                  <CustomDatePicker
                    value={wfhFromDate}
                    onChange={(val) => setWfhFromDate(val)}
                    placeholder="Select start date"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">To Date</label>
                  <CustomDatePicker
                    value={wfhToDate}
                    onChange={(val) => setWfhToDate(val)}
                    placeholder="Select end date"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Month</label>
                  <CustomDropdown
                    options={[
                      "Current Month",
                      "January", "February", "March", "April", "May", "June",
                      "July", "August", "September", "October", "November", "December"
                    ]}
                    value={wfhMonth}
                    onChange={(val) => setWfhMonth(val)}
                    placeholder="Select month"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Reason for WFH</label>
                  <input
                    type="text"
                    required
                    autoComplete="off"
                    value={wfhReason}
                    onChange={(e) => setWfhReason(e.target.value)}
                    placeholder="e.g. Internet setup / Personal work"
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#0B4FBA]/30 bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={addingWfh || !wfhFromDate || !wfhToDate}
                  className="px-4 py-1.5 bg-[#0B4FBA] hover:bg-[#003882] text-white text-xs font-semibold rounded-lg shadow-xs transition-all flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {addingWfh ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  <span>Save WFH Request</span>
                </button>
              </div>
            </form>

            {/* WFH List Table */}
            <div className="bg-white rounded-xl border border-gray-200/80 shadow-2xs overflow-hidden">
              <div className="p-3 border-b border-gray-100 font-bold text-xs text-gray-800 bg-gray-50/50 flex justify-between items-center">
                <span>Work From Home Applications ({wfhList.length})</span>
                <span className="text-[11px] text-gray-500 font-normal">
                  Only approved WFH entries are accepted
                </span>
              </div>

              {wfhList.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-400">
                  No Work From Home requests recorded yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-[10px] font-bold border-b border-gray-200">
                      <tr>
                        <th className="py-3 px-4">Month & Dates</th>
                        <th className="py-3 px-4">Reason</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Approval Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {wfhList.map((wfh) => (
                        <tr key={wfh.id} className="hover:bg-gray-50/70 transition-colors">
                          <td className="py-3 px-4 text-gray-900 font-medium">
                            <div>{wfh.fromDate} to {wfh.toDate}</div>
                            <div className="text-[10px] text-gray-400 font-normal">{wfh.month}</div>
                          </td>
                          <td className="py-3 px-4 text-gray-600 max-w-xs truncate">
                            {wfh.reason}
                          </td>
                          <td className="py-3 px-4">
                            {wfh.status === "Approved" && (
                              <span className="bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded border border-emerald-200 text-[10px] flex items-center space-x-1 w-fit">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Approved</span>
                              </span>
                            )}
                            {wfh.status === "Rejected" && (
                              <span className="bg-rose-50 text-rose-700 font-semibold px-2 py-0.5 rounded border border-rose-200 text-[10px] flex items-center space-x-1 w-fit">
                                <XCircle className="w-3 h-3" />
                                <span>Rejected</span>
                              </span>
                            )}
                            {wfh.status === "Pending" && (
                              <span className="bg-amber-50 text-amber-700 font-semibold px-2 py-0.5 rounded border border-amber-200 text-[10px] flex items-center space-x-1 w-fit">
                                <Clock className="w-3 h-3" />
                                <span>Pending</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right space-x-1">
                            {wfh.status === "Pending" ? (
                              <>
                                <button
                                  onClick={() => handleWfhStatus(wfh.id, "Approved")}
                                  className="px-2.5 py-1 bg-emerald-600 text-white rounded text-[11px] font-semibold hover:bg-emerald-700 transition-colors shadow-2xs"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleWfhStatus(wfh.id, "Rejected")}
                                  className="px-2.5 py-1 bg-rose-600 text-white rounded text-[11px] font-semibold hover:bg-rose-700 transition-colors shadow-2xs"
                                >
                                  Reject
                                </button>
                              </>
                            ) : (
                              <span className="text-[11px] text-gray-400 italic">Dismissed</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: DAILY TIMESHEET (Today's Date Auto-selected & Locked) */}
        {activeTab === "timesheet" && (
          <div className="space-y-4">
            {/* Add Daily Timesheet Form */}
            <form
              onSubmit={handleSaveTimesheet}
              className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-2xs space-y-3"
            >
              <div className="flex items-center space-x-2 border-b border-gray-100 pb-2">
                <Clock className="w-4 h-4 text-[#0B4FBA]" />
                <h2 className="text-sm font-bold text-gray-900">Add Daily Timesheet Log</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                {/* Today's Date Locked */}
                <div>
                  <label className="block font-semibold text-gray-700 mb-1 flex items-center justify-between">
                    <span>Timesheet Date</span>
                    <span className="text-[10px] text-gray-400 font-normal flex items-center space-x-1">
                      <Lock className="w-3 h-3" />
                      <span>Today Only</span>
                    </span>
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={todayStr}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg bg-gray-100 text-gray-800 font-mono font-bold cursor-not-allowed outline-none shadow-2xs"
                  />
                </div>

                {/* Master Project Dropdown */}
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Select Project</label>
                  <CustomDropdown
                    options={projectDropdownOptions}
                    value={tsProject}
                    onChange={(val) => setTsProject(val)}
                    placeholder="Select project"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Billing Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="16"
                    required
                    value={tsHours}
                    onChange={(e) => setTsHours(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#0B4FBA]/30 bg-white font-mono"
                  />
                </div>

                <div className="sm:col-span-2 md:col-span-4">
                  <label className="block font-semibold text-gray-700 mb-1">Work Tasks / Summary</label>
                  <input
                    type="text"
                    required
                    autoComplete="off"
                    value={tsTasks}
                    onChange={(e) => setTsTasks(e.target.value)}
                    placeholder="e.g. Developed API routes, fixed dropdown bug, reviewed PRs"
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#0B4FBA]/30 bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={addingTs || !tsTasks.trim()}
                  className="px-4 py-1.5 bg-[#0B4FBA] hover:bg-[#003882] text-white text-xs font-semibold rounded-lg shadow-xs transition-all flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {addingTs ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  <span>Save Timesheet Entry</span>
                </button>
              </div>
            </form>

            {/* Timesheet History Table */}
            <div className="bg-white rounded-xl border border-gray-200/80 shadow-2xs overflow-hidden">
              <div className="p-3 border-b border-gray-100 font-bold text-xs text-gray-800 bg-gray-50/50">
                Timesheet History ({timesheets.length})
              </div>

              {timesheets.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-400">
                  No timesheet logs recorded yet. Use the form above to submit today's work hours.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-[10px] font-bold border-b border-gray-200">
                      <tr>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Project</th>
                        <th className="py-3 px-4">Billing Hours</th>
                        <th className="py-3 px-4">Work Summary</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {timesheets.map((entry, idx) => (
                        <tr key={entry.id || idx} className="hover:bg-gray-50/70 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-gray-900">{entry.date}</td>
                          <td className="py-3 px-4 font-semibold text-[#0B4FBA]">{entry.projectName}</td>
                          <td className="py-3 px-4">
                            <span className="bg-blue-50 text-[#0B4FBA] font-mono font-bold px-2 py-0.5 rounded border border-blue-200 text-[11px]">
                              {entry.billingHours} hrs
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-700 max-w-md">{entry.tasks}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 6: SALARY & PAYROLL */}
        {activeTab === "salary" && (
          <div className="bg-white p-8 rounded-xl border border-gray-200/80 shadow-2xs text-center space-y-3">
            <DollarSign className="w-10 h-10 text-[#0B4FBA] mx-auto p-2 bg-blue-50 border border-blue-200 rounded-full" />
            <h2 className="text-base font-bold text-gray-900">Salary & Payroll Management</h2>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              Salary structure, monthly payslips, and payroll processing for {employee.firstName} {employee.lastName} will be configured in the next phase.
            </p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
