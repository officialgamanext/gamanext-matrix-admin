"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminLayout from "../components/AdminLayout";
import {
  getCustomersFromStorage,
  saveCustomerToStorage,
  deleteCustomerFromStorage,
  getCustomerWorksFromStorage,
  getWorkInstallmentsFromStorage,
  CustomerData,
  CustomerWork,
  WorkInstallment,
} from "@/lib/firebase";
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  Building2,
  MapPin,
  ChevronRight,
  Edit2,
  Trash2,
  Eye,
  IndianRupee,
  Briefcase,
  X,
  CheckCircle2,
  AlertCircle,
  FileText,
} from "lucide-react";

export default function CustomersPage() {
  const router = useRouter();

  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [works, setWorks] = useState<CustomerWork[]>([]);
  const [installments, setInstallments] = useState<WorkInstallment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerData | null>(null);

  // Delete State
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<CustomerData>({
    name: "",
    mobileNumber: "",
    businessName: "",
    email: "",
    address: "",
    gstin: "",
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Load Customers, Works & Installments
  const loadData = async () => {
    setLoading(true);
    try {
      const [cList, wList, iList] = await Promise.all([
        getCustomersFromStorage(),
        getCustomerWorksFromStorage(),
        getWorkInstallmentsFromStorage(),
      ]);
      setCustomers(cList);
      setWorks(wList);
      setInstallments(iList);
    } catch (err) {
      console.error("Error loading customer data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter Customers
  const filteredCustomers = customers.filter((cust) => {
    const q = searchQuery.toLowerCase();
    return (
      cust.name.toLowerCase().includes(q) ||
      cust.businessName.toLowerCase().includes(q) ||
      cust.mobileNumber.toLowerCase().includes(q) ||
      (cust.email && cust.email.toLowerCase().includes(q)) ||
      (cust.gstin && cust.gstin.toLowerCase().includes(q)) ||
      cust.address.toLowerCase().includes(q)
    );
  });

  // Calculate totals
  const totalWorksAmount = works.reduce((sum, w) => sum + (w.amount || 0), 0);
  const totalPaidAmount = installments.reduce((sum, inst) => sum + (inst.amount || 0), 0);
  const pendingAmount = Math.max(0, totalWorksAmount - totalPaidAmount);

  // Modal handlers
  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setFormData({
      name: "",
      mobileNumber: "",
      businessName: "",
      email: "",
      address: "",
      gstin: "",
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (customer: CustomerData, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCustomer(customer);
    setFormData({ ...customer });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this customer?")) return;
    setDeletingId(id);
    try {
      await deleteCustomerFromStorage(id);
      await loadData();
    } catch (err) {
      console.error("Failed to delete customer:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = "Customer Name is required";
    if (!formData.mobileNumber.trim()) errors.mobileNumber = "Mobile Number is required";
    if (!formData.businessName.trim()) errors.businessName = "Business Name is required";
    if (!formData.address.trim()) errors.address = "Address is required";
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Invalid email format";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      await saveCustomerToStorage(formData);
      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      console.error("Error saving customer:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Top Header & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-[#0B4FBA]/10 border border-[#0B4FBA]/20 rounded-xl text-[#0B4FBA]">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Customers</h1>
                <span className="bg-blue-100 text-[#0B4FBA] text-xs font-semibold px-2.5 py-0.5 rounded-full border border-blue-200">
                  {customers.length} Total
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Manage client accounts, GST numbers, business profiles, works, installments, and invoices.
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-[#0B4FBA] hover:bg-[#083c8d] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">Total Customers</span>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mt-2">{customers.length}</div>
            <p className="text-[11px] text-emerald-600 mt-1 font-medium">Active client accounts</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">Active Works</span>
              <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                <Briefcase className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mt-2">{works.length}</div>
            <p className="text-[11px] text-gray-500 mt-1 font-medium">Projects & contracts</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">Contract Revenue</span>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <IndianRupee className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-emerald-700 mt-2">
              ₹{totalWorksAmount.toLocaleString("en-IN")}
            </div>
            <p className="text-[11px] text-emerald-600 mt-1 font-medium">
              Collected: ₹{totalPaidAmount.toLocaleString("en-IN")}
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">Pending Receivables</span>
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-amber-700 mt-2">
              ₹{pendingAmount.toLocaleString("en-IN")}
            </div>
            <p className="text-[11px] text-amber-600 mt-1 font-medium">Across all active works</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, business, GSTIN, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B4FBA]/20 focus:border-[#0B4FBA] transition-all"
            />
          </div>
          <div className="text-xs text-gray-500 font-medium">
            Showing <span className="font-semibold text-gray-900">{filteredCustomers.length}</span> of {customers.length} customers
          </div>
        </div>

        {/* Customers Grid */}
        {loading ? (
          <div className="p-12 text-center bg-white rounded-xl border border-gray-200">
            <div className="w-8 h-8 border-2 border-[#0B4FBA] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs text-gray-500 font-medium">Loading customers...</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-xl border border-gray-200">
            <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-gray-900">No Customers Found</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              {searchQuery
                ? `No customers match "${searchQuery}". Try a different keyword.`
                : "Get started by adding your first customer."}
            </p>
            {!searchQuery && (
              <button
                onClick={handleOpenAdd}
                className="mt-4 px-4 py-2 bg-[#0B4FBA] text-white text-xs font-semibold rounded-lg hover:bg-[#083c8d]"
              >
                Add Customer Now
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCustomers.map((cust) => {
              const custWorks = works.filter((w) => w.customerId === cust.id);
              const custWorksTotal = custWorks.reduce((acc, w) => acc + (w.amount || 0), 0);

              return (
                <div
                  key={cust.id}
                  onClick={() => router.push(`/customers/${cust.id}`)}
                  className="bg-white border border-gray-200 hover:border-[#0B4FBA]/40 rounded-xl p-5 shadow-2xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-[#0B4FBA]/10 border border-[#0B4FBA]/20 text-[#0B4FBA] flex items-center justify-center font-bold text-sm">
                          {cust.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-gray-900 group-hover:text-[#0B4FBA] transition-colors line-clamp-1">
                            {cust.name}
                          </h3>
                          <div className="flex items-center space-x-1.5 text-xs text-gray-500 mt-0.5 font-medium">
                            <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span className="line-clamp-1">{cust.businessName}</span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#0B4FBA] group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                    </div>

                    <div className="space-y-1.5 text-xs text-gray-600 bg-gray-50/75 p-3 rounded-lg border border-gray-100">
                      <div className="flex items-center space-x-2">
                        <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="font-mono">{cust.mobileNumber}</span>
                      </div>
                      {cust.email && (
                        <div className="flex items-center space-x-2">
                          <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="truncate">{cust.email}</span>
                        </div>
                      )}
                      {cust.gstin && (
                        <div className="flex items-center space-x-2">
                          <FileText className="w-3.5 h-3.5 text-[#0B4FBA] shrink-0" />
                          <span className="font-mono font-semibold text-gray-700">GST: {cust.gstin}</span>
                        </div>
                      )}
                      <div className="flex items-start space-x-2">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{cust.address}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-100">
                      <span className="text-gray-500 font-medium">
                        Works: <strong className="text-gray-900">{custWorks.length}</strong>
                      </span>
                      <span className="font-semibold text-emerald-700">
                        ₹{custWorksTotal.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-end space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/customers/${cust.id}`);
                      }}
                      className="px-2.5 py-1.5 bg-blue-50 text-[#0B4FBA] hover:bg-blue-100 text-xs font-semibold rounded-lg transition-colors flex items-center space-x-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </button>
                    <button
                      onClick={(e) => handleOpenEdit(cust, e)}
                      className="px-2.5 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 text-xs font-semibold rounded-lg transition-colors flex items-center space-x-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={(e) => handleDelete(cust.id!, e)}
                      disabled={deletingId === cust.id}
                      className="px-2.5 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 text-xs font-semibold rounded-lg transition-colors flex items-center space-x-1 disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-[#0B4FBA]" />
                <h2 className="text-base font-bold text-gray-900">
                  {editingCustomer ? "Edit Customer Details" : "Add New Customer"}
                </h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rajesh Sharma"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg text-xs focus:outline-none focus:ring-2 ${
                    formErrors.name ? "border-red-300 focus:ring-red-200" : "border-gray-300 focus:ring-[#0B4FBA]/20 focus:border-[#0B4FBA]"
                  }`}
                />
                {formErrors.name && <p className="text-[11px] text-red-500 mt-1">{formErrors.name}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. +91 98765 43210"
                    value={formData.mobileNumber}
                    onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg text-xs focus:outline-none focus:ring-2 ${
                      formErrors.mobileNumber ? "border-red-300 focus:ring-red-200" : "border-gray-300 focus:ring-[#0B4FBA]/20 focus:border-[#0B4FBA]"
                    }`}
                  />
                  {formErrors.mobileNumber && <p className="text-[11px] text-red-500 mt-1">{formErrors.mobileNumber}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Business Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sharma Digital Solutions"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg text-xs focus:outline-none focus:ring-2 ${
                      formErrors.businessName ? "border-red-300 focus:ring-red-200" : "border-gray-300 focus:ring-[#0B4FBA]/20 focus:border-[#0B4FBA]"
                    }`}
                  />
                  {formErrors.businessName && <p className="text-[11px] text-red-500 mt-1">{formErrors.businessName}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Email Address <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. rajesh@sharmadigital.com"
                    value={formData.email || ""}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-[#0B4FBA]/20 focus:border-[#0B4FBA]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Customer GSTIN / Tax ID <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 29ACME1234B1Z2"
                    value={formData.gstin || ""}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono uppercase focus:ring-2 focus:ring-[#0B4FBA]/20 focus:border-[#0B4FBA]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Enter full billing address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg text-xs focus:outline-none focus:ring-2 ${
                    formErrors.address ? "border-red-300 focus:ring-red-200" : "border-gray-300 focus:ring-[#0B4FBA]/20 focus:border-[#0B4FBA]"
                  }`}
                />
                {formErrors.address && <p className="text-[11px] text-red-500 mt-1">{formErrors.address}</p>}
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#0B4FBA] hover:bg-[#083c8d] text-white text-xs font-semibold rounded-lg shadow-sm flex items-center space-x-2 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingCustomer ? "Update Customer" : "Save Customer"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
