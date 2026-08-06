"use client";

import { useEffect, useRef, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import {
  getWhatsAppContacts,
  getAllWhatsAppConversations,
  saveWhatsAppContact,
  saveWhatsAppMessage,
  updateWhatsAppContact,
  deleteWhatsAppContact,
  updateWhatsAppMessageStatus,
  WhatsAppContact,
  WhatsAppMessage,
  db,
} from "@/lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  Unsubscribe,
} from "firebase/firestore";
import {
  MessageCircle,
  Search,
  Plus,
  Send,
  Phone,
  User,
  UserPlus,
  CheckCheck,
  Check,
  Clock,
  X,
  ChevronDown,
  Trash2,
  Edit3,
  MoreVertical,
  AlertCircle,
  Smile,
  Paperclip,
  Star,
  Hash,
} from "lucide-react";

/* ─────────────── helpers ─────────────── */
function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function avatarColor(phone: string) {
  const colors = [
    "bg-violet-500", "bg-blue-500", "bg-emerald-500",
    "bg-amber-500", "bg-rose-500", "bg-cyan-500", "bg-pink-500",
  ];
  const idx = phone.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length;
  return colors[idx];
}

function normalizePhone(raw: string): string {
  let s = raw.trim().replace(/[\s\-().]/g, "");
  if (!s.startsWith("+")) s = "+" + s;
  return s;
}

function isValidPhone(p: string) {
  return /^\+[1-9]\d{6,14}$/.test(p);
}

/* ─────────────── Country data ─────────────── */
const COUNTRIES = [
  { code: "IN", name: "India",              dial: "+91",  flag: "🇮🇳" },
  { code: "US", name: "United States",       dial: "+1",   flag: "🇺🇸" },
  { code: "GB", name: "United Kingdom",      dial: "+44",  flag: "🇬🇧" },
  { code: "AE", name: "UAE",                 dial: "+971", flag: "🇦🇪" },
  { code: "SA", name: "Saudi Arabia",        dial: "+966", flag: "🇸🇦" },
  { code: "AU", name: "Australia",           dial: "+61",  flag: "🇦🇺" },
  { code: "CA", name: "Canada",              dial: "+1",   flag: "🇨🇦" },
  { code: "SG", name: "Singapore",           dial: "+65",  flag: "🇸🇬" },
  { code: "MY", name: "Malaysia",            dial: "+60",  flag: "🇲🇾" },
  { code: "PK", name: "Pakistan",            dial: "+92",  flag: "🇵🇰" },
  { code: "BD", name: "Bangladesh",          dial: "+880", flag: "🇧🇩" },
  { code: "LK", name: "Sri Lanka",           dial: "+94",  flag: "🇱🇰" },
  { code: "NP", name: "Nepal",              dial: "+977", flag: "🇳🇵" },
  { code: "DE", name: "Germany",             dial: "+49",  flag: "🇩🇪" },
  { code: "FR", name: "France",              dial: "+33",  flag: "🇫🇷" },
  { code: "IT", name: "Italy",               dial: "+39",  flag: "🇮🇹" },
  { code: "NL", name: "Netherlands",         dial: "+31",  flag: "🇳🇱" },
  { code: "CH", name: "Switzerland",         dial: "+41",  flag: "🇨🇭" },
  { code: "SE", name: "Sweden",              dial: "+46",  flag: "🇸🇪" },
  { code: "NO", name: "Norway",              dial: "+47",  flag: "🇳🇴" },
  { code: "DK", name: "Denmark",             dial: "+45",  flag: "🇩🇰" },
  { code: "JP", name: "Japan",               dial: "+81",  flag: "🇯🇵" },
  { code: "CN", name: "China",               dial: "+86",  flag: "🇨🇳" },
  { code: "KR", name: "South Korea",         dial: "+82",  flag: "🇰🇷" },
  { code: "ID", name: "Indonesia",           dial: "+62",  flag: "🇮🇩" },
  { code: "PH", name: "Philippines",         dial: "+63",  flag: "🇵🇭" },
  { code: "TH", name: "Thailand",            dial: "+66",  flag: "🇹🇭" },
  { code: "VN", name: "Vietnam",             dial: "+84",  flag: "🇻🇳" },
  { code: "BR", name: "Brazil",              dial: "+55",  flag: "🇧🇷" },
  { code: "MX", name: "Mexico",              dial: "+52",  flag: "🇲🇽" },
  { code: "AR", name: "Argentina",           dial: "+54",  flag: "🇦🇷" },
  { code: "ZA", name: "South Africa",        dial: "+27",  flag: "🇿🇦" },
  { code: "NG", name: "Nigeria",             dial: "+234", flag: "🇳🇬" },
  { code: "KE", name: "Kenya",               dial: "+254", flag: "🇰🇪" },
  { code: "EG", name: "Egypt",               dial: "+20",  flag: "🇪🇬" },
  { code: "QA", name: "Qatar",               dial: "+974", flag: "🇶🇦" },
  { code: "KW", name: "Kuwait",              dial: "+965", flag: "🇰🇼" },
  { code: "BH", name: "Bahrain",             dial: "+973", flag: "🇧🇭" },
  { code: "OM", name: "Oman",                dial: "+968", flag: "🇴🇲" },
  { code: "TR", name: "Turkey",              dial: "+90",  flag: "🇹🇷" },
  { code: "RU", name: "Russia",              dial: "+7",   flag: "🇷🇺" },
  { code: "NZ", name: "New Zealand",         dial: "+64",  flag: "🇳🇿" },
];
const DEFAULT_COUNTRY = COUNTRIES[0]; // India

