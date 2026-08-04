"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "../../components/AdminLayout";
import { saveEmployeeToStorage, EmployeeData } from "@/lib/firebase";
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
} from "lucide-react";
import Link from "next/link";

export default function AddEmployeePage() {
  const router = useRouter();

  // Loading state
  const [submitting, setSubmitting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");

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
    employeeId: `GMN-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    employeeRole: "Software Engineer",
    department: "Engineering",
    dateOfJoining: new Date().toISOString().split("T")[0],
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
  const handleChange = (
    field: keyof EmployeeData,
    value: string
  ) => {
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

      // 5. Final Employee payload
      setUploadStatus("Saving employee record to Firebase Firestore...");
      const finalPayload: EmployeeData = {
        ...formData,
        profilePhotoUrl: profileUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80",
        aadharFrontUrl: aadharFrontUrl || "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=400&q=80",
        aadharBackUrl: aadharBackUrl || "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=400&q=80",
        panCardUrl: panUrl || "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=400&q=80",
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
      <form onSubmit={handleSubmit} className="space-y-4 pb-12">
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
              <div className="text-blue-600 text-[11px]">Please wait while images are uploaded to ImageKit and stored in Firebase.</div>
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
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="e.g. rajesh@gamanext.com"
                className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B4FBA]/30 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleChange("dateOfBirth", e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B4FBA]/30 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                City
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleChange("city", e.target.value)}
                placeholder="e.g. Hyderabad"
                className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B4FBA]/30 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Pincode
              </label>
              <input
                type="text"
                value={formData.pincode}
                onChange={(e) => handleChange("pincode", e.target.value)}
                placeholder="e.g. 500033"
                className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B4FBA]/30 outline-none"
              />
            </div>

            <div className="sm:col-span-2 md:col-span-4">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Full Address
              </label>
              <input
                type="text"
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
          <div className="flex items-center space-x-2 border-b border-gray-100 pb-2.5">
            <Briefcase className="w-4 h-4 text-[#0B4FBA]" />
            <h2 className="text-sm font-bold text-gray-900">Employment & Credential Details</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Employee ID <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.employeeId}
                onChange={(e) => handleChange("employeeId", e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-[#0B4FBA]/30 outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Employee Role <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.employeeRole}
                onChange={(e) => handleChange("employeeRole", e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B4FBA]/30 outline-none bg-white"
              >
                <option value="Senior Software Engineer">Senior Software Engineer</option>
                <option value="Frontend Developer">Frontend Developer</option>
                <option value="Backend Developer">Backend Developer</option>
                <option value="Product Designer">Product Designer</option>
                <option value="Sales Executive">Sales Executive</option>
                <option value="HR Manager">HR Manager</option>
                <option value="Operations Associate">Operations Associate</option>
                <option value="Accountant">Accountant</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Department <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.department}
                onChange={(e) => handleChange("department", e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B4FBA]/30 outline-none bg-white"
              >
                <option value="Engineering">Engineering</option>
                <option value="UI/UX Design">UI/UX Design</option>
                <option value="Sales & Marketing">Sales & Marketing</option>
                <option value="Human Resources">Human Resources</option>
                <option value="Finance">Finance</option>
                <option value="Operations">Operations</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Date of Joining <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.dateOfJoining}
                onChange={(e) => handleChange("dateOfJoining", e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B4FBA]/30 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Username <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.username}
                onChange={(e) => handleChange("username", e.target.value)}
                placeholder="e.g. rajesh_k"
                className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B4FBA]/30 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Password <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => handleChange("password", e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B4FBA]/30 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Aadhar Card Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
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
                <p className="text-[11px] text-gray-500">Upload profile photo, Aadhar front/back, and PAN card images.</p>
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
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Bank Name
              </label>
              <input
                type="text"
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
                value={formData.bankAccountNumber}
                onChange={(e) => handleChange("bankAccountNumber", e.target.value)}
                placeholder="e.g. 50100492837192"
                className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B4FBA]/30 outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                IFSC Code
              </label>
              <input
                type="text"
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
                  value={formData.emergencyContact1.name}
                  onChange={(e) => handleEmergencyChange("emergencyContact1", "name", e.target.value)}
                  placeholder="e.g. Suresh Kumar"
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg bg-white outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Relation</label>
                <input
                  type="text"
                  value={formData.emergencyContact1.relation}
                  onChange={(e) => handleEmergencyChange("emergencyContact1", "relation", e.target.value)}
                  placeholder="e.g. Father / Spouse"
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg bg-white outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Mobile Number</label>
                <input
                  type="tel"
                  value={formData.emergencyContact1.mobileNumber}
                  onChange={(e) => handleEmergencyChange("emergencyContact1", "mobileNumber", e.target.value)}
                  placeholder="+91 9876500001"
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg bg-white outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Occupation</label>
                <input
                  type="text"
                  value={formData.emergencyContact1.occupation}
                  onChange={(e) => handleEmergencyChange("emergencyContact1", "occupation", e.target.value)}
                  placeholder="e.g. Business"
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg bg-white outline-none"
                />
              </div>

              <div className="sm:col-span-2 md:col-span-4">
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  value={formData.emergencyContact1.address}
                  onChange={(e) => handleEmergencyChange("emergencyContact1", "address", e.target.value)}
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
                  value={formData.emergencyContact2.name}
                  onChange={(e) => handleEmergencyChange("emergencyContact2", "name", e.target.value)}
                  placeholder="e.g. Priya Kumar"
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg bg-white outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Relation</label>
                <input
                  type="text"
                  value={formData.emergencyContact2.relation}
                  onChange={(e) => handleEmergencyChange("emergencyContact2", "relation", e.target.value)}
                  placeholder="e.g. Spouse / Mother"
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg bg-white outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Mobile Number</label>
                <input
                  type="tel"
                  value={formData.emergencyContact2.mobileNumber}
                  onChange={(e) => handleEmergencyChange("emergencyContact2", "mobileNumber", e.target.value)}
                  placeholder="+91 9876500002"
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg bg-white outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Occupation</label>
                <input
                  type="text"
                  value={formData.emergencyContact2.occupation}
                  onChange={(e) => handleEmergencyChange("emergencyContact2", "occupation", e.target.value)}
                  placeholder="e.g. Teacher"
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg bg-white outline-none"
                />
              </div>

              <div className="sm:col-span-2 md:col-span-4">
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  value={formData.emergencyContact2.address}
                  onChange={(e) => handleEmergencyChange("emergencyContact2", "address", e.target.value)}
                  placeholder="Emergency contact 2 full address"
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg bg-white outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit Bar at bottom - Compact Shopify Button Alignment */}
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
