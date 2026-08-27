/**
 * exportUtils.ts
 * Professional Bank-Statement Style PDF and Excel Export for Kanakku
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Transaction, ExpenseTransaction, IncomeTransaction, TransferTransaction } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ExportRow {
  date: string;
  time: string;
  description: string;
  category: string;
  type: string;
  needWant: string;
  amount: string;
  rawAmount: number;
  isExpense: boolean;
  isIncome: boolean;
  isTransfer: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getSafePdfCurrencySymbol = (symbol: string): string => {
  if (symbol === '₹') return 'Rs. ';
  if (symbol === '€') return 'EUR ';
  if (symbol === '£') return 'GBP ';
  if (symbol === '¥') return 'JPY ';
  return symbol;
};

const formatDate = (tx: Transaction): string => {
  if (tx.timestamp) {
    return new Date(tx.timestamp).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
  return tx.date || '—';
};

const formatTime = (tx: Transaction): string =>
  tx.time || (tx.timestamp ? new Date(tx.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—');

export const buildExportRows = (
  transactions: Transaction[],
  currencySymbol: string,
  forPdf: boolean = false
): ExportRow[] => {
  const sym = forPdf ? getSafePdfCurrencySymbol(currencySymbol) : currencySymbol;

  return [...transactions]
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
    .map((tx) => {
      const isExpense = tx.type === 'expense';
      const isIncome = tx.type === 'income';
      const isTransfer = tx.type === 'transfer';
      const sign = isExpense ? '-' : isIncome ? '+' : '';

      let description = 'Transaction';
      let category = 'General';
      let needWant = '—';

      if (isExpense) {
        const exp = tx as ExpenseTransaction;
        description = exp.description || exp.category;
        category = exp.category || 'Expense';
        needWant = exp.needWant || '—';
      } else if (isIncome) {
        const inc = tx as IncomeTransaction;
        description = inc.source || 'Income';
        category = 'Income Deposit';
      } else if (isTransfer) {
        const tr = tx as TransferTransaction;
        description = tr.transferType === 'transfer' ? 'Account Transfer' : `Transfer (${tr.transferType})`;
        category = 'Transfer';
      }

      return {
        date: formatDate(tx),
        time: formatTime(tx),
        description,
        category,
        type: tx.type.charAt(0).toUpperCase() + tx.type.slice(1),
        needWant,
        amount: `${sign}${sym}${tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        rawAmount: tx.amount,
        isExpense,
        isIncome,
        isTransfer,
      };
    });
};

// ─── PDF Export (Bank Statement Style) ────────────────────────────────────────

export const exportPDF = (
  transactions: Transaction[],
  currencySymbol: string,
  userName: string,
  totalIncome?: number,
  totalExpenses?: number,
  statementTitle: string = 'Account Financial Statement'
): void => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const rows = buildExportRows(transactions, currencySymbol, true);
  const pdfSym = getSafePdfCurrencySymbol(currencySymbol);
  const pageW = doc.internal.pageSize.getWidth();
  const now = new Date();

  // Compute totals if not passed directly
  const computedIncome = totalIncome !== undefined
    ? totalIncome
    : transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);

  const computedExpenses = totalExpenses !== undefined
    ? totalExpenses
    : transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const netFlow = computedIncome - computedExpenses;

  const generatedOn = now.toLocaleDateString('en-IN', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }) + ` at ` + now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const statementRef = `KNK-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

  // ── 1. Formal Bank Statement Header Banner ──────────────────────────────────
  doc.setFillColor(15, 23, 42); // Deep Navy (#0F172A)
  doc.rect(0, 0, pageW, 44, 'F');

  // Decorative gold/emerald brand accent stripe
  doc.setFillColor(0, 200, 83); // #00C853
  doc.rect(0, 43, pageW, 1.2, 'F');

  // App / Bank Brand Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text('KANAKKU', 14, 16);

  // Subtitle / Bank Statement Label
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184); // Slate 400
  doc.text('OFFICIAL BANK STATEMENT & TRANSACTION LEDGER', 14, 22);

  // Account Holder & Metadata Left
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(226, 232, 240);
  doc.text(`Account Holder: `, 14, 30);
  doc.setFont('helvetica', 'bold');
  doc.text(`${userName || 'Primary User'}`, 38, 30);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`Reference No: ${statementRef}`, 14, 36);

  // Statement Metadata Right
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225);
  const genText = `Generated: ${generatedOn}`;
  doc.text(genText, pageW - doc.getTextWidth(genText) - 14, 30);

  const scopeText = `Total Records: ${transactions.length} Transactions`;
  doc.text(scopeText, pageW - doc.getTextWidth(scopeText) - 14, 36);

  // ── 2. Summary Financial Strip ─────────────────────────────────────────────
  doc.setFillColor(241, 245, 249); // Slate 100
  doc.rect(0, 44.2, pageW, 22, 'F');

  const summaryItems = [
    {
      label: 'TOTAL CREDITS (INCOME)',
      value: `+${pdfSym}${computedIncome.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      color: [0, 150, 60] as [number, number, number],
    },
    {
      label: 'TOTAL DEBITS (EXPENSES)',
      value: `-${pdfSym}${computedExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      color: [225, 29, 72] as [number, number, number],
    },
    {
      label: 'NET CASH FLOW',
      value: `${netFlow >= 0 ? '+' : ''}${pdfSym}${netFlow.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      color: netFlow >= 0 ? ([14, 116, 144] as [number, number, number]) : ([225, 29, 72] as [number, number, number]),
    },
    {
      label: 'TRANSACTIONS COUNT',
      value: `${transactions.length} Entries`,
      color: [51, 65, 85] as [number, number, number],
    },
  ];

  const colW = (pageW - 28) / summaryItems.length;
  summaryItems.forEach((item, i) => {
    const x = 14 + i * colW;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(item.label, x, 52);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...item.color);
    doc.text(item.value, x, 60);
  });

  // Divider line under summary
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.line(14, 66.2, pageW - 14, 66.2);

  // ── 3. Table Section Heading ──────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('STATEMENT TRANSACTION DETAILS', 14, 73);

  // ── 4. Structured AutoTable (Bank Statement Table) ─────────────────────────
  autoTable(doc, {
    startY: 76,
    margin: { left: 14, right: 14, bottom: 18 },
    head: [['Date', 'Description', 'Category', 'Type', 'Need/Want', 'Amount']],
    body: rows.length > 0
      ? rows.map((r) => [r.date, r.description, r.category, r.type, r.needWant, r.amount])
      : [['—', 'No transactions found matching current filters', '—', '—', '—', '—']],
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: { top: 3.5, bottom: 3.5, left: 4, right: 4 },
      overflow: 'linebreak',
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      textColor: [30, 41, 59],
    },
    headStyles: {
      fillColor: [15, 23, 42], // Deep Navy #0F172A
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // #F8FAFC
    },
    columnStyles: {
      0: { cellWidth: 26 }, // Date
      1: { cellWidth: 'auto' }, // Description
      2: { cellWidth: 30 }, // Category
      3: { cellWidth: 20, halign: 'center' }, // Type
      4: { cellWidth: 22, halign: 'center' }, // Need/Want
      5: { cellWidth: 32, halign: 'right', fontStyle: 'bold' }, // Amount
    },
    didParseCell: (data) => {
      // Colorize Amount column: Green for credits (+), Red for debits (-), Blue for transfer
      if (data.section === 'body' && data.column.index === 5) {
        const raw = String(data.cell.raw || '');
        if (raw.startsWith('+')) {
          data.cell.styles.textColor = [0, 150, 60];
        } else if (raw.startsWith('-')) {
          data.cell.styles.textColor = [225, 29, 72];
        } else {
          data.cell.styles.textColor = [37, 99, 235];
        }
      }
      // Style Need/Want badge text
      if (data.section === 'body' && data.column.index === 4) {
        const raw = String(data.cell.raw || '');
        if (raw === 'Need') {
          data.cell.styles.textColor = [0, 82, 255];
          data.cell.styles.fontStyle = 'bold';
        } else if (raw === 'Want') {
          data.cell.styles.textColor = [0, 180, 80];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
    // Summary Totals Footer in Table
    foot: rows.length > 0 ? [[
      '',
      '',
      '',
      '',
      'NET TOTALS:',
      `${netFlow >= 0 ? '+' : ''}${pdfSym}${netFlow.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    ]] : undefined,
    footStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
  });

  // ── 5. Formal Bank Statement Footer on Every Page ──────────────────────────
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageH = doc.internal.pageSize.getHeight();

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(14, pageH - 12, pageW - 14, pageH - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);

    doc.text(
      `Kanakku Financial Statement  •  Official Confidential Record  •  Ref: ${statementRef}`,
      14,
      pageH - 7
    );

    doc.text(
      `Page ${i} of ${pageCount}`,
      pageW - 14 - doc.getTextWidth(`Page ${i} of ${pageCount}`),
      pageH - 7
    );
  }

  // Trigger download
  const cleanDateStr = now.toISOString().split('T')[0];
  doc.save(`Kanakku_Statement_${cleanDateStr}.pdf`);
};

// ─── Excel Export (.xlsx Multi-Sheet Workbook) ────────────────────────────────

export const exportExcel = (
  transactions: Transaction[],
  currencySymbol: string,
  userName: string,
  totalIncome?: number,
  totalExpenses?: number
): void => {
  const rows = buildExportRows(transactions, currencySymbol, false);
  const now = new Date();

  const computedIncome = totalIncome !== undefined
    ? totalIncome
    : transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);

  const computedExpenses = totalExpenses !== undefined
    ? totalExpenses
    : transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const netFlow = computedIncome - computedExpenses;

  // 1. Summary Sheet Content
  const summaryData = [
    ['KANAKKU — PERSONAL FINANCIAL STATEMENT'],
    ['Generated Automatically via Kanakku Money Manager'],
    [],
    ['Account Holder:', userName || 'Primary User'],
    ['Statement Date:', now.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })],
    ['Statement Time:', now.toLocaleTimeString('en-IN')],
    ['Total Records:', transactions.length],
    [],
    ['FINANCIAL SUMMARY METRICS', 'AMOUNT'],
    ['Total Income (Credits)', `${currencySymbol}${computedIncome.toFixed(2)}`],
    ['Total Expenses (Debits)', `${currencySymbol}${computedExpenses.toFixed(2)}`],
    ['Net Cash Flow', `${currencySymbol}${netFlow.toFixed(2)}`],
    ['Total Transactions Count', transactions.length],
  ];

  // 2. Transactions Sheet Content
  const txData = [
    ['Date', 'Time', 'Description', 'Category', 'Type', 'Need / Want', 'Formatted Amount', 'Numeric Value'],
    ...rows.map((r) => [
      r.date,
      r.time,
      r.description,
      r.category,
      r.type,
      r.needWant,
      r.amount,
      r.isExpense ? -r.rawAmount : r.rawAmount,
    ]),
  ];

  const wb = XLSX.utils.book_new();

  // Create & format Summary Worksheet
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary['!cols'] = [{ wch: 32 }, { wch: 28 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Statement Summary');

  // Create & format Transactions Worksheet
  const wsTx = XLSX.utils.aoa_to_sheet(txData);
  wsTx['!cols'] = [
    { wch: 15 }, // Date
    { wch: 12 }, // Time
    { wch: 36 }, // Description
    { wch: 22 }, // Category
    { wch: 14 }, // Type
    { wch: 14 }, // Need / Want
    { wch: 20 }, // Formatted Amount
    { wch: 16 }, // Numeric Value
  ];
  XLSX.utils.book_append_sheet(wb, wsTx, 'Transactions');

  // Trigger file download
  const cleanDateStr = now.toISOString().split('T')[0];
  XLSX.writeFile(wb, `Kanakku_Statement_${cleanDateStr}.xlsx`);
};
