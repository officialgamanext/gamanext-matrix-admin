"use client";

import { useEffect, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import {
  getCompanySettingsFromStorage,
  saveCompanySettingsToStorage,
  CompanySettings,
  DEFAULT_COMPANY_SETTINGS,
} from "@/lib/firebase";
import { uploadToImageKit } from "@/lib/imagekit";
import {
  Settings,
  Building2,
  Phone,
  Mail,
  Globe,
  MapPin,
  FileText,
  Landmark,
  QrCode,
  PenTool,
  CheckCircle2,
  Save,
  RotateCcw,
  Upload,
  Image as ImageIcon,
  X,
  Edit2,
  Eye,
  ShieldCheck,
  Check,
} from "lucide-react";

export default function SettingsPage() {
  const [settings, setSettings] = useState<CompanySettings>(DEFAULT_COMPANY_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // View Mode by default
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"company" | "bank" | "invoice">("company");

  // File Upload State for QR Code & Signature
  const [qrCodeFile, setQrCodeFile] = useState<File | null>(null);
  const [qrPreviewUrl, setQrPreviewUrl] = useState<string | null>(null);

  const [sigFile, setSigFile] = useState<File | null>(null);
  const [sigPreviewUrl, setSigPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const data = await getCompanySettingsFromStorage();
        setSettings(data);
        if (data.upiQrCodeUrl) {
          setQrPreviewUrl(data.upiQrCodeUrl);
        }
        if (data.signatoryImageUrl) {
          setSigPreviewUrl(data.signatoryImageUrl);
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleQrFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setQrCodeFile(file);
      setQrPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRemoveQrCode = () => {
    setQrCodeFile(null);
    setQrPreviewUrl(null);
    setSettings((prev) => ({ ...prev, upiQrCodeUrl: "" }));
  };

  const handleSigFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSigFile(file);
      setSigPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRemoveSignature = () => {
    setSigFile(null);
    setSigPreviewUrl(null);
    setSettings((prev) => ({ ...prev, signatoryImageUrl: "" }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);

    let updatedSettings = { ...settings };

    try {
      // Upload QR Code if selected
      if (qrCodeFile) {
        const uploadedQrUrl = await uploadToImageKit(qrCodeFile, "qr-codes");
        if (uploadedQrUrl) {
          updatedSettings.upiQrCodeUrl = uploadedQrUrl;
        }
      }

      // Upload Signature Image if selected
      if (sigFile) {
        const uploadedSigUrl = await uploadToImageKit(sigFile, "signatures");
        if (uploadedSigUrl) {
          updatedSettings.signatoryImageUrl = uploadedSigUrl;
        }
      }

      const saved = await saveCompanySettingsToStorage(updatedSettings);
      setSettings(saved);
      if (saved.upiQrCodeUrl) setQrPreviewUrl(saved.upiQrCodeUrl);
      if (saved.signatoryImageUrl) setSigPreviewUrl(saved.signatoryImageUrl);

      setQrCodeFile(null);
      setSigFile(null);
      setIsEditing(false); // Return to View Mode after saving

      setSuccessMsg("Business settings updated successfully!");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      console.error("Failed to save settings:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefault = () => {
    if (confirm("Reset company settings to default values?")) {
      setSettings(DEFAULT_COMPANY_SETTINGS);
      setQrCodeFile(null);
      setSigFile(null);
      setQrPreviewUrl(DEFAULT_COMPANY_SETTINGS.upiQrCodeUrl || null);
      setSigPreviewUrl(DEFAULT_COMPANY_SETTINGS.signatoryImageUrl || null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-[#0B4FBA]/10 border border-[#0B4FBA]/20 rounded-xl text-[#0B4FBA]">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Business Settings</h1>
                <span
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                    isEditing
                      ? "bg-amber-100 text-amber-800 border-amber-200"
                      : "bg-emerald-100 text-emerald-800 border-emerald-200"
                  }`}
                >
                  {isEditing ? "Edit Mode" : "Read-Only View"}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Manage company info, GSTIN, bank accounts, UPI QR image, and authorized signature.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-[#0B4FBA] hover:bg-[#083c8d] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center space-x-2"
              >
                <Edit2 className="w-4 h-4" />
                <span>Edit Settings</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3.5 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleResetDefault}
                  className="px-3.5 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-semibold rounded-lg transition-colors flex items-center space-x-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Defaults</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Success Notification */}
        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between animate-in fade-in">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
            <span className="text-[11px] text-emerald-600">Saved to database</span>
          </div>
        )}

        {/* Tabs Bar */}
        <div className="flex items-center space-x-2 bg-white p-1.5 rounded-xl border border-gray-200 shadow-2xs">
          <button
            onClick={() => setActiveTab("company")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center space-x-2 ${
              activeTab === "company"
                ? "bg-[#0B4FBA] text-white shadow-xs"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Company Profile & GST</span>
          </button>

          <button
            onClick={() => setActiveTab("bank")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center space-x-2 ${
              activeTab === "bank"
                ? "bg-[#0B4FBA] text-white shadow-xs"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Landmark className="w-4 h-4" />
            <span>Bank Account & UPI QR Code</span>
          </button>

          <button
            onClick={() => setActiveTab("invoice")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center space-x-2 ${
              activeTab === "invoice"
                ? "bg-[#0B4FBA] text-white shadow-xs"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Terms & Signature</span>
          </button>
        </div>

        {/* Content Container */}
        {loading ? (
          <div className="p-12 text-center bg-white rounded-xl border border-gray-200">
            <div className="w-8 h-8 border-2 border-[#0B4FBA] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs text-gray-500 font-medium">Loading settings...</p>
          </div>
        ) : !isEditing ? (
          /* ========================================================================== */
          /* READ-ONLY VIEW MODE                                                       */
          /* ========================================================================== */
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-2xs space-y-6">
            {/* TAB 1: COMPANY PROFILE VIEW */}
            {activeTab === "company" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div>
                    <h2 className="text-base font-bold text-gray-900">Organization Details</h2>
                    <p className="text-xs text-gray-500">Official company contact and GST information.</p>
                  </div>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-3 py-1.5 bg-[#0B4FBA] text-white text-xs font-semibold rounded-lg hover:bg-[#083c8d] transition-colors flex items-center space-x-1.5"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Profile</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-100 space-y-1">
                    <span className="text-[11px] font-semibold text-gray-500 block">Company Name</span>
                    <span className="text-sm font-bold text-gray-900 block">{settings.companyName}</span>
                  </div>

                  <div className="p-4 bg-blue-50/70 rounded-xl border border-blue-100 space-y-1">
                    <span className="text-[11px] font-semibold text-blue-700 block">Company GSTIN / Tax ID</span>
                    <span className="text-sm font-bold font-mono text-[#0B4FBA] block">{settings.gstin}</span>
                  </div>

                  <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-100 space-y-1">
                    <span className="text-[11px] font-semibold text-gray-500 block">Phone Number</span>
                    <span className="text-sm font-semibold font-mono text-gray-900 block">{settings.phone}</span>
                  </div>

                  <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-100 space-y-1">
                    <span className="text-[11px] font-semibold text-gray-500 block">Email Address</span>
                    <span className="text-sm font-semibold text-gray-900 block">{settings.email}</span>
                  </div>

                  <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-100 space-y-1">
                    <span className="text-[11px] font-semibold text-gray-500 block">Website</span>
                    <span className="text-sm font-semibold text-gray-900 block">{settings.website || "N/A"}</span>
                  </div>

                  <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-100 space-y-1 md:col-span-2">
                    <span className="text-[11px] font-semibold text-gray-500 block">Registered Address</span>
                    <span className="text-xs font-medium text-gray-800 block leading-relaxed">{settings.address}</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: BANK & UPI VIEW */}
            {activeTab === "bank" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div>
                    <h2 className="text-base font-bold text-gray-900">Bank Details & UPI Payment QR Code</h2>
                    <p className="text-xs text-gray-500">Bank account details and uploaded QR Code image.</p>
                  </div>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-3 py-1.5 bg-[#0B4FBA] text-white text-xs font-semibold rounded-lg hover:bg-[#083c8d] transition-colors flex items-center space-x-1.5"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Bank Info</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-100 space-y-1">
                    <span className="text-[11px] font-semibold text-gray-500 block">Bank Name</span>
                    <span className="text-sm font-bold text-gray-900 block">{settings.bankName || "HDFC Bank"}</span>
                  </div>

                  <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-100 space-y-1">
                    <span className="text-[11px] font-semibold text-gray-500 block">Account Holder Name</span>
                    <span className="text-sm font-semibold text-gray-900 block">{settings.accountName || settings.companyName}</span>
                  </div>

                  <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-100 space-y-1">
                    <span className="text-[11px] font-semibold text-gray-500 block">Account Number</span>
                    <span className="text-sm font-bold font-mono text-gray-900 block">{settings.accountNumber || "50200012345678"}</span>
                  </div>

                  <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-100 space-y-1">
                    <span className="text-[11px] font-semibold text-gray-500 block">IFSC Code</span>
                    <span className="text-sm font-bold font-mono text-gray-900 block">{settings.ifscCode || "HDFC0001234"}</span>
                  </div>

                  <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-100 space-y-1">
                    <span className="text-[11px] font-semibold text-gray-500 block">Bank Branch</span>
                    <span className="text-sm font-semibold text-gray-900 block">{settings.branch || "Koramangala, Bengaluru"}</span>
                  </div>

                  <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-100 space-y-1">
                    <span className="text-[11px] font-semibold text-gray-500 block">UPI ID</span>
                    <span className="text-sm font-bold font-mono text-purple-700 block">{settings.upiId || "6281288314@upi"}</span>
                  </div>
                </div>

                {/* QR Code Preview in View Mode */}
                <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-[#0B4FBA] block">UPI Payment QR Code</span>
                    <p className="text-[11px] text-gray-500">Printed directly on invoice Scan to Pay section.</p>
                  </div>
                  <div className="w-24 h-24 bg-white border border-gray-200 rounded-xl overflow-hidden p-1 flex items-center justify-center shadow-2xs">
                    {qrPreviewUrl ? (
                      <img src={qrPreviewUrl} alt="UPI QR Code" className="w-full h-full object-contain" />
                    ) : (
                      <div className="text-center text-gray-400">
                        <QrCode className="w-8 h-8 mx-auto" />
                        <span className="text-[9px] block mt-0.5">Default Vector</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: INVOICE TERMS & SIGNATURE VIEW */}
            {activeTab === "invoice" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div>
                    <h2 className="text-base font-bold text-gray-900">Authorized Signature & Terms</h2>
                    <p className="text-xs text-gray-500">Signatory name, signature image, and invoice terms.</p>
                  </div>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-3 py-1.5 bg-[#0B4FBA] text-white text-xs font-semibold rounded-lg hover:bg-[#083c8d] transition-colors flex items-center space-x-1.5"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Signature & Terms</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-100 space-y-1">
                    <span className="text-[11px] font-semibold text-gray-500 block">Authorized Signatory Title</span>
                    <span className="text-sm font-bold text-gray-900 block">{settings.signatoryName || "Siva Krishna"}</span>
                  </div>

                  <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-[#0B4FBA] block">Signature Image</span>
                      <span className="text-[10px] text-gray-500">Printed on bottom signature line</span>
                    </div>
                    <div className="w-32 h-14 bg-white border border-gray-200 rounded-lg p-1 flex items-center justify-center shadow-2xs">
                      {sigPreviewUrl ? (
                        <img src={sigPreviewUrl} alt="Signature" className="max-h-full max-w-full object-contain" />
                      ) : (
                        <span className="italic text-base font-serif text-[#004bb7]">
                          {settings.signatoryName || "Siva Krishna"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-100 space-y-2 text-xs">
                  <span className="text-[11px] font-semibold text-gray-500 block">Default Terms & Conditions</span>
                  <div className="font-mono text-gray-700 whitespace-pre-line leading-relaxed">
                    {settings.termsAndConditions}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ========================================================================== */
          /* EDIT MODE FORM                                                            */
          /* ========================================================================== */
          <form onSubmit={handleSave} className="bg-white rounded-xl border border-gray-200 p-6 shadow-2xs space-y-6">
            {/* TAB 1: COMPANY PROFILE EDIT */}
            {activeTab === "company" && (
              <div className="space-y-4">
                <div className="border-b border-gray-100 pb-3">
                  <h2 className="text-base font-bold text-gray-900">Edit Organization Information</h2>
                  <p className="text-xs text-gray-500">
                    Update official company contact and GST identification.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Company / Legal Business Name *
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={settings.companyName}
                        onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-[#0B4FBA]/20 focus:border-[#0B4FBA]"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Company GSTIN / Tax ID *
                    </label>
                    <div className="relative">
                      <FileText className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={settings.gstin}
                        onChange={(e) => setSettings({ ...settings, gstin: e.target.value })}
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-xs font-mono font-bold uppercase focus:ring-2 focus:ring-[#0B4FBA]/20 focus:border-[#0B4FBA]"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Official Phone / Mobile *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={settings.phone}
                        onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-[#0B4FBA]/20 focus:border-[#0B4FBA]"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={settings.email}
                        onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-[#0B4FBA]/20 focus:border-[#0B4FBA]"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Official Website
                    </label>
                    <div className="relative">
                      <Globe className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={settings.website || ""}
                        onChange={(e) => setSettings({ ...settings, website: e.target.value })}
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-[#0B4FBA]/20 focus:border-[#0B4FBA]"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Registered Business Address *
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <textarea
                      rows={3}
                      value={settings.address}
                      onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-[#0B4FBA]/20 focus:border-[#0B4FBA]"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: BANK DETAILS & UPI QR CODE EDIT */}
            {activeTab === "bank" && (
              <div className="space-y-6">
                <div className="border-b border-gray-100 pb-3">
                  <h2 className="text-base font-bold text-gray-900">Edit Bank Details & UPI Payment QR Code</h2>
                  <p className="text-xs text-gray-500">
                    Upload your UPI payment QR code image to print directly on generated customer invoices.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={settings.bankName || ""}
                      onChange={(e) => setSettings({ ...settings, bankName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-[#0B4FBA]/20 focus:border-[#0B4FBA]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Account Holder Name</label>
                    <input
                      type="text"
                      value={settings.accountName || ""}
                      onChange={(e) => setSettings({ ...settings, accountName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-[#0B4FBA]/20 focus:border-[#0B4FBA]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Account Number</label>
                    <input
                      type="text"
                      value={settings.accountNumber || ""}
                      onChange={(e) => setSettings({ ...settings, accountNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-[#0B4FBA]/20 focus:border-[#0B4FBA]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">IFSC Code</label>
                    <input
                      type="text"
                      value={settings.ifscCode || ""}
                      onChange={(e) => setSettings({ ...settings, ifscCode: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono uppercase focus:ring-2 focus:ring-[#0B4FBA]/20 focus:border-[#0B4FBA]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Bank Branch</label>
                    <input
                      type="text"
                      value={settings.branch || ""}
                      onChange={(e) => setSettings({ ...settings, branch: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-[#0B4FBA]/20 focus:border-[#0B4FBA]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">UPI ID (Scan to Pay Text)</label>
                    <div className="relative">
                      <QrCode className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="e.g. 6281288314@upi"
                        value={settings.upiId || ""}
                        onChange={(e) => setSettings({ ...settings, upiId: e.target.value })}
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-[#0B4FBA]/20 focus:border-[#0B4FBA]"
                      />
                    </div>
                  </div>
                </div>

                {/* Upload UPI QR Code Image */}
                <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-[#0B4FBA] block">UPI Payment QR Code Image</span>
                      <p className="text-[11px] text-gray-500">
                        Upload your QR code image. Uploads to ImageKit on save.
                      </p>
                    </div>

                    {qrPreviewUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveQrCode}
                        className="text-xs text-red-600 hover:text-red-800 font-semibold flex items-center space-x-1"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Remove QR Code</span>
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="w-28 h-28 bg-white border border-gray-200 rounded-xl overflow-hidden p-1.5 flex items-center justify-center shrink-0 shadow-2xs">
                      {qrPreviewUrl ? (
                        <img src={qrPreviewUrl} alt="UPI QR Code" className="w-full h-full object-contain" />
                      ) : (
                        <div className="text-center p-2 text-gray-400">
                          <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-50" />
                          <span className="text-[10px] block">No Image</span>
                        </div>
                      )}
                    </div>

                    <div className="grow w-full">
                      <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 hover:border-[#0B4FBA] rounded-xl bg-white cursor-pointer transition-colors text-center">
                        <Upload className="w-5 h-5 text-[#0B4FBA] mb-1" />
                        <span className="text-xs font-bold text-gray-800">
                          {qrCodeFile ? qrCodeFile.name : "Choose QR Code Image File"}
                        </span>
                        <span className="text-[10px] text-gray-400 mt-0.5">PNG, JPG, WEBP (Max 5MB)</span>
                        <input type="file" accept="image/*" onChange={handleQrFileChange} className="hidden" />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: INVOICE TERMS & SIGNATURE EDIT */}
            {activeTab === "invoice" && (
              <div className="space-y-6">
                <div className="border-b border-gray-100 pb-3">
                  <h2 className="text-base font-bold text-gray-900">Edit Terms & Signature Image</h2>
                  <p className="text-xs text-gray-500">
                    Configure default legal terms and upload authorized signature image.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Authorized Signatory Name / Title
                  </label>
                  <div className="relative max-w-md">
                    <PenTool className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={settings.signatoryName || ""}
                      onChange={(e) => setSettings({ ...settings, signatoryName: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-[#0B4FBA]/20 focus:border-[#0B4FBA]"
                    />
                  </div>
                </div>

                {/* Upload Authorized Signature Image */}
                <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-[#0B4FBA] block">Authorized Signature Image</span>
                      <p className="text-[11px] text-gray-500">
                        Upload your signature image (transparent PNG recommended). Uploads to ImageKit on save.
                      </p>
                    </div>

                    {sigPreviewUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveSignature}
                        className="text-xs text-red-600 hover:text-red-800 font-semibold flex items-center space-x-1"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Remove Signature</span>
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="w-36 h-16 bg-white border border-gray-200 rounded-xl overflow-hidden p-1.5 flex items-center justify-center shrink-0 shadow-2xs">
                      {sigPreviewUrl ? (
                        <img src={sigPreviewUrl} alt="Signature" className="w-full h-full object-contain" />
                      ) : (
                        <span className="italic text-sm font-serif text-[#004bb7]">
                          {settings.signatoryName || "Siva Krishna"}
                        </span>
                      )}
                    </div>

                    <div className="grow w-full">
                      <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 hover:border-[#0B4FBA] rounded-xl bg-white cursor-pointer transition-colors text-center">
                        <Upload className="w-5 h-5 text-[#0B4FBA] mb-1" />
                        <span className="text-xs font-bold text-gray-800">
                          {sigFile ? sigFile.name : "Choose Signature Image File"}
                        </span>
                        <span className="text-[10px] text-gray-400 mt-0.5">PNG, JPG, WEBP (Max 5MB)</span>
                        <input type="file" accept="image/*" onChange={handleSigFileChange} className="hidden" />
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Default Invoice Terms & Conditions
                  </label>
                  <textarea
                    rows={5}
                    value={settings.termsAndConditions || ""}
                    onChange={(e) => setSettings({ ...settings, termsAndConditions: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono leading-relaxed focus:ring-2 focus:ring-[#0B4FBA]/20 focus:border-[#0B4FBA]"
                  />
                </div>
              </div>
            )}

            {/* Save & Cancel Action Bar */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-semibold rounded-lg"
              >
                Cancel Editing
              </button>

              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-[#0B4FBA] hover:bg-[#083c8d] text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center space-x-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? "Uploading & Saving..." : "Save Business Settings"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </AdminLayout>
  );
}
