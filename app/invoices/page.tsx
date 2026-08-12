"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminLayout from "../components/AdminLayout";
import {
  getCustomerInvoicesFromStorage,
  deleteCustomerInvoiceFromStorage,
  getCompanySettingsFromStorage,
  CustomerInvoice,
  CompanySettings,
  DEFAULT_COMPANY_SETTINGS,
} from "@/lib/firebase";
import {
  Receipt,
  Search,
  Eye,
  MessageSquare,
  Trash2,
  Printer,
  X,
  Send,
  Share2,
  FileText,
  Phone,
  Mail,
  Globe,
  QrCode,
} from "lucide-react";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<CustomerInvoice[]>([]);
  const [companySettings, setCompanySettings] = useState<CompanySettings>(DEFAULT_COMPANY_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  // Modals
  const [previewInvoice, setPreviewInvoice] = useState<CustomerInvoice | null>(null);
  const [whatsappInvoice, setWhatsappInvoice] = useState<CustomerInvoice | null>(null);
  const [sendingWhatsapp, setSendingWhatsapp] = useState(false);
  const [whatsappStatusMessage, setWhatsappStatusMessage] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [invList, settingsData] = await Promise.all([
        getCustomerInvoicesFromStorage(),
        getCompanySettingsFromStorage(),
      ]);
      setInvoices(invList);
      setCompanySettings(settingsData);
    } catch (err) {
      console.error("Failed to load global invoices:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredInvoices = invoices.filter((inv) => {
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      inv.invoiceNumber.toLowerCase().includes(q) ||
      inv.customerDetails.name.toLowerCase().includes(q) ||
      inv.customerDetails.businessName.toLowerCase().includes(q) ||
      inv.customerDetails.mobileNumber.includes(q);

    const matchesStatus = statusFilter === "All" || inv.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  const totalVolume = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
  const paidVolume = invoices
    .filter((inv) => inv.status === "Paid")
    .reduce((sum, inv) => sum + inv.total, 0);
  const unpaidVolume = invoices
    .filter((inv) => inv.status === "Unpaid" || inv.status === "Overdue" || inv.status === "Partially Paid")
    .reduce((sum, inv) => sum + inv.total, 0);

  const handleDeleteInvoice = async (id: string) => {
    if (!confirm("Are you sure you want to delete this invoice?")) return;
    try {
      await deleteCustomerInvoiceFromStorage(id);
      await loadData();
    } catch (err) {
      console.error("Error deleting invoice:", err);
    }
  };

  const handleSendWhatsappMessage = async () => {
    if (!whatsappInvoice) return;
    setSendingWhatsapp(true);
    setWhatsappStatusMessage(null);

    const messageText = `*TAX INVOICE NOTICE* 🧾\n\nDear *${whatsappInvoice.customerDetails.name}* (${whatsappInvoice.customerDetails.businessName}),\n\nHere is your official invoice summary from *${whatsappInvoice.myCompanyDetails.companyName}*:\n\n📄 *Invoice No:* ${whatsappInvoice.invoiceNumber}\n📅 *Issue Date:* ${whatsappInvoice.issueDate}\n⏰ *Due Date:* ${whatsappInvoice.dueDate}\n💰 *Total Amount Due:* ₹${whatsappInvoice.total.toLocaleString("en-IN")}\n📌 *GSTIN:* ${whatsappInvoice.myCompanyDetails.gstin}\n\nPlease process payment to *UPI ID: ${whatsappInvoice.myCompanyDetails.upiId || "6281288314@upi"}*. Thank you!`;

    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: whatsappInvoice.customerDetails.mobileNumber,
          message: messageText,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setWhatsappStatusMessage("Message sent successfully via WhatsApp API!");
      } else {
        setWhatsappStatusMessage(`API notice: ${data.error || "Falling back to WhatsApp direct link"}`);
      }
    } catch (err) {
      setWhatsappStatusMessage("Sending via Web WhatsApp fallback...");
    } finally {
      setSendingWhatsapp(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-[#0B4FBA]/10 border border-[#0B4FBA]/20 rounded-xl text-[#0B4FBA]">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Invoices & Billing</h1>
                <span className="bg-blue-100 text-[#0B4FBA] text-xs font-semibold px-2.5 py-0.5 rounded-full border border-blue-200">
                  {invoices.length} Total
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Overview of customer billing, payment statuses, PDF previews, and WhatsApp sharing.
              </p>
            </div>
          </div>

          <Link
            href="/customers"
            className="px-4 py-2 bg-[#0B4FBA] hover:bg-[#083c8d] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center space-x-2"
          >
            <span>Manage Customers & Invoices</span>
          </Link>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
            <span className="text-xs font-medium text-gray-500">Total Invoiced Amount</span>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              ₹{totalVolume.toLocaleString("en-IN")}
            </div>
            <p className="text-[11px] text-gray-500 mt-1">{invoices.length} total generated invoices</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
            <span className="text-xs font-medium text-gray-500">Collected Revenue</span>
            <div className="text-2xl font-bold text-emerald-700 mt-1">
              ₹{paidVolume.toLocaleString("en-IN")}
            </div>
            <p className="text-[11px] text-emerald-600 mt-1">Paid customer invoices</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
            <span className="text-xs font-medium text-gray-500">Outstanding Balance</span>
            <div className="text-2xl font-bold text-amber-600 mt-1">
              ₹{unpaidVolume.toLocaleString("en-IN")}
            </div>
            <p className="text-[11px] text-amber-600 mt-1">Pending & overdue invoices</p>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by invoice #, customer name, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B4FBA]/20 focus:border-[#0B4FBA] transition-all"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <span className="text-xs font-semibold text-gray-500">Status:</span>
            {["All", "Paid", "Partially Paid", "Unpaid", "Overdue"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                  statusFilter === status
                    ? "bg-[#0B4FBA] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Invoices List */}
        {loading ? (
          <div className="p-12 text-center bg-white rounded-xl border border-gray-200">
            <div className="w-8 h-8 border-2 border-[#0B4FBA] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs text-gray-500 font-medium">Loading invoices...</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-xl border border-gray-200">
            <Receipt className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-gray-900">No Invoices Found</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              No billing records match your query. Navigate to a customer profile to generate invoices.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-2xs divide-y divide-gray-100 overflow-hidden">
            {filteredInvoices.map((inv) => (
              <div
                key={inv.id}
                className="p-4 hover:bg-gray-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start space-x-4">
                  <div className="p-2.5 bg-blue-50 text-[#0B4FBA] rounded-xl border border-blue-100 mt-0.5">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-bold text-gray-900">{inv.invoiceNumber}</h3>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                          inv.status === "Paid"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                            : inv.status === "Partially Paid"
                            ? "bg-blue-100 text-blue-800 border-blue-200"
                            : inv.status === "Overdue"
                            ? "bg-red-100 text-red-800 border-red-200"
                            : "bg-amber-100 text-amber-800 border-amber-200"
                        }`}
                      >
                        {inv.status}
                      </span>
                    </div>

                    <div className="text-xs text-gray-700 font-semibold mt-1">
                      {inv.customerDetails.businessName}{" "}
                      <span className="font-normal text-gray-500">({inv.customerDetails.name})</span>
                    </div>

                    <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1 font-medium">
                      <span>Issue: {inv.issueDate}</span>
                      <span>•</span>
                      <span>Due: {inv.dueDate}</span>
                      {inv.poNumber && (
                        <>
                          <span>•</span>
                          <span>PO: {inv.poNumber}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-4">
                  <div className="text-right">
                    <span className="text-[11px] text-gray-500 font-medium block">Grand Total</span>
                    <span className="text-base font-bold text-gray-900">
                      ₹{inv.total.toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 pl-3 border-l border-gray-200">
                    <button
                      onClick={() => setPreviewInvoice(inv)}
                      className="px-2.5 py-1.5 bg-blue-50 text-[#0B4FBA] hover:bg-blue-100 text-xs font-semibold rounded-lg transition-colors flex items-center space-x-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </button>

                    <button
                      onClick={() => setWhatsappInvoice(inv)}
                      className="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold rounded-lg transition-colors flex items-center space-x-1"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </button>

                    <button
                      onClick={() => handleDeleteInvoice(inv.id!)}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invoice Preview Modal */}
      {previewInvoice && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-300 w-full max-w-3xl overflow-hidden my-8 animate-in fade-in">
            <div className="flex items-center justify-between px-6 py-3 bg-gray-900 text-white select-none">
              <div className="flex items-center space-x-2">
                <Receipt className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold">Printable Tax Invoice - #{previewInvoice.invoiceNumber}</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-md flex items-center space-x-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print PDF</span>
                </button>
                <button
                  onClick={() => setWhatsappInvoice(previewInvoice)}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md flex items-center space-x-1"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>
                <button onClick={() => setPreviewInvoice(null)} className="p-1 text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Print Body */}
            <div className="p-8 space-y-6 bg-white text-gray-900 relative overflow-hidden" id="printable-invoice">
              <div className="flex justify-between items-start">
                <div className="space-y-1 max-w-sm">
                  <div className="mb-3">
                    <img
                      src="/gama-next-logo-reserved.png"
                      alt="GamaNext Software Solutions"
                      className="h-10 w-auto object-contain"
                    />
                  </div>

                  <div className="text-xs space-y-1 text-gray-700 font-medium">
                    <div className="font-bold text-gray-900">
                      {previewInvoice.myCompanyDetails.companyName}
                    </div>
                    <div className="text-gray-600 leading-snug">
                      {previewInvoice.myCompanyDetails.address}
                    </div>
                    <div className="flex items-center space-x-1 text-gray-700">
                      <Phone className="w-3 h-3 text-[#004bb7]" />
                      <span className="font-mono">{previewInvoice.myCompanyDetails.phone}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-gray-700">
                      <Mail className="w-3 h-3 text-[#004bb7]" />
                      <span>{previewInvoice.myCompanyDetails.email}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-gray-700">
                      <Globe className="w-3 h-3 text-[#004bb7]" />
                      <span>{previewInvoice.myCompanyDetails.website || "www.gamanext.com"}</span>
                    </div>
                    <div className="font-bold font-mono text-gray-900 mt-1">
                      GSTIN: {previewInvoice.myCompanyDetails.gstin}
                    </div>
                  </div>
                </div>

                <div className="text-right space-y-3">
                  <h1 className="text-4xl font-black text-[#004bb7] tracking-wider uppercase">INVOICE</h1>
                  <div className="text-xs space-y-1 font-medium text-gray-700">
                    <div>
                      <span className="text-gray-500">Invoice No. : </span>
                      <span className="font-bold font-mono text-gray-900">{previewInvoice.invoiceNumber}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Invoice Date : </span>
                      <span className="font-semibold text-gray-900">{previewInvoice.issueDate}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Due Date : </span>
                      <span className="font-semibold text-gray-900">{previewInvoice.dueDate}</span>
                    </div>
                    {previewInvoice.poNumber && (
                      <div>
                        <span className="text-gray-500">PO Number : </span>
                        <span className="font-semibold text-gray-900">{previewInvoice.poNumber}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* BILL TO Box with Illustration Graphic on Right */}
              <div style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: "16px", width: "100%" }}>
                <div style={{ width: "58%", flexShrink: 0 }} className="bg-[#eef4ff] p-4 rounded-xl border border-blue-100 text-xs space-y-1">
                  <span className="text-[10px] font-bold text-[#004bb7] uppercase tracking-wider block mb-1">
                    BILL TO
                  </span>
                  <div className="font-bold text-gray-900 text-sm">{previewInvoice.customerDetails.businessName}</div>
                  <div className="text-gray-700">{previewInvoice.customerDetails.address}</div>
                  <div className="font-bold font-mono text-gray-900 mt-1">
                    GSTIN: {previewInvoice.customerDetails.gstin || "N/A"}
                  </div>
                </div>

                {/* Vector Graphic Matching Mock Image */}
                <div style={{ width: "38%", flexShrink: 0, display: "flex", justifyContent: "flex-end" }} className="select-none">
                  <div className="relative w-44 h-24 flex items-end justify-center">
                    <div className="absolute top-0 left-6 w-24 h-20 bg-white border-2 border-[#004bb7] rounded-lg shadow-2xs p-2 flex flex-col justify-between">
                      <div className="text-[8px] font-bold text-[#004bb7] border-b border-blue-200 pb-1 uppercase tracking-tighter">
                        INVOICE
                      </div>
                      <div className="space-y-1 py-1">
                        <div className="h-1 bg-blue-100 rounded w-full"></div>
                        <div className="h-1 bg-blue-100 rounded w-4/5"></div>
                        <div className="h-1 bg-blue-100 rounded w-3/5"></div>
                      </div>
                    </div>

                    <div className="relative z-10 w-28 h-14 bg-white border-2 border-[#004bb7] rounded-t-lg p-1 flex flex-col items-center justify-center shadow-xs">
                      <div className="text-xs font-mono font-bold text-[#004bb7] tracking-wider">&lt;/&gt;</div>
                      <div className="w-full h-1 bg-[#004bb7] mt-1 rounded-full"></div>
                    </div>
                    <div className="absolute bottom-0 w-32 h-1 bg-[#004bb7] rounded-full z-10"></div>

                    <div className="absolute -left-1 bottom-1 w-9 h-9 bg-[#004bb7] text-white rounded-full flex items-center justify-center font-bold text-sm shadow-md border-2 border-white z-20">
                      ₹
                    </div>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-[#004bb7] text-white uppercase tracking-wider font-bold">
                    <th className="py-3 px-3 text-center w-10">#</th>
                    <th className="py-3 px-3">DESCRIPTION</th>
                    <th className="py-3 px-3 text-center">HSN / SAC</th>
                    <th className="py-3 px-3 text-center">QTY</th>
                    <th className="py-3 px-3 text-right">RATE (₹)</th>
                    <th className="py-3 px-3 text-right">AMOUNT (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 border-b border-gray-200">
                  {previewInvoice.items.map((item, idx) => {
                    const lines = (item.description || "").split("\n");
                    const title = lines[0];
                    const subtitle = lines.slice(1).join("\n");

                    return (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="py-3.5 px-3 text-center font-semibold text-gray-600">{idx + 1}</td>
                        <td className="py-3.5 px-3">
                          <div className="font-bold text-gray-900">{title}</div>
                          {subtitle && <div className="text-[11px] text-gray-500 mt-0.5 whitespace-pre-line">{subtitle}</div>}
                        </td>
                        <td className="py-3.5 px-3 text-center font-mono text-gray-600">
                          {item.hsnSac || "998313"}
                        </td>
                        <td className="py-3.5 px-3 text-center font-semibold text-gray-700">{item.quantity}</td>
                        <td className="py-3.5 px-3 text-right text-gray-700">
                          {item.unitPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-3 text-right font-bold text-gray-900">
                          {item.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Bottom Section */}
              <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", gap: "24px", width: "100%", paddingTop: "8px" }}>
                <div style={{ width: "48%", flexShrink: 0 }} className="space-y-4 text-xs">
                  {previewInvoice.notes && (
                    <div>
                      <span className="font-bold text-gray-900 block mb-0.5">NOTES</span>
                      <p className="text-gray-600 whitespace-pre-line">{previewInvoice.notes}</p>
                    </div>
                  )}

                  <div>
                    <span className="font-bold text-gray-900 block mb-0.5">TERMS & CONDITIONS</span>
                    <p className="text-[11px] text-gray-500 leading-relaxed whitespace-pre-line">
                      {previewInvoice.terms ||
                        "• Payment is due within 30 days from the invoice date.\n• Late payments may be subject to a 2% monthly interest charge.\n• All disputes are subject to Bengaluru jurisdiction."}
                    </p>
                  </div>

                  {/* Bank Details Box */}
                  <div className="bg-[#eef4ff] p-3.5 rounded-xl border border-blue-100 space-y-1">
                    <span className="font-bold text-[#004bb7] block mb-1">BANK DETAILS</span>
                    <div style={{ display: "flex", flexDirection: "column", gap: "3px", fontSize: "11px" }}>
                      <div style={{ display: "flex", flexDirection: "row", alignItems: "center", width: "100%" }}>
                        <span style={{ width: "95px", minWidth: "95px", flexShrink: 0, color: "#6b7280" }}>Bank Name</span>
                        <span style={{ fontWeight: 600, color: "#111827" }}>
                          : {previewInvoice.myCompanyDetails.bankName || "HDFC Bank"}
                        </span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "row", alignItems: "center", width: "100%" }}>
                        <span style={{ width: "95px", minWidth: "95px", flexShrink: 0, color: "#6b7280" }}>Account Name</span>
                        <span style={{ fontWeight: 600, color: "#111827" }}>
                          : {previewInvoice.myCompanyDetails.accountName || previewInvoice.myCompanyDetails.companyName}
                        </span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "row", alignItems: "center", width: "100%" }}>
                        <span style={{ width: "95px", minWidth: "95px", flexShrink: 0, color: "#6b7280" }}>Account No.</span>
                        <span style={{ fontWeight: 700, fontFamily: "monospace", color: "#111827" }}>
                          : {previewInvoice.myCompanyDetails.accountNumber || "50200012345678"}
                        </span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "row", alignItems: "center", width: "100%" }}>
                        <span style={{ width: "95px", minWidth: "95px", flexShrink: 0, color: "#6b7280" }}>IFSC Code</span>
                        <span style={{ fontWeight: 700, fontFamily: "monospace", color: "#111827" }}>
                          : {previewInvoice.myCompanyDetails.ifscCode || "HDFC0001234"}
                        </span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "row", alignItems: "center", width: "100%" }}>
                        <span style={{ width: "95px", minWidth: "95px", flexShrink: 0, color: "#6b7280" }}>Branch</span>
                        <span style={{ fontWeight: 600, color: "#111827" }}>
                          : {previewInvoice.myCompanyDetails.branch || "Koramangala, Bengaluru"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Calculations & Signature / QR Code */}
                <div style={{ width: "48%", flexShrink: 0 }} className="space-y-6 text-xs">
                  <div className="space-y-2 bg-gray-50 p-3.5 rounded-xl border border-gray-200">
                    <div className="flex justify-between text-gray-700">
                      <span>Sub Total</span>
                      <span className="font-bold">
                        ₹ {previewInvoice.subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>CGST ({previewInvoice.cgstRate || 9}%)</span>
                      <span>
                        ₹ {(previewInvoice.cgstAmount || Math.round(previewInvoice.subtotal * 0.09)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>SGST ({previewInvoice.sgstRate || 9}%)</span>
                      <span>
                        ₹ {(previewInvoice.sgstAmount || Math.round(previewInvoice.subtotal * 0.09)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between text-base font-bold bg-[#004bb7] text-white p-2.5 rounded-lg mt-2">
                      <span>TOTAL DUE</span>
                      <span>₹ {previewInvoice.total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  <div className="flex items-end justify-between pt-2">
                    <div className="space-y-4">
                      <span className="text-[11px] font-bold text-gray-700 block">
                        For {previewInvoice.myCompanyDetails.companyName}
                      </span>
                      <div className="border-b border-gray-400 w-48 min-h-[40px] flex items-end pl-2 pb-1">
                        {previewInvoice.myCompanyDetails.signatoryImageUrl || companySettings.signatoryImageUrl ? (
                          <img
                            src={previewInvoice.myCompanyDetails.signatoryImageUrl || companySettings.signatoryImageUrl}
                            alt="Authorized Signature"
                            className="h-10 w-auto object-contain"
                          />
                        ) : (
                          <span className="italic text-2xl font-serif text-[#004bb7] font-semibold tracking-wide">
                            {previewInvoice.myCompanyDetails.signatoryName || "Siva Krishna"}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                        Authorized Signatory
                      </span>
                    </div>

                    <div className="text-center space-y-1">
                      <div className="w-20 h-20 bg-white border border-gray-300 rounded-lg p-1 mx-auto flex items-center justify-center overflow-hidden shadow-2xs">
                        {previewInvoice.myCompanyDetails.upiQrCodeUrl || companySettings.upiQrCodeUrl ? (
                          <img
                            src={previewInvoice.myCompanyDetails.upiQrCodeUrl || companySettings.upiQrCodeUrl}
                            alt="UPI Scan to Pay QR"
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <QrCode className="w-14 h-14 text-gray-800" />
                        )}
                      </div>
                      <span className="text-[9px] text-gray-500 font-medium block">Scan to Pay</span>
                      <span className="text-[9px] font-mono font-bold text-gray-700 block">
                        UPI ID: {previewInvoice.myCompanyDetails.upiId || "6281288314@upi"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-gray-100 text-center">
                <div className="bg-[#004bb7] text-white text-xs font-semibold py-2 px-6 rounded-b-xl tracking-wider italic shadow-xs">
                  —— Thank you for your business! ——
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Modal */}
      {whatsappInvoice && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-md overflow-hidden animate-in fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-emerald-600 text-white">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5" />
                <h2 className="text-base font-bold">Send Invoice via WhatsApp</h2>
              </div>
              <button onClick={() => setWhatsappInvoice(null)} className="text-emerald-100 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 text-xs space-y-1">
                <div className="font-bold text-gray-900">
                  Recipient: {whatsappInvoice.customerDetails.name}
                </div>
                <div className="text-gray-600 font-mono">
                  Phone: {whatsappInvoice.customerDetails.mobileNumber}
                </div>
                <div className="text-emerald-700 font-bold mt-1">
                  Invoice #{whatsappInvoice.invoiceNumber} — Total: ₹
                  {whatsappInvoice.total.toLocaleString("en-IN")}
                </div>
              </div>

              {whatsappStatusMessage && (
                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-medium border border-emerald-200">
                  {whatsappStatusMessage}
                </div>
              )}

              <div className="space-y-2 pt-2">
                <button
                  onClick={handleSendWhatsappMessage}
                  disabled={sendingWhatsapp}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{sendingWhatsapp ? "Sending..." : "Send WhatsApp API Message"}</span>
                </button>

                <a
                  href={`https://wa.me/${whatsappInvoice.customerDetails.mobileNumber.replace(
                    /[^\d]/g,
                    ""
                  )}?text=${encodeURIComponent(
                    `Hello ${whatsappInvoice.customerDetails.name}, here is your Invoice ${whatsappInvoice.invoiceNumber} for ₹${whatsappInvoice.total} from ${whatsappInvoice.myCompanyDetails.companyName}.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-bold rounded-lg flex items-center justify-center space-x-2 text-center"
                >
                  <Share2 className="w-4 h-4 text-emerald-600" />
                  <span>Open Direct Web WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