/* ─────────────── Country Picker component ─────────────── */
function CountryPicker({
  selected,
  onChange,
}: {
  selected: typeof COUNTRIES[0];
  onChange: (c: typeof COUNTRIES[0]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function outside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, []);

  const filtered = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(q.toLowerCase()) ||
      c.dial.includes(q) ||
      c.code.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => { setOpen((v) => !v); setQ(""); }}
        className="flex items-center space-x-1.5 px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors min-w-[100px] h-full"
      >
        <span className="text-xl leading-none">{selected.flag}</span>
        <span className="text-sm font-semibold text-gray-700">{selected.dial}</span>
        <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 bg-white rounded-xl shadow-2xl border border-gray-200 w-64 z-50 overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-gray-400" />
              <input
                autoFocus
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search country..."
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B4FBA]/20"
              />
            </div>
          </div>
          {/* List */}
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-400">No results</div>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.code + c.dial}
                  type="button"
                  onClick={() => { onChange(c); setOpen(false); }}
                  className={`w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-blue-50 transition-colors ${
                    selected.code === c.code && selected.dial === c.dial ? "bg-blue-50 text-[#0B4FBA]" : "text-gray-700"
                  }`}
                >
                  <span className="text-xl leading-none w-7 shrink-0">{c.flag}</span>
                  <span className="flex-1 text-sm font-medium truncate">{c.name}</span>
                  <span className="text-xs font-mono text-gray-400 shrink-0">{c.dial}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

type ConversationSummary = {
  phone: string;
  contactName: string;
  lastMessage: string;
  lastAt: string;
  unread: number;
  contact?: WhatsAppContact;
};

/* ─────────────── status icon ─────────────── */
function StatusIcon({ status }: { status: WhatsAppMessage["status"] }) {
  if (status === "read") return <CheckCheck className="w-3.5 h-3.5 text-blue-400" />;
  if (status === "delivered") return <CheckCheck className="w-3.5 h-3.5 text-gray-400" />;
  if (status === "sent") return <Check className="w-3.5 h-3.5 text-gray-400" />;
  if (status === "sending") return <Clock className="w-3.5 h-3.5 text-gray-300 animate-spin" />;
  if (status === "failed") return <AlertCircle className="w-3.5 h-3.5 text-rose-400" />;
  return null;
}

