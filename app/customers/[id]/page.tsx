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
} from "lucide-react";

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
    invoiceNumber: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    poNumber: `PO-2026-${Math.floor(1000 + Math.random() * 9000)}`,
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

  const handleOpenAddInvoice = () => {
    if (!customer) return;
    setEditingInvoice(null);

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
      invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      poNumber: `PO-2026-${Math.floor(1000 + Math.random() * 9000)}`,
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

  // --- WHATSAPP SHARE HANDLERS ---
  const handleOpenWhatsapp = (inv: CustomerInvoice) => {
    setWhatsappInvoice(inv);
    setWhatsappStatusMessage(null);
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
        setWhatsappStatusMessage("Invoice details sent successfully via WhatsApp API!");
      } else {
        setWhatsappStatusMessage(`API Notice: ${data.error || "Falling back to Direct Web WhatsApp link"}`);
      }
    } catch (err) {
      setWhatsappStatusMessage("Opening via Web WhatsApp link...");
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
          <p className="text-xs text-gray-500 font-medium">Loading customer details...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!customer) {
    return (
      <AdminLayout>
        <div className="p-12 text-center bg-white rounded-xl border border-gray-200">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-gray-900">Customer Not Found</h2>
          <p className="text-xs text-gray-500 mt-1">
            The customer with ID "{customerId}" could not be located.
          </p>
          <Link
            href="/customers"
            className="inline-flex items-center space-x-2 mt-4 px-4 py-2 bg-[#0B4FBA] text-white text-xs font-semibold rounded-lg hover:bg-[#083c8d]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Customers</span>
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
            <span>Back to Customers</span>
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
                if (confirm("Delete this customer profile permanently?")) {
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
              <span>Customer Profile</span>
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
                <h2 className="text-base font-bold text-gray-900">Customer Details Profile</h2>
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
                      <div className="text-[11px] text-gray-500 font-medium">Customer Name</div>
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
                      <div className="text-[11px] text-gray-500 font-medium">Customer GSTIN / Tax ID</div>
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
                        <button
                          onClick={() => setPreviewInvoice(inv)}
                          className="px-2.5 py-1.5 bg-blue-50 text-[#0B4FBA] hover:bg-blue-100 text-xs font-semibold rounded-lg flex items-center space-x-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Preview</span>
                        </button>

                        <button
                          onClick={() => handleOpenWhatsapp(inv)}
                          className="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold rounded-lg flex items-center space-x-1"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </button>

                        <button
                          onClick={() => handleOpenEditInvoice(inv)}
                          className="p-1.5 text-gray-500 hover:text-[#0B4FBA] rounded-lg"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteInvoice(inv.id!)}
                          className="p-1.5 text-gray-500 hover:text-red-600 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
              <h2 className="text-base font-bold text-gray-900">Edit Customer Profile</h2>
              <button onClick={() => setIsEditProfileOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Customer Name *</label>
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
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Customer GSTIN</label>
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
                  {editingInvoice ? "Edit Invoice" : "Create Customer Invoice"}
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
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, issueDate: e.target.value })}
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
                  Customer Billing Info & GSTIN
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
                      Customer GSTIN
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
                  onClick={() => handleOpenWhatsapp(previewInvoice)}
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
                    GSTIN: {previewInvoice.customerDetails.gstin || ""}
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

                  {/* Signature & QR Block */}
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

                    {/* QR Code rendering Image if uploaded */}
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

              {/* Bottom Blue Wave Footer */}
              <div className="mt-8 pt-4 border-t border-gray-100 text-center">
                <div className="bg-[#004bb7] text-white text-xs font-semibold py-2 px-6 rounded-b-xl tracking-wider italic shadow-xs">
                  —— Thank you for your business! ——
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WHATSAPP MODAL */}
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
