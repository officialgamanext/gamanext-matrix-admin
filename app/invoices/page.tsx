"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminLayout from "../components/AdminLayout";
import {
  getCustomerInvoicesFromStorage,
  saveCustomerInvoiceToStorage,
  deleteCustomerInvoiceFromStorage,
  getCompanySettingsFromStorage,
  getCustomersFromStorage,
  getCustomerWorksFromStorage,
  getNextInvoiceNumber,
  recalculateInvoiceTotals,
  CustomerInvoice,
  CustomerData,
  InvoiceItem,
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
  Plus,
  Edit2,
  Users,
  Building2,
  User,
  CheckCircle2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  RotateCw,
  Loader2,
  Sparkles,
} from "lucide-react";
import PrintableInvoice from "../components/PrintableInvoice";
import { generateAndUploadInvoicePdf, downloadInvoicePdf } from "@/lib/invoicePdf";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<CustomerInvoice[]>([]);
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [companySettings, setCompanySettings] = useState<CompanySettings>(DEFAULT_COMPANY_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 24;

  // Cloudinary PDF Generation States
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [invoiceToRender, setInvoiceToRender] = useState<CustomerInvoice | null>(null);
  const [generateStatus, setGenerateStatus] = useState<string | null>(null);

  // Modals
  const [previewInvoice, setPreviewInvoice] = useState<CustomerInvoice | null>(null);
  const [whatsappInvoice, setWhatsappInvoice] = useState<CustomerInvoice | null>(null);
  const [whatsappMessage, setWhatsappMessage] = useState("");
  const [sendingWhatsapp, setSendingWhatsapp] = useState(false);
  const [whatsappStatusMessage, setWhatsappStatusMessage] = useState<string | null>(null);

  // Create / Edit Invoice Modal
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<CustomerInvoice | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState<CustomerInvoice>({
    customerId: "",
    invoiceNumber: "INV202601",
    poNumber: "",
    issueDate: new Date().toISOString().split("T")[0],
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
    status: "Unpaid",
    myCompanyDetails: {
      companyName: DEFAULT_COMPANY_SETTINGS.companyName,
      email: DEFAULT_COMPANY_SETTINGS.email,
      phone: DEFAULT_COMPANY_SETTINGS.phone,
      website: DEFAULT_COMPANY_SETTINGS.website,
      address: DEFAULT_COMPANY_SETTINGS.address,
      gstin: DEFAULT_COMPANY_SETTINGS.gstin,
      bankName: DEFAULT_COMPANY_SETTINGS.bankName,
      accountName: DEFAULT_COMPANY_SETTINGS.accountName,
      accountNumber: DEFAULT_COMPANY_SETTINGS.accountNumber,
      ifscCode: DEFAULT_COMPANY_SETTINGS.ifscCode,
      branch: DEFAULT_COMPANY_SETTINGS.branch,
      upiId: DEFAULT_COMPANY_SETTINGS.upiId,
      upiQrCodeUrl: DEFAULT_COMPANY_SETTINGS.upiQrCodeUrl,
      signatoryName: DEFAULT_COMPANY_SETTINGS.signatoryName,
    },
    customerDetails: {
      name: "",
      businessName: "",
      mobileNumber: "",
      email: "",
      address: "",
      gstin: "",
    },
    items: [
      {
        id: "item-1",
        description: "Custom Software Development & IT Services",
        hsnSac: "998313",
        quantity: 1,
        unitPrice: 50000,
        amount: 50000,
      },
    ],
    subtotal: 50000,
    cgstRate: 9,
    cgstAmount: 4500,
    sgstRate: 9,
    sgstAmount: 4500,
    taxAmount: 9000,
    discount: 0,
    total: 59000,
    notes: "Thank you for your business.\nWe appreciate your trust in Gamanext.",
    terms: DEFAULT_COMPANY_SETTINGS.termsAndConditions,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [invList, settingsData, custList] = await Promise.all([
        getCustomerInvoicesFromStorage(),
        getCompanySettingsFromStorage(),
        getCustomersFromStorage(),
      ]);
      setInvoices(invList);
      setCompanySettings(settingsData);
      setCustomers(custList);
    } catch (err) {
      console.error("Failed to load global invoices:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sort invoices so the latest created is at the top
  const sortedInvoices = [...invoices].sort((a, b) => {
    const timeA = new Date(a.createdAt || a.issueDate || 0).getTime();
    const timeB = new Date(b.createdAt || b.issueDate || 0).getTime();
    if (timeB !== timeA) return timeB - timeA;
    return (b.invoiceNumber || "").localeCompare(a.invoiceNumber || "");
  });

  const filteredInvoices = sortedInvoices.filter((inv) => {
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      inv.invoiceNumber.toLowerCase().includes(q) ||
      inv.customerDetails.name.toLowerCase().includes(q) ||
      inv.customerDetails.businessName.toLowerCase().includes(q) ||
      inv.customerDetails.mobileNumber.includes(q);

    const matchesStatus = statusFilter === "All" || inv.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  // Reset to first page when search or status filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredInvoices.length / PAGE_SIZE) || 1;
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedInvoices = filteredInvoices.slice(startIndex, startIndex + PAGE_SIZE);

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

  const handlePrintInvoice = (inv: CustomerInvoice) => {
    const originalTitle = document.title;
    const rawBusinessName = inv.customerDetails?.businessName || inv.customerDetails?.name || "Client";
    const cleanBusinessName = rawBusinessName.replace(/\s+/g, "");
    const invoiceNumber = inv.invoiceNumber || "INV";
    const filename = `${cleanBusinessName}-${invoiceNumber}`;

    document.title = filename;

    const restoreTitle = () => {
      document.title = originalTitle;
      window.removeEventListener("afterprint", restoreTitle);
    };

    window.addEventListener("afterprint", restoreTitle);
    window.print();
    setTimeout(restoreTitle, 2000);
  };

  const handleGeneratePdf = async (inv: CustomerInvoice) => {
    if (generatingId) return;
    const invId = inv.id || "current";
    setGeneratingId(invId);
    setGenerateStatus("Generating PDF...");

    try {
      let targetEl: HTMLElement | null = null;

      if (previewInvoice && previewInvoice.id === inv.id) {
        targetEl = document.getElementById("printable-invoice");
      } else {
        setInvoiceToRender(inv);
        // Allow the off-screen invoice container to render
        await new Promise((resolve) => setTimeout(resolve, 300));
        targetEl = document.getElementById("hidden-printable-invoice");
      }

      if (!targetEl) {
        throw new Error("Unable to locate invoice document for PDF export.");
      }

      setGenerateStatus("Uploading to Cloudinary...");
      const { secureUrl, publicId } = await generateAndUploadInvoicePdf(inv, targetEl);

      const updatedInv: CustomerInvoice = {
        ...inv,
        pdfUrl: secureUrl,
        pdfPublicId: publicId,
      };

      await saveCustomerInvoiceToStorage(updatedInv);

      setInvoices((prev) =>
        prev.map((item) => (item.id === inv.id ? updatedInv : item))
      );

      if (previewInvoice && previewInvoice.id === inv.id) {
        setPreviewInvoice(updatedInv);
      }

      setGenerateStatus("Saved!");
      setTimeout(() => setGenerateStatus(null), 2500);
    } catch (err: any) {
      console.error("PDF generation/upload failed:", err);
      alert(`Error generating PDF: ${err.message || err}`);
    } finally {
      setGeneratingId(null);
      setInvoiceToRender(null);
    }
  };

  const handleDownloadPdf = async (inv: CustomerInvoice) => {
    if (!inv.pdfUrl) {
      alert("No generated PDF found. Please generate the PDF first.");
      return;
    }
    const rawBusinessName =
      inv.customerDetails?.businessName ||
      inv.customerDetails?.name ||
      "Client";
    const cleanBusinessName = rawBusinessName.replace(/\s+/g, "");
    const filename = `${cleanBusinessName}-${inv.invoiceNumber || "INV"}`;
    await downloadInvoicePdf(inv.pdfUrl, filename);
  };

  const openWhatsappModal = (inv: CustomerInvoice) => {
    setWhatsappInvoice(inv);
    setWhatsappMessage(
      `Hello ${inv.customerDetails.name}, here is your Invoice #${inv.invoiceNumber} for ₹${inv.total.toLocaleString("en-IN")} from ${inv.myCompanyDetails.companyName}.`
    );
    setWhatsappStatusMessage(null);
  };

  const handleSendWhatsappMessage = async () => {
    if (!whatsappInvoice || !whatsappMessage.trim()) return;
    setSendingWhatsapp(true);
    setWhatsappStatusMessage(null);

    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: whatsappInvoice.customerDetails.mobileNumber,
          message: whatsappMessage.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setWhatsappStatusMessage("Message sent successfully!");
        setTimeout(() => {
          setWhatsappInvoice(null);
        }, 1000);
      } else {
        setWhatsappStatusMessage(`Failed: ${data.error || "API error"}`);
      }
    } catch (err) {
      setWhatsappStatusMessage("Failed to send message.");
    } finally {
      setSendingWhatsapp(false);
    }
  };

  // --- ADD / EDIT INVOICE MODAL HANDLERS ---
  const handleOpenAddInvoice = () => {
    setEditingInvoice(null);
    const currentYear = new Date().getFullYear();
    const nextInvoiceNo = getNextInvoiceNumber(invoices, currentYear);

    const firstCust = customers.length > 0 ? customers[0] : null;
    const initialCustomerId = firstCust ? (firstCust.id || "") : "";
    setSelectedCustomerId(initialCustomerId);

    const initialItems: InvoiceItem[] = [
      {
        id: `item-${Date.now()}`,
        description: "Custom Software Development & IT Services",
        hsnSac: "998313",
        quantity: 1,
        unitPrice: 50000,
        amount: 50000,
      },
    ];

    const calc = recalculateInvoiceTotals(initialItems, 9, 9, 0);

    setInvoiceForm({
      customerId: initialCustomerId,
      invoiceNumber: nextInvoiceNo,
      poNumber: "",
      issueDate: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
      status: "Unpaid",
      myCompanyDetails: {
        companyName: companySettings.companyName,
        email: companySettings.email,
        phone: companySettings.phone,
        website: companySettings.website,
        address: companySettings.address,
        gstin: companySettings.gstin,
        logoUrl: companySettings.logoUrl || "/logo.jpeg",
        bankName: companySettings.bankName,
        accountName: companySettings.accountName,
        accountNumber: companySettings.accountNumber,
        ifscCode: companySettings.ifscCode,
        branch: companySettings.branch,
        upiId: companySettings.upiId,
        upiQrCodeUrl: companySettings.upiQrCodeUrl,
        signatoryName: companySettings.signatoryName,
      },
      customerDetails: {
        name: firstCust?.name || "",
        businessName: firstCust?.businessName || "",
        mobileNumber: firstCust?.mobileNumber || "",
        email: firstCust?.email || "",
        address: firstCust?.address || "",
        gstin: firstCust?.gstin || "",
      },
      items: initialItems,
      subtotal: calc.subtotal,
      cgstRate: 9,
      cgstAmount: calc.cgstAmount,
      sgstRate: 9,
      sgstAmount: calc.sgstAmount,
      taxAmount: calc.taxAmount,
      discount: 0,
      total: calc.total,
      notes: "Thank you for your business.\nWe appreciate your trust in Gamanext.",
      terms: companySettings.termsAndConditions || DEFAULT_COMPANY_SETTINGS.termsAndConditions,
    });

    setIsInvoiceModalOpen(true);
  };

  const handleOpenEditInvoice = (inv: CustomerInvoice) => {
    setEditingInvoice(inv);
    setSelectedCustomerId(inv.customerId || "");
    setInvoiceForm({ ...inv });
    setIsInvoiceModalOpen(true);
  };

  const handleCustomerSelect = async (cId: string) => {
    setSelectedCustomerId(cId);
    const cust = customers.find((c) => c.id === cId);
    if (!cust) return;

    let itemsToSet = [...invoiceForm.items];
    try {
      if (cId) {
        const custWorks = await getCustomerWorksFromStorage(cId);
        if (custWorks.length > 0) {
          itemsToSet = custWorks.map((w, idx) => ({
            id: `item-${idx + 1}`,
            description: w.name,
            hsnSac: "998313",
            quantity: 1,
            unitPrice: w.amount,
            amount: w.amount,
          }));
        }
      }
    } catch (e) {}

    const calc = recalculateInvoiceTotals(
      itemsToSet,
      invoiceForm.cgstRate || 9,
      invoiceForm.sgstRate || 9,
      invoiceForm.discount || 0
    );

    setInvoiceForm((prev) => ({
      ...prev,
      customerId: cId,
      customerDetails: {
        name: cust.name,
        businessName: cust.businessName,
        mobileNumber: cust.mobileNumber,
        email: cust.email || "",
        address: cust.address,
        gstin: cust.gstin || "",
      },
      items: itemsToSet,
      subtotal: calc.subtotal,
      cgstAmount: calc.cgstAmount,
      sgstAmount: calc.sgstAmount,
      taxAmount: calc.taxAmount,
      total: calc.total,
    }));
  };

  const handleIssueDateChange = (dateStr: string) => {
    if (!dateStr) return;
    if (!editingInvoice) {
      const yr = new Date(dateStr).getFullYear();
      if (!isNaN(yr)) {
        const nextInvoiceNo = getNextInvoiceNumber(invoices, yr);
        setInvoiceForm((prev) => ({
          ...prev,
          issueDate: dateStr,
          invoiceNumber: nextInvoiceNo,
        }));
        return;
      }
    }
    setInvoiceForm((prev) => ({ ...prev, issueDate: dateStr }));
  };

  const handleInvoiceItemChange = (
    index: number,
    field: keyof InvoiceItem,
    value: string | number
  ) => {
    const updatedItems = [...invoiceForm.items];
    const item = { ...updatedItems[index] };

    if (field === "quantity" || field === "unitPrice") {
      const numVal = Number(value) || 0;
      item[field] = numVal as never;
      item.amount =
        (field === "quantity" ? numVal : item.quantity) *
        (field === "unitPrice" ? numVal : item.unitPrice);
    } else {
      (item as Record<string, unknown>)[field] = value;
    }

    updatedItems[index] = item;

    const calc = recalculateInvoiceTotals(
      updatedItems,
      invoiceForm.cgstRate || 9,
      invoiceForm.sgstRate || 9,
      invoiceForm.discount || 0
    );

    setInvoiceForm({
      ...invoiceForm,
      items: updatedItems,
      subtotal: calc.subtotal,
      cgstAmount: calc.cgstAmount,
      sgstAmount: calc.sgstAmount,
      taxAmount: calc.taxAmount,
      total: calc.total,
    });
  };

  const handleAddInvoiceItem = () => {
    const newItem: InvoiceItem = {
      id: `item-${Date.now()}`,
      description: "",
      hsnSac: "998313",
      quantity: 1,
      unitPrice: 0,
      amount: 0,
    };
    const updatedItems = [...invoiceForm.items, newItem];
    const calc = recalculateInvoiceTotals(
      updatedItems,
      invoiceForm.cgstRate || 9,
      invoiceForm.sgstRate || 9,
      invoiceForm.discount || 0
    );
    setInvoiceForm({
      ...invoiceForm,
      items: updatedItems,
      subtotal: calc.subtotal,
      cgstAmount: calc.cgstAmount,
      sgstAmount: calc.sgstAmount,
      taxAmount: calc.taxAmount,
      total: calc.total,
    });
  };

  const handleRemoveInvoiceItem = (index: number) => {
    if (invoiceForm.items.length <= 1) return;
    const updatedItems = invoiceForm.items.filter((_, idx) => idx !== index);
    const calc = recalculateInvoiceTotals(
      updatedItems,
      invoiceForm.cgstRate || 9,
      invoiceForm.sgstRate || 9,
      invoiceForm.discount || 0
    );
    setInvoiceForm({
      ...invoiceForm,
      items: updatedItems,
      subtotal: calc.subtotal,
      cgstAmount: calc.cgstAmount,
      sgstAmount: calc.sgstAmount,
      taxAmount: calc.taxAmount,
      total: calc.total,
    });
  };

  const handleSaveInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceForm.customerId) {
      alert("Please select a client for this invoice.");
      return;
    }
    if (!invoiceForm.invoiceNumber || invoiceForm.items.length === 0) {
      alert("Please provide an invoice number and at least one item line.");
      return;
    }

    setSubmitting(true);
    try {
      await saveCustomerInvoiceToStorage(invoiceForm);
      setIsInvoiceModalOpen(false);
      await loadData();
    } catch (err) {
      console.error("Failed to save invoice:", err);
      alert("Failed to save invoice. Please check console for details.");
    } finally {
      setSubmitting(false);
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
                Overview of client billing, payment statuses, PDF previews, and WhatsApp sharing.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleOpenAddInvoice}
              className="px-4 py-2 bg-[#0B4FBA] hover:bg-[#083c8d] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Invoice</span>
            </button>
            <Link
              href="/customers"
              className="px-3.5 py-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center justify-center space-x-1.5"
            >
              <Users className="w-3.5 h-3.5 text-gray-500" />
              <span>Clients</span>
            </Link>
          </div>
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
            <p className="text-[11px] text-emerald-600 mt-1">Paid client invoices</p>
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
              placeholder="Search by invoice #, client name, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B4FBA]/20 focus:border-[#0B4FBA] transition-all"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs font-semibold text-gray-500 shrink-0">Status:</span>
            {["All", "Paid", "Partially Paid", "Unpaid", "Overdue"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
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
              No billing records match your search. Click below to create a new invoice for any client.
            </p>
            <button
              onClick={handleOpenAddInvoice}
              className="mt-4 px-4 py-2 bg-[#0B4FBA] text-white text-xs font-semibold rounded-lg shadow-sm hover:bg-[#083c8d] transition-colors inline-flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Invoice Now</span>
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-2xs divide-y divide-gray-100 overflow-hidden">
            {paginatedInvoices.map((inv) => (
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

                    <Link
                      href={`/customers/${inv.customerId}`}
                      className="text-xs text-gray-700 font-semibold mt-1 hover:text-[#0B4FBA] hover:underline flex items-center space-x-1.5"
                    >
                      <Building2 className="w-3.5 h-3.5 text-gray-400" />
                      <span>{inv.customerDetails.businessName || inv.customerDetails.name}</span>
                      <span className="font-normal text-gray-500">({inv.customerDetails.name})</span>
                    </Link>

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

                  <div className="flex items-center space-x-1.5 pl-3 border-l border-gray-200">
                    {inv.pdfUrl ? (
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleDownloadPdf(inv)}
                          className="p-2 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors flex items-center justify-center"
                          title="Download Invoice PDF"
                          aria-label="Download Invoice PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleGeneratePdf(inv)}
                          disabled={generatingId === inv.id}
                          className="p-2 text-gray-500 hover:text-[#0B4FBA] hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center disabled:opacity-60"
                          title="Regenerate PDF in Cloudinary"
                          aria-label="Regenerate PDF"
                        >
                          <RotateCw
                            className={`w-4 h-4 ${
                              generatingId === inv.id ? "animate-spin text-[#0B4FBA]" : ""
                            }`}
                          />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleGeneratePdf(inv)}
                        disabled={generatingId === inv.id}
                        className="p-2 bg-[#0B4FBA] hover:bg-[#083c8d] text-white rounded-lg transition-colors flex items-center justify-center disabled:opacity-60"
                        title="Generate PDF & Save to Cloudinary"
                        aria-label="Generate PDF"
                      >
                        {generatingId === inv.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4" />
                        )}
                      </button>
                    )}

                    <button
                      onClick={() => setPreviewInvoice(inv)}
                      className="p-2 text-[#0B4FBA] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center justify-center"
                      title="Preview / Print Invoice"
                      aria-label="Preview Invoice"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleOpenEditInvoice(inv)}
                      className="p-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center justify-center"
                      title="Edit Invoice"
                      aria-label="Edit Invoice"
                    >
                      <Edit2 className="w-4 h-4 text-gray-600" />
                    </button>

                    <button
                      onClick={() => openWhatsappModal(inv)}
                      className="p-2 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors flex items-center justify-center"
                      title="Send on WhatsApp"
                      aria-label="Send on WhatsApp"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="bg-gray-50/70 px-4 py-3 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="text-gray-500 font-medium">
                  Showing <span className="font-bold text-gray-900">{startIndex + 1}</span> to{" "}
                  <span className="font-bold text-gray-900">
                    {Math.min(startIndex + PAGE_SIZE, filteredInvoices.length)}
                  </span>{" "}
                  of <span className="font-bold text-gray-900">{filteredInvoices.length}</span> invoices
                </div>

                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="h-8 px-2.5 border border-gray-200 bg-white rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white transition-colors flex items-center space-x-1 shadow-2xs"
                    title="Previous Page"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline text-xs font-medium">Prev</span>
                  </button>

                  <div className="flex items-center space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                      if (
                        pageNum === 1 ||
                        pageNum === totalPages ||
                        (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={pageNum}
                            type="button"
                            onClick={() => setCurrentPage(pageNum)}
                            className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                              currentPage === pageNum
                                ? "bg-[#0B4FBA] text-white shadow-xs"
                                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-2xs"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      }
                      if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                        return (
                          <span key={pageNum} className="text-gray-400 px-1 select-none font-bold">
                            ...
                          </span>
                        );
                      }
                      return null;
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={currentPage >= totalPages}
                    className="h-8 px-2.5 border border-gray-200 bg-white rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white transition-colors flex items-center space-x-1 shadow-2xs"
                    title="Next Page"
                  >
                    <span className="hidden sm:inline text-xs font-medium">Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CREATE / EDIT CLIENT INVOICE MODAL */}
      {isInvoiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-4xl overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50 shrink-0">
              <div className="flex items-center space-x-2">
                <Receipt className="w-5 h-5 text-[#0B4FBA]" />
                <h2 className="text-base font-bold text-gray-900">
                  {editingInvoice ? `Edit Invoice - ${editingInvoice.invoiceNumber}` : "Create Client Invoice"}
                </h2>
              </div>
              <button
                onClick={() => setIsInvoiceModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveInvoice} className="p-6 space-y-6 overflow-y-auto grow">
              {/* SELECT CLIENT SECTION */}
              <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-100 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-[#0B4FBA] uppercase tracking-wider flex items-center space-x-1.5">
                    <User className="w-4 h-4" />
                    <span>Select Client to Bill *</span>
                  </label>
                  {selectedCustomerId && (
                    <span className="text-[11px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-semibold flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Linked to Client Profile</span>
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-1 gap-3">
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => handleCustomerSelect(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0B4FBA]/20 focus:border-[#0B4FBA]"
                    required
                  >
                    <option value="">-- Choose a Client from Database --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.businessName ? `${c.businessName} (${c.name})` : c.name} — {c.mobileNumber}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-[11px] text-gray-500">
                  Selecting a client automatically populates their contact, address, and GSTIN details. This invoice will appear directly in their client details page.
                </p>
              </div>

              {/* INVOICE META ROW */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Invoice No. *
                  </label>
                  <input
                    type="text"
                    value={invoiceForm.invoiceNumber}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceNumber: e.target.value })}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-mono font-bold text-gray-900 bg-white"
                    placeholder="e.g. INV202601"
                    required
                  />
                  <span className="text-[10px] text-gray-500 mt-0.5 block">Auto-sequenced (INV + Year + 01)</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">PO Number</label>
                  <input
                    type="text"
                    placeholder="e.g. PO-2026-0054"
                    value={invoiceForm.poNumber || ""}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, poNumber: e.target.value })}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-mono bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Issue Date *</label>
                  <input
                    type="date"
                    value={invoiceForm.issueDate}
                    onChange={(e) => handleIssueDateChange(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Due Date *</label>
                  <input
                    type="date"
                    value={invoiceForm.dueDate}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white"
                    required
                  />
                </div>
              </div>

              {/* CLIENT BILLING INFO */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                  Client Billing Info & GSTIN
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 mb-0.5">Business Name</label>
                    <input
                      type="text"
                      value={invoiceForm.customerDetails.businessName}
                      onChange={(e) =>
                        setInvoiceForm({
                          ...invoiceForm,
                          customerDetails: {
                            ...invoiceForm.customerDetails,
                            businessName: e.target.value,
                          },
                        })
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-md text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 mb-0.5">Contact Name</label>
                    <input
                      type="text"
                      value={invoiceForm.customerDetails.name}
                      onChange={(e) =>
                        setInvoiceForm({
                          ...invoiceForm,
                          customerDetails: {
                            ...invoiceForm.customerDetails,
                            name: e.target.value,
                          },
                        })
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-md text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 mb-0.5">Client Mobile</label>
                    <input
                      type="text"
                      value={invoiceForm.customerDetails.mobileNumber}
                      onChange={(e) =>
                        setInvoiceForm({
                          ...invoiceForm,
                          customerDetails: {
                            ...invoiceForm.customerDetails,
                            mobileNumber: e.target.value,
                          },
                        })
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-md text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 mb-0.5">Email Address</label>
                    <input
                      type="email"
                      value={invoiceForm.customerDetails.email || ""}
                      onChange={(e) =>
                        setInvoiceForm({
                          ...invoiceForm,
                          customerDetails: {
                            ...invoiceForm.customerDetails,
                            email: e.target.value,
                          },
                        })
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-md text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 mb-0.5">Client GSTIN</label>
                    <input
                      type="text"
                      placeholder="Leave empty if none"
                      value={invoiceForm.customerDetails.gstin || ""}
                      onChange={(e) =>
                        setInvoiceForm({
                          ...invoiceForm,
                          customerDetails: {
                            ...invoiceForm.customerDetails,
                            gstin: e.target.value,
                          },
                        })
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-md text-xs font-mono uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 mb-0.5">Payment Status</label>
                    <select
                      value={invoiceForm.status}
                      onChange={(e) =>
                        setInvoiceForm({
                          ...invoiceForm,
                          status: e.target.value as CustomerInvoice["status"],
                        })
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-md text-xs font-semibold"
                    >
                      <option value="Unpaid">Unpaid</option>
                      <option value="Paid">Paid</option>
                      <option value="Partially Paid">Partially Paid</option>
                      <option value="Overdue">Overdue</option>
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-medium text-gray-600 mb-0.5">Billing Address</label>
                    <input
                      type="text"
                      value={invoiceForm.customerDetails.address}
                      onChange={(e) =>
                        setInvoiceForm({
                          ...invoiceForm,
                          customerDetails: {
                            ...invoiceForm.customerDetails,
                            address: e.target.value,
                          },
                        })
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-md text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* ITEMS TABLE */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Invoice Items & Deliverables
                  </span>
                  <button
                    type="button"
                    onClick={handleAddInvoiceItem}
                    className="text-xs text-[#0B4FBA] font-semibold hover:underline flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item Line</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {invoiceForm.items.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="grid grid-cols-12 gap-2 items-center p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="col-span-12 sm:col-span-4">
                        <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">
                          Description & Service
                        </label>
                        <textarea
                          rows={2}
                          placeholder="e.g. Custom Web Development & Maintenance"
                          value={item.description}
                          onChange={(e) => handleInvoiceItemChange(idx, "description", e.target.value)}
                          className="w-full px-2.5 py-1 bg-white border border-gray-300 rounded-md text-xs"
                          required
                        />
                      </div>

                      <div className="col-span-4 sm:col-span-2">
                        <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">HSN / SAC</label>
                        <input
                          type="text"
                          placeholder="998313"
                          value={item.hsnSac || ""}
                          onChange={(e) => handleInvoiceItemChange(idx, "hsnSac", e.target.value)}
                          className="w-full px-2 py-1.5 bg-white border border-gray-300 rounded-md text-xs font-mono text-center"
                        />
                      </div>

                      <div className="col-span-3 sm:col-span-1">
                        <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Qty</label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleInvoiceItemChange(idx, "quantity", e.target.value)}
                          className="w-full px-1.5 py-1.5 bg-white border border-gray-300 rounded-md text-xs text-center"
                          min={1}
                          required
                        />
                      </div>

                      <div className="col-span-5 sm:col-span-2">
                        <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Rate (₹)</label>
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => handleInvoiceItemChange(idx, "unitPrice", e.target.value)}
                          className="w-full px-2 py-1.5 bg-white border border-gray-300 rounded-md text-xs"
                          required
                        />
                      </div>

                      <div className="col-span-10 sm:col-span-2 text-right">
                        <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Amount</label>
                        <span className="text-xs font-bold text-gray-900 block py-1.5">
                          ₹{item.amount.toLocaleString("en-IN")}
                        </span>
                      </div>

                      <div className="col-span-2 sm:col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveInvoiceItem(idx)}
                          disabled={invoiceForm.items.length <= 1}
                          className="p-1 text-gray-400 hover:text-red-600 disabled:opacity-30"
                          title="Remove Line"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* TAX & TOTALS BOX */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center p-4 bg-gray-900 text-white rounded-xl">
                <div className="space-y-2 text-xs">
                  <div className="flex items-center space-x-4">
                    <span className="w-20">CGST Rate:</span>
                    <input
                      type="number"
                      value={invoiceForm.cgstRate || 9}
                      onChange={(e) => {
                        const rate = Number(e.target.value) || 0;
                        const calc = recalculateInvoiceTotals(
                          invoiceForm.items,
                          rate,
                          invoiceForm.sgstRate || 9,
                          invoiceForm.discount || 0
                        );
                        setInvoiceForm({
                          ...invoiceForm,
                          cgstRate: rate,
                          cgstAmount: calc.cgstAmount,
                          taxAmount: calc.taxAmount,
                          total: calc.total,
                        });
                      }}
                      className="w-16 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-center text-xs text-white"
                    />
                    <span>% (₹{(invoiceForm.cgstAmount || 0).toLocaleString("en-IN")})</span>
                  </div>

                  <div className="flex items-center space-x-4">
                    <span className="w-20">SGST Rate:</span>
                    <input
                      type="number"
                      value={invoiceForm.sgstRate || 9}
                      onChange={(e) => {
                        const rate = Number(e.target.value) || 0;
                        const calc = recalculateInvoiceTotals(
                          invoiceForm.items,
                          invoiceForm.cgstRate || 9,
                          rate,
                          invoiceForm.discount || 0
                        );
                        setInvoiceForm({
                          ...invoiceForm,
                          sgstRate: rate,
                          sgstAmount: calc.sgstAmount,
                          taxAmount: calc.taxAmount,
                          total: calc.total,
                        });
                      }}
                      className="w-16 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-center text-xs text-white"
                    />
                    <span>% (₹{(invoiceForm.sgstAmount || 0).toLocaleString("en-IN")})</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-gray-400 block">
                    Subtotal: ₹{invoiceForm.subtotal.toLocaleString("en-IN")}
                  </span>
                  <span className="text-xs text-gray-400 block">
                    Total Tax: ₹{(invoiceForm.taxAmount || 0).toLocaleString("en-IN")}
                  </span>
                  <span className="text-2xl font-bold text-emerald-400 mt-1 block">
                    Grand Total: ₹{invoiceForm.total.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* NOTES & TERMS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Notes</label>
                  <textarea
                    rows={2}
                    value={invoiceForm.notes || ""}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs"
                    placeholder="Notes to the client..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Terms & Conditions</label>
                  <textarea
                    rows={2}
                    value={invoiceForm.terms || ""}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, terms: e.target.value })}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs"
                    placeholder="Terms and payment details..."
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsInvoiceModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#0B4FBA] text-white text-xs font-semibold rounded-lg hover:bg-[#083c8d] flex items-center space-x-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <span>Saving Invoice...</span>
                  ) : (
                    <>
                      <Receipt className="w-4 h-4" />
                      <span>{editingInvoice ? "Update Invoice" : "Generate & Save Invoice"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INVOICE PREVIEW MODAL */}
      {previewInvoice && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex flex-col items-center justify-start p-2 sm:p-4 overflow-y-auto print:static print:inset-auto print:p-0 print:m-0 print:bg-white print:backdrop-blur-none print:overflow-visible">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-300 w-full max-w-4xl my-2 sm:my-6 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in print:max-h-none print:my-0 print:shadow-none print:border-none print:max-w-none print:w-full print:m-0 print:rounded-none print:overflow-visible print:transform-none">
            {/* Modal Header Bar (Always visible & Sticky at Top) */}
            <div className="sticky top-0 z-30 shrink-0 flex items-center justify-between px-6 py-3 bg-gray-900 text-white select-none shadow-md print:hidden">
              <div className="flex items-center space-x-2">
                <Receipt className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold">Printable Tax Invoice - #{previewInvoice.invoiceNumber}</span>
                {previewInvoice.pdfUrl && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium ml-2">
                    PDF Ready
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {/* Cloudinary PDF Generation / Download Controls */}
                {previewInvoice.pdfUrl ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleDownloadPdf(previewInvoice)}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md flex items-center space-x-1.5 transition shadow-xs"
                      title="Download Invoice PDF"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download PDF</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleGeneratePdf(previewInvoice)}
                      disabled={Boolean(generatingId)}
                      className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-medium rounded-md flex items-center space-x-1 transition disabled:opacity-50"
                      title="Regenerate PDF in Cloudinary"
                    >
                      <RotateCw className={`w-3.5 h-3.5 ${generatingId ? "animate-spin" : ""}`} />
                      <span>{generatingId ? "Generating..." : "Regenerate"}</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleGeneratePdf(previewInvoice)}
                    disabled={Boolean(generatingId)}
                    className="px-3 py-1 bg-[#0B4FBA] hover:bg-[#083c8d] text-white text-xs font-semibold rounded-md flex items-center space-x-1.5 transition shadow-xs disabled:opacity-50"
                    title="Generate PDF and upload to Cloudinary"
                  >
                    {generatingId ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>{generateStatus || "Generating..."}</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Generate PDF</span>
                      </>
                    )}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handlePrintInvoice(previewInvoice)}
                  className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-md flex items-center space-x-1 transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => openWhatsappModal(previewInvoice)}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md flex items-center space-x-1 transition"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewInvoice(null)}
                  className="p-1 text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Invoice Component */}
            <PrintableInvoice invoice={previewInvoice} id="printable-invoice" />
          </div>
        </div>
      )}

      {/* Hidden Off-Screen Invoice Container for Instant PDF Generation */}
      {invoiceToRender && (
        <div className="fixed left-[-9999px] top-0 pointer-events-none z-[-100] w-[800px] bg-white">
          <PrintableInvoice invoice={invoiceToRender} id="hidden-printable-invoice" />
        </div>
      )}

      {/* WHATSAPP MODAL */}
      {whatsappInvoice && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-md overflow-hidden animate-in fade-in">
            <div className="flex items-center justify-between px-5 py-4 border-b border-emerald-600 bg-emerald-600 text-white">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5" />
                <h2 className="text-sm font-medium">Send WhatsApp Message</h2>
              </div>
              <button onClick={() => setWhatsappInvoice(null)} className="text-emerald-100 hover:text-white p-1 rounded-[6px]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Message <span className="text-rose-500">*</span>
                </label>
                <textarea
                  autoFocus
                  rows={4}
                  value={whatsappMessage}
                  onChange={(e) => setWhatsappMessage(e.target.value)}
                  placeholder="Type message to send..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-[6px] text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 focus:bg-white transition resize-none"
                />
              </div>

              {whatsappStatusMessage && (
                <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-[6px] text-xs font-medium border border-emerald-200">
                  {whatsappStatusMessage}
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setWhatsappInvoice(null)}
                  className="h-[34px] px-4 border border-gray-300 rounded-[6px] text-xs font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendWhatsappMessage}
                  disabled={sendingWhatsapp || !whatsappMessage.trim()}
                  className="h-[34px] px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-[6px] shadow-sm flex items-center justify-center space-x-1.5 disabled:opacity-50"
                >
                  {sendingWhatsapp ? (
                    <span>Sending...</span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
