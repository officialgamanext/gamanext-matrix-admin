"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "../../components/AdminLayout";
import CustomDropdown from "../../components/CustomDropdown";
import CustomDatePicker from "../../components/CustomDatePicker";
import {
  saveEmployeeToStorage,
  getEmployeesFromStorage,
  getDepartmentsFromStorage,
  getRolesFromStorage,
  EmployeeData,
} from "@/lib/firebase";
import { uploadToImageKit } from "@/lib/imagekit";
import {
  ArrowLeft,
  User,
  Briefcase,
  Upload,
  CreditCard,
  PhoneCall,
  CheckCircle2,
  Loader2,
  FileCheck,
  Building2,
  Eye,
  EyeOff,
  Lock,
} from "lucide-react";
import Link from "next/link";

export default function AddEmployeePage() {
  const router = useRouter();

  // Loading state
  const [submitting, setSubmitting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");

  // Password visibility toggle
  const [showPassword, setShowPassword] = useState(false);

  // Dynamic Options from storage
  const [departmentOptions, setDepartmentOptions] = useState<string[]>([]);
  const [roleOptions, setRoleOptions] = useState<string[]>([]);

  // Form State
  const [formData, setFormData] = useState<EmployeeData>({
    firstName: "",
    lastName: "",
    mobileNumber: "",
    email: "",
    dateOfBirth: "",
    address: "",
    city: "",
    pincode: "",
    employeeId: "",
    employeeRole: "Senior Software Engineer",
    department: "Engineering",
    dateOfJoining: new Date().toISOString().split("T")[0],
    jobType: "Full-Time",
    username: "",
    password: "",
    aadharNumber: "",
    panCardNumber: "",
    profilePhotoUrl: "",
    aadharFrontUrl: "",
    aadharBackUrl: "",
    panCardUrl: "",
    bankName: "",
    bankAccountNumber: "",
    bankIfscCode: "",
    emergencyContact1: {
      name: "",
      relation: "Father",
      mobileNumber: "",
      occupation: "",
      address: "",
    },
    emergencyContact2: {
      name: "",
      relation: "Mother",
      mobileNumber: "",
      occupation: "",
      address: "",
    },
  });

  // Job Type Options
  const jobTypeOptions = ["Full-Time", "Part-Time", "Contract", "Internship"];

  // Generate 6-digit numeric Unique Employee ID & matching username on load
  useEffect(() => {
    async function initializeOptionsAndID() {
      try {
        const [depts, roles, existingEmps] = await Promise.all([
          getDepartmentsFromStorage(),
          getRolesFromStorage(),
          getEmployeesFromStorage(),
        ]);

        setDepartmentOptions(depts.map((d) => d.name));
        setRoleOptions(roles.map((r) => r.name));

        const existingIds = new Set(existingEmps.map((e) => e.employeeId));

        // Generate unique 6-digit numeric ID
        let generatedId = "";
        do {
          generatedId = Math.floor(100000 + Math.random() * 900000).toString();
        } while (existingIds.has(generatedId));

        const generatedUsername = `${generatedId}@gamanext.com`;

        setFormData((prev) => ({
          ...prev,
          employeeId: generatedId,
          username: generatedUsername,
        }));
      } catch (err) {
        console.error("Failed to initialize options/ID:", err);
      }
    }
    initializeOptionsAndID();
  }, []);

  // Relation Options for Emergency Contacts
  const relationOptions = [
    "Father",
    "Mother",
    "Spouse",
    "Brother",
    "Sister",
    "Son",
    "Daughter",
    "Relative",
    "Friend",
    "Guardian",
    "Other",
  ];

  // Image Files state
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [aadharFrontFile, setAadharFrontFile] = useState<File | null>(null);
  const [aadharBackFile, setAadharBackFile] = useState<File | null>(null);
  const [panCardFile, setPanCardFile] = useState<File | null>(null);

  // Image Previews
  const [profilePreview, setProfilePreview] = useState<string>("");
  const [aadharFrontPreview, setAadharFrontPreview] = useState<string>("");
  const [aadharBackPreview, setAadharBackPreview] = useState<string>("");
  const [panCardPreview, setPanCardPreview] = useState<string>("");

  // Helper for image change
  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: (f: File | null) => void,
    setPreview: (s: string) => void
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  // Generic input handler
  const handleChange = (field: keyof EmployeeData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Emergency contact change handler
  const handleEmergencyChange = (
    contactKey: "emergencyContact1" | "emergencyContact2",
    field: keyof EmployeeData["emergencyContact1"],
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [contactKey]: {
        ...prev[contactKey],
        [field]: value,
      },
    }));
  };

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstName || !formData.mobileNumber || !formData.email) {
      alert("Please fill in required personal details (First Name, Mobile, Email).");
      return;
    }

    setSubmitting(true);
    setUploadStatus("Uploading employee documents to ImageKit CDN...");

    try {
      let profileUrl = formData.profilePhotoUrl;
      let aadharFrontUrl = formData.aadharFrontUrl;
      let aadharBackUrl = formData.aadharBackUrl;
      let panUrl = formData.panCardUrl;

      // 1. Upload Profile Photo to ImageKit
      if (profilePhotoFile) {
        setUploadStatus("Uploading Profile Photo to ImageKit...");
        profileUrl = await uploadToImageKit(profilePhotoFile, "profile_photos");
      }

      // 2. Upload Aadhar Front to ImageKit
      if (aadharFrontFile) {
        setUploadStatus("Uploading Aadhar Front Document to ImageKit...");
        aadharFrontUrl = await uploadToImageKit(aadharFrontFile, "aadhar_docs");
      }

      // 3. Upload Aadhar Back to ImageKit
      if (aadharBackFile) {
        setUploadStatus("Uploading Aadhar Back Document to ImageKit...");
        aadharBackUrl = await uploadToImageKit(aadharBackFile, "aadhar_docs");
      }

      // 4. Upload PAN Card Photo to ImageKit
      if (panCardFile) {
        setUploadStatus("Uploading PAN Card Document to ImageKit...");
        panUrl = await uploadToImageKit(panCardFile, "pan_docs");
      }

      // Ensure username is employeeId@gamanext.com
      const autoUsername = `${formData.employeeId}@gamanext.com`;

      // 5. Final Employee payload
      setUploadStatus("Saving employee record to Firebase Firestore...");
      const finalPayload: EmployeeData = {
        ...formData,
        username: autoUsername,
        profilePhotoUrl:
          profileUrl ||
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80",
        aadharFrontUrl:
          aadharFrontUrl ||
          "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=400&q=80",
        aadharBackUrl:
          aadharBackUrl ||
          "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=400&q=80",
        panCardUrl:
          panUrl ||
          "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=400&q=80",
      };

      await saveEmployeeToStorage(finalPayload);

      setUploadStatus("Saved successfully!");
      router.push("/employees");
    } catch (err) {
      console.error("Save employee error:", err);
      alert("Failed to save employee. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4 pb-12">
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
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">Add New Employee</h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Fill employee personal, employment, document, and emergency contact details.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Link
              href="/departments-roles"
              className="px-3.5 py-1.5 bg-blue-50 text-[#0B4FBA] border border-blue-200 text-xs font-semibold rounded-lg hover:bg-blue-100 transition-colors shadow-2xs flex items-center space-x-1.5"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Manage Depts & Roles</span>
            </Link>
            <Link
              href="/employees"
              className="px-3.5 py-1.5 bg-white border border-gray-300 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-2xs"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-3.5 py-1.5 bg-[#0B4FBA] hover:bg-[#003882] text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center space-x-1.5 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Save Employee</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Loading Banner */}
        {submitting && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs flex items-center space-x-3 animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin text-[#0B4FBA]" />
            <div>
              <div className="font-semibold">{uploadStatus}</div>
              <div className="text-blue-600 text-[11px]">
                Please wait while images are uploaded to ImageKit and stored in Firebase.
              </div>
            </div>
          </div>
        )}

        {/* SECTION 1: Personal Information */}
        <div className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-2xs space-y-4">
          <div className="flex items-center space-x-2 border-b border-gray-100 pb-2.5">
            <User className="w-4 h-4 text-[#0B4FBA]" />
            <h2 className="text-sm font-bold text-gray-900">Personal Information</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                First Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                autoComplete="off"
                spellCheck={false}
                value={formData.firstName}
                onChange={(e) => handleChange("firstName", e.target.value)}
                placeholder="e.g. Rajesh"
                className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B4FBA]/30 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Last Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                autoComplete="off"
                spellCheck={false}
                value={formData.lastName}
                onChange={(e) => handleChange("lastName", e.target.value)}
                placeholder="e.g. Kumar"
                className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B4FBA]/30 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Mobile Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                autoComplete="off"
                spellCheck={false}
                value={formData.mobileNumber}
                onChange={(e) => handleChange("mobileNumber", e.target.value)}
                placeholder="e.g. +91 9876543210"
                className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B4FBA]/30 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                autoComplete="off"
                spellCheck={false}
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="e.g. rajesh@gamanext.com"
                className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B4FBA]/30 outline-none"
              />
            </div>

            {/* Custom Date Picker for DOB */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Date of Birth (Custom Calendar)
              </label>
              <CustomDatePicker
                value={formData.dateOfBirth}
                onChange={(val) => handleChange("dateOfBirth", val)}
                placeholder="Select Date of Birth"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">City</label>
              <input
                type="text"
                autoComplete="off"
                spellCheck={false}
                value={formData.city}
                onChange={(e) => handleChange("city", e.target.value)}
                placeholder="e.g. Hyderabad"
                className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B4FBA]/30 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Pincode</label>
              <input
                type="text"
                autoComplete="off"
                spellCheck={false}
                value={formData.pincode}
                onChange={(e) => handleChange("pincode", e.target.value)}
                placeholder="e.g. 500033"
                className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B4FBA]/30 outline-none"
              />
            </div>

            <div className="sm:col-span-2 md:col-span-4">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Full Address</label>
              <input
                type="text"
                autoComplete="off"
                spellCheck={false}
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
                placeholder="e.g. Plot 42, Street 5, Jubilee Hills"
                className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B4FBA]/30 outline-none"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: Employment Details */}
        <div className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
            <div className="flex items-center space-x-2">
              <Briefcase className="w-4 h-4 text-[#0B4FBA]" />
              <h2 className="text-sm font-bold text-gray-900">Employment & Credential Details</h2>
            </div>
            <Link
              href="/departments-roles"
              className="text-xs text-[#0B4FBA] hover:underline font-semibold flex items-center space-x-1"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>+ Add Custom Role / Department</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* Auto-generated 6-digit numeric Employee ID (Not Editable) */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center justify-between">
                <span>Employee ID</span>
                <span className="text-[10px] text-gray-400 font-normal flex items-center space-x-1">
                  <Lock className="w-3 h-3 text-gray-400" />
                  <span>Auto-Generated (Unique)</span>
                </span>
              </label>
              <input
                type="text"
                readOnly
                value={formData.employeeId}
                placeholder="Generating ID..."
                className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg bg-gray-100 text-gray-800 font-mono font-bold cursor-not-allowed select-none outline-none shadow-2xs"
              />
            </div>

            {/* Custom Dropdown for Employee Role */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Employee Role (Custom Dropdown) <span className="text-rose-500">*</span>
              </label>
              <CustomDropdown
                options={roleOptions}
                value={formData.employeeRole}
                onChange={(val) => handleChange("employeeRole", val)}
                placeholder="Select Employee Role"
              />
            </div>

            {/* Custom Dropdown for Department */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Department (Custom Dropdown) <span className="text-rose-500">*</span>
              </label>
              <CustomDropdown
                options={departmentOptions}
                value={formData.department}
                onChange={(val) => handleChange("department", val)}
                placeholder="Select Department"
              />
            </div>

            {/* Custom Date Picker for Date of Joining */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Date of Joining (Custom Calendar) <span className="text-rose-500">*</span>
              </label>
              <CustomDatePicker
                value={formData.dateOfJoining}
                onChange={(val) => handleChange("dateOfJoining", val)}
                placeholder="Select Joining Date"
              />
            </div>

            {/* Custom Dropdown for Job Type */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Job Type <span className="text-rose-500">*</span>
              </label>
              <CustomDropdown
                options={jobTypeOptions}
                value={formData.jobType || "Full-Time"}
                onChange={(val) => handleChange("jobType", val)}
                placeholder="Select Job Type"
              />
            </div>

            {/* Auto-generated Username: empId@gamanext.com (Not Editable) */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center justify-between">
                <span>Username</span>
                <span className="text-[10px] text-gray-400 font-normal flex items-center space-x-1">
                  <Lock className="w-3 h-3 text-gray-400" />
                  <span>Auto-Generated</span>
                </span>
              </label>
              <input
                type="text"
                readOnly
                value={formData.employeeId ? `${formData.employeeId}@gamanext.com` : ""}
                placeholder="id@gamanext.com"
                className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg bg-gray-100 text-gray-800 font-mono font-bold cursor-not-allowed select-none outline-none shadow-2xs"
              />
            </div>

            {/* Password input with Show/Hide Eye toggle */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  spellCheck={false}
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-3 pr-9 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B4FBA]/30 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 text-gray-400 hover:text-gray-600 focus:outline-none p-0.5"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-3.5 h-3.5 text-[#0B4FBA]" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Aadhar Card Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                autoComplete="off"
                spellCheck={false}
                value={formData.aadharNumber}
                onChange={(e) => handleChange("aadharNumber", e.target.value)}
                placeholder="12 digit Aadhar No"
                className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B4FBA]/30 outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                PAN Card Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                autoComplete="off"
                spellCheck={false}
                value={formData.panCardNumber}
                onChange={(e) => handleChange("panCardNumber", e.target.value.toUpperCase())}
                placeholder="10 digit PAN No"
                className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B4FBA]/30 outline-none uppercase font-mono"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: Documents & ImageKit Photo Uploads */}
        <div className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
            <div className="flex items-center space-x-2">
              <Upload className="w-4 h-4 text-[#0B4FBA]" />
              <div>
                <h2 className="text-sm font-bold text-gray-900">Document Uploads (ImageKit CDN)</h2>
                <p className="text-[11px] text-gray-500">
                  Upload profile photo, Aadhar front/back, and PAN card images.
                </p>
              </div>
            </div>
            <span className="text-[10px] bg-blue-50 text-[#0B4FBA] px-2 py-0.5 rounded border border-blue-200 font-medium">
              ImageKit Direct Upload
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* Profile Photo */}
            <div className="border border-dashed border-gray-300 rounded-xl p-3 text-center space-y-2 hover:bg-gray-50/50 transition-colors">
              <span className="text-xs font-bold text-gray-800 block">Profile Photo</span>
              <div className="w-20 h-20 mx-auto rounded-full bg-gray-100 overflow-hidden relative border border-gray-200 flex items-center justify-center">
                {profilePreview ? (
                  <img src={profilePreview} alt="Profile preview" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-7 h-7 text-gray-400" />
                )}
              </div>
              <label className="cursor-pointer inline-flex items-center space-x-1 text-xs text-[#0B4FBA] font-medium bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md border border-blue-200/60 transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Profile</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e, setProfilePhotoFile, setProfilePreview)}
                  className="hidden"
                />
              </label>
            </div>

            {/* Aadhar Front */}
            <div className="border border-dashed border-gray-300 rounded-xl p-3 text-center space-y-2 hover:bg-gray-50/50 transition-colors">
              <span className="text-xs font-bold text-gray-800 block">Aadhar Card (Front)</span>
              <div className="w-full h-20 rounded-lg bg-gray-100 overflow-hidden relative border border-gray-200 flex items-center justify-center">
                {aadharFrontPreview ? (
                  <img src={aadharFrontPreview} alt="Aadhar Front" className="w-full h-full object-cover" />
                ) : (
                  <FileCheck className="w-7 h-7 text-gray-400" />
                )}
              </div>
              <label className="cursor-pointer inline-flex items-center space-x-1 text-xs text-[#0B4FBA] font-medium bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md border border-blue-200/60 transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Front</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e, setAadharFrontFile, setAadharFrontPreview)}
                  className="hidden"
                />
              </label>
            </div>

            {/* Aadhar Back */}
            <div className="border border-dashed border-gray-300 rounded-xl p-3 text-center space-y-2 hover:bg-gray-50/50 transition-colors">
              <span className="text-xs font-bold text-gray-800 block">Aadhar Card (Back)</span>
              <div className="w-full h-20 rounded-lg bg-gray-100 overflow-hidden relative border border-gray-200 flex items-center justify-center">
                {aadharBackPreview ? (
                  <img src={aadharBackPreview} alt="Aadhar Back" className="w-full h-full object-cover" />
                ) : (
                  <FileCheck className="w-7 h-7 text-gray-400" />
                )}
              </div>
              <label className="cursor-pointer inline-flex items-center space-x-1 text-xs text-[#0B4FBA] font-medium bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md border border-blue-200/60 transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Back</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e, setAadharBackFile, setAadharBackPreview)}
                  className="hidden"
                />
              </label>
            </div>

            {/* PAN Card Photo */}
            <div className="border border-dashed border-gray-300 rounded-xl p-3 text-center space-y-2 hover:bg-gray-50/50 transition-colors">
              <span className="text-xs font-bold text-gray-800 block">PAN Card Photo</span>
              <div className="w-full h-20 rounded-lg bg-gray-100 overflow-hidden relative border border-gray-200 flex items-center justify-center">
                {panCardPreview ? (
                  <img src={panCardPreview} alt="PAN Card" className="w-full h-full object-cover" />
                ) : (
                  <CreditCard className="w-7 h-7 text-gray-400" />
                )}
              </div>
              <label className="cursor-pointer inline-flex items-center space-x-1 text-xs text-[#0B4FBA] font-medium bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md border border-blue-200/60 transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload PAN</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e, setPanCardFile, setPanCardPreview)}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* SECTION 4: Bank Details */}
        <div className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-2xs space-y-4">
          <div className="flex items-center space-x-2 border-b border-gray-100 pb-2.5">
            <CreditCard className="w-4 h-4 text-[#0B4FBA]" />
            <h2 className="text-sm font-bold text-gray-900">Bank Account Details</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Bank Name</label>
              <input
                type="text"
                autoComplete="off"
                spellCheck={false}
                value={formData.bankName}
                onChange={(e) => handleChange("bankName", e.target.value)}
                placeholder="e.g. HDFC Bank / ICICI Bank"
                className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B4FBA]/30 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Bank Account Number
              </label>
              <input
                type="text"
                autoComplete="off"
                spellCheck={false}
                value={formData.bankAccountNumber}
                onChange={(e) => handleChange("bankAccountNumber", e.target.value)}
                placeholder="e.g. 50100492837192"
                className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B4FBA]/30 outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">IFSC Code</label>
              <input
                type="text"
                autoComplete="off"
                spellCheck={false}
                value={formData.bankIfscCode}
                onChange={(e) => handleChange("bankIfscCode", e.target.value.toUpperCase())}
                placeholder="e.g. HDFC0001234"
                className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B4FBA]/30 outline-none uppercase font-mono"
              />
            </div>
          </div>
        </div>

        {/* SECTION 5: Emergency Contacts */}
        <div className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-2xs space-y-4">
          <div className="flex items-center space-x-2 border-b border-gray-100 pb-2.5">
            <PhoneCall className="w-4 h-4 text-[#0B4FBA]" />
            <h2 className="text-sm font-bold text-gray-900">Emergency Contacts</h2>
          </div>

          {/* Emergency Contact 1 */}
          <div className="space-y-2.5 bg-gray-50/50 p-3.5 rounded-xl border border-gray-200/60">
            <span className="text-[11px] font-bold text-[#0B4FBA] uppercase tracking-wider block">
              Emergency Contact 1
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  autoComplete="off"
                  spellCheck={false}
                  value={formData.emergencyContact1.name}
                  onChange={(e) =>
                    handleEmergencyChange("emergencyContact1", "name", e.target.value)
                  }
                  placeholder="e.g. Suresh Kumar"
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg bg-white outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Relation</label>
                <CustomDropdown
                  options={relationOptions}
                  value={formData.emergencyContact1.relation}
                  onChange={(val) => handleEmergencyChange("emergencyContact1", "relation", val)}
                  placeholder="Select Relation"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  autoComplete="off"
                  spellCheck={false}
                  value={formData.emergencyContact1.mobileNumber}
                  onChange={(e) =>
                    handleEmergencyChange("emergencyContact1", "mobileNumber", e.target.value)
                  }
                  placeholder="+91 9876500001"
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg bg-white outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Occupation
                </label>
                <input
                  type="text"
                  autoComplete="off"
                  spellCheck={false}
                  value={formData.emergencyContact1.occupation}
                  onChange={(e) =>
                    handleEmergencyChange("emergencyContact1", "occupation", e.target.value)
                  }
                  placeholder="e.g. Business"
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg bg-white outline-none"
                />
              </div>

              <div className="sm:col-span-2 md:col-span-4">
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  autoComplete="off"
                  spellCheck={false}
                  value={formData.emergencyContact1.address}
                  onChange={(e) =>
                    handleEmergencyChange("emergencyContact1", "address", e.target.value)
                  }
                  placeholder="Emergency contact full address"
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg bg-white outline-none"
                />
              </div>
            </div>
          </div>

          {/* Emergency Contact 2 */}
          <div className="space-y-2.5 bg-gray-50/50 p-3.5 rounded-xl border border-gray-200/60">
            <span className="text-[11px] font-bold text-[#0B4FBA] uppercase tracking-wider block">
              Emergency Contact 2
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  autoComplete="off"
                  spellCheck={false}
                  value={formData.emergencyContact2.name}
                  onChange={(e) =>
                    handleEmergencyChange("emergencyContact2", "name", e.target.value)
                  }
                  placeholder="e.g. Priya Kumar"
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg bg-white outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Relation</label>
                <CustomDropdown
                  options={relationOptions}
                  value={formData.emergencyContact2.relation}
                  onChange={(val) => handleEmergencyChange("emergencyContact2", "relation", val)}
                  placeholder="Select Relation"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  autoComplete="off"
                  spellCheck={false}
                  value={formData.emergencyContact2.mobileNumber}
                  onChange={(e) =>
                    handleEmergencyChange("emergencyContact2", "mobileNumber", e.target.value)
                  }
                  placeholder="+91 9876500002"
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg bg-white outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Occupation
                </label>
                <input
                  type="text"
                  autoComplete="off"
                  spellCheck={false}
                  value={formData.emergencyContact2.occupation}
                  onChange={(e) =>
                    handleEmergencyChange("emergencyContact2", "occupation", e.target.value)
                  }
                  placeholder="e.g. Teacher"
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg bg-white outline-none"
                />
              </div>

              <div className="sm:col-span-2 md:col-span-4">
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  autoComplete="off"
                  spellCheck={false}
                  value={formData.emergencyContact2.address}
                  onChange={(e) =>
                    handleEmergencyChange("emergencyContact2", "address", e.target.value)
                  }
                  placeholder="Emergency contact 2 full address"
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg bg-white outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex justify-end space-x-2 pt-2">
          <Link
            href="/employees"
            className="px-3.5 py-1.5 bg-white border border-gray-300 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-2xs"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-3.5 py-1.5 bg-[#0B4FBA] hover:bg-[#003882] text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center space-x-1.5 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Save Employee</span>
              </>
            )}
          </button>
        </div>
      </form>
    </AdminLayout>
  );
}
