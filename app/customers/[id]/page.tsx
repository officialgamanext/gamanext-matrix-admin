"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminLayout from "../../components/AdminLayout";
import {
  getCustomersFromStorage,
  saveCustomerToStorage,
  deleteCustomerFromStorage,
  getCustomerWorksFromStorage,
  saveCustomerWorkToStorage,
  deleteCustomerWorkFromStorage,
  getWorkInstallmentsFromStorage,
  saveWorkInstallmentToStorage,
  deleteWorkInstallmentFromStorage,
  getCustomerInvoicesFromStorage,
  saveCustomerInvoiceToStorage,
  deleteCustomerInvoiceFromStorage,
  getCompanySettingsFromStorage,
  getNextInvoiceNumber,
  recalculateInvoiceTotals,
  CustomerData,
  CustomerWork,
  WorkInstallment,
  CustomerInvoice,
  InvoiceItem,
  CompanySettings,
  DEFAULT_COMPANY_SETTINGS,
} from "@/lib/firebase";
import {
  Users,
  ArrowLeft,
  Phone,
  Mail,
  Building2,
  MapPin,
  Calendar,
  Edit2,
  Trash2,
  Plus,
  Briefcase,
  IndianRupee,
  Receipt,
  Eye,
  CheckCircle2,
  AlertCircle,
  X,
  Send,
  Printer,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Wallet,
  TrendingUp,
  FileText,
  MessageSquare,
  Share2,
  Globe,
  QrCode,
  Download,
  RotateCw,
  Loader2,
  Sparkles,
} from "lucide-react";
import PrintableInvoice from "../../components/PrintableInvoice";
import { generateAndUploadInvoicePdf, downloadInvoicePdf } from "@/lib/invoicePdf";