/* ─────────────── Save Contact Modal ─────────────── */
function SaveContactModal({
  phone,
  existingContact,
  onSave,
  onClose,
}: {
  phone: string;
  existingContact?: WhatsAppContact;
  onSave: (c: WhatsAppContact) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(existingContact?.name || "");
  const [notes, setNotes] = useState(existingContact?.notes || "");
  const [saving, setSaving] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    let saved: WhatsAppContact;
    if (existingContact?.id) {
      await updateWhatsAppContact(existingContact.id, { name: name.trim(), notes });
      saved = { ...existingContact, name: name.trim(), notes };
    } else {
      saved = await saveWhatsAppContact({ name: name.trim(), phone, notes });
    }
    onSave(saved);
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="bg-gradient-to-r from-[#003680] to-[#0B4FBA] p-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-lg">
                  {existingContact ? "Edit Contact" : "Save Contact"}
                </h2>
                <p className="text-blue-100 text-xs">{phone}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <form onSubmit={handleSave} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Contact Name <span className="text-rose-500">*</span>
            </label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0B4FBA]/30 focus:border-[#0B4FBA]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Phone Number
            </label>
            <input
              type="text"
              value={phone}
              disabled
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes..."
              rows={2}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0B4FBA]/30 focus:border-[#0B4FBA] resize-none"
            />
          </div>
          <div className="flex space-x-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="flex-1 px-4 py-2.5 bg-[#0B4FBA] hover:bg-[#003882] text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {saving ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>{existingContact ? "Update" : "Save Contact"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─────────────── New Chat Modal ─────────────── */
function NewChatModal({
  contacts,
  onSelectContact,
  onStartNew,
  onClose,
}: {
  contacts: WhatsAppContact[];
  onSelectContact: (c: WhatsAppContact) => void;
  onStartNew: (phone: string) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const [localNumber, setLocalNumber] = useState("");
  const [country, setCountry] = useState(DEFAULT_COUNTRY);
  const [phoneError, setPhoneError] = useState("");

  const filtered = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  function buildFullPhone() {
    // strip all non-digits from local number input
    const digits = localNumber.replace(/\D/g, "");
    return country.dial + digits;
  }

  function handleNewNumber() {
    const full = buildFullPhone();
    if (!isValidPhone(full)) {
      setPhoneError("Enter a valid local number (digits only, no country code).");
      return;
    }
    setPhoneError("");
    onStartNew(full);
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#003680] to-[#0B4FBA] p-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-lg">New Message</h2>
                <p className="text-blue-100 text-xs">Start a conversation</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Phone number input with country picker */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Enter Phone Number
            </label>

            {/* Country + Number row */}
            <div className="flex space-x-2">
              {/* Country Code Picker */}
              <CountryPicker selected={country} onChange={(c) => { setCountry(c); setPhoneError(""); }} />

              {/* Local number */}
              <input
                type="tel"
                autoFocus
                value={localNumber}
                onChange={(e) => { setLocalNumber(e.target.value); setPhoneError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleNewNumber()}
                placeholder="98765 43210"
                className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0B4FBA]/30 focus:border-[#0B4FBA]"
              />

              {/* Chat button */}
              <button
                type="button"
                onClick={handleNewNumber}
                disabled={!localNumber.trim()}
                className="px-4 py-2.5 bg-[#0B4FBA] hover:bg-[#003882] disabled:opacity-40 text-white rounded-lg text-sm font-semibold transition-colors shrink-0"
              >
                Chat
              </button>
            </div>

            {/* Full number preview */}
            {localNumber.trim() && (
              <div className="mt-2 flex items-center space-x-1.5 text-xs text-gray-500">
                <span className="text-base">{country.flag}</span>
                <span>Full number:</span>
                <span className="font-mono font-semibold text-[#0B4FBA]">{buildFullPhone()}</span>
              </div>
            )}

            {phoneError && (
              <p className="text-xs text-rose-500 mt-1.5 flex items-center space-x-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{phoneError}</span>
              </p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">or choose a contact</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Search contacts */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contacts..."
              className="w-full pl-8 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0B4FBA]/30"
            />
          </div>

          <div className="max-h-52 overflow-y-auto space-y-1 -mx-1 px-1">
            {filtered.length === 0 ? (
              <div className="text-center py-8 text-xs text-gray-400">
                <User className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>No contacts found</p>
              </div>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onSelectContact(c)}
                  className="w-full flex items-center space-x-3 p-2.5 rounded-lg hover:bg-blue-50 transition-colors text-left group"
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold ${avatarColor(c.phone)}`}>
                    {getInitials(c.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-gray-900 group-hover:text-[#0B4FBA] truncate">{c.name}</div>
                    <div className="text-xs text-gray-500 font-mono">{c.phone}</div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────── Main Page ─────────────── */
export default function MessagesPage() {
  const [contacts, setContacts] = useState<WhatsAppContact[]>([]);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activePhone, setActivePhone] = useState<string | null>(null);
  const [activeContact, setActiveContact] = useState<WhatsAppContact | null>(null);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showSaveContact, setShowSaveContact] = useState(false);
  const [showContactMenu, setShowContactMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [apiError, setApiError] = useState("");
  const [isLive, setIsLive] = useState(false); // real-time listener connected
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const contactMenuRef = useRef<HTMLDivElement>(null);
  const msgUnsubRef = useRef<Unsubscribe | null>(null);
  const convUnsubRef = useRef<Unsubscribe | null>(null);
  const contactsRef = useRef<WhatsAppContact[]>([]);

  /* ── Build sidebar conversation list ── */
  function buildConversationList(
    allContacts: WhatsAppContact[],
    allMessages: WhatsAppMessage[]
  ) {
    const map = new Map<string, ConversationSummary>();
    const sorted = [...allMessages].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    for (const msg of sorted) {
      if (!map.has(msg.phone)) {
        const contact = allContacts.find((c) => c.phone === msg.phone);
        const unread = allMessages.filter(
          (m) => m.phone === msg.phone && m.direction === "inbound" && m.status !== "read"
        ).length;
        map.set(msg.phone, {
          phone: msg.phone,
          contactName: contact?.name || msg.contactName || msg.phone,
          lastMessage: msg.direction === "inbound" ? `↩ ${msg.message}` : msg.message,
          lastAt: msg.timestamp,
          unread,
          contact,
        });
      }
    }
    setConversations(Array.from(map.values()));
  }

  /* ── Bootstrap: load contacts, then start real-time conversation listener ── */
  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      setLoading(true);
      try {
        const allContacts = await getWhatsAppContacts();
        if (!mounted) return;
        contactsRef.current = allContacts;
        setContacts(allContacts);
      } catch (err) {
        console.error("Failed to load contacts:", err);
      } finally {
        if (mounted) setLoading(false);
      }

      // Real-time listener for ALL messages (for conversation list sidebar)
      try {
        const q = query(
          collection(db, "whatsapp_messages"),
          orderBy("timestamp", "desc")
        );
        const unsub = onSnapshot(q, (snap) => {
          if (!mounted) return;
          const allMsgs: WhatsAppMessage[] = snap.docs.map(
            (d) => ({ id: d.id, ...d.data() } as WhatsAppMessage)
          );
          buildConversationList(contactsRef.current, allMsgs);
          setIsLive(true);
        }, (err) => {
          console.warn("Conversation listener error, falling back:", err);
          // fallback: load once
          getAllWhatsAppConversations().then((msgs) => {
            if (mounted) buildConversationList(contactsRef.current, msgs);
          });
        });
        convUnsubRef.current = unsub;
      } catch (e) {
        console.error("Could not start conversation listener:", e);
      }
    }

    bootstrap();
    return () => {
      mounted = false;
      convUnsubRef.current?.();
      msgUnsubRef.current?.();
    };
  }, []);

  /* ── Real-time listener for active chat messages ── */
  useEffect(() => {
    // Clean up previous chat listener
    msgUnsubRef.current?.();
    msgUnsubRef.current = null;

    if (!activePhone) return;

    try {
      const q = query(
        collection(db, "whatsapp_messages"),
        where("phone", "==", activePhone),
        orderBy("timestamp", "asc")
      );
      const unsub = onSnapshot(q, (snap) => {
        const msgs: WhatsAppMessage[] = snap.docs.map(
          (d) => ({ id: d.id, ...d.data() } as WhatsAppMessage)
        );
        setMessages(msgs);
      }, (err) => {
        console.warn("Message listener fallback:", err);
        // Fallback: poll every 5s if onSnapshot isn't available (e.g. missing index)
        const load = async () => {
          const { getWhatsAppMessages } = await import("@/lib/firebase");
          const msgs = await getWhatsAppMessages(activePhone);
          setMessages(msgs);
        };
        load();
        const id = setInterval(load, 5000);
        msgUnsubRef.current = () => clearInterval(id);
        return;
      });
      msgUnsubRef.current = unsub;
    } catch (e) {
      console.error("Could not start message listener:", e);
    }

    return () => {
      msgUnsubRef.current?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePhone]);

  /* ── Scroll to bottom ── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ── Close contact menu on click outside ── */
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (contactMenuRef.current && !contactMenuRef.current.contains(e.target as Node)) {
        setShowContactMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ── Open conversation ── */
  function openConversation(phone: string, contact?: WhatsAppContact) {
    setActivePhone(phone);
    setActiveContact(contact || contacts.find((c) => c.phone === phone) || null);
    setApiError("");
    setShowContactMenu(false);
  }

  /* ── Send message ── */
  async function handleSend() {
    const text = inputText.trim();
    if (!text || !activePhone || sending) return;

    setSending(true);
    setApiError("");
    setInputText("");

    // Optimistic local message
    const tempMsg: WhatsAppMessage = {
      id: `temp-${Date.now()}`,
      phone: activePhone,
      contactName: activeContact?.name,
      direction: "outbound",
      type: "text",
      message: text,
      status: "sending",
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempMsg]);

    try {
      // 1. Save to Firestore first (optimistically)
      const savedMsg = await saveWhatsAppMessage({ ...tempMsg, id: undefined });

      // 2. Call WhatsApp API
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: activePhone, message: text }),
      });
      const data = await res.json();

      if (data.success) {
        await updateWhatsAppMessageStatus(savedMsg.id!, "sent", data.waMessageId);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempMsg.id ? { ...savedMsg, status: "sent", waMessageId: data.waMessageId } : m
          )
        );
        // Realtime onSnapshot automatically updates conversation list
      } else {
        await updateWhatsAppMessageStatus(savedMsg.id!, "failed");
        setMessages((prev) =>
          prev.map((m) => (m.id === tempMsg.id ? { ...savedMsg, status: "failed" } : m))
        );
        setApiError(data.error || "Failed to send message via WhatsApp API");
      }
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) => (m.id === tempMsg.id ? { ...m, status: "failed" } : m))
      );
      setApiError("Network error — could not reach the WhatsApp API");
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  /* ── Save contact callback ── */
  async function handleContactSaved(c: WhatsAppContact) {
    setActiveContact(c);
    const updated = await getWhatsAppContacts();
    setContacts(updated);
    setShowSaveContact(false);
    // Rebuild conversations with the new contact name
    const allMsgs = await getAllWhatsAppConversations();
    buildConversationList(updated, allMsgs);
  }

  /* ── Delete contact ── */
  async function handleDeleteContact() {
    if (!activeContact?.id) return;
    await deleteWhatsAppContact(activeContact.id);
    setActiveContact(null);
    setShowContactMenu(false);
    setShowDeleteConfirm(false);
    const updated = await getWhatsAppContacts();
    setContacts(updated);
    const allMsgs = await getAllWhatsAppConversations();
    buildConversationList(updated, allMsgs);
  }

  /* ── Filtered conversations ── */
  const filteredConversations = conversations.filter((conv) => {
    const q = searchQuery.toLowerCase();
    return (
      conv.contactName.toLowerCase().includes(q) ||
      conv.phone.includes(q) ||
      conv.lastMessage.toLowerCase().includes(q)
    );
  });

  /* ── Group messages by date ── */
  const groupedMessages: { date: string; msgs: WhatsAppMessage[] }[] = [];
  for (const msg of messages) {
    const dateLabel = formatDate(msg.timestamp);
    const last = groupedMessages[groupedMessages.length - 1];
    if (last && last.date === dateLabel) {
      last.msgs.push(msg);
    } else {
      groupedMessages.push({ date: dateLabel, msgs: [msg] });
    }
  }

  return (
    <AdminLayout>
      <div className="flex flex-col h-[calc(100vh-56px-40px)] -m-5 -mt-5 mt-0 rounded-xl overflow-hidden border border-gray-200/80 shadow-sm">
        {/* ─── Header ─── */}
        <div className="bg-white px-5 py-3.5 border-b border-gray-200/80 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#0B4FBA]/10 border border-[#0B4FBA]/20 rounded-lg text-[#0B4FBA]">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">Messages</h1>
                <span className="bg-emerald-100 text-emerald-800 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
                  WhatsApp Business
                </span>
                {isLive && (
                  <span className="flex items-center space-x-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span>Live</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {conversations.length} conversation{conversations.length !== 1 ? "s" : ""} · {contacts.length} saved contacts
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowNewChat(true)}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-[#0B4FBA] hover:bg-[#003882] text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Message</span>
          </button>
        </div>

        {/* ─── Main Body ─── */}
        <div className="flex flex-1 overflow-hidden">
          {/* ─────────── Left Panel: Conversation List ─────────── */}
          <div className="w-80 shrink-0 bg-white border-r border-gray-200/80 flex flex-col overflow-hidden">
            {/* Search */}
            <div className="p-3 border-b border-gray-100">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search conversations..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B4FBA]/20 focus:border-[#0B4FBA] bg-gray-50/60"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="w-6 h-6 border-2 border-[#0B4FBA] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-xs text-gray-400">Loading conversations...</p>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-8 text-center space-y-3">
                  <MessageCircle className="w-10 h-10 text-gray-200 mx-auto" />
                  <div className="text-sm font-semibold text-gray-600">No conversations yet</div>
                  <p className="text-xs text-gray-400">Click "New Message" to start chatting.</p>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const isActive = conv.phone === activePhone;
                  return (
                    <button
                      key={conv.phone}
                      onClick={() => openConversation(conv.phone, conv.contact)}
                      className={`w-full flex items-center space-x-3 px-3 py-3 border-b border-gray-50 transition-all text-left group ${
                        isActive
                          ? "bg-blue-50 border-l-2 border-l-[#0B4FBA]"
                          : conv.unread > 0
                          ? "bg-emerald-50/40 hover:bg-emerald-50 border-l-2 border-l-emerald-400"
                          : "hover:bg-gray-50/80 border-l-2 border-l-transparent"
                      }`}
                    >
                      {/* Avatar */}
                      <div className={`w-11 h-11 rounded-full shrink-0 flex items-center justify-center text-white text-sm font-bold ${avatarColor(conv.phone)}`}>
                        {conv.contact ? getInitials(conv.contact.name) : <Phone className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-semibold truncate ${
                            isActive ? "text-[#0B4FBA]" : conv.unread > 0 ? "text-gray-900" : "text-gray-900"
                          }`}>
                            {conv.contact ? conv.contact.name : conv.phone}
                          </span>
                          <div className="flex items-center space-x-1.5 shrink-0 ml-1">
                            {conv.unread > 0 && !isActive && (
                              <span className="w-5 h-5 bg-emerald-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                {conv.unread > 9 ? "9+" : conv.unread}
                              </span>
                            )}
                            <span className="text-[10px] text-gray-400">
                              {formatTime(conv.lastAt)}
                            </span>
                          </div>
                        </div>
                        {conv.contact && (
                          <div className="text-[10px] text-gray-400 font-mono">{conv.phone}</div>
                        )}
                        <div className={`text-xs truncate mt-0.5 ${
                          conv.unread > 0 && !isActive ? "text-gray-700 font-medium" : "text-gray-500"
                        }`}>{conv.lastMessage}</div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Contacts footer */}
            <div className="p-3 border-t border-gray-100 bg-gray-50/40">
              <div className="text-[11px] text-gray-400 font-medium mb-2 flex items-center space-x-1">
                <Hash className="w-3 h-3" />
                <span>SAVED CONTACTS ({contacts.length})</span>
              </div>
              <div className="space-y-0.5 max-h-28 overflow-y-auto">
                {contacts.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => openConversation(c.phone, c)}
                    className="w-full flex items-center space-x-2 px-2 py-1.5 rounded-lg hover:bg-white transition-colors text-left"
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${avatarColor(c.phone)}`}>
                      {getInitials(c.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-gray-800 truncate">{c.name}</div>
                      <div className="text-[10px] text-gray-400 font-mono">{c.phone}</div>
                    </div>
                  </button>
                ))}
                {contacts.length === 0 && (
                  <p className="text-xs text-gray-400 px-2 py-1">No saved contacts yet.</p>
                )}
              </div>
            </div>
          </div>

          {/* ─────────── Right Panel: Chat Window ─────────── */}
          {!activePhone ? (
            /* Empty state */
            <div className="flex-1 flex flex-col items-center justify-center bg-[#f1f2f4] space-y-4">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-200">
                <MessageCircle className="w-10 h-10 text-[#0B4FBA]/40" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-gray-700">Your WhatsApp Inbox</h3>
                <p className="text-sm text-gray-400 mt-1 max-w-xs">
                  Select a conversation or start a new chat to send messages.
                </p>
              </div>
              <button
                onClick={() => setShowNewChat(true)}
                className="flex items-center space-x-2 px-5 py-2.5 bg-[#0B4FBA] hover:bg-[#003882] text-white text-sm font-semibold rounded-xl shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Start a New Chat</span>
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden bg-[#f1f2f4]">
              {/* Chat Header */}
              <div className="bg-white px-4 py-3 border-b border-gray-200/80 flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${avatarColor(activePhone)}`}>
                    {activeContact ? getInitials(activeContact.name) : <Phone className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">
                      {activeContact?.name || activePhone}
                    </div>
                    {activeContact && (
                      <div className="text-xs text-gray-500 font-mono">{activePhone}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {/* Save / Edit Contact button */}
                  {!activeContact ? (
                    <button
                      onClick={() => setShowSaveContact(true)}
                      className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-200 transition-colors"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Save Contact</span>
                    </button>
                  ) : null}

                  {/* More menu */}
                  <div className="relative" ref={contactMenuRef}>
                    <button
                      onClick={() => setShowContactMenu((v) => !v)}
                      className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {showContactMenu && (
                      <div className="absolute right-0 top-9 bg-white rounded-xl shadow-xl border border-gray-200 w-48 py-1 z-40 animate-in slide-in-from-top-2">
                        {activeContact ? (
                          <>
                            <button
                              onClick={() => { setShowSaveContact(true); setShowContactMenu(false); }}
                              className="w-full flex items-center space-x-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-gray-400" />
                              <span>Edit Contact</span>
                            </button>
                            <div className="h-px bg-gray-100 my-1" />
                            <button
                              onClick={() => { setShowDeleteConfirm(true); setShowContactMenu(false); }}
                              className="w-full flex items-center space-x-2.5 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete Contact</span>
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => { setShowSaveContact(true); setShowContactMenu(false); }}
                            className="w-full flex items-center space-x-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <UserPlus className="w-3.5 h-3.5 text-gray-400" />
                            <span>Save as Contact</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full space-y-3">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold ${avatarColor(activePhone)}`}>
                      {activeContact ? getInitials(activeContact.name) : <Phone className="w-7 h-7" />}
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-gray-700">
                        {activeContact?.name || activePhone}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">No messages yet. Say hello! 👋</p>
                    </div>
                    {!activeContact && (
                      <button
                        onClick={() => setShowSaveContact(true)}
                        className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Save this number as a contact</span>
                      </button>
                    )}
                  </div>
                ) : (
                  groupedMessages.map((group) => (
                    <div key={group.date}>
                      {/* Date divider */}
                      <div className="flex items-center space-x-3 my-3">
                        <div className="flex-1 h-px bg-gray-200/80" />
                        <span className="text-[11px] text-gray-400 font-medium bg-[#f1f2f4] px-2 py-0.5 rounded-full border border-gray-200/60">
                          {group.date}
                        </span>
                        <div className="flex-1 h-px bg-gray-200/80" />
                      </div>

                      {/* Messages */}
                      <div className="space-y-2">
                        {group.msgs.map((msg) => {
                          const isOut = msg.direction === "outbound";
                          return (
                            <div
                              key={msg.id}
                              className={`flex ${isOut ? "justify-end" : "justify-start"}`}
                            >
                              <div
                                className={`max-w-[72%] rounded-2xl px-3.5 py-2 shadow-xs ${
                                  isOut
                                    ? "bg-[#0B4FBA] text-white rounded-br-sm"
                                    : "bg-white text-gray-800 rounded-bl-sm border border-gray-100"
                                }`}
                              >
                                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                  {msg.message}
                                </p>
                                <div className={`flex items-center justify-end space-x-1 mt-1 ${isOut ? "text-blue-200" : "text-gray-400"}`}>
                                  <span className="text-[10px]">{formatTime(msg.timestamp)}</span>
                                  {isOut && <StatusIcon status={msg.status} />}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* API Error banner */}
              {apiError && (
                <div className="mx-4 mb-2 px-3 py-2.5 bg-rose-50 border border-rose-200 rounded-lg flex items-start space-x-2 text-xs text-rose-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Send failed: </span>
                    {apiError}
                    {apiError.includes("not configured") && (
                      <span> Add your <code className="font-mono bg-rose-100 px-1 rounded">WHATSAPP_ACCESS_TOKEN</code> and <code className="font-mono bg-rose-100 px-1 rounded">WHATSAPP_PHONE_NUMBER_ID</code> to <code className="font-mono bg-rose-100 px-1 rounded">.env.local</code></span>
                    )}
                  </div>
                  <button onClick={() => setApiError("")} className="ml-auto shrink-0">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Message Input */}
              <div className="bg-white border-t border-gray-200/80 px-4 py-3 shrink-0">
                <div className="flex items-end space-x-3">
                  <div className="flex-1 flex items-end bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 focus-within:ring-2 focus-within:ring-[#0B4FBA]/20 focus-within:border-[#0B4FBA] transition-all">
                    <textarea
                      ref={inputRef}
                      value={inputText}
                      onChange={(e) => {
                        setInputText(e.target.value);
                        e.target.style.height = "auto";
                        e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                      }}
                      onKeyDown={handleKeyDown}
                      placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
                      rows={1}
                      className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 resize-none focus:outline-none leading-relaxed"
                      style={{ maxHeight: "120px" }}
                    />
                  </div>
                  <button
                    onClick={handleSend}
                    disabled={!inputText.trim() || sending}
                    className="w-11 h-11 bg-[#0B4FBA] hover:bg-[#003882] text-white rounded-full flex items-center justify-center transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                  >
                    {sending ? (
                      <Clock className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 mt-1.5 px-1">
                  Messages are sent via WhatsApp Business API · History stored in Firestore
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Modals ─── */}
      {showNewChat && (
        <NewChatModal
          contacts={contacts}
          onSelectContact={(c) => {
            setShowNewChat(false);
            openConversation(c.phone, c);
          }}
          onStartNew={(phone) => {
            setShowNewChat(false);
            openConversation(phone, contacts.find((c) => c.phone === phone));
          }}
          onClose={() => setShowNewChat(false)}
        />
      )}

      {showSaveContact && activePhone && (
        <SaveContactModal
          phone={activePhone}
          existingContact={activeContact || undefined}
          onSave={handleContactSaved}
          onClose={() => setShowSaveContact(false)}
        />
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Delete Contact?</h3>
                <p className="text-xs text-gray-500">This will only delete the contact entry. Message history is preserved.</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteContact}
                className="flex-1 px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
