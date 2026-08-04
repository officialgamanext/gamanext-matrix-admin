"use client";

import { useState, useRef, useEffect } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from "lucide-react";

interface CustomDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export default function CustomDatePicker({
  value,
  onChange,
  placeholder = "Select date...",
  className = "",
  disabled = false,
}: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Parse current date or fallback to today
  const parsedDate = value ? new Date(value) : new Date();
  const [viewDate, setViewDate] = useState<Date>(
    isNaN(parsedDate.getTime()) ? new Date() : parsedDate
  );

  const popoverRef = useRef<HTMLDivElement>(null);

  // Sync viewDate when value changes
  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) setViewDate(d);
    }
  }, [value]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();

  // Navigation handlers
  const handlePrevMonth = () => {
    setViewDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(currentYear, currentMonth + 1, 1));
  };

  // Month Names & Day Headers
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const dayHeaders = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  // Generate calendar days
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const calendarDays: { day: number; monthOffset: number; dateStr: string }[] = [];

  // Previous month trailing days
  const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const day = prevMonthDays - i;
    const d = new Date(currentYear, currentMonth - 1, day);
    const dateStr = formatDateToYYYYMMDD(d);
    calendarDays.push({ day, monthOffset: -1, dateStr });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(currentYear, currentMonth, day);
    const dateStr = formatDateToYYYYMMDD(d);
    calendarDays.push({ day, monthOffset: 0, dateStr });
  }

  // Next month leading days
  const totalCells = Math.ceil(calendarDays.length / 7) * 7;
  const nextDays = totalCells - calendarDays.length;
  for (let day = 1; day <= nextDays; day++) {
    const d = new Date(currentYear, currentMonth + 1, day);
    const dateStr = formatDateToYYYYMMDD(d);
    calendarDays.push({ day, monthOffset: 1, dateStr });
  }

  function formatDateToYYYYMMDD(d: Date): string {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  // Handle Select Day
  const handleSelectDay = (dateStr: string) => {
    onChange(dateStr);
    setIsOpen(false);
  };

  // Format display text
  const displayValue = value
    ? new Date(value).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "";

  return (
    <div ref={popoverRef} className={`relative w-full ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-1.5 text-xs border rounded-lg bg-white flex items-center justify-between transition-all select-none ${
          isOpen
            ? "border-[#0B4FBA] ring-2 ring-[#0B4FBA]/20 shadow-xs"
            : "border-gray-300 hover:border-gray-400"
        } ${disabled ? "opacity-50 cursor-not-allowed bg-gray-50" : "cursor-pointer"}`}
      >
        <span className={value ? "text-gray-900 font-medium" : "text-gray-400"}>
          {displayValue || placeholder}
        </span>
        <CalendarIcon
          className={`w-3.5 h-3.5 transition-colors ${
            isOpen ? "text-[#0B4FBA]" : "text-gray-400"
          }`}
        />
      </button>

      {/* Calendar Popover */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 p-3 w-64 select-none animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Calendar Month Header */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="font-bold text-xs text-gray-900">
              {monthNames[currentMonth]} {currentYear}
            </div>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {dayHeaders.map((d, i) => (
              <span key={i} className="text-[10px] font-bold text-gray-400 uppercase">
                {d}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {calendarDays.map((cell, idx) => {
              const isSelected = cell.dateStr === value;
              const isCurrentMonth = cell.monthOffset === 0;

              return (
                <button
                  type="button"
                  key={idx}
                  onClick={() => handleSelectDay(cell.dateStr)}
                  className={`h-7 w-7 text-xs rounded-lg flex items-center justify-center transition-all ${
                    isSelected
                      ? "bg-[#0B4FBA] text-white font-bold shadow-xs"
                      : isCurrentMonth
                      ? "text-gray-800 hover:bg-blue-50 hover:text-[#0B4FBA]"
                      : "text-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>

          {/* Today & Clear Actions */}
          <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-gray-100 text-[11px]">
            <button
              type="button"
              onClick={() => handleSelectDay(formatDateToYYYYMMDD(new Date()))}
              className="text-[#0B4FBA] font-semibold hover:underline"
            >
              Select Today
            </button>
            {value && (
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setIsOpen(false);
                }}
                className="text-gray-400 hover:text-rose-600 font-medium"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
