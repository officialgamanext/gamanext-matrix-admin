"use client";

import { useEffect, useState, useId } from "react";
import AdminLayout from "../components/AdminLayout";
import {
  getClientContacts,
  saveClientContact,
  updateClientContact,
  deleteClientContact,
  saveWhatsAppMessage,
  WhatsAppContact,
  WhatsAppMessage,
} from "@/lib/firebase";
import {
  Users,
  Search,
  Plus,
  Send,
  Phone,
  User,
  CheckCircle2,
  AlertCircle,
  Clock,
  X,
  Trash2,
  Edit3,
  Check,
  CheckCheck,
  Sparkles,
  ExternalLink,
  MessageSquare,
  Copy,
  ShieldCheck,
  RefreshCw,
  Globe,
} from "lucide-react";

/* ─────────────── Helpers & Country Codes ─────────────── */
const COUNTRIES = [
  { code: "IN", name: "India", dial: "+91", flag: "🇮🇳" },
  { code: "US", name: "United States", dial: "+1", flag: "🇺🇸" },
  { code: "GB", name: "United Kingdom", dial: "+44", flag: "🇬🇧" },
  { code: "AE", name: "UAE", dial: "+971", flag: "🇦🇪" },
  { code: "SA", name: "Saudi Arabia", dial: "+966", flag: "🇸🇦" },
  { code: "AU", name: "Australia", dial: "+61", flag: "🇦🇺" },
  { code: "CA", name: "Canada", dial: "+1", flag: "🇨🇦" },
  { code: "SG", name: "Singapore", dial: "+65", flag: "🇸🇬" },
  { code: "MY", name: "Malaysia", dial: "+60", flag: "🇲🇾" },
];

const DEFAULT_COUNTRY = COUNTRIES[0];

function cleanPhone(raw: string): string {
  return raw.replace(/\D/g, "");
}

function normalizeE164(phone: string, defaultDial = "+91"): string {
  let cleaned = phone.trim().replace(/[\s\-().]/g, "");
  if (!cleaned.startsWith("+")) {
    const dialDigits = defaultDial.replace("+", "");
    if (!cleaned.startsWith(dialDigits)) {
      cleaned = defaultDial + cleaned;
    } else {
      cleaned = "+" + cleaned;
    }
  }
  return cleaned;
}

function avatarColor(str: string) {
  const colors = [
    "bg-blue-600 text-white",
    "bg-indigo-600 text-white",
    "bg-violet-600 text-white",
    "bg-emerald-600 text-white",
    "bg-teal-600 text-white",
    "bg-amber-600 text-white",
    "bg-rose-600 text-white",
    "bg-cyan-600 text-white",
  ];
  const hash = str.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

function getInitials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "CL"
  );
}