export default function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const customerId = resolvedParams.id;
  const router = useRouter();

  // Active Tab: 'profile' | 'works' | 'invoices'
  const [activeTab, setActiveTab] = useState<"profile" | "works" | "invoices">("profile");

  // Cloudinary PDF Generation States
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [invoiceToRender, setInvoiceToRender] = useState<CustomerInvoice | null>(null);
  const [generateStatus, setGenerateStatus] = useState<string | null>(null);

  // Main Data States
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [works, setWorks] = useState<CustomerWork[]>([]);
  const [installments, setInstallments] = useState<WorkInstallment[]>([]);
  const [invoices, setInvoices] = useState<CustomerInvoice[]>([]);
  const [companySettings, setCompanySettings] = useState<CompanySettings>(DEFAULT_COMPANY_SETTINGS);
  const [loading, setLoading] = useState(true);

  // UI / Collapsible states
  const [expandedWorkIds, setExpandedWorkIds] = useState<Record<string, boolean>>({});

  // --- MODAL STATES ---
  // Profile Edit Modal
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState<CustomerData>({
    name: "",
    mobileNumber: "",
    businessName: "",
    email: "",
    address: "",
    gstin: "",
  });

  // Work Modal (Add / Edit)
  const [isWorkModalOpen, setIsWorkModalOpen] = useState(false);
  const [editingWork, setEditingWork] = useState<CustomerWork | null>(null);
  const [workForm, setWorkForm] = useState<CustomerWork>({
    customerId: customerId,
    name: "",
    amount: 0,
    status: "In Progress",
    notes: "",
  });

  // Installment Modal (Add / Edit)
  const [isInstallmentModalOpen, setIsInstallmentModalOpen] = useState(false);
  const [editingInstallment, setEditingInstallment] = useState<WorkInstallment | null>(null);
  const [targetWorkId, setTargetWorkId] = useState<string>("");
  const [installmentForm, setInstallmentForm] = useState<WorkInstallment>({
    workId: "",
    customerId: customerId,
    amount: 0,
    paymentMode: "UPI",
    date: new Date().toISOString().split("T")[0],
    note: "",
  });

  // Invoice Modal (Add / Edit)
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<CustomerInvoice | null>(null);
  const [invoiceForm, setInvoiceForm] = useState<CustomerInvoice>({
    customerId: customerId,
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
        id: `item-${Date.now()}`,
        description: "",
        hsnSac: "998313",
        quantity: 1,
        unitPrice: 0,
        amount: 0,
      },
    ],
    subtotal: 0,
    cgstRate: 9,
    cgstAmount: 0,
    sgstRate: 9,
    sgstAmount: 0,
    taxAmount: 0,
    discount: 0,
    total: 0,
    notes: "Thank you for your business.\nWe appreciate your trust in Gamanext.",
    terms: DEFAULT_COMPANY_SETTINGS.termsAndConditions,
  });

  // Invoice Preview Modal
  const [previewInvoice, setPreviewInvoice] = useState<CustomerInvoice | null>(null);

  // WhatsApp Share Modal
  const [whatsappInvoice, setWhatsappInvoice] = useState<CustomerInvoice | null>(null);
  const [whatsappMessage, setWhatsappMessage] = useState("");
  const [sendingWhatsapp, setSendingWhatsapp] = useState(false);
  const [whatsappStatusMessage, setWhatsappStatusMessage] = useState<string | null>(null);

  // Submitting flags
  const [submitting, setSubmitting] = useState(false);

  // Load All Customer Data & Company Settings
  const loadData = async () => {
    setLoading(true);
    try {
      const [customersList, settingsData] = await Promise.all([
        getCustomersFromStorage(),
        getCompanySettingsFromStorage(),
      ]);

      setCompanySettings(settingsData);
      const currentCust = customersList.find((c) => c.id === customerId);

      if (!currentCust) {
        setCustomer(null);
        setLoading(false);
        return;
      }

      setCustomer(currentCust);
      setProfileForm({ ...currentCust });

      const [wList, iList, invList] = await Promise.all([
        getCustomerWorksFromStorage(customerId),
        getWorkInstallmentsFromStorage(customerId),
        getCustomerInvoicesFromStorage(customerId),
      ]);

      setWorks(wList);
      setInstallments(iList);
      setInvoices(invList);

      const expandMap: Record<string, boolean> = {};
      wList.forEach((w) => {
        if (w.id) expandMap[w.id] = true;
      });
      setExpandedWorkIds(expandMap);
    } catch (err) {
      console.error("Error loading customer detail:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [customerId]);

  const toggleWorkExpand = (id: string) => {
    setExpandedWorkIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // --- PROFILE HANDLERS ---
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.name || !profileForm.mobileNumber || !profileForm.businessName) return;
    setSubmitting(true);
    try {
      const updated = await saveCustomerToStorage(profileForm);
      setCustomer(updated);
      setIsEditProfileOpen(false);
      await loadData();
    } catch (err) {
      console.error("Failed to update profile:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // --- WORKS HANDLERS ---
  const handleOpenAddWork = () => {
    setEditingWork(null);
    setWorkForm({
      customerId: customerId,
      name: "",
      amount: 0,
      status: "In Progress",
      notes: "",
    });
    setIsWorkModalOpen(true);
  };

  const handleOpenEditWork = (work: CustomerWork) => {
    setEditingWork(work);
    setWorkForm({ ...work });
    setIsWorkModalOpen(true);
  };

  const handleSaveWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workForm.name || workForm.amount <= 0) return;
    setSubmitting(true);
    try {
      await saveCustomerWorkToStorage(workForm);
      setIsWorkModalOpen(false);
      await loadData();
    } catch (err) {
      console.error("Failed to save work:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteWork = async (id: string) => {
    if (!confirm("Are you sure you want to delete this work item?")) return;
    try {
      await deleteCustomerWorkFromStorage(id);
      await loadData();
    } catch (err) {
      console.error("Failed to delete work:", err);
    }
  };

  // --- INSTALLMENTS HANDLERS ---
  const handleOpenAddInstallment = (workId: string) => {
    setEditingInstallment(null);
    setTargetWorkId(workId);
    setInstallmentForm({
      workId: workId,
      customerId: customerId,
      amount: 0,
      paymentMode: "UPI",
      date: new Date().toISOString().split("T")[0],
      note: "",
    });
    setIsInstallmentModalOpen(true);
  };

  const handleOpenEditInstallment = (inst: WorkInstallment) => {
    setEditingInstallment(inst);
    setTargetWorkId(inst.workId);
    setInstallmentForm({ ...inst });
    setIsInstallmentModalOpen(true);
  };

  const handleSaveInstallment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (installmentForm.amount <= 0 || !installmentForm.date) return;
    setSubmitting(true);
    try {
      await saveWorkInstallmentToStorage(installmentForm);
      setIsInstallmentModalOpen(false);
      await loadData();
    } catch (err) {
      console.error("Failed to save installment:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteInstallment = async (id: string) => {
    if (!confirm("Delete this installment payment record?")) return;
    try {
      await deleteWorkInstallmentFromStorage(id);
      await loadData();
    } catch (err) {
      console.error("Failed to delete installment:", err);
    }
  };

  // --- INVOICE HANDLERS ---
  const recalculateInvoiceTotals = (
    items: InvoiceItem[],
    cgstRate: number = 9,
    sgstRate: number = 9,
    discount: number = 0
  ) => {
    const subtotal = items.reduce((sum, item) => sum + (item.amount || 0), 0);
    const cgstAmount = Math.round((subtotal * cgstRate) / 100);
    const sgstAmount = Math.round((subtotal * sgstRate) / 100);
    const taxAmount = cgstAmount + sgstAmount;
    const total = Math.max(0, subtotal + taxAmount - discount);

    return { subtotal, cgstAmount, sgstAmount, taxAmount, total };
  };

  const handleOpenAddInvoice = async () => {
    if (!customer) return;
    setEditingInvoice(null);

    const allInvoices = await getCustomerInvoicesFromStorage();
    const currentYear = new Date().getFullYear();
    const nextInvoiceNumber = getNextInvoiceNumber(allInvoices, currentYear);

    const initialItems: InvoiceItem[] =
      works.length > 0
        ? works.map((w, idx) => ({
            id: `item-${idx + 1}`,
            description: w.name,
            hsnSac: "998313",
            quantity: 1,
            unitPrice: w.amount,
            amount: w.amount,
          }))
        : [
            {
              id: `item-1`,
              description: "Custom Software Development\nRequirement Analysis, UI/UX, Development & Testing",
              hsnSac: "998313",
              quantity: 1,
              unitPrice: 75000,
              amount: 75000,
            },
          ];

    const calc = recalculateInvoiceTotals(initialItems, 9, 9, 0);

    setInvoiceForm({
      customerId: customerId,
      invoiceNumber: nextInvoiceNumber,
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
        name: customer.name,
        businessName: customer.businessName,
        mobileNumber: customer.mobileNumber,
        email: customer.email || "",
        address: customer.address,
        gstin: customer.gstin || "",
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
    setInvoiceForm({ ...inv });
    setIsInvoiceModalOpen(true);
  };

  const handleIssueDateChange = async (dateStr: string) => {
    if (!dateStr) return;
    if (!editingInvoice) {
      const yr = new Date(dateStr).getFullYear();
      if (!isNaN(yr)) {
        const allInvoices = await getCustomerInvoicesFromStorage();
        const nextInvoiceNo = getNextInvoiceNumber(allInvoices, yr);
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

    if (field === "quantity") {
      item.quantity = Number(value) || 0;
      item.amount = item.quantity * item.unitPrice;
    } else if (field === "unitPrice") {
      item.unitPrice = Number(value) || 0;
      item.amount = item.quantity * item.unitPrice;
    } else if (field === "description") {
      item.description = String(value);
    } else if (field === "hsnSac") {
      item.hsnSac = String(value);
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
      id: `item-${Date.now()}-${Math.random()}`,
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
    const updatedItems = invoiceForm.items.filter((_, i) => i !== index);
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
    if (!invoiceForm.invoiceNumber || invoiceForm.items.length === 0) return;

    setSubmitting(true);
    try {
      await saveCustomerInvoiceToStorage(invoiceForm);
      setIsInvoiceModalOpen(false);
      await loadData();
    } catch (err) {
      console.error("Failed to save invoice:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    if (!confirm("Are you sure you want to delete this invoice?")) return;
    try {
      await deleteCustomerInvoiceFromStorage(id);
      if (previewInvoice?.id === id) setPreviewInvoice(null);
      await loadData();
    } catch (err) {
      console.error("Failed to delete invoice:", err);
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

  // --- WHATSAPP SHARE HANDLERS ---
  const handleOpenWhatsapp = (inv: CustomerInvoice) => {
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

  // Analytics
  const totalWorksValue = works.reduce((sum, w) => sum + (w.amount || 0), 0);
  const totalCollectedInstallments = installments.reduce((sum, i) => sum + (i.amount || 0), 0);
  const totalPendingBalance = Math.max(0, totalWorksValue - totalCollectedInstallments);
  const collectionPercentage =
    totalWorksValue > 0 ? Math.min(100, Math.round((totalCollectedInstallments / totalWorksValue) * 100)) : 0;

  const upiTotal = installments
    .filter((i) => i.paymentMode === "UPI")
    .reduce((sum, i) => sum + i.amount, 0);
  const cashTotal = installments
    .filter((i) => i.paymentMode === "Cash")
    .reduce((sum, i) => sum + i.amount, 0);

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-12 text-center bg-white rounded-xl border border-gray-200 shadow-2xs">
          <div className="w-8 h-8 border-2 border-[#0B4FBA] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs text-gray-500 font-medium">Loading client details...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!customer) {
    return (
      <AdminLayout>
        <div className="p-12 text-center bg-white rounded-xl border border-gray-200">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-gray-900">Client Not Found</h2>
          <p className="text-xs text-gray-500 mt-1">
            The client with ID "{customerId}" could not be located.
          </p>
          <Link
            href="/customers"
            className="inline-flex items-center space-x-2 mt-4 px-4 py-2 bg-[#0B4FBA] text-white text-xs font-semibold rounded-lg hover:bg-[#083c8d]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Clients</span>
          </Link>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/customers"
            className="inline-flex items-center space-x-2 text-xs font-semibold text-gray-600 hover:text-[#0B4FBA] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Clients</span>
          </Link>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setProfileForm({ ...customer });
                setIsEditProfileOpen(true);
              }}
              className="px-3.5 py-1.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center space-x-1.5"
            >
              <Edit2 className="w-3.5 h-3.5 text-gray-500" />
              <span>Edit Profile</span>
            </button>
            <button
              onClick={async () => {
                if (confirm("Delete this client profile permanently?")) {
                  await deleteCustomerFromStorage(customerId);
                  router.push("/customers");
                }
              }}
              className="px-3 py-1.5 bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 text-xs font-semibold rounded-lg transition-colors flex items-center space-x-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </div>

        {/* Customer Banner */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-2xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-[#0B4FBA]/10 border border-[#0B4FBA]/20 text-[#0B4FBA] flex items-center justify-center font-bold text-xl shrink-0">
                {customer.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-3">
                  <h1 className="text-xl font-bold text-gray-900 tracking-tight">{customer.name}</h1>
                  {customer.gstin && (
                    <span className="bg-blue-100 text-[#0B4FBA] text-[11px] font-bold font-mono px-2.5 py-0.5 rounded-full border border-blue-200">
                      GST: {customer.gstin}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600 font-medium">
                  <span className="flex items-center space-x-1 text-gray-900 font-semibold">
                    <Building2 className="w-3.5 h-3.5 text-[#0B4FBA]" />
                    <span>{customer.businessName}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    <span>{customer.mobileNumber}</span>
                  </span>
                  {customer.email && (
                    <span className="flex items-center space-x-1">
                      <Mail className="w-3.5 h-3.5 text-gray-400" />
                      <span>{customer.email}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-gray-50/80 p-3 rounded-xl border border-gray-100">
              <div className="text-right px-3 border-r border-gray-200">
                <span className="text-[11px] text-gray-500 font-medium block">Total Works</span>
                <span className="text-base font-bold text-gray-900">{works.length}</span>
              </div>
              <div className="text-right px-3 border-r border-gray-200">
                <span className="text-[11px] text-gray-500 font-medium block">Total Billed</span>
                <span className="text-base font-bold text-emerald-700">
                  ₹{totalWorksValue.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="text-right px-3">
                <span className="text-[11px] text-gray-500 font-medium block">Pending Balance</span>
                <span className="text-base font-bold text-amber-600">
                  ₹{totalPendingBalance.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center space-x-2 mt-6 pt-4 border-t border-gray-100">
            <button
              onClick={() => setActiveTab("profile")}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center space-x-2 ${
                activeTab === "profile"
                  ? "bg-[#0B4FBA] text-white shadow-xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Client Profile</span>
            </button>

            <button
              onClick={() => setActiveTab("works")}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center space-x-2 ${
                activeTab === "works"
                  ? "bg-[#0B4FBA] text-white shadow-xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>Works & Installments</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === "works" ? "bg-white/20 text-white" : "bg-gray-200 text-gray-700"
              }`}>
                {works.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("invoices")}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center space-x-2 ${
                activeTab === "invoices"
                  ? "bg-[#0B4FBA] text-white shadow-xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Invoices & Billing</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === "invoices" ? "bg-white/20 text-white" : "bg-gray-200 text-gray-700"
              }`}>
                {invoices.length}
              </span>
            </button>
          </div>
        </div>

        {/* TAB 1: PROFILE TAB */}
        {activeTab === "profile" && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-2xs space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-gray-900">Client Details Profile</h2>
                <p className="text-xs text-gray-500">Contact information, business GST, and billing address.</p>
              </div>
              <button
                onClick={() => {
                  setProfileForm({ ...customer });
                  setIsEditProfileOpen(true);
                }}
                className="px-3.5 py-1.5 bg-[#0B4FBA] text-white text-xs font-semibold rounded-lg hover:bg-[#083c8d] transition-colors flex items-center space-x-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-100 space-y-3">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Personal & Contact Info
                  </div>

                  <div className="flex items-start space-x-3">
                    <Users className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <div className="text-[11px] text-gray-500 font-medium">Client Name</div>
                      <div className="text-sm font-semibold text-gray-900">{customer.name}</div>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Phone className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <div className="text-[11px] text-gray-500 font-medium">Mobile Phone</div>
                      <div className="text-sm font-semibold text-gray-900 font-mono">
                        {customer.mobileNumber}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Mail className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <div className="text-[11px] text-gray-500 font-medium">Email Address</div>
                      <div className="text-sm font-semibold text-gray-900">
                        {customer.email || "Not Provided"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-100 space-y-3">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Business & GST Identification
                  </div>

                  <div className="flex items-start space-x-3">
                    <Building2 className="w-4 h-4 text-[#0B4FBA] mt-0.5" />
                    <div>
                      <div className="text-[11px] text-gray-500 font-medium">Business Name</div>
                      <div className="text-sm font-semibold text-gray-900">
                        {customer.businessName}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <FileText className="w-4 h-4 text-[#0B4FBA] mt-0.5" />
                    <div>
                      <div className="text-[11px] text-gray-500 font-medium">Client GSTIN / Tax ID</div>
                      <div className="text-sm font-bold font-mono text-gray-900">
                        {customer.gstin || "N/A (Empty)"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <div className="text-[11px] text-gray-500 font-medium">Billing Address</div>
                      <div className="text-sm font-medium text-gray-900 leading-relaxed">
                        {customer.address}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: WORKS & INSTALLMENTS TAB */}
        {activeTab === "works" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-[#0B4FBA]" />
                  <h2 className="text-sm font-bold text-gray-900">Works Analytics & Payment Methods</h2>
                </div>
                <span className="text-xs font-semibold text-[#0B4FBA] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                  {collectionPercentage}% Collected
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-3.5 bg-blue-50/60 border border-blue-100 rounded-xl">
                  <span className="text-[11px] font-semibold text-blue-700 block">Total Contract Value</span>
                  <div className="text-xl font-bold text-blue-900 mt-1">
                    ₹{totalWorksValue.toLocaleString("en-IN")}
                  </div>
                  <span className="text-[10px] text-blue-600 font-medium mt-1 block">
                    {works.length} Work Projects
                  </span>
                </div>

                <div className="p-3.5 bg-emerald-50/60 border border-emerald-100 rounded-xl">
                  <span className="text-[11px] font-semibold text-emerald-700 block">Total Received</span>
                  <div className="text-xl font-bold text-emerald-900 mt-1">
                    ₹{totalCollectedInstallments.toLocaleString("en-IN")}
                  </div>
                  <span className="text-[10px] text-emerald-600 font-medium mt-1 block">
                    {installments.length} Installments
                  </span>
                </div>

                <div className="p-3.5 bg-amber-50/60 border border-amber-100 rounded-xl">
                  <span className="text-[11px] font-semibold text-amber-700 block">Pending Balance</span>
                  <div className="text-xl font-bold text-amber-900 mt-1">
                    ₹{totalPendingBalance.toLocaleString("en-IN")}
                  </div>
                  <span className="text-[10px] text-amber-600 font-medium mt-1 block">
                    Outstanding balance
                  </span>
                </div>

                <div className="p-3.5 bg-purple-50/60 border border-purple-100 rounded-xl">
                  <span className="text-[11px] font-semibold text-purple-700 block">Payment Mode Breakdown</span>
                  <div className="flex items-center space-x-3 text-xs mt-2 font-medium">
                    <span className="flex items-center space-x-1 text-purple-900">
                      <Wallet className="w-3 h-3 text-purple-600" />
                      <span>UPI: ₹{upiTotal.toLocaleString("en-IN")}</span>
                    </span>
                    <span className="flex items-center space-x-1 text-purple-900">
                      <IndianRupee className="w-3 h-3 text-purple-600" />
                      <span>Cash: ₹{cashTotal.toLocaleString("en-IN")}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Works List */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                <div>
                  <h2 className="text-base font-bold text-gray-900">Works & Installments Directory</h2>
                  <p className="text-xs text-gray-500">
                    Add contract work items and record installments via UPI or Cash.
                  </p>
                </div>
                <button
                  onClick={handleOpenAddWork}
                  className="px-4 py-2 bg-[#0B4FBA] hover:bg-[#083c8d] text-white text-xs font-semibold rounded-lg shadow-sm flex items-center justify-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Work</span>
                </button>
              </div>

              {works.length === 0 ? (
                <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <Briefcase className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <h3 className="text-xs font-bold text-gray-700">No Works Added Yet</h3>
                </div>
              ) : (
                <div className="space-y-4">
                  {works.map((work) => {
                    const workInsts = installments.filter((i) => i.workId === work.id);
                    const workPaid = workInsts.reduce((sum, i) => sum + (i.amount || 0), 0);
                    const isExpanded = expandedWorkIds[work.id || ""];

                    return (
                      <div
                        key={work.id}
                        className="border border-gray-200 rounded-xl bg-white overflow-hidden shadow-2xs"
                      >
                        <div
                          onClick={() => toggleWorkExpand(work.id!)}
                          className="p-4 bg-gray-50/70 hover:bg-gray-100/70 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none"
                        >
                          <div className="flex items-start space-x-3">
                            <div className="p-2 bg-[#0B4FBA]/10 text-[#0B4FBA] rounded-lg mt-0.5">
                              <Briefcase className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <h3 className="text-sm font-bold text-gray-900">{work.name}</h3>
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                    work.status === "Completed"
                                      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                      : work.status === "In Progress"
                                      ? "bg-blue-100 text-[#0B4FBA] border-blue-200"
                                      : "bg-amber-100 text-amber-800 border-amber-200"
                                  }`}
                                >
                                  {work.status}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between md:justify-end gap-4">
                            <div className="text-right">
                              <div className="text-xs text-gray-500">Contract Amount</div>
                              <div className="text-sm font-bold text-gray-900">
                                ₹{work.amount.toLocaleString("en-IN")}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-emerald-600 font-medium">Paid</div>
                              <div className="text-sm font-bold text-emerald-700">
                                ₹{workPaid.toLocaleString("en-IN")}
                              </div>
                            </div>

                            <div className="flex items-center space-x-1 pl-2 border-l border-gray-200">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenAddInstallment(work.id!);
                                }}
                                className="px-2.5 py-1 bg-[#0B4FBA] text-white text-[11px] font-semibold rounded-md flex items-center space-x-1"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Installment</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEditWork(work);
                                }}
                                className="p-1.5 text-gray-500 hover:text-[#0B4FBA] rounded-md"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteWork(work.id!);
                                }}
                                className="p-1.5 text-gray-500 hover:text-red-600 rounded-md"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="p-4 bg-white border-t border-gray-100 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                                Installment Payments ({workInsts.length})
                              </span>
                            </div>

                            {workInsts.map((inst) => (
                              <div
                                key={inst.id}
                                className="p-2.5 flex items-center justify-between bg-gray-50 rounded-lg text-xs"
                              >
                                <div className="flex items-center space-x-3">
                                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-purple-100 text-purple-800 uppercase">
                                    {inst.paymentMode}
                                  </span>
                                  <span className="font-bold text-gray-900">
                                    ₹{inst.amount.toLocaleString("en-IN")}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2 text-gray-500">
                                  <span>{inst.date}</span>
                                  <button onClick={() => handleDeleteInstallment(inst.id!)} className="text-red-600">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: INVOICES TAB */}
        {activeTab === "invoices" && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-2xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-gray-900">Invoices & Billing</h2>
                <p className="text-xs text-gray-500">
                  Generate invoices, preview printable bills, and send directly via WhatsApp.
                </p>
              </div>
              <button
                onClick={handleOpenAddInvoice}
                className="px-4 py-2 bg-[#0B4FBA] hover:bg-[#083c8d] text-white text-xs font-semibold rounded-lg shadow-sm flex items-center justify-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create Invoice</span>
              </button>
            </div>

            {invoices.length === 0 ? (
              <div className="p-10 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <Receipt className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <h3 className="text-xs font-bold text-gray-700">No Invoices Created</h3>
                <button
                  onClick={handleOpenAddInvoice}
                  className="mt-3 px-4 py-1.5 bg-[#0B4FBA] text-white text-xs font-semibold rounded-lg"
                >
                  Create Invoice Now
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
                {invoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-4 bg-white hover:bg-gray-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-start space-x-3">
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
                                : "bg-amber-100 text-amber-800 border-amber-200"
                            }`}
                          >
                            {inv.status}
                          </span>
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

                      <div className="flex items-center space-x-1.5 pl-3 border-l border-gray-200">
                        {inv.pdfUrl ? (
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => handleDownloadPdf(inv)}
                              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg transition-colors flex items-center space-x-1 shadow-2xs"
                              title="Download Invoice PDF"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Download</span>
                            </button>
                            <button
                              onClick={() => handleGeneratePdf(inv)}
                              disabled={generatingId === inv.id}
                              className="p-1.5 text-gray-400 hover:text-[#0B4FBA] hover:bg-blue-50 rounded-lg transition-colors"
                              title="Regenerate PDF in Cloudinary"
                            >
                              <RotateCw
                                className={`w-3.5 h-3.5 ${
                                  generatingId === inv.id ? "animate-spin text-[#0B4FBA]" : ""
                                }`}
                              />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleGeneratePdf(inv)}
                            disabled={generatingId === inv.id}
                            className="px-2.5 py-1.5 bg-[#0B4FBA] hover:bg-[#083c8d] text-white text-xs font-semibold rounded-lg transition-colors flex items-center space-x-1.5 disabled:opacity-60 shadow-2xs"
                            title="Generate PDF & Save to Cloudinary"
                          >
                            {generatingId === inv.id ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Generating...</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Generate</span>
                              </>
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
                          onClick={() => handleOpenWhatsapp(inv)}
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
              </div>
            )}
          </div>
        )}
      </div>

      {/* EDIT PROFILE MODAL */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-lg overflow-hidden animate-in fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h2 className="text-base font-bold text-gray-900">Edit Client Profile</h2>
              <button onClick={() => setIsEditProfileOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Client Name *</label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Mobile Number *</label>
                  <input
                    type="text"
                    value={profileForm.mobileNumber}
                    onChange={(e) => setProfileForm({ ...profileForm, mobileNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Business Name *</label>
                  <input
                    type="text"
                    value={profileForm.businessName}
                    onChange={(e) => setProfileForm({ ...profileForm, businessName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={profileForm.email || ""}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Client GSTIN</label>
                  <input
                    type="text"
                    placeholder="Leave empty if none"
                    value={profileForm.gstin || ""}
                    onChange={(e) => setProfileForm({ ...profileForm, gstin: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Billing Address *</label>
                <textarea
                  rows={3}
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#0B4FBA] text-white text-xs font-semibold rounded-lg"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT WORK MODAL */}
      {isWorkModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h2 className="text-base font-bold text-gray-900">
                {editingWork ? "Edit Work" : "Add Work"}
              </h2>
              <button onClick={() => setIsWorkModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveWork} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Work Title *</label>
                <input
                  type="text"
                  value={workForm.name}
                  onChange={(e) => setWorkForm({ ...workForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    value={workForm.amount || ""}
                    onChange={(e) => setWorkForm({ ...workForm, amount: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Status</label>
                  <select
                    value={workForm.status}
                    onChange={(e) =>
                      setWorkForm({
                        ...workForm,
                        status: e.target.value as CustomerWork["status"],
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsWorkModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#0B4FBA] text-white text-xs font-semibold rounded-lg"
                >
                  Save Work
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT INSTALLMENT MODAL */}
      {isInstallmentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h2 className="text-base font-bold text-gray-900">Record Installment Payment</h2>
              <button onClick={() => setIsInstallmentModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveInstallment} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Installment Amount (₹) *</label>
                <input
                  type="number"
                  value={installmentForm.amount || ""}
                  onChange={(e) =>
                    setInstallmentForm({ ...installmentForm, amount: Number(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Payment Mode *</label>
                  <select
                    value={installmentForm.paymentMode}
                    onChange={(e) =>
                      setInstallmentForm({
                        ...installmentForm,
                        paymentMode: e.target.value as WorkInstallment["paymentMode"],
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                  >
                    <option value="UPI">UPI</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Date *</label>
                  <input
                    type="date"
                    value={installmentForm.date}
                    onChange={(e) => setInstallmentForm({ ...installmentForm, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsInstallmentModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#0B4FBA] text-[#0B4FBA] hover:bg-[#083c8d] text-white text-xs font-semibold rounded-lg"
                >
                  Save Installment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE / EDIT INVOICE MODAL */}
      {isInvoiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-4xl overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50 shrink-0">
              <div className="flex items-center space-x-2">
                <Receipt className="w-5 h-5 text-[#0B4FBA]" />
                <h2 className="text-base font-bold text-gray-900">
                  {editingInvoice ? "Edit Invoice" : "Create Client Invoice"}
                </h2>
              </div>
              <button onClick={() => setIsInvoiceModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveInvoice} className="p-6 space-y-6 overflow-y-auto grow">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Invoice No. *</label>
                  <input
                    type="text"
                    value={invoiceForm.invoiceNumber}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceNumber: e.target.value })}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">PO Number</label>
                  <input
                    type="text"
                    placeholder="e.g. PO-2026-0054"
                    value={invoiceForm.poNumber || ""}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, poNumber: e.target.value })}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Issue Date *</label>
                  <input
                    type="date"
                    value={invoiceForm.issueDate}
                    onChange={(e) => handleIssueDateChange(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Due Date *</label>
                  <input
                    type="date"
                    value={invoiceForm.dueDate}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs"
                    required
                  />
                </div>
              </div>

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
                    <label className="block text-[11px] font-medium text-gray-600 mb-0.5">
                      Client GSTIN
                    </label>
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
                </div>
              </div>

              {/* Items Table */}
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
                      <div className="col-span-4">
                        <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">
                          Description & Subtitle
                        </label>
                        <textarea
                          rows={2}
                          placeholder="e.g. Custom Software Development\nRequirement Analysis, UI/UX"
                          value={item.description}
                          onChange={(e) => handleInvoiceItemChange(idx, "description", e.target.value)}
                          className="w-full px-2.5 py-1 bg-white border border-gray-300 rounded-md text-xs"
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">HSN / SAC</label>
                        <input
                          type="text"
                          placeholder="998313"
                          value={item.hsnSac || ""}
                          onChange={(e) => handleInvoiceItemChange(idx, "hsnSac", e.target.value)}
                          className="w-full px-2 py-1.5 bg-white border border-gray-300 rounded-md text-xs font-mono text-center"
                        />
                      </div>
                      <div className="col-span-1">
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
                      <div className="col-span-2">
                        <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Rate (₹)</label>
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => handleInvoiceItemChange(idx, "unitPrice", e.target.value)}
                          className="w-full px-2 py-1.5 bg-white border border-gray-300 rounded-md text-xs"
                          required
                        />
                      </div>
                      <div className="col-span-2 text-right">
                        <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Amount</label>
                        <span className="text-xs font-bold text-gray-900 block py-1.5">
                          ₹{item.amount.toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveInvoiceItem(idx)}
                          disabled={invoiceForm.items.length <= 1}
                          className="p-1 text-gray-400 hover:text-red-600 disabled:opacity-30"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tax & Grand Total Calculation Box */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center p-4 bg-gray-900 text-white rounded-xl">
                <div className="space-y-1 text-xs">
                  <div className="flex items-center space-x-4">
                    <span>CGST Rate:</span>
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
                    <span>SGST Rate:</span>
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
                  <span className="text-xs text-gray-400 block">Subtotal: ₹{invoiceForm.subtotal.toLocaleString("en-IN")}</span>
                  <span className="text-2xl font-bold text-emerald-400">
                    Grand Total: ₹{invoiceForm.total.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsInvoiceModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#0B4FBA] text-white text-xs font-semibold rounded-lg flex items-center space-x-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingInvoice ? "Update Invoice" : "Save Invoice"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINTABLE INVOICE PREVIEW MODAL */}
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
                  onClick={() => handleOpenWhatsapp(previewInvoice)}
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
          <div className="bg-white rounded-[6px] shadow-xl border border-gray-200 w-full max-w-md overflow-hidden animate-in fade-in">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-emerald-600 text-white">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-4 h-4" />
                <h2 className="text-sm font-medium">Send WhatsApp Message</h2>
              </div>
              <button
                onClick={() => setWhatsappInvoice(null)}
                className="text-emerald-100 hover:text-white p-1 rounded-[6px]"
              >
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
