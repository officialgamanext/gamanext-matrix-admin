"use client";

import React from "react";
import { CustomerInvoice } from "@/lib/firebase";

interface PrintableInvoiceProps {
  invoice: CustomerInvoice;
  id?: string;
}

export default function PrintableInvoice({ invoice, id = "printable-invoice" }: PrintableInvoiceProps) {
  const qrCodeSrc =
    invoice.myCompanyDetails.upiQrCodeUrl ||
    `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
      `upi://pay?pa=${invoice.myCompanyDetails.upiId || "gamanext2555qr@fbl"}&pn=${
        invoice.myCompanyDetails.companyName || "Gamanext Software Solutions"
      }&cu=INR`
    )}`;

  return (
    <div
      id={id}
      className="p-8 sm:p-10 bg-white text-gray-900 space-y-5 text-xs font-sans overflow-y-auto flex-1 print:overflow-visible print:m-0"
    >
      {/* TOP HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <div className="mb-2">
            <img
              src={invoice.myCompanyDetails.logoUrl || "/logo.jpeg"}
              alt="Logo"
              className="h-16 w-auto object-contain"
              crossOrigin="anonymous"
            />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            {invoice.myCompanyDetails.companyName || "Gamanext Software Solutions"}
          </h1>
          <p className="text-xs text-gray-500 max-w-sm mt-0.5 leading-relaxed">
            {invoice.myCompanyDetails.address}
          </p>
          <div className="mt-2 text-xs space-y-0.5 text-gray-700">
            <div>
              <span className="font-semibold text-gray-900">GSTIN:</span> {invoice.myCompanyDetails.gstin}
            </div>
            <div>
              <span className="font-semibold text-gray-900">Email:</span> {invoice.myCompanyDetails.email}
            </div>
            <div>
              <span className="font-semibold text-gray-900">Phone:</span> {invoice.myCompanyDetails.phone}
            </div>
          </div>
        </div>

        <div className="text-left sm:text-right shrink-0">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0B4FBA] uppercase">
            TAX INVOICE
          </h2>
          <div className="mt-2 space-y-1 text-xs">
            <div className="flex justify-start sm:justify-end space-x-2">
              <span className="text-gray-500">Invoice No:</span>
              <span className="font-bold text-gray-900 font-mono">{invoice.invoiceNumber}</span>
            </div>
            <div className="flex justify-start sm:justify-end space-x-2">
              <span className="text-gray-500">Date:</span>
              <span className="font-semibold text-gray-800">{invoice.issueDate}</span>
            </div>
            <div className="flex justify-start sm:justify-end space-x-2">
              <span className="text-gray-500">Due Date:</span>
              <span className="font-semibold text-gray-800">{invoice.dueDate}</span>
            </div>
            {invoice.poNumber && (
              <div className="flex justify-start sm:justify-end space-x-2">
                <span className="text-gray-500">PO Number:</span>
                <span className="font-semibold text-gray-800 font-mono">{invoice.poNumber}</span>
              </div>
            )}
            <div className="flex justify-start sm:justify-end pt-1">
              <span className="inline-block bg-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-0.5 rounded-full">
                Status: {invoice.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* THIN DIVIDER */}
      <div className="border-b border-gray-200"></div>

      {/* BILLED TO (CLIENT DETAILS) BOX */}
      <div className="border border-gray-200 rounded-xl p-4 bg-white">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
          BILLED TO (CLIENT DETAILS)
        </span>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 text-xs">
          <div>
            <h3 className="text-sm font-bold text-gray-900">
              {invoice.customerDetails.businessName || invoice.customerDetails.name}
            </h3>
            <p className="text-xs text-gray-700 font-medium">
              {invoice.customerDetails.name}
            </p>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed max-w-sm">
              {invoice.customerDetails.address}
            </p>
          </div>
          <div className="text-left sm:text-right space-y-1">
            <div>
              <span className="text-gray-500">Phone: </span>
              <span className="font-bold text-gray-900 font-mono">{invoice.customerDetails.mobileNumber}</span>
            </div>
            {invoice.customerDetails.gstin && (
              <div>
                <span className="text-gray-500">GSTIN: </span>
                <span className="font-bold text-gray-900 font-mono">{invoice.customerDetails.gstin}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ITEMS TABLE */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#0B4FBA] text-white text-xs font-semibold">
              <th className="py-2.5 px-3 text-center w-12 text-white font-semibold">#</th>
              <th className="py-2.5 px-3 text-white font-semibold">Item Description</th>
              <th className="py-2.5 px-3 text-center w-24 text-white font-semibold">HSN/SAC</th>
              <th className="py-2.5 px-3 text-center w-16 text-white font-semibold">Qty</th>
              <th className="py-2.5 px-3 text-right w-28 text-white font-semibold">Rate (₹)</th>
              <th className="py-2.5 px-3 text-right w-28 text-white font-semibold">Amount (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-xs">
            {invoice.items.map((item, idx) => (
              <tr key={idx} className="hover:bg-gray-50/50">
                <td className="py-3 px-3 text-center text-gray-400 font-medium">{idx + 1}</td>
                <td className="py-3 px-3 font-bold text-gray-900 whitespace-pre-line">{item.description}</td>
                <td className="py-3 px-3 text-center text-gray-600 font-medium">{item.hsnSac || "-"}</td>
                <td className="py-3 px-3 text-center font-bold text-gray-900">{item.quantity}</td>
                <td className="py-3 px-3 text-right text-gray-800 font-medium">
                  {item.unitPrice.toLocaleString("en-IN")}
                </td>
                <td className="py-3 px-3 text-right font-bold text-gray-900">
                  {item.amount.toLocaleString("en-IN")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MIDDLE SECTION: BANK DETAILS (LEFT) & TOTALS (RIGHT) */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pt-2">
        {/* Bank Account & Payment Details Card */}
        <div className="flex-1 w-full border border-gray-200 rounded-xl p-4 bg-white space-y-3">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
            BANK & PAYMENT DETAILS
          </span>
          <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
            <div>
              <span className="text-gray-500 block text-[11px]">Bank Name:</span>
              <span className="font-bold text-gray-900">
                {invoice.myCompanyDetails.bankName || "Federal Bank"}
              </span>
            </div>
            <div>
              <span className="text-gray-500 block text-[11px]">Account Name:</span>
              <span className="font-bold text-gray-900">
                {invoice.myCompanyDetails.accountName || invoice.myCompanyDetails.companyName}
              </span>
            </div>
            <div>
              <span className="text-gray-500 block text-[11px]">Account Number:</span>
              <span className="font-bold font-mono text-gray-900">
                {invoice.myCompanyDetails.accountNumber || "25790200002555"}
              </span>
            </div>
            <div>
              <span className="text-gray-500 block text-[11px]">IFSC Code:</span>
              <span className="font-bold font-mono text-gray-900">
                {invoice.myCompanyDetails.ifscCode || "FDRL0002579"}
              </span>
            </div>
            <div>
              <span className="text-gray-500 block text-[11px]">Branch:</span>
              <span className="font-bold text-gray-900">
                {invoice.myCompanyDetails.branch || "Vedayapalem, Nellore"}
              </span>
            </div>
            <div>
              <span className="text-gray-500 block text-[11px]">UPI ID:</span>
              <span className="font-bold font-mono text-[#0B4FBA]">
                {invoice.myCompanyDetails.upiId || "gamanext2555qr@fbl"}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100 flex items-center space-x-3">
            <img
              src={qrCodeSrc}
              alt="UPI QR Code"
              className="w-16 h-16 rounded border border-gray-200 p-0.5 object-contain bg-white"
              crossOrigin="anonymous"
            />
            <span className="text-[10px] text-gray-500 leading-snug">
              Scan QR Code to pay directly via any UPI app.
            </span>
          </div>
        </div>

        {/* Subtotals & Taxes */}
        <div className="w-full sm:w-80 shrink-0 space-y-2 text-xs">
          <div className="flex justify-between py-1 text-gray-600">
            <span>Subtotal:</span>
            <span className="font-bold font-mono text-gray-900">
              ₹{invoice.subtotal.toLocaleString("en-IN")}
            </span>
          </div>
          {invoice.cgstRate !== undefined && invoice.cgstRate > 0 && (
            <div className="flex justify-between py-1 text-gray-600">
              <span>CGST ({invoice.cgstRate}%):</span>
              <span className="font-bold font-mono text-gray-900">
                ₹{(invoice.cgstAmount || 0).toLocaleString("en-IN")}
              </span>
            </div>
          )}
          {invoice.sgstRate !== undefined && invoice.sgstRate > 0 && (
            <div className="flex justify-between py-1 text-gray-600">
              <span>SGST ({invoice.sgstRate}%):</span>
              <span className="font-bold font-mono text-gray-900">
                ₹{(invoice.sgstAmount || 0).toLocaleString("en-IN")}
              </span>
            </div>
          )}
          {invoice.discount !== undefined && invoice.discount > 0 && (
            <div className="flex justify-between py-1 text-emerald-600">
              <span>Discount:</span>
              <span className="font-bold font-mono">-₹{invoice.discount.toLocaleString("en-IN")}</span>
            </div>
          )}

          {/* THICK SOLID BLACK LINE */}
          <div className="border-t-2 border-gray-900 my-2"></div>

          <div className="flex justify-between items-center py-1">
            <span className="font-bold text-gray-900 text-sm">Grand Total:</span>
            <span className="text-xl font-bold font-mono text-[#0B4FBA]">
              ₹{invoice.total.toLocaleString("en-IN")}
            </span>
          </div>
        </div>
      </div>

      {/* FOOTER SECTION: NOTES & TERMS (LEFT) & SIGNATURE (RIGHT) */}
      <div className="pt-6 flex flex-col sm:flex-row justify-between items-end gap-6 text-xs">
        <div className="max-w-md space-y-3">
          {invoice.notes && (
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">
                NOTES
              </span>
              <p className="text-xs text-gray-600 whitespace-pre-line leading-relaxed">
                {invoice.notes}
              </p>
            </div>
          )}
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">
              TERMS & CONDITIONS
            </span>
            <p className="text-[11px] text-gray-500 whitespace-pre-line leading-relaxed">
              {invoice.terms ||
                "• Payment is due within 30 days from the invoice date.\n• Late payments may be subject to a 2% monthly interest charge.\n• All disputes are subject to Bengaluru jurisdiction."}
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="text-xs text-gray-600 font-medium block">
            For {invoice.myCompanyDetails.companyName || "Gamanext Software Solutions"}
          </span>
          <div className="h-16 flex items-center justify-end my-1">
            <img
              src="/signature.PNG"
              alt="Authorized Signature"
              className="h-14 w-auto object-contain"
              crossOrigin="anonymous"
            />
          </div>
          <div className="border-t border-gray-400 pt-1 text-[11px] text-gray-500 font-medium">
            Authorized Signatory
          </div>
        </div>
      </div>
    </div>
  );
}