/* ─────────────── Main Component ─────────────── */
export default function ClientContactsPage() {
  const [contacts, setContacts] = useState<WhatsAppContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);

  // Modals
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<WhatsAppContact | null>(null);

  // Send Message Modal (Single Contact)
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [activeContactForMessage, setActiveContactForMessage] = useState<WhatsAppContact | null>(null);

  // Bulk Send Modal
  const [isBulkSendOpen, setIsBulkSendOpen] = useState(false);

  // Delete State
  const [deletingContact, setDeletingContact] = useState<WhatsAppContact | null>(null);

  // Feedback Toast
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Load Contacts: loads strictly separately added client contacts
  const loadContacts = async () => {
    setLoading(true);
    try {
      const data = await getClientContacts();
      setContacts(data);
    } catch (err) {
      console.error("Error loading client contacts:", err);
      showToast("Could not load client contacts", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();
  }, []);

  // Filtered Contacts
  const filteredContacts = contacts.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      (c.notes && c.notes.toLowerCase().includes(q))
    );
  });

  // Bulk Selection Handlers
  const handleSelectAll = () => {
    if (selectedContactIds.length === filteredContacts.length) {
      setSelectedContactIds([]);
    } else {
      setSelectedContactIds(filteredContacts.map((c) => c.id || c.phone));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedContactIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Open Send Modal for individual contact
  const handleOpenSendModal = (contact: WhatsAppContact) => {
    setActiveContactForMessage(contact);
    setIsSendModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (contact: WhatsAppContact) => {
    setEditingContact(contact);
    setIsAddEditOpen(true);
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingContact(null);
    setIsAddEditOpen(true);
  };

  // Handle Delete
  const handleDelete = async (contact: WhatsAppContact) => {
    if (!contact.id) return;
    try {
      await deleteClientContact(contact.id);
      setContacts((prev) => prev.filter((c) => c.id !== contact.id));
      setSelectedContactIds((prev) => prev.filter((id) => id !== contact.id));
      showToast(`Client contact "${contact.name}" removed`);
      setDeletingContact(null);
    } catch (err) {
      showToast("Failed to delete contact", "error");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-4 max-w-7xl mx-auto pb-12">
        {/* Toast Alert */}
        {toastMessage && (
          <div
            className={`fixed bottom-6 right-6 z-50 flex items-center space-x-3 px-4 py-2.5 rounded-[6px] shadow-xl border text-xs font-medium transition-all transform animate-in fade-in slide-in-from-bottom-3 ${
              toastMessage.type === "success"
                ? "bg-emerald-900/95 border-emerald-700 text-emerald-100"
                : "bg-rose-900/95 border-rose-700 text-rose-100"
            }`}
          >
            {toastMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="text-white/70 hover:text-white ml-2"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-[6px] border border-gray-200 shadow-2xs">
          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-[6px] bg-[#0B4FBA]/10 text-[#0B4FBA] flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-xl font-bold text-gray-900">Client Contacts</h1>
                  <span className="px-2 py-0.5 rounded-[6px] text-xs font-semibold bg-[#0B4FBA]/10 text-[#0B4FBA] border border-[#0B4FBA]/20">
                    {contacts.length} Contacts
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  Manage WhatsApp contacts, send template messages, and broadcast in bulk.
                </p>
              </div>
            </div>
          </div>

          {/* Header Actions - Exactly h-[34px] and rounded-[6px] */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Bulk Send Button */}
            <button
              onClick={() => setIsBulkSendOpen(true)}
              className="h-[34px] px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-[6px] text-xs font-medium shadow-2xs transition flex items-center space-x-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Bulk Send</span>
              {selectedContactIds.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-[6px] bg-white/25 text-[11px] font-medium">
                  {selectedContactIds.length}
                </span>
              )}
            </button>

            {/* Add Contact Button */}
            <button
              onClick={handleOpenAdd}
              className="h-[34px] px-4 bg-[#0B4FBA] hover:bg-[#003882] text-white rounded-[6px] text-xs font-medium shadow-2xs transition flex items-center space-x-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Contact</span>
            </button>
          </div>
        </div>

        {/* Template Info Card (Meta Cloud API message_to_customers) */}
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50/40 to-teal-50/30 border border-blue-200 rounded-[6px] p-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-[6px] bg-blue-600 text-white flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap">
                <span className="font-bold text-gray-900">WhatsApp Cloud API Template:</span>
                <span className="px-1.5 py-0.5 rounded-[6px] font-mono bg-blue-100 text-blue-800 font-semibold border border-blue-200 text-[11px]">
                  message_to_customers · en_US
                </span>
                <span className="px-1.5 py-0.5 rounded-[6px] text-[10px] font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Active · Utility
                </span>
                <span className="text-gray-500 font-mono text-[11px]">ID: 921754134307275</span>
              </div>
              <p className="text-gray-600 mt-0.5 text-[11px]">
                Header: <strong className="text-blue-900 font-semibold">GamaNext™</strong> · Merged Client Message · Call to Action: <strong className="text-emerald-700 font-semibold">View Website</strong>
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1.5 text-[11px] font-medium text-blue-700 bg-white px-2.5 py-1 rounded-[6px] border border-blue-200 shrink-0">
            <Sparkles className="w-3 h-3 text-blue-600" />
            <span>Meta Cloud API Connected</span>
          </div>
        </div>

        {/* Search, Filter & Bulk Toolbar - All elements h-[38px] and rounded-[6px] */}
        <div className="bg-white p-3 rounded-[6px] border border-gray-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by client name, mobile number, or notes..."
              className="w-full h-[38px] pl-9 pr-8 bg-gray-50 border border-gray-300 rounded-[6px] text-xs focus:outline-none focus:ring-2 focus:ring-[#0B4FBA]/30 focus:border-[#0B4FBA] focus:bg-white transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Bulk Selection Bar */}
          <div className="flex items-center space-x-2 self-end sm:self-center">
            {selectedContactIds.length > 0 && (
              <div className="flex items-center space-x-2 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 h-[38px] rounded-[6px] text-xs font-semibold animate-in fade-in">
                <span>{selectedContactIds.length} selected</span>
                <button
                  onClick={() => setIsBulkSendOpen(true)}
                  className="h-[28px] px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[6px] text-[11px] font-medium transition flex items-center space-x-1"
                >
                  <Send className="w-3 h-3" />
                  <span>Send</span>
                </button>
                <button
                  onClick={() => setSelectedContactIds([])}
                  className="text-emerald-700 hover:text-emerald-900 ml-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <button
              onClick={handleSelectAll}
              className="h-[38px] px-3.5 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-[6px] border border-gray-300 transition flex items-center"
            >
              {selectedContactIds.length === filteredContacts.length && filteredContacts.length > 0
                ? "Deselect All"
                : `Select All (${filteredContacts.length})`}
            </button>
          </div>
        </div>

        {/* Contacts List / Table */}
        <div className="bg-white rounded-[6px] border border-gray-200 shadow-2xs overflow-hidden">
          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center space-y-2 text-gray-500">
              <RefreshCw className="w-7 h-7 animate-spin text-[#0B4FBA]" />
              <p className="text-xs font-medium">Loading client contacts...</p>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 bg-blue-50 text-[#0B4FBA] rounded-[6px] flex items-center justify-center mx-auto">
                <Users className="w-6 h-6" />
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <h3 className="text-base font-bold text-gray-900">No contacts found</h3>
                <p className="text-xs text-gray-500">
                  {searchQuery
                    ? "No contacts matched your search query. Try typing something else."
                    : "Get started by adding your first client contact."}
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  onClick={handleOpenAdd}
                  className="h-[34px] px-4 bg-[#0B4FBA] hover:bg-[#003882] text-white rounded-[6px] text-xs font-medium transition flex items-center space-x-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add First Contact</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/80 text-[11px] font-semibold text-gray-600 uppercase tracking-wider">
                    <th className="py-3 px-3.5 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={
                          filteredContacts.length > 0 &&
                          selectedContactIds.length === filteredContacts.length
                        }
                        onChange={handleSelectAll}
                        className="w-4 h-4 rounded-[4px] text-[#0B4FBA] focus:ring-[#0B4FBA] border-gray-300 cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-3.5">Client Name</th>
                    <th className="py-3 px-3.5">WhatsApp Number</th>
                    <th className="py-3 px-3.5">Notes / Details</th>
                    <th className="py-3 px-3.5">Added Date</th>
                    <th className="py-3 px-3.5 text-center">Send WhatsApp</th>
                    <th className="py-3 px-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {filteredContacts.map((contact) => {
                    const id = contact.id || contact.phone;
                    const isSelected = selectedContactIds.includes(id);

                    return (
                      <tr
                        key={id}
                        className={`hover:bg-blue-50/30 transition-colors ${
                          isSelected ? "bg-blue-50/40" : ""
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-2.5 px-3.5 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(id)}
                            className="w-4 h-4 rounded-[4px] text-[#0B4FBA] focus:ring-[#0B4FBA] border-gray-300 cursor-pointer"
                          />
                        </td>

                        {/* Name & Avatar */}
                        <td className="py-2.5 px-3.5">
                          <div className="flex items-center space-x-2.5">
                            <div
                              className={`w-8 h-8 rounded-[6px] flex items-center justify-center font-bold text-[11px] shrink-0 ${avatarColor(
                                contact.name
                              )}`}
                            >
                              {getInitials(contact.name)}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900 hover:text-[#0B4FBA] transition text-xs">
                                {contact.name}
                              </div>
                              <div className="text-[10px] text-gray-400">Client</div>
                            </div>
                          </div>
                        </td>

                        {/* WhatsApp Number */}
                        <td className="py-2.5 px-3.5 font-mono text-gray-700">
                          <div className="flex items-center space-x-1.5">
                            <span className="font-medium">{contact.phone}</span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(contact.phone);
                                showToast(`Copied ${contact.phone}`);
                              }}
                              title="Copy number"
                              className="text-gray-400 hover:text-gray-600 p-1 rounded-[6px] transition"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <a
                              href={`https://wa.me/${cleanPhone(contact.phone)}`}
                              target="_blank"
                              rel="noreferrer"
                              title="Direct WhatsApp link"
                              className="text-emerald-500 hover:text-emerald-700 p-1 rounded-[6px] transition"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </td>

                        {/* Notes */}
                        <td className="py-2.5 px-3.5 text-gray-600 max-w-xs truncate">
                          {contact.notes ? (
                            <span className="text-[11px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded-[6px]">
                              {contact.notes}
                            </span>
                          ) : (
                            <span className="text-[11px] text-gray-400 italic">—</span>
                          )}
                        </td>

                        {/* Date */}
                        <td className="py-2.5 px-3.5 text-[11px] text-gray-500">
                          {contact.createdAt
                            ? new Date(contact.createdAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : "Recent"}
                        </td>

                        {/* SEND WHATSAPP MESSAGE BUTTON (Height 38px, rounded 6px) */}
                        <td className="py-2.5 px-3.5 text-center">
                          <button
                            onClick={() => handleOpenSendModal(contact)}
                            className="inline-flex items-center space-x-1.5 h-[34px] px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-medium text-xs rounded-[6px] shadow-2xs transition-all"
                            title={`Send WhatsApp message to ${contact.name}`}
                          >
                            <svg
                              viewBox="0 0 24 24"
                              className="w-3.5 h-3.5 fill-current shrink-0"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path d="M17.472 14.382c-.301-.15-1.78-.877-2.056-.977-.275-.101-.476-.15-.676.15-.201.3-.777.978-.952 1.178-.176.2-.351.226-.652.075-.3-.15-1.267-.467-2.414-1.488-.893-.796-1.496-1.78-1.671-2.08-.176-.3-.019-.463.132-.613.135-.135.301-.351.451-.527.151-.175.201-.3.302-.501.1-.2.05-.376-.025-.526-.075-.15-.677-1.631-.928-2.235-.244-.588-.493-.509-.677-.518l-.577-.01c-.2 0-.527.075-.802.375-.276.3-1.053 1.029-1.053 2.508s1.078 2.906 1.229 3.107c.15.2 2.121 3.24 5.138 4.542.718.31 1.278.496 1.715.635.722.23 1.378.197 1.898.12.579-.088 1.78-.727 2.03-1.429.251-.702.251-1.303.176-1.429-.075-.125-.276-.201-.577-.351z" />
                              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.115.548 4.101 1.508 5.835L.234 23.243a.75.75 0 00.923.923l5.408-1.274A11.947 11.947 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.946 9.946 0 01-5.074-1.391l-.364-.216-3.774.889.889-3.774-.216-.364A9.948 9.948 0 012 12c0-5.514 4.486-10 10-10s10 4.486 10 10-4.486 10-10 10z" />
                            </svg>
                            <span>WhatsApp</span>
                          </button>
                        </td>

                        {/* Actions (Edit / Delete) */}
                        <td className="py-2.5 px-3.5 text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              onClick={() => handleOpenEdit(contact)}
                              className="h-[32px] w-[32px] flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-[6px] transition"
                              title="Edit Contact"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingContact(contact)}
                              className="h-[32px] w-[32px] flex items-center justify-center text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-[6px] transition"
                              title="Delete Contact"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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

        {/* ════════════════ MODAL 1: ADD / EDIT CONTACT ════════════════ */}
        {isAddEditOpen && (
          <AddEditContactModal
            existingContact={editingContact}
            onClose={() => setIsAddEditOpen(false)}
            onSaved={(saved) => {
              setIsAddEditOpen(false);
              loadContacts();
              showToast(
                editingContact
                  ? `Contact "${saved.name}" updated successfully`
                  : `Contact "${saved.name}" saved successfully`
              );
            }}
          />
        )}

        {/* ════════════════ MODAL 2: SEND WHATSAPP MESSAGE (SINGLE) ════════════════ */}
        {isSendModalOpen && activeContactForMessage && (
          <SendMessageModal
            contact={activeContactForMessage}
            onClose={() => {
              setIsSendModalOpen(false);
              setActiveContactForMessage(null);
            }}
            onSent={() => {
              setIsSendModalOpen(false);
              setActiveContactForMessage(null);
              showToast(`WhatsApp message sent to ${activeContactForMessage.name}!`);
            }}
          />
        )}

        {/* ════════════════ MODAL 3: BULK SEND WHATSAPP ════════════════ */}
        {isBulkSendOpen && (
          <BulkSendModal
            allContacts={contacts}
            initialSelectedIds={selectedContactIds}
            onClose={() => setIsBulkSendOpen(false)}
            onComplete={(sentCount) => {
              setIsBulkSendOpen(false);
              showToast(`Bulk send completed: sent to ${sentCount} client(s)!`);
            }}
          />
        )}

        {/* ════════════════ MODAL 4: CONFIRM DELETE ════════════════ */}
        {deletingContact && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[6px] max-w-sm w-full p-5 space-y-4 shadow-2xl border border-gray-200 animate-in zoom-in-95">
              <div className="w-10 h-10 rounded-[6px] bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="text-center space-y-1">
                <h3 className="font-bold text-gray-900 text-base">Delete Client Contact</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Are you sure you want to remove{" "}
                  <strong className="text-gray-900">{deletingContact.name}</strong> (
                  {deletingContact.phone})? This action cannot be undone.
                </p>
              </div>
              <div className="flex space-x-2 pt-2">
                <button
                  onClick={() => setDeletingContact(null)}
                  className="flex-1 h-[38px] border border-gray-300 rounded-[6px] text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deletingContact)}
                  className="flex-1 h-[38px] bg-rose-600 hover:bg-rose-700 text-white rounded-[6px] text-xs font-semibold transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

/* ─────────────── SUB-COMPONENT: ADD / EDIT CONTACT MODAL ─────────────── */
function AddEditContactModal({
  existingContact,
  onClose,
  onSaved,
}: {
  existingContact: WhatsAppContact | null;
  onClose: () => void;
  onSaved: (contact: WhatsAppContact) => void;
}) {
  const [name, setName] = useState(existingContact?.name || "");
  const [country, setCountry] = useState(DEFAULT_COUNTRY);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [notes, setNotes] = useState(existingContact?.notes || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const nameInputId = useId();
  const phoneInputId = useId();
  const notesInputId = useId();

  // Pre-fill phone if editing
  useEffect(() => {
    if (existingContact?.phone) {
      let matchedCountry = COUNTRIES.find((c) => existingContact.phone.startsWith(c.dial));
      if (matchedCountry) {
        setCountry(matchedCountry);
        setPhoneNumber(existingContact.phone.slice(matchedCountry.dial.length));
      } else {
        setPhoneNumber(existingContact.phone.replace(/^\+/, ""));
      }
    }
  }, [existingContact]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter the client's name.");
      return;
    }

    const cleaned = cleanPhone(phoneNumber);
    if (!cleaned || cleaned.length < 7) {
      setError("Please enter a valid WhatsApp mobile number with digits.");
      return;
    }

    const fullPhone = country.dial + cleaned;

    setSaving(true);
    setError("");

    try {
      if (existingContact?.id) {
        await updateClientContact(existingContact.id, {
          name: name.trim(),
          phone: fullPhone,
          notes: notes.trim(),
        });
        onSaved({
          ...existingContact,
          name: name.trim(),
          phone: fullPhone,
          notes: notes.trim(),
        });
      } else {
        const created = await saveClientContact({
          name: name.trim(),
          phone: fullPhone,
          notes: notes.trim(),
        });
        onSaved(created);
      }
    } catch (err) {
      console.error("Save error:", err);
      setError("Failed to save contact. Please check your connection.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[6px] max-w-md w-full overflow-hidden shadow-2xl border border-gray-200 animate-in zoom-in-95">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#003680] to-[#0B4FBA] p-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-[6px] bg-white/15 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-base">
                {existingContact ? "Edit Client Contact" : "Add Client Contact"}
              </h2>
              <p className="text-[11px] text-blue-100">Store client name & WhatsApp number</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-[6px] transition text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-[6px] text-rose-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Client Name: h-[38px] & rounded-[6px] */}
          <div>
            <label htmlFor={nameInputId} className="block text-xs font-semibold text-gray-700 mb-1">
              Client Name <span className="text-rose-500">*</span>
            </label>
            <input
              id={nameInputId}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. John Doe / Pattabiram Sweets"
              required
              className="w-full h-[38px] px-3 bg-gray-50 border border-gray-300 rounded-[6px] text-xs focus:outline-none focus:ring-2 focus:ring-[#0B4FBA]/30 focus:border-[#0B4FBA] focus:bg-white transition"
            />
          </div>

          {/* WhatsApp Mobile Number: Dropdown & Input h-[38px] & rounded-[6px] */}
          <div>
            <label htmlFor={phoneInputId} className="block text-xs font-semibold text-gray-700 mb-1">
              WhatsApp Mobile Number <span className="text-rose-500">*</span>
            </label>
            <div className="flex space-x-2">
              <select
                value={country.code}
                onChange={(e) => {
                  const match = COUNTRIES.find((c) => c.code === e.target.value);
                  if (match) setCountry(match);
                }}
                className="h-[38px] px-2.5 bg-gray-50 border border-gray-300 rounded-[6px] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0B4FBA]/30 focus:border-[#0B4FBA]"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.dial}
                  </option>
                ))}
              </select>
              <input
                id={phoneInputId}
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="9876543210 (digits only)"
                required
                className="flex-1 h-[38px] px-3 bg-gray-50 border border-gray-300 rounded-[6px] text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#0B4FBA]/30 focus:border-[#0B4FBA] focus:bg-white transition"
              />
            </div>
            <p className="text-[11px] text-gray-500 mt-1">
              Recipient: <span className="font-mono text-blue-700">{country.dial} {phoneNumber}</span>
            </p>
          </div>

          {/* Notes / Details: h-[38px] & rounded-[6px] */}
          <div>
            <label htmlFor={notesInputId} className="block text-xs font-semibold text-gray-700 mb-1">
              Notes / Business Details <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <input
              id={notesInputId}
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Wholesale customer, Bangalore"
              className="w-full h-[38px] px-3 bg-gray-50 border border-gray-300 rounded-[6px] text-xs focus:outline-none focus:ring-2 focus:ring-[#0B4FBA]/30 focus:border-[#0B4FBA] focus:bg-white transition"
            />
          </div>

          {/* Buttons: h-[38px] & rounded-[6px] */}
          <div className="flex space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-[38px] border border-gray-300 rounded-[6px] text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 h-[38px] bg-[#0B4FBA] hover:bg-[#003882] text-white rounded-[6px] text-xs font-semibold transition disabled:opacity-50 flex items-center justify-center space-x-1.5"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>{existingContact ? "Update Contact" : "Save Contact"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─────────────── SUB-COMPONENT: SEND WHATSAPP TEMPLATE MODAL (SINGLE) ─────────────── */
function SendMessageModal({
  contact,
  onClose,
  onSent,
}: {
  contact: WhatsAppContact;
  onClose: () => void;
  onSent: () => void;
}) {
  const [selectedTemplate, setSelectedTemplate] = useState("3p_direct_integration_test_template");
  const [customTemplateName, setCustomTemplateName] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [languageCode, setLanguageCode] = useState("en_US");
  const [customMessage, setCustomMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [apiResult, setApiResult] = useState<{ success: boolean; text: string } | null>(null);

  const activeTemplateName = isCustom ? customTemplateName.trim() : selectedTemplate;

  // Pre-configured preview descriptions
  const getPreviewText = () => {
    if (activeTemplateName === "3p_direct_integration_test_template") {
      return `Integration Test\n\nWelcome! This is a test message from the WhatsApp Business Platform. You have successfully configured your WhatsApp Business account and completed onboarding. You can now start sending messages to your customers.\n\nWhatsApp Business Platform`;
    }
    if (activeTemplateName === "message_to_customers") {
      return `Missed call\n\nHi ${contact.name}, we missed your call. Please let us know if you're available to reschedule.\n\n[ Reschedule Call ]`;
    }
    if (activeTemplateName === "customer_update_notification") {
      return `Hello ${contact.name}, please note the following update regarding our services: ${customMessage.trim() || "[Type your custom message in the box below]"}. Thank you for your cooperation and support.`;
    }
    if (customMessage.trim()) {
      return `Hi ${contact.name}, ${customMessage.trim()}`;
    }
    return `Hello ${contact.name}, [Template: ${activeTemplateName || "custom"}]`;
  };

  const handleSend = async () => {
    if (!activeTemplateName) {
      setApiResult({ success: false, text: "Please enter or select a template name." });
      return;
    }

    setSending(true);
    setApiResult(null);

    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: contact.phone,
          phone: contact.phone,
          name: contact.name,
          type: "template",
          templateName: activeTemplateName,
          languageCode: languageCode || "en_US",
          variables:
            activeTemplateName === "customer_update_notification"
              ? [contact.name, customMessage.trim() || ""]
              : undefined,
        }),
      });

      const data = await res.json();

      if (data.success) {
        await saveWhatsAppMessage({
          phone: contact.phone,
          contactName: contact.name,
          direction: "outbound",
          type: "template",
          message: customMessage.trim()
            ? `Template: ${activeTemplateName} | Hi ${contact.name}, ${customMessage.trim()}`
            : `Template: ${activeTemplateName} (Sent to ${contact.name})`,
          status: "sent",
          waMessageId: data.waMessageId || undefined,
          timestamp: new Date().toISOString(),
        });

        setApiResult({
          success: true,
          text: `Template "${activeTemplateName}" sent successfully!`,
        });

        setTimeout(() => {
          onSent();
        }, 1200);
      } else {
        const errorMsg =
          typeof data.error === "object"
            ? data.error?.message || JSON.stringify(data.error)
            : data.error || "Failed to send template message.";
        setApiResult({
          success: false,
          text: errorMsg,
        });
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Network error";
      setApiResult({
        success: false,
        text: `Failed to connect to WhatsApp API: ${errMsg}`,
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[6px] max-w-md w-full overflow-hidden shadow-2xl border border-gray-200 animate-in zoom-in-95">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 p-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-[6px] bg-white/20 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current text-white" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.472 14.382c-.301-.15-1.78-.877-2.056-.977-.275-.101-.476-.15-.676.15-.201.3-.777.978-.952 1.178-.176.2-.351.226-.652.075-.3-.15-1.267-.467-2.414-1.488-.893-.796-1.496-1.78-1.671-2.08-.176-.3-.019-.463.132-.613.135-.135.301-.351.451-.527.151-.175.201-.3.302-.501.1-.2.05-.376-.025-.526-.075-.15-.677-1.631-.928-2.235-.244-.588-.493-.509-.677-.518l-.577-.01c-.2 0-.527.075-.802.375-.276.3-1.053 1.029-1.053 2.508s1.078 2.906 1.229 3.107c.15.2 2.121 3.24 5.138 4.542.718.31 1.278.496 1.715.635.722.23 1.378.197 1.898.12.579-.088 1.78-.727 2.03-1.429.251-.702.251-1.303.176-1.429-.075-.125-.276-.201-.577-.351z" />
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.115.548 4.101 1.508 5.835L.234 23.243a.75.75 0 00.923.923l5.408-1.274A11.947 11.947 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.946 9.946 0 01-5.074-1.391l-.364-.216-3.774.889.889-3.774-.216-.364A9.948 9.948 0 012 12c0-5.514 4.486-10 10-10s10 4.486 10 10-4.486 10-10 10z" />
              </svg>
            </div>
            <div>
              <h2 className="font-medium text-sm">Send WhatsApp Template</h2>
              <p className="text-[11px] text-emerald-100">
                To: <span className="font-medium text-white">{contact.name}</span> ({contact.phone})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-[6px] transition text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Template Selection & Preview */}
        <div className="p-5 space-y-3.5">
          {/* Template Selection */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Select Approved Template <span className="text-rose-500">*</span>
            </label>
            <select
              value={isCustom ? "custom" : selectedTemplate}
              onChange={(e) => {
                if (e.target.value === "custom") {
                  setIsCustom(true);
                } else {
                  setIsCustom(false);
                  setSelectedTemplate(e.target.value);
                  setLanguageCode(e.target.value === "holiday_notification" ? "en" : "en_US");
                }
              }}
              className="w-full h-[34px] px-2.5 bg-gray-50 border border-gray-300 rounded-[6px] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600"
            >
              <option value="3p_direct_integration_test_template">3p_direct_integration_test_template (en_US · Live Approved)</option>
              <option value="message_to_customers">message_to_customers (en_US · Missed Call Template)</option>
              <option value="customer_update_notification">customer_update_notification (en_US · Custom Update)</option>
              <option value="custom">Other / Custom Template Name...</option>
            </select>
          </div>

          {/* Custom Template Name Input if selected */}
          {isCustom && (
            <div className="space-y-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Template Name (as in Meta WhatsApp Manager)
                </label>
                <input
                  type="text"
                  value={customTemplateName}
                  onChange={(e) => setCustomTemplateName(e.target.value)}
                  placeholder="e.g. holiday_notification"
                  className="w-full h-[34px] px-3 bg-gray-50 border border-gray-300 rounded-[6px] text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 focus:bg-white transition"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Language Code
                </label>
                <input
                  type="text"
                  value={languageCode}
                  onChange={(e) => setLanguageCode(e.target.value)}
                  placeholder="en_US or en"
                  className="w-full h-[34px] px-3 bg-gray-50 border border-gray-300 rounded-[6px] text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 focus:bg-white transition"
                />
              </div>
            </div>
          )}

          {/* Optional Editable Message after {{1}} (Variable {{2}}) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-gray-700">
                Message after {"{{1}}"} (Variable {"{{2}}"})
              </label>
              <span className="text-[10px] text-gray-400 font-normal">Optional · For templates with {"{{2}}"}</span>
            </div>
            <input
              type="text"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="e.g. tomorrow is a holiday due to Ganesh Chaturthi. Our team will resume work on Monday."
              className="w-full h-[34px] px-3 bg-gray-50 border border-gray-300 rounded-[6px] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 focus:bg-white transition"
            />
          </div>

          {/* Template Live Preview */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Template Message Preview:
            </label>
            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-[6px] text-xs text-gray-800 leading-relaxed font-sans shadow-2xs">
              <div className="flex items-center space-x-1.5 text-emerald-800 font-medium text-[11px] mb-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Meta Approved Cloud API Template</span>
              </div>
              <p className="text-gray-900 whitespace-pre-wrap">{getPreviewText()}</p>
              {activeTemplateName === "message_to_customers" ? (
                <div className="text-[10px] text-gray-500 mt-2 font-mono">
                  Static template · No variables in body
                </div>
              ) : (
                <div className="text-[10px] text-gray-500 mt-2 font-mono space-y-0.5">
                  <div>Variable {"{{1}}"} &rarr; <strong className="text-emerald-700">{contact.name}</strong></div>
                  {customMessage.trim() && (
                    <div>Variable {"{{2}}"} &rarr; <strong className="text-emerald-700">{customMessage.trim()}</strong></div>
                  )}
                </div>
              )}
            </div>
          </div>

          {apiResult && (
            <div
              className={`p-2.5 rounded-[6px] border text-xs flex items-center space-x-2 ${
                apiResult.success
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-rose-50 border-rose-200 text-rose-800"
              }`}
            >
              {apiResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{apiResult.text}</span>
            </div>
          )}

          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="h-[34px] px-4 border border-gray-300 rounded-[6px] text-xs font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={sending || !activeTemplateName}
              onClick={handleSend}
              className="h-[34px] px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[6px] text-xs font-medium shadow-2xs transition disabled:opacity-50 flex items-center space-x-1.5"
            >
              {sending ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Sending Template...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Template</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────── SUB-COMPONENT: BULK SEND MODAL ─────────────── */
function BulkSendModal({
  allContacts,
  initialSelectedIds,
  onClose,
  onComplete,
}: {
  allContacts: WhatsAppContact[];
  initialSelectedIds: string[];
  onClose: () => void;
  onComplete: (sentCount: number) => void;
}) {
  const [recipientTarget, setRecipientTarget] = useState<"all" | "selected">(
    initialSelectedIds.length > 0 ? "selected" : "all"
  );
  const [selectedIds, setSelectedIds] = useState<string[]>(
    initialSelectedIds.length > 0 ? initialSelectedIds : allContacts.map((c) => c.id || c.phone)
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("3p_direct_integration_test_template");
  const [languageCode, setLanguageCode] = useState("en_US");
  const [customMessage, setCustomMessage] = useState("");

  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, successes: 0, failures: 0 });
  const [logs, setLogs] = useState<{ name: string; phone: string; status: "success" | "error"; error?: string }[]>([]);

  // Resolve target contacts
  const targetContacts =
    recipientTarget === "all"
      ? allContacts
      : allContacts.filter((c) => selectedIds.includes(c.id || c.phone));

  // Toggle selection
  const handleToggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Select all / deselect in modal
  const handleSelectAllModal = () => {
    if (selectedIds.length === allContacts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(allContacts.map((c) => c.id || c.phone));
    }
  };

  // Filtered contacts in the selector table
  const filteredList = allContacts.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm)
  );

  // Execute Bulk Send using Template
  const handleExecuteBulkSend = async () => {
    if (targetContacts.length === 0) return;

    setSending(true);
    setProgress({ current: 0, total: targetContacts.length, successes: 0, failures: 0 });
    setLogs([]);

    let successes = 0;
    let failures = 0;

    for (let i = 0; i < targetContacts.length; i++) {
      const contact = targetContacts[i];
      setProgress({
        current: i + 1,
        total: targetContacts.length,
        successes,
        failures,
      });

      try {
        const payload = {
          to: contact.phone,
          phone: contact.phone,
          name: contact.name,
          type: "template",
          templateName: selectedTemplate,
          languageCode: languageCode || "en_US",
          variables:
            selectedTemplate === "customer_update_notification"
              ? [contact.name, customMessage.trim() || ""]
              : undefined,
        };

        const res = await fetch("/api/whatsapp/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (data.success) {
          successes++;
          await saveWhatsAppMessage({
            phone: contact.phone,
            contactName: contact.name,
            direction: "outbound",
            type: "template",
            message: customMessage.trim()
              ? `Template: ${selectedTemplate} | Hi ${contact.name}, ${customMessage.trim()}`
              : `Template: ${selectedTemplate} (Sent to ${contact.name})`,
            status: "sent",
            waMessageId: data.waMessageId || undefined,
            timestamp: new Date().toISOString(),
          });
          setLogs((prev) => [
            { name: contact.name, phone: contact.phone, status: "success" },
            ...prev,
          ]);
        } else {
          failures++;
          const errorMsg =
            typeof data.error === "object"
              ? data.error?.message || JSON.stringify(data.error)
              : data.error || "Meta API error";
          setLogs((prev) => [
            {
              name: contact.name,
              phone: contact.phone,
              status: "error",
              error: errorMsg,
            },
            ...prev,
          ]);
        }
      } catch (err: unknown) {
        failures++;
        const errMsg = err instanceof Error ? err.message : "Network error";
        setLogs((prev) => [
          {
            name: contact.name,
            phone: contact.phone,
            status: "error",
            error: errMsg,
          },
          ...prev,
        ]);
      }

      // Delay between requests to avoid Meta rate limits
      if (i < targetContacts.length - 1) {
        await new Promise((r) => setTimeout(r, 400));
      }
    }

    setProgress({
      current: targetContacts.length,
      total: targetContacts.length,
      successes,
      failures,
    });
    setSending(false);

    if (successes > 0) {
      setTimeout(() => {
        onComplete(successes);
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-[6px] max-w-xl w-full overflow-hidden shadow-2xl border border-gray-200 my-6 animate-in zoom-in-95">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-[#0B4FBA] p-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-[6px] bg-white/20 flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-medium text-base">Bulk Send WhatsApp Template</h2>
              <p className="text-[11px] text-blue-100">Broadcast approved template to all or selected clients</p>
            </div>
          </div>
          {!sending && (
            <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-[6px] transition text-white">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {/* Recipient Audience Chooser */}
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-gray-700">Choose Recipients:</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={sending}
                onClick={() => setRecipientTarget("all")}
                className={`p-2.5 rounded-[6px] border text-left transition flex items-center space-x-2.5 ${
                  recipientTarget === "all"
                    ? "bg-blue-50 border-[#0B4FBA] text-[#0B4FBA]"
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <div className="w-7 h-7 rounded-[6px] bg-blue-100 text-[#0B4FBA] flex items-center justify-center font-medium text-xs">
                  {allContacts.length}
                </div>
                <div>
                  <div className="font-medium text-xs">All Clients</div>
                  <div className="text-[11px] text-gray-500">{allContacts.length} contacts</div>
                </div>
              </button>

              <button
                type="button"
                disabled={sending}
                onClick={() => setRecipientTarget("selected")}
                className={`p-2.5 rounded-[6px] border text-left transition flex items-center space-x-2.5 ${
                  recipientTarget === "selected"
                    ? "bg-emerald-50 border-emerald-600 text-emerald-800"
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <div className="w-7 h-7 rounded-[6px] bg-emerald-100 text-emerald-800 flex items-center justify-center font-medium text-xs">
                  {selectedIds.length}
                </div>
                <div>
                  <div className="font-medium text-xs">Selected Clients</div>
                  <div className="text-[11px] text-gray-500">{selectedIds.length} chosen</div>
                </div>
              </button>
            </div>
          </div>

          {/* If Selected: Client Selection Table */}
          {recipientTarget === "selected" && (
            <div className="border border-gray-200 rounded-[6px] p-2.5 bg-gray-50/50 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter client list..."
                  className="h-[34px] px-2.5 bg-white border border-gray-300 rounded-[6px] text-xs w-full max-w-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={handleSelectAllModal}
                  className="h-[34px] px-2.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-[6px] hover:bg-gray-50 shrink-0 flex items-center"
                >
                  {selectedIds.length === allContacts.length ? "Deselect All" : "Select All"}
                </button>
              </div>

              <div className="max-h-32 overflow-y-auto divide-y divide-gray-100 bg-white rounded-[6px] border border-gray-200 text-xs">
                {filteredList.map((c) => {
                  const id = c.id || c.phone;
                  const isChecked = selectedIds.includes(id);

                  return (
                    <label
                      key={id}
                      className="flex items-center space-x-2 px-2.5 py-1.5 hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggle(id)}
                        className="w-3.5 h-3.5 rounded-[4px] text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="font-medium text-gray-800">{c.name}</span>
                      <span className="text-gray-500 font-mono text-[11px]">{c.phone}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Template Selection for Broadcast */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-700">
              Select Approved WhatsApp Template:
            </label>
            <select
              value={selectedTemplate}
              onChange={(e) => {
                setSelectedTemplate(e.target.value);
                setLanguageCode("en_US");
              }}
              disabled={sending}
              className="w-full h-[34px] px-2.5 bg-gray-50 border border-gray-300 rounded-[6px] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600"
            >
              <option value="3p_direct_integration_test_template">3p_direct_integration_test_template (en_US · Live Approved)</option>
              <option value="message_to_customers">message_to_customers (en_US · Missed Call Template)</option>
              <option value="customer_update_notification">customer_update_notification (en_US · Custom Update)</option>
            </select>

            {/* Optional Editable Message after {{1}} (Variable {{2}}) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-gray-700">
                  Message after {"{{1}}"} (Variable {"{{2}}"})
                </label>
                <span className="text-[10px] text-gray-400 font-normal">Optional · For templates with {"{{2}}"}</span>
              </div>
              <input
                type="text"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="e.g. tomorrow is a holiday due to Ganesh Chaturthi. Our team will resume work on Monday."
                disabled={sending}
                className="w-full h-[34px] px-3 bg-gray-50 border border-gray-300 rounded-[6px] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 focus:bg-white transition"
              />
            </div>

            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-[6px] text-xs text-gray-800 leading-relaxed font-sans shadow-2xs">
              <div className="flex items-center space-x-1.5 text-emerald-800 font-medium text-[11px] mb-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Meta Approved Cloud API Template</span>
              </div>
              <p className="text-gray-900 whitespace-pre-wrap">
                {selectedTemplate === "3p_direct_integration_test_template"
                  ? "Integration Test\n\nWelcome! This is a test message from the WhatsApp Business Platform. You have successfully configured your WhatsApp Business account and completed onboarding. You can now start sending messages to your customers.\n\nWhatsApp Business Platform"
                  : selectedTemplate === "message_to_customers"
                  ? "Missed call\n\nHi {{Client Name}}, we missed your call. Please let us know if you're available to reschedule.\n\n[ Reschedule Call ]"
                  : customMessage.trim()
                  ? `Hello {{Client Name}}, please note the following update regarding our services: ${customMessage.trim()}. Thank you for your cooperation and support.`
                  : "Hello {{Client Name}}, please note the following update regarding our services: [Type custom message]. Thank you for your cooperation and support."}
              </p>
              {selectedTemplate === "message_to_customers" ? (
                <div className="text-[10px] text-gray-500 mt-2 font-mono">
                  Static template · No variables in body
                </div>
              ) : (
                <div className="text-[10px] text-gray-500 mt-2 font-mono space-y-0.5">
                  <div>Variable {"{{1}}"} will be automatically filled with each recipient's name.</div>
                  {customMessage.trim() && (
                    <div>Variable {"{{2}}"} will be set to: <strong className="text-emerald-700">{customMessage.trim()}</strong></div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Progress / Live status */}
          {sending && (
            <div className="space-y-1.5 p-3 bg-gray-50 border border-gray-200 rounded-[6px]">
              <div className="flex justify-between text-xs font-medium text-gray-700">
                <span>Sending WhatsApp Template Messages...</span>
                <span>
                  {progress.current} / {progress.total}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-[6px] h-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-2 transition-all duration-300 rounded-[6px]"
                  style={{
                    width: `${(progress.current / Math.max(1, progress.total)) * 100}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-gray-500">
                <span className="text-emerald-600 font-medium">✓ {progress.successes} successful</span>
                <span className="text-rose-600 font-medium">✗ {progress.failures} failed</span>
              </div>
            </div>
          )}

          {/* Completed summary logs */}
          {!sending && logs.length > 0 && (
            <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-[6px] space-y-1.5">
              <div className="text-xs font-medium text-gray-800 flex items-center justify-between">
                <span>Broadcast Summary:</span>
                <span className="text-emerald-700 font-medium">
                  {progress.successes} Sent / {progress.failures} Failed
                </span>
              </div>
              <div className="max-h-24 overflow-y-auto divide-y divide-gray-100 text-xs">
                {logs.map((l, idx) => (
                  <div key={idx} className="py-0.5 flex items-center justify-between">
                    <span className="text-gray-800 font-medium">{l.name} ({l.phone})</span>
                    {l.status === "success" ? (
                      <span className="text-emerald-600 font-medium text-[11px]">✓ Sent</span>
                    ) : (
                      <span className="text-rose-600 text-[11px]" title={l.error}>
                        ✗ {l.error || "Failed"}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={sending}
              className="flex-1 h-[34px] border border-gray-300 rounded-[6px] text-xs font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleExecuteBulkSend}
              disabled={sending || targetContacts.length === 0}
              className="flex-1 h-[34px] bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-[6px] text-xs font-medium shadow-2xs transition disabled:opacity-50 flex items-center justify-center space-x-1.5"
            >
              {sending ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Broadcasting ({progress.current}/{progress.total})...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Template to {targetContacts.length} Clients</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
