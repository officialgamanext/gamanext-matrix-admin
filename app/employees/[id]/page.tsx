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
  setActiveProjectForEmployee,
  setProjectAllocationStatus,
  deleteProjectAllocation,
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
  getRequestsForEmployee,
  saveRequestForEmployee,
  updateRequestStatusInStorage,
  getYearlyReviewsForEmployee,
  saveYearlyReviewForEmployee,
  getPerformanceBandsForEmployee,
  savePerformanceBandForEmployee,
  EmployeeData,
  ProjectAllocation,
  LeaveRequest,
  WFHRequest,
  TimesheetEntry,
  MasterProjectItem,
  EmployeeRequest,
  YearlyReview,
  PerformanceBandRecord,
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
  Save,
  Lock,
  FolderKanban,
  Send,
  CheckCheck,
  ArrowRight,
  Receipt,
  Star,
  Award,
  TrendingUp,
  Sparkles,
  Power,
  PowerOff,
  Trash2,
  Info,
} from "lucide-react";

// Helper to determine fiscal quarter based on month (1-indexed)
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
    "profile" | "projects" | "leaves" | "wfh" | "timesheet" | "requests" | "performance" | "salary"
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
  const [newProjectStatus, setNewProjectStatus] = useState<"Active" | "Inactive">("Active");
  const [addingProject, setAddingProject] = useState(false);
  const [togglingProjectId, setTogglingProjectId] = useState<string | null>(null);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);

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

  // Tab 6: Requests (Accessories & WiFi Bill Reimbursements)
  const [empRequests, setEmpRequests] = useState<EmployeeRequest[]>([]);
  const [reqType, setReqType] = useState<
    "Accessories Allowance" | "Monthly Network/WiFi Bill Reimbursement"
  >("Monthly Network/WiFi Bill Reimbursement");
  const [reqAmount, setReqAmount] = useState("1000");
  const [reqDesc, setReqDesc] = useState("");
  const [addingReq, setAddingReq] = useState(false);

  // Tab 7: Yearly Reviews & Performance Bands
  const [reviews, setReviews] = useState<YearlyReview[]>([]);
  const [bands, setBands] = useState<PerformanceBandRecord[]>([]);

  // Review Form
  const [reviewYear, setReviewYear] = useState("2026");
  const [reviewRating, setReviewRating] = useState("9.0");
  const [reviewFeedback, setReviewFeedback] = useState("");
  const [addingReview, setAddingReview] = useState(false);

  // Performance Band Form
  const [bandYear, setBandYear] = useState("2026");
  const [bandValue, setBandValue] = useState<"Band A" | "Band B" | "Band C" | "Band D">("Band A");
  const [bandRemarks, setBandRemarks] = useState("");
  const [addingBand, setAddingBand] = useState(false);

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
          const [
            projData,
            leaveData,
            wfhData,
            tsData,
            deptsData,
            rolesData,
            mProjects,
            reqData,
            revData,
            bandData,
          ] = await Promise.all([
            getProjectsForEmployee(empKey),
            getLeavesForEmployee(empKey),
            getWFHForEmployee(empKey),
            getTimesheetsForEmployee(empKey),
            getDepartmentsFromStorage(),
            getRolesFromStorage(),
            getMasterProjectsFromStorage(),
            getRequestsForEmployee(empKey),
            getYearlyReviewsForEmployee(empKey),
            getPerformanceBandsForEmployee(empKey),
          ]);

          setProjects(projData);
          setLeaves(leaveData);
          setWfhList(wfhData);
          setTimesheets(tsData);
          setDepartments(deptsData.map((d) => d.name));
          setRoles(rolesData.map((r) => r.name));
          setMasterProjects(mProjects);
          setEmpRequests(reqData);
          setReviews(revData);
          setBands(bandData);

          if (projData.some((p) => p.status === "Active")) {
            const activeProj = projData.find((p) => p.status === "Active");
            if (activeProj) setTsProject(activeProj.projectName);
          } else if (mProjects.length > 0) {
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
        status: newProjectStatus,
      });

      setProjects((prev) => {
        if (newProjectStatus === "Active") {
          return [created, ...prev.map((p) => ({ ...p, status: "Inactive" as const }))];
        }
        return [created, ...prev];
      });

      setNewProjectRole("");
      if (newProjectStatus === "Active") {
        setTsProject(created.projectName);
      }
    } catch (err) {
      console.error("Assign project error:", err);
    } finally {
      setAddingProject(false);
    }
  };

  // Toggle Project Active/Inactive (Enable / Disable) Status Handler
  const handleToggleProjectStatus = async (projId: string, currentStatus: string) => {
    if (!employee || !projId) return;
    const nextStatus: "Active" | "Inactive" = currentStatus === "Active" ? "Inactive" : "Active";
    setTogglingProjectId(projId);
    try {
      const empKey = employee.id || employee.employeeId;
      await setProjectAllocationStatus(empKey, projId, nextStatus);
      setProjects((prev) =>
        prev.map((p) => {
          if (p.id === projId) {
            return { ...p, status: nextStatus };
          }
          if (nextStatus === "Active") {
            // Guarantee only one is active: all other projects become Inactive
            return { ...p, status: "Inactive" as const };
          }
          return p;
        })
      );
      if (nextStatus === "Active") {
        const target = projects.find((p) => p.id === projId);
        if (target) setTsProject(target.projectName);
      }
    } catch (err) {
      console.error("Toggle project status error:", err);
    } finally {
      setTogglingProjectId(null);
    }
  };

  // Delete Project Allocation Handler
  const handleDeleteProject = async (projId: string) => {
    if (!confirm("Are you sure you want to remove this project allocation?")) return;
    setDeletingProjectId(projId);
    try {
      await deleteProjectAllocation(projId);
      setProjects((prev) => prev.filter((p) => p.id !== projId));
    } catch (err) {
      console.error("Delete project allocation error:", err);
    } finally {
      setDeletingProjectId(null);
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

  // Submit Employee Request Handler (Accessories & WiFi Bill)
  const handleAddRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee || !reqAmount || !reqDesc.trim()) {
      alert("Please fill in amount and description.");
      return;
    }

    // One-time check for Accessories Allowance
    if (reqType === "Accessories Allowance") {
      const hasExistingAccessories = empRequests.some(
        (r) => r.requestType === "Accessories Allowance" && r.status !== "Rejected"
      );
      if (hasExistingAccessories) {
        alert(
          "One-Time Limit Reached! Accessories Allowance can only be availed ONCE per employee."
        );
        return;
      }
    }

    setAddingReq(true);
    try {
      const empKey = employee.id || employee.employeeId;
      const created = await saveRequestForEmployee({
        employeeId: empKey,
        requestType: reqType,
        amount: parseFloat(reqAmount) || 0,
        monthOrDescription: reqDesc.trim(),
        status: "Pending",
      });

      setEmpRequests((prev) => [created, ...prev]);
      setReqDesc("");
      setReqAmount("1000");
    } catch (err) {
      console.error("Submit request error:", err);
    } finally {
      setAddingReq(false);
    }
  };

  // Step-by-Step Request Status Workflow Update
  const handleUpdateRequestStatus = async (
    reqId?: string,
    nextStatus?: "Pending" | "Approved" | "Rejected" | "Amount Initiated" | "Amount Credited"
  ) => {
    if (!reqId || !nextStatus) return;
    await updateRequestStatusInStorage(reqId, nextStatus);
    setEmpRequests((prev) =>
      prev.map((r) => (r.id === reqId ? { ...r, status: nextStatus } : r))
    );
  };

  // Save Yearly Review Handler
  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee || !reviewFeedback.trim()) return;

    setAddingReview(true);
    try {
      const empKey = employee.id || employee.employeeId;
      const created = await saveYearlyReviewForEmployee({
        employeeId: empKey,
        year: reviewYear,
        rating: parseFloat(reviewRating) || 8.0,
        feedback: reviewFeedback.trim(),
      });

      setReviews((prev) => [created, ...prev.filter((r) => r.year !== reviewYear)]);
      setReviewFeedback("");
    } catch (err) {
      console.error("Save review error:", err);
    } finally {
      setAddingReview(false);
    }
  };

  // Save Performance Band Handler
  const handleSaveBand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee || !bandRemarks.trim()) return;

    setAddingBand(true);
    try {
      const empKey = employee.id || employee.employeeId;
      const created = await savePerformanceBandForEmployee({
        employeeId: empKey,
        year: bandYear,
        band: bandValue,
        remarks: bandRemarks.trim(),
      });

      setBands((prev) => [created, ...prev.filter((b) => b.year !== bandYear)]);
      setBandRemarks("");
    } catch (err) {
      console.error("Save band error:", err);
    } finally {
      setAddingBand(false);
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
            onClick={() => setActiveTab("requests")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === "requests"
                ? "bg-[#0B4FBA] text-white shadow-xs"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Requests ({empRequests.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("performance")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === "performance"
                ? "bg-[#0B4FBA] text-white shadow-xs"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Performance & Ratings ({reviews.length})</span>
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
            {/* Policy Banner */}
            <div className="bg-blue-50/80 border border-blue-200/80 rounded-xl p-3.5 flex items-start space-x-3 text-xs text-blue-900">
              <Info className="w-4 h-4 text-[#0B4FBA] shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold text-[#0B4FBA]">Single Active Project Policy</p>
                <p className="text-gray-600 leading-relaxed">
                  Only <strong>one project allocation</strong> can be active at a time for this employee. Enabling a project as Active will automatically set all other assigned projects to Inactive. You can enable or disable any project using the toggles or action buttons below.
                </p>
              </div>
            </div>

            {/* Assign Project Form */}
            <form
              onSubmit={handleAssignProject}
              className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-2xs space-y-4"
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

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Select Project *</label>
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
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#0B4FBA]/30 bg-white h-[38px] text-xs"
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

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Initial Status</label>
                  <CustomDropdown
                    options={[
                      { value: "Active", label: "Active (Current Working)" },
                      { value: "Inactive", label: "Inactive (Disabled / Standby)" },
                    ]}
                    value={newProjectStatus}
                    onChange={(val) => setNewProjectStatus(val as "Active" | "Inactive")}
                    placeholder="Select status"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-gray-100/60">
                <div className="text-[11px] text-gray-500">
                  {newProjectStatus === "Active" ? (
                    <span className="text-emerald-700 font-medium flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                      <span>Assigning as <strong>Active</strong> will automatically mark existing projects as Inactive</span>
                    </span>
                  ) : (
                    <span className="text-gray-500">Assigning as Inactive (can be enabled at any time)</span>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={addingProject || !newProjectName.trim()}
                  className="px-4 py-2 bg-[#0B4FBA] hover:bg-[#003882] text-white text-xs font-semibold rounded-lg shadow-xs transition-all flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
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
              <div className="p-3.5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="font-bold text-xs text-gray-800 flex items-center space-x-2">
                  <span>Project Assignment History</span>
                  <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                    {projects.length}
                  </span>
                </div>
                {projects.some((p) => p.status === "Active") ? (
                  <div className="text-[11px] font-medium text-emerald-700 flex items-center space-x-1.5 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200/70">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>
                      Current Active:{" "}
                      <strong>
                        {projects.find((p) => p.status === "Active")?.projectName}
                      </strong>
                    </span>
                  </div>
                ) : (
                  <div className="text-[11px] font-medium text-amber-700 flex items-center space-x-1.5 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200/70">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    <span>No active project currently assigned</span>
                  </div>
                )}
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
                        <th className="py-3 px-4 text-center">Enable / Disable</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {projects.map((proj, idx) => {
                        const isActive = proj.status === "Active";
                        const isToggling = togglingProjectId === proj.id;
                        const isDeleting = deletingProjectId === proj.id;

                        return (
                          <tr
                            key={proj.id || idx}
                            className={`hover:bg-gray-50/70 transition-colors ${
                              isActive ? "bg-blue-50/30" : ""
                            }`}
                          >
                            <td className="py-3 px-4 font-bold text-gray-900">
                              <div className="flex items-center space-x-2">
                                <FolderKanban
                                  className={`w-4 h-4 shrink-0 ${
                                    isActive ? "text-[#0B4FBA]" : "text-gray-400"
                                  }`}
                                />
                                <div>
                                  <span className="block text-gray-900">{proj.projectName}</span>
                                  {isActive && (
                                    <span className="text-[10px] text-emerald-600 font-semibold block">
                                      Active Working Project
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-gray-700">{proj.role || "—"}</td>
                            <td className="py-3 px-4 text-gray-600 font-mono">{proj.startDate || "—"}</td>
                            <td className="py-3 px-4">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                  isActive
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs"
                                    : "bg-gray-100 text-gray-600 border border-gray-200"
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    isActive ? "bg-emerald-500 animate-pulse" : "bg-gray-400"
                                  }`}
                                ></span>
                                <span>{isActive ? "Active" : "Inactive"}</span>
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center space-x-2">
                                <button
                                  type="button"
                                  role="switch"
                                  aria-checked={isActive}
                                  disabled={isToggling || !proj.id}
                                  onClick={() => handleToggleProjectStatus(proj.id!, proj.status)}
                                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden disabled:opacity-50 ${
                                    isActive ? "bg-emerald-600" : "bg-gray-300 hover:bg-gray-400"
                                  }`}
                                  title={
                                    isActive
                                      ? "Click to Disable (Set Inactive)"
                                      : "Click to Enable (Set Active and disable other projects)"
                                  }
                                >
                                  <span
                                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                      isActive ? "translate-x-4" : "translate-x-0"
                                    }`}
                                  />
                                </button>
                                <span
                                  className={`text-[11px] font-semibold ${
                                    isActive ? "text-emerald-700" : "text-gray-500"
                                  }`}
                                >
                                  {isActive ? "Enabled" : "Disabled"}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end space-x-2">
                                {isActive ? (
                                  <button
                                    type="button"
                                    disabled={isToggling || !proj.id}
                                    onClick={() => handleToggleProjectStatus(proj.id!, proj.status)}
                                    className="px-2.5 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors flex items-center space-x-1 disabled:opacity-50 cursor-pointer"
                                    title="Disable this project allocation"
                                  >
                                    {isToggling ? (
                                      <Loader2 className="w-3 h-3 animate-spin text-rose-600" />
                                    ) : (
                                      <PowerOff className="w-3 h-3 text-rose-600" />
                                    )}
                                    <span>Disable</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    disabled={isToggling || !proj.id}
                                    onClick={() => handleToggleProjectStatus(proj.id!, proj.status)}
                                    className="px-2.5 py-1 text-[11px] font-semibold text-[#0B4FBA] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors flex items-center space-x-1 disabled:opacity-50 cursor-pointer"
                                    title="Enable this project and deactivate all others"
                                  >
                                    {isToggling ? (
                                      <Loader2 className="w-3 h-3 animate-spin text-[#0B4FBA]" />
                                    ) : (
                                      <Power className="w-3 h-3 text-[#0B4FBA]" />
                                    )}
                                    <span>Enable (Active)</span>
                                  </button>
                                )}

                                {proj.id && (
                                  <button
                                    type="button"
                                    disabled={isDeleting}
                                    onClick={() => handleDeleteProject(proj.id!)}
                                    className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors disabled:opacity-50 cursor-pointer"
                                    title="Delete allocation"
                                  >
                                    {isDeleting ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <Trash2 className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                )}
                              </div>
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

        {/* TAB 5: DAILY TIMESHEET */}
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

        {/* TAB 6: REQUESTS (ACCESSORIES & WIFI BILL REIMBURSEMENT) */}
        {activeTab === "requests" && (
          <div className="space-y-4">
            {/* Rules Banner */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-xl p-4 text-xs text-emerald-950 space-y-1.5">
              <div className="font-bold text-sm text-emerald-900 flex items-center space-x-2">
                <Receipt className="w-4 h-4 text-emerald-700" />
                <span>Employee Reimbursements & Allowances Rules</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-emerald-800">
                <li>
                  <strong className="text-emerald-950">Accessories Allowance:</strong> One-Time limit per employee (e.g., keyboard, mouse, headset).
                </li>
                <li>
                  <strong className="text-emerald-950">Monthly Network/WiFi Bill:</strong> Can be requested every month for home office internet support.
                </li>
                <li>
                  <strong className="text-emerald-950">Payout Workflow:</strong> Pending → Accept/Reject → Amount Initiated → Amount Credited.
                </li>
              </ul>
            </div>

            {/* Add Request Form */}
            <form
              onSubmit={handleAddRequest}
              className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-2xs space-y-3"
            >
              <div className="flex items-center space-x-2 border-b border-gray-100 pb-2">
                <Receipt className="w-4 h-4 text-[#0B4FBA]" />
                <h2 className="text-sm font-bold text-gray-900">Submit Allowance / Reimbursement Request</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Request Type</label>
                  <CustomDropdown
                    options={[
                      "Monthly Network/WiFi Bill Reimbursement",
                      "Accessories Allowance",
                    ]}
                    value={reqType}
                    onChange={(val: any) => setReqType(val)}
                    placeholder="Select request type"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Claim Amount (₹)</label>
                  <input
                    type="number"
                    min="100"
                    step="100"
                    required
                    value={reqAmount}
                    onChange={(e) => setReqAmount(e.target.value)}
                    placeholder="e.g. 1000"
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#0B4FBA]/30 bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    {reqType === "Monthly Network/WiFi Bill Reimbursement"
                      ? "Month / Period"
                      : "Accessories Description"}
                  </label>
                  <input
                    type="text"
                    required
                    autoComplete="off"
                    value={reqDesc}
                    onChange={(e) => setReqDesc(e.target.value)}
                    placeholder={
                      reqType === "Monthly Network/WiFi Bill Reimbursement"
                        ? "e.g. WiFi Bill for July 2026"
                        : "e.g. Ergonomic Keyboard & Wireless Mouse"
                    }
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#0B4FBA]/30 bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={addingReq || !reqDesc.trim() || !reqAmount}
                  className="px-4 py-1.5 bg-[#0B4FBA] hover:bg-[#003882] text-white text-xs font-semibold rounded-lg shadow-xs transition-all flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {addingReq ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Submit Request</span>
                </button>
              </div>
            </form>

            {/* Requests History Table */}
            <div className="bg-white rounded-xl border border-gray-200/80 shadow-2xs overflow-hidden">
              <div className="p-3 border-b border-gray-100 font-bold text-xs text-gray-800 bg-gray-50/50 flex justify-between items-center">
                <span>Reimbursement & Allowance Requests ({empRequests.length})</span>
                <span className="text-[11px] text-gray-500 font-normal">
                  Step-by-step approval & payout tracking
                </span>
              </div>

              {empRequests.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-400">
                  No requests submitted yet. Use the form above to claim WiFi bill or accessories allowance.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-[10px] font-bold border-b border-gray-200">
                      <tr>
                        <th className="py-3 px-4">Request Type</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Month / Details</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Workflow Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {empRequests.map((req) => (
                        <tr key={req.id} className="hover:bg-gray-50/70 transition-colors">
                          <td className="py-3 px-4 font-bold text-gray-900 flex items-center space-x-2">
                            <Receipt className="w-4 h-4 text-[#0B4FBA]" />
                            <span>{req.requestType}</span>
                          </td>

                          <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                            ₹{req.amount.toLocaleString("en-IN")}
                          </td>

                          <td className="py-3 px-4 text-gray-700">{req.monthOrDescription}</td>

                          {/* Status Badge */}
                          <td className="py-3 px-4">
                            {req.status === "Pending" && (
                              <span className="bg-amber-50 text-amber-700 font-semibold px-2 py-0.5 rounded border border-amber-200 text-[10px] inline-flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>Pending Approval</span>
                              </span>
                            )}
                            {req.status === "Approved" && (
                              <span className="bg-blue-50 text-[#0B4FBA] font-semibold px-2 py-0.5 rounded border border-blue-200 text-[10px] inline-flex items-center space-x-1">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Accepted / Approved</span>
                              </span>
                            )}
                            {req.status === "Rejected" && (
                              <span className="bg-rose-50 text-rose-700 font-semibold px-2 py-0.5 rounded border border-rose-200 text-[10px] inline-flex items-center space-x-1">
                                <XCircle className="w-3 h-3" />
                                <span>Rejected</span>
                              </span>
                            )}
                            {req.status === "Amount Initiated" && (
                              <span className="bg-purple-50 text-purple-700 font-semibold px-2 py-0.5 rounded border border-purple-200 text-[10px] inline-flex items-center space-x-1">
                                <ArrowRight className="w-3 h-3" />
                                <span>Amount Initiated</span>
                              </span>
                            )}
                            {req.status === "Amount Credited" && (
                              <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-300 text-[10px] inline-flex items-center space-x-1">
                                <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Amount Credited</span>
                              </span>
                            )}
                          </td>

                          {/* Step-by-Step Workflow Action Buttons */}
                          <td className="py-3 px-4 text-right space-x-1">
                            {req.status === "Pending" && (
                              <>
                                <button
                                  onClick={() => handleUpdateRequestStatus(req.id, "Approved")}
                                  className="px-2.5 py-1 bg-emerald-600 text-white rounded text-[11px] font-semibold hover:bg-emerald-700 transition-colors shadow-2xs"
                                >
                                  Accept
                                </button>
                                <button
                                  onClick={() => handleUpdateRequestStatus(req.id, "Rejected")}
                                  className="px-2.5 py-1 bg-rose-600 text-white rounded text-[11px] font-semibold hover:bg-rose-700 transition-colors shadow-2xs"
                                >
                                  Reject
                                </button>
                              </>
                            )}

                            {req.status === "Approved" && (
                              <button
                                onClick={() => handleUpdateRequestStatus(req.id, "Amount Initiated")}
                                className="px-3 py-1 bg-purple-600 text-white rounded text-[11px] font-semibold hover:bg-purple-700 transition-colors shadow-2xs flex items-center space-x-1 ml-auto"
                              >
                                <span>Initiate Amount</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}

                            {req.status === "Amount Initiated" && (
                              <button
                                onClick={() => handleUpdateRequestStatus(req.id, "Amount Credited")}
                                className="px-3 py-1 bg-emerald-600 text-white rounded text-[11px] font-semibold hover:bg-emerald-700 transition-colors shadow-2xs flex items-center space-x-1 ml-auto"
                              >
                                <CheckCheck className="w-3.5 h-3.5" />
                                <span>Credit Amount</span>
                              </button>
                            )}

                            {req.status === "Amount Credited" && (
                              <span className="text-[11px] font-semibold text-emerald-700 flex items-center space-x-1 justify-end">
                                <CheckCheck className="w-3.5 h-3.5" />
                                <span>Completed</span>
                              </span>
                            )}

                            {req.status === "Rejected" && (
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

        {/* TAB 7: YEARLY PERFORMANCE REVIEWS & BANDS */}
        {activeTab === "performance" && (
          <div className="space-y-6">
            {/* SECTION 1: YEARLY REVIEW & RATING (OUT OF 10) */}
            <div className="space-y-4">
              <form
                onSubmit={handleSaveReview}
                className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-2xs space-y-3"
              >
                <div className="flex items-center space-x-2 border-b border-gray-100 pb-2">
                  <Star className="w-4 h-4 text-amber-500" />
                  <h2 className="text-sm font-bold text-gray-900">Add Yearly Review & Rating (Out of 10)</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Review Year</label>
                    <CustomDropdown
                      options={["2026", "2025", "2024", "2023"]}
                      value={reviewYear}
                      onChange={(val) => setReviewYear(val)}
                      placeholder="Select year"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Rating Score (Out of 10)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="10"
                      required
                      value={reviewRating}
                      onChange={(e) => setReviewRating(e.target.value)}
                      placeholder="e.g. 9.5"
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#0B4FBA]/30 bg-white font-mono font-bold"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block font-semibold text-gray-700 mb-1">Review Comments / Feedback</label>
                    <input
                      type="text"
                      required
                      autoComplete="off"
                      value={reviewFeedback}
                      onChange={(e) => setReviewFeedback(e.target.value)}
                      placeholder="e.g. Exceptional leadership, delivered core modules ahead of schedule."
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#0B4FBA]/30 bg-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={addingReview || !reviewFeedback.trim()}
                    className="px-4 py-1.5 bg-[#0B4FBA] hover:bg-[#003882] text-white text-xs font-semibold rounded-lg shadow-xs transition-all flex items-center space-x-1.5 disabled:opacity-50"
                  >
                    {addingReview ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                    <span>Save Yearly Review</span>
                  </button>
                </div>
              </form>

              {/* Reviews History Table */}
              <div className="bg-white rounded-xl border border-gray-200/80 shadow-2xs overflow-hidden">
                <div className="p-3 border-b border-gray-100 font-bold text-xs text-gray-800 bg-gray-50/50 flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                    <span>Yearly Review & Rating History ({reviews.length})</span>
                  </div>
                  <span className="text-[11px] text-gray-500 font-normal">Score out of 10.0</span>
                </div>

                {reviews.length === 0 ? (
                  <div className="p-8 text-center text-xs text-gray-400">
                    No yearly reviews recorded yet. Use the form above to add an annual review.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-[10px] font-bold border-b border-gray-200">
                        <tr>
                          <th className="py-3 px-4">Year</th>
                          <th className="py-3 px-4">Rating Score</th>
                          <th className="py-3 px-4">Reviewer Comments</th>
                          <th className="py-3 px-4">Date Logged</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {reviews.map((rev) => (
                          <tr key={rev.id || rev.year} className="hover:bg-gray-50/70 transition-colors">
                            <td className="py-3 px-4 font-mono font-bold text-[#0B4FBA]">{rev.year}</td>

                            {/* Score / 10 + Star Badge */}
                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-2">
                                <span className="font-mono font-extrabold text-sm text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                  {rev.rating} / 10
                                </span>
                                <div className="flex text-amber-400">
                                  {Array.from({ length: Math.min(5, Math.round(rev.rating / 2)) }).map((_, i) => (
                                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                                  ))}
                                </div>
                              </div>
                            </td>

                            <td className="py-3 px-4 text-gray-700 max-w-md">{rev.feedback}</td>

                            <td className="py-3 px-4 text-gray-500 text-[11px]">
                              {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : "Saved"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 2: PERFORMANCE BAND */}
            <div className="space-y-4">
              <form
                onSubmit={handleSaveBand}
                className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-2xs space-y-3"
              >
                <div className="flex items-center space-x-2 border-b border-gray-100 pb-2">
                  <Award className="w-4 h-4 text-[#0B4FBA]" />
                  <h2 className="text-sm font-bold text-gray-900">Assign Yearly Performance Band</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Performance Year</label>
                    <CustomDropdown
                      options={["2026", "2025", "2024", "2023"]}
                      value={bandYear}
                      onChange={(val) => setBandYear(val)}
                      placeholder="Select year"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Performance Band</label>
                    <CustomDropdown
                      options={[
                        "Band A",
                        "Band B",
                        "Band C",
                        "Band D",
                      ]}
                      value={bandValue}
                      onChange={(val: any) => setBandValue(val)}
                      placeholder="Select performance band"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block font-semibold text-gray-700 mb-1">Performance Remarks / Goals Summary</label>
                    <input
                      type="text"
                      required
                      autoComplete="off"
                      value={bandRemarks}
                      onChange={(e) => setBandRemarks(e.target.value)}
                      placeholder="e.g. Exceeded annual KPI targets across all project deliverables."
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#0B4FBA]/30 bg-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={addingBand || !bandRemarks.trim()}
                    className="px-4 py-1.5 bg-[#0B4FBA] hover:bg-[#003882] text-white text-xs font-semibold rounded-lg shadow-xs transition-all flex items-center space-x-1.5 disabled:opacity-50"
                  >
                    {addingBand ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                    <span>Save Performance Band</span>
                  </button>
                </div>
              </form>

              {/* Performance Band History Table */}
              <div className="bg-white rounded-xl border border-gray-200/80 shadow-2xs overflow-hidden">
                <div className="p-3 border-b border-gray-100 font-bold text-xs text-gray-800 bg-gray-50/50 flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Award className="w-4 h-4 text-[#0B4FBA]" />
                    <span>Performance Band History ({bands.length})</span>
                  </div>
                  <span className="text-[11px] text-gray-500 font-normal">
                    Band A (Excellent), Band B (Good), Band C (Satisfactory), Band D (Needs Improvement)
                  </span>
                </div>

                {bands.length === 0 ? (
                  <div className="p-8 text-center text-xs text-gray-400">
                    No performance band assignments recorded yet. Use the form above to assign a yearly band.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-[10px] font-bold border-b border-gray-200">
                        <tr>
                          <th className="py-3 px-4">Year</th>
                          <th className="py-3 px-4">Assigned Band</th>
                          <th className="py-3 px-4">Level Description</th>
                          <th className="py-3 px-4">Remarks & KPI Performance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {bands.map((b) => (
                          <tr key={b.id || b.year} className="hover:bg-gray-50/70 transition-colors">
                            <td className="py-3 px-4 font-mono font-bold text-[#0B4FBA]">{b.year}</td>

                            {/* Band Badge */}
                            <td className="py-3 px-4">
                              {b.band === "Band A" && (
                                <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded-md font-extrabold text-xs inline-flex items-center space-x-1">
                                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Band A</span>
                                </span>
                              )}
                              {b.band === "Band B" && (
                                <span className="bg-blue-100 text-blue-800 border border-blue-300 px-2.5 py-1 rounded-md font-extrabold text-xs inline-flex items-center space-x-1">
                                  <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                                  <span>Band B</span>
                                </span>
                              )}
                              {b.band === "Band C" && (
                                <span className="bg-amber-100 text-amber-800 border border-amber-300 px-2.5 py-1 rounded-md font-extrabold text-xs inline-flex items-center space-x-1">
                                  <span>Band C</span>
                                </span>
                              )}
                              {b.band === "Band D" && (
                                <span className="bg-rose-100 text-rose-800 border border-rose-300 px-2.5 py-1 rounded-md font-extrabold text-xs inline-flex items-center space-x-1">
                                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                                  <span>Band D</span>
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-4 font-semibold text-gray-800">
                              {b.band === "Band A" && "Excellent (Top Performer)"}
                              {b.band === "Band B" && "Good (Above Average)"}
                              {b.band === "Band C" && "Satisfactory (Average)"}
                              {b.band === "Band D" && "Needs Improvement"}
                            </td>

                            <td className="py-3 px-4 text-gray-700 max-w-md">{b.remarks}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: SALARY & PAYROLL */}
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
