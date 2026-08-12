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
} from "lucide-react";

export default function SettingsPage() {
  const [settings, setSettings] = useState<CompanySettings>(DEFAULT_COMPANY_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"company" | "bank" | "invoice">("company");

  // File Upload State for QR Code
  const [qrCodeFile, setQrCodeFile] = useState<File | null>(null);
  const [qrPreviewUrl, setQrPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const data = await getCompanySettingsFromStorage();
        setSettings(data);
        if (data.upiQrCodeUrl) {
          setQrPreviewUrl(data.upiQrCodeUrl);
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setQrCodeFile(file);
      const localUrl = URL.createObjectURL(file);
      setQrPreviewUrl(localUrl);
    }
  };

  const handleRemoveQrCode = () => {
    setQrCodeFile(null);
    setQrPreviewUrl(null);
    setSettings((prev) => ({ ...prev, upiQrCodeUrl: "" }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);

    let updatedSettings = { ...settings };

    try {
      // If a new QR code file was selected, upload it to ImageKit
      if (qrCodeFile) {
        const uploadedUrl = await uploadToImageKit(qrCodeFile, "qr-codes");
        if (uploadedUrl) {
          updatedSettings.upiQrCodeUrl = uploadedUrl;
        }
      }

      const saved = await saveCompanySettingsToStorage(updatedSettings);
      setSettings(saved);
      if (saved.upiQrCodeUrl) {
        setQrPreviewUrl(saved.upiQrCodeUrl);
      }
      setQrCodeFile(null);

      setSuccessMsg("Business settings & UPI QR Code updated successfully!");
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
      setQrPreviewUrl(DEFAULT_COMPANY_SETTINGS.upiQrCodeUrl || null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-[#0B4FBA]/10 border border-[#0B4FBA]/20 rounded-xl text-[#0B4FBA]">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Business Settings</h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Manage organization profile, GSTIN, bank details, UPI QR code, and invoice preferences.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleResetDefault}
              className="px-3.5 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-semibold rounded-lg transition-colors flex items-center space-x-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>
          </div>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between animate-in fade-in">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
            <span className="text-[11px] text-emerald-600">Saved to database</span>
          </div>
        )}

        {/* Tab Selection */}
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
            <span>Invoice Terms & Signatory</span>
          </button>
        </div>

        {/* Main Settings Form */}
        {loading ? (
          <div className="p-12 text-center bg-white rounded-xl border border-gray-200">
            <div className="w-8 h-8 border-2 border-[#0B4FBA] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs text-gray-500 font-medium">Loading settings...</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="bg-white rounded-xl border border-gray-200 p-6 shadow-2xs space-y-6">
            {/* TAB 1: COMPANY PROFILE */}
            {activeTab === "company" && (
              <div className="space-y-4">
                <div className="border-b border-gray-100 pb-3">
                  <h2 className="text-base font-bold text-gray-900">Organization Information</h2>
                  <p className="text-xs text-gray-500">
                    These contact and GST details will be automatically pre-filled on all invoices.
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

            {/* TAB 2: BANK DETAILS & UPI QR CODE */}
            {activeTab === "bank" && (
              <div className="space-y-6">
                <div className="border-b border-gray-100 pb-3">
                  <h2 className="text-base font-bold text-gray-900">Bank Details & UPI Payment QR Code</h2>
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
                        Upload your bank or PhonePe / GPay QR code image. Will be uploaded to ImageKit on Save.
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
                    {/* Image Preview Box */}
                    <div className="w-28 h-28 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xs flex items-center justify-center shrink-0">
                      {qrPreviewUrl ? (
                        <img
                          src={qrPreviewUrl}
                          alt="UPI QR Code"
                          className="w-full h-full object-contain p-1.5"
                        />
                      ) : (
                        <div className="text-center p-2 text-gray-400">
                          <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-50" />
                          <span className="text-[10px] block">No QR Code</span>
                        </div>
                      )}
                    </div>

                    {/* File Input */}
                    <div className="grow w-full">
                      <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 hover:border-[#0B4FBA] rounded-xl bg-white cursor-pointer transition-colors text-center">
                        <Upload className="w-5 h-5 text-[#0B4FBA] mb-1" />
                        <span className="text-xs font-bold text-gray-800">
                          {qrCodeFile ? qrCodeFile.name : "Choose QR Code Image File"}
                        </span>
                        <span className="text-[10px] text-gray-400 mt-0.5">
                          PNG, JPG, JPEG or WEBP (Max 5MB)
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: INVOICE PREFERENCES */}
            {activeTab === "invoice" && (
              <div className="space-y-4">
                <div className="border-b border-gray-100 pb-3">
                  <h2 className="text-base font-bold text-gray-900">Default Terms & Signatory</h2>
                  <p className="text-xs text-gray-500">
                    Configure default legal terms and authorized signature line for generated invoices.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Authorized Signatory Name
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

            {/* Save Button Bar */}
            <div className="flex items-center justify-end pt-4 border-t border-gray-100">
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
