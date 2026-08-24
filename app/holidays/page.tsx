"use client";

import { useEffect, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import CustomDropdown from "../components/CustomDropdown";
import CustomDatePicker from "../components/CustomDatePicker";
import {
  getHolidaysFromStorage,
  saveHolidayToStorage,
  deleteHolidayFromStorage,
  HolidayItem,
} from "@/lib/firebase";
import {
  Calendar as CalendarIcon,
  Plus,
  Search,
  Trash2,
  Edit3,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  PartyPopper,
  Flag,
  Sparkles,
  Building2,
  CalendarCheck2,
  Clock,
  Filter,
  LayoutGrid,
  List,
} from "lucide-react";

export default function HolidaysPage() {
  const [holidays, setHolidays] = useState<HolidayItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState("2026");
  const [selectedType, setSelectedType] = useState("All");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<HolidayItem | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formType, setFormType] = useState<
    "National Holiday" | "Public Holiday" | "Festival Holiday" | "Company Holiday" | "Optional / Restricted"
  >("Public Holiday");
  const [formDescription, setFormDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Load Holidays from Storage
  const loadHolidays = async () => {
    setLoading(true);
    try {
      const data = await getHolidaysFromStorage(selectedYear === "All" ? undefined : selectedYear);
      setHolidays(data);
    } catch (err) {
      console.error("Failed to load holidays:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHolidays();
  }, [selectedYear]);

  // Open Modal for Create
  const handleOpenAddModal = () => {
    setEditingHoliday(null);
    setFormTitle("");
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormType("Public Holiday");
    setFormDescription("");
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEditModal = (h: HolidayItem) => {
    setEditingHoliday(h);
    setFormTitle(h.title);
    setFormDate(h.date);
    setFormType(h.type || "Public Holiday");
    setFormDescription(h.description || "");
    setIsModalOpen(true);
  };

  // Save Holiday Form Submission
  const handleSaveHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDate.trim()) return;

    setSaving(true);
    try {
      const saved = await saveHolidayToStorage({
        id: editingHoliday?.id,
        title: formTitle.trim(),
        date: formDate.trim(),
        type: formType,
        description: formDescription.trim(),
        year: new Date(formDate).getFullYear(),
      });

      if (editingHoliday?.id) {
        setHolidays((prev) =>
          prev
            .map((item) => (item.id === editingHoliday.id ? saved : item))
            .sort((a, b) => (a.date > b.date ? 1 : -1))
        );
      } else {
        setHolidays((prev) =>
          [saved, ...prev].sort((a, b) => (a.date > b.date ? 1 : -1))
        );
      }

      setIsModalOpen(false);
      setEditingHoliday(null);
    } catch (err) {
      console.error("Failed to save holiday:", err);
      alert("Failed to save holiday. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Delete Holiday Handler
  const handleDeleteHoliday = async (id?: string) => {
    if (!id) return;
    if (!confirm("Are you sure you want to delete this holiday?")) return;

    setDeletingId(id);
    try {
      await deleteHolidayFromStorage(id);
      setHolidays((prev) => prev.filter((h) => h.id !== id));
    } catch (err) {
      console.error("Failed to delete holiday:", err);
      alert("Failed to delete holiday.");
    } finally {
      setDeletingId(null);
    }
  };

  // Date Formatting Helper
  const formatDateDisplay = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Relative Date / Status Calculation
  const getHolidayStatus = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);

    const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return { label: "Today", color: "bg-emerald-500 text-white animate-pulse" };
    if (diffDays > 0 && diffDays <= 7) return { label: `In ${diffDays} days`, color: "bg-amber-50 text-amber-700 border border-amber-200 font-bold" };
    if (diffDays > 7) return { label: "Upcoming", color: "bg-blue-50 text-blue-700 border border-blue-200" };
    return { label: "Passed", color: "bg-gray-100 text-gray-500 border border-gray-200" };
  };

  // Category Color Badge Helper
  const getTypeBadge = (type?: string) => {
    switch (type) {
      case "National Holiday":
        return {
          bg: "bg-rose-50 text-rose-700 border-rose-200",
          icon: Flag,
        };
      case "Festival Holiday":
        return {
          bg: "bg-purple-50 text-purple-700 border-purple-200",
          icon: PartyPopper,
        };
      case "Company Holiday":
        return {
          bg: "bg-blue-50 text-[#0B4FBA] border-blue-200",
          icon: Building2,
        };
      case "Optional / Restricted":
        return {
          bg: "bg-amber-50 text-amber-700 border-amber-200",
          icon: Sparkles,
        };
      case "Public Holiday":
      default:
        return {
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
          icon: CalendarCheck2,
        };
    }
  };

  // Filtered Holidays
  const filteredHolidays = holidays.filter((h) => {
    const matchesSearch =
      h.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (h.description && h.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (h.dayOfWeek && h.dayOfWeek.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = selectedType === "All" || h.type === selectedType;

    return matchesSearch && matchesType;
  });

  // Summary Metrics
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcomingCount = holidays.filter((h) => new Date(h.date) >= today).length;
  const nationalCount = holidays.filter((h) => h.type === "National Holiday").length;
  const festivalCount = holidays.filter((h) => h.type === "Festival Holiday").length;

  return (
    <AdminLayout>
      <div className="space-y-4">
        {/* Page Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-gray-200/80 shadow-2xs">
          <div className="flex items-center space-x-3.5">
            <div className="p-2.5 bg-[#0B4FBA]/10 border border-[#0B4FBA]/20 rounded-xl text-[#0B4FBA]">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">Holidays Calendar</h1>
                <span className="bg-blue-50 text-[#0B4FBA] text-xs font-bold px-2.5 py-0.5 rounded-full border border-blue-200">
                  {holidays.length} Total
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Manage company public, national, and festival holidays schedule.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 self-start sm:self-auto">
            {/* Year Selector */}
            <div className="w-28">
              <CustomDropdown
                options={[
                  { value: "2026", label: "2026" },
                  { value: "2027", label: "2027" },
                  { value: "2025", label: "2025" },
                  { value: "All", label: "All Years" },
                ]}
                value={selectedYear}
                onChange={(val) => setSelectedYear(val)}
                placeholder="Select year"
              />
            </div>

            <button
              onClick={handleOpenAddModal}
              className="px-3.5 py-2 bg-[#0B4FBA] hover:bg-[#003882] text-white text-xs font-semibold rounded-lg shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Holiday</span>
            </button>
          </div>
        </div>

        {/* Statistics Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-2xs flex items-center space-x-3">
            <div className="p-2.5 bg-blue-50 text-[#0B4FBA] rounded-lg border border-blue-100">
              <CalendarCheck2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900">{holidays.length}</div>
              <div className="text-[11px] text-gray-500 font-medium">Total Holidays ({selectedYear})</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-2xs flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-emerald-700">{upcomingCount}</div>
              <div className="text-[11px] text-gray-500 font-medium">Upcoming Holidays</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-2xs flex items-center space-x-3">
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-lg border border-rose-100">
              <Flag className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-rose-700">{nationalCount}</div>
              <div className="text-[11px] text-gray-500 font-medium">National Holidays</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-2xs flex items-center space-x-3">
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg border border-purple-100">
              <PartyPopper className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-purple-700">{festivalCount}</div>
              <div className="text-[11px] text-gray-500 font-medium">Festival Holidays</div>
            </div>
          </div>
        </div>

        {/* Toolbar: Search, Type Tabs & View Switcher */}
        <div className="bg-white p-3 rounded-xl border border-gray-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Type Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs">
            {[
              "All",
              "National Holiday",
              "Festival Holiday",
              "Public Holiday",
              "Company Holiday",
              "Optional / Restricted",
            ].map((t) => (
              <button
                key={t}
                onClick={() => setSelectedType(t)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  selectedType === t
                    ? "bg-[#0B4FBA] text-white shadow-xs"
                    : "bg-gray-100/80 text-gray-600 hover:bg-gray-200/80 hover:text-gray-900"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Search Input & View Mode */}
          <div className="flex items-center space-x-2 shrink-0">
            <div className="relative w-full md:w-56">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search holidays..."
                className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#0B4FBA]/30 bg-white"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center border border-gray-200 rounded-lg p-0.5 bg-gray-50">
              <button
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-md transition-all cursor-pointer ${
                  viewMode === "table" ? "bg-white text-[#0B4FBA] shadow-xs" : "text-gray-400 hover:text-gray-700"
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("cards")}
                className={`p-1.5 rounded-md transition-all cursor-pointer ${
                  viewMode === "cards" ? "bg-white text-[#0B4FBA] shadow-xs" : "text-gray-400 hover:text-gray-700"
                }`}
                title="Cards View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content View: Table or Cards */}
        {loading ? (
          <div className="bg-white p-12 rounded-xl border border-gray-200/80 text-center flex flex-col items-center justify-center space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-[#0B4FBA]" />
            <span className="text-xs text-gray-500 font-medium">Loading holidays list...</span>
          </div>
        ) : filteredHolidays.length === 0 ? (
          <div className="bg-white p-12 rounded-xl border border-gray-200/80 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto text-gray-400">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-gray-900">No holidays found</h3>
              <p className="text-xs text-gray-500">
                {searchQuery || selectedType !== "All"
                  ? "No holidays match your filter criteria. Try resetting filters."
                  : "No holidays have been added for this year yet."}
              </p>
            </div>
            <button
              onClick={handleOpenAddModal}
              className="px-3.5 py-1.5 bg-[#0B4FBA] hover:bg-[#003882] text-white text-xs font-semibold rounded-lg shadow-xs transition-all inline-flex items-center space-x-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add First Holiday</span>
            </button>
          </div>
        ) : viewMode === "table" ? (
          /* Table View */
          <div className="bg-white rounded-xl border border-gray-200/80 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-[10px] font-bold border-b border-gray-200">
                  <tr>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Day</th>
                    <th className="py-3.5 px-4">Holiday Name & Details</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredHolidays.map((h, idx) => {
                    const badge = getTypeBadge(h.type);
                    const Icon = badge.icon;
                    const status = getHolidayStatus(h.date);
                    const isDeleting = deletingId === h.id;

                    return (
                      <tr key={h.id || idx} className="hover:bg-gray-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-gray-900 whitespace-nowrap">
                          {formatDateDisplay(h.date)}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-gray-600 whitespace-nowrap">
                          {h.dayOfWeek || new Date(h.date).toLocaleDateString("en-US", { weekday: "long" })}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <span className="font-bold text-gray-900 block">{h.title}</span>
                            {h.description && (
                              <span className="text-[11px] text-gray-500 block line-clamp-1">
                                {h.description}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border ${badge.bg}`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            <span>{h.type || "Public Holiday"}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${status.color}`}
                          >
                            {status.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => handleOpenEditModal(h)}
                              className="p-1 text-gray-400 hover:text-[#0B4FBA] hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                              title="Edit Holiday"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteHoliday(h.id)}
                              disabled={isDeleting}
                              className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors disabled:opacity-50 cursor-pointer"
                              title="Delete Holiday"
                            >
                              {isDeleting ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Cards Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredHolidays.map((h, idx) => {
              const badge = getTypeBadge(h.type);
              const Icon = badge.icon;
              const status = getHolidayStatus(h.date);
              const isDeleting = deletingId === h.id;
              const dateObj = new Date(h.date);
              const monthShort = dateObj.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
              const dayNumber = dateObj.getDate();

              return (
                <div
                  key={h.id || idx}
                  className="bg-white rounded-xl border border-gray-200/80 shadow-2xs p-4 flex flex-col justify-between space-y-3 hover:shadow-xs transition-shadow"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      {/* Date Badge Box */}
                      <div className="w-12 h-12 bg-blue-50 border border-blue-200/80 rounded-xl flex flex-col items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-[#0B4FBA] leading-none uppercase">
                          {monthShort}
                        </span>
                        <span className="text-base font-black text-gray-900 leading-tight">
                          {dayNumber}
                        </span>
                      </div>

                      <div className="space-y-0.5">
                        <h3 className="font-bold text-sm text-gray-900 line-clamp-1">{h.title}</h3>
                        <span className="text-xs text-gray-500 font-medium block">
                          {h.dayOfWeek || dateObj.toLocaleDateString("en-US", { weekday: "long" })},{" "}
                          {dateObj.getFullYear()}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${status.color}`}
                    >
                      {status.label}
                    </span>
                  </div>

                  {h.description && (
                    <p className="text-xs text-gray-600 line-clamp-2 bg-gray-50/70 p-2 rounded-lg border border-gray-100">
                      {h.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-semibold border ${badge.bg}`}
                    >
                      <Icon className="w-3 h-3" />
                      <span>{h.type || "Public Holiday"}</span>
                    </span>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleOpenEditModal(h)}
                        className="p-1 text-gray-400 hover:text-[#0B4FBA] hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                        title="Edit"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteHoliday(h.id)}
                        disabled={isDeleting}
                        className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors disabled:opacity-50 cursor-pointer"
                        title="Delete"
                      >
                        {isDeleting ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add / Edit Holiday Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-[#0B4FBA]/10 text-[#0B4FBA] rounded-lg">
                    <CalendarIcon className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm text-gray-900">
                    {editingHoliday ? "Edit Holiday" : "Add New Holiday"}
                  </h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveHoliday} className="p-5 space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Holiday Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Diwali, Republic Day, Good Friday"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#0B4FBA]/30 bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Holiday Date *
                    </label>
                    <CustomDatePicker
                      value={formDate}
                      onChange={(val) => setFormDate(val)}
                      placeholder="Select date"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Holiday Category *
                    </label>
                    <CustomDropdown
                      options={[
                        { value: "National Holiday", label: "National Holiday" },
                        { value: "Festival Holiday", label: "Festival Holiday" },
                        { value: "Public Holiday", label: "Public Holiday" },
                        { value: "Company Holiday", label: "Company Holiday" },
                        { value: "Optional / Restricted", label: "Optional / Restricted" },
                      ]}
                      value={formType}
                      onChange={(val) => setFormType(val as any)}
                      placeholder="Select category"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Description / Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Add brief details about the occasion..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#0B4FBA]/30 bg-white resize-none"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving || !formTitle.trim() || !formDate.trim()}
                    className="px-4 py-2 bg-[#0B4FBA] hover:bg-[#003882] text-white font-semibold rounded-lg shadow-xs transition-all flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    {saving ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    <span>{editingHoliday ? "Update Holiday" : "Save Holiday"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
