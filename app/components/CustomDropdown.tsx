"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Search } from "lucide-react";

export interface OptionItem {
  label: string;
  value: string;
}

interface CustomDropdownProps {
  options: (string | OptionItem)[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export default function CustomDropdown({
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  className = "",
  disabled = false,
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Normalize options
  const normalizedOptions: OptionItem[] = options.map((opt) =>
    typeof opt === "string" ? { label: opt, value: opt } : opt
  );

  const selectedItem = normalizedOptions.find((opt) => opt.value === value);

  // Filter options if search exists
  const filteredOptions = normalizedOptions.filter((opt) =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className={`relative w-full ${className}`}>
      {/* Custom Trigger Button */}
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
        <span className={selectedItem ? "text-gray-900 font-medium" : "text-gray-400"}>
          {selectedItem ? selectedItem.label : placeholder}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-[#0B4FBA]" : ""
          }`}
        />
      </button>

      {/* Custom Options Popover */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Optional Search Bar for dropdowns with 5+ options */}
          {normalizedOptions.length > 5 && (
            <div className="p-2 border-b border-gray-100 relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="w-full pl-8 pr-3 py-1 text-xs border border-gray-200 rounded-md outline-none focus:ring-1 focus:ring-[#0B4FBA] bg-gray-50/50"
              />
            </div>
          )}

          {/* Options List */}
          <div className="max-h-48 overflow-y-auto p-1 space-y-0.5">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-xs text-gray-400">No options found</div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = option.value === value;
                return (
                  <div
                    key={option.value}
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                      setSearchTerm("");
                    }}
                    className={`flex items-center justify-between px-3 py-2 text-xs rounded-lg cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-blue-50 text-[#0B4FBA] font-semibold"
                        : "text-gray-700 hover:bg-gray-100/70"
                    }`}
                  >
                    <span>{option.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#0B4FBA]" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
