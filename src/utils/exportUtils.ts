/**
 * exportUtils.ts
 * Professional bank-statement style PDF and Excel export for Kanakku
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Transaction, ExpenseTransaction, IncomeTransaction } from '../types';

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
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
  currencySymbol: string
): ExportRow[] =>
  [...transactions]
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
    .map((tx) => {
      const isExpense = tx.type === 'expense';
      const isIncome = tx.type === 'income';
      const sign = isExpense ? '-' : isIncome ? '+' : '';
      const description =
        tx.type === 'expense'
          ? (tx as ExpenseTransaction).description || (tx as ExpenseTransaction).category
          : tx.type === 'income'
          ? (tx as IncomeTransaction).source
          : `Transfer`;

      return {
        date: formatDate(tx),
        time: formatTime(tx),
        description,
        category:
          tx.type === 'expense'
            ? (tx as ExpenseTransaction).category
            : tx.type === 'income'
            ? 'Income'
            : 'Transfer',
        type: tx.type.charAt(0).toUpperCase() + tx.type.slice(1),
        needWant:
          tx.type === 'expense' ? (tx as ExpenseTransaction).needWant || '—' : '—',
        amount: `${sign}${currencySymbol}${tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        rawAmount: tx.amount,
        isExpense,
      };
    });

// ─── PDF Export ───────────────────────────────────────────────────────────────

export const exportPDF = (
  transactions: Transaction[],
  currencySymbol: string,
  userName: string,
  totalIncome: number,
  totalExpenses: number
): void => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const rows = buildExportRows(transactions, currencySymbol);
  const pageW = doc.internal.pageSize.getWidth();
  const now = new Date();
  const generatedOn = now.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // ── Header Band ──────────────────────────────────────────────────────────
  doc.setFillColor(10, 10, 10);
  doc.rect(0, 0, pageW, 38, 'F');

  // App name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text('Kanakku', 14, 16);

  // Tagline
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(180, 180, 180);
  doc.text('Personal Finance Statement', 14, 22);

  // Account holder
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(`Account Holder: ${userName}`, 14, 30);

  // Generated date (right aligned)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(180, 180, 180);
  const dateLabel = `Generated: ${generatedOn}`;
  const dateW = doc.getTextWidth(dateLabel);
  doc.text(dateLabel, pageW - dateW - 14, 30);

  // ── Summary Strip ────────────────────────────────────────────────────────
  doc.setFillColor(245, 246, 248);
  doc.rect(0, 38, pageW, 20, 'F');

  const netFlow = totalIncome - totalExpenses;
  const summaryItems = [
    { label: 'Total Income', value: `+${currencySymbol}${totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, color: [0, 160, 80] as [number,number,number] },
    { label: 'Total Expenses', value: `-${currencySymbol}${totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, color: [220, 50, 80] as [number,number,number] },
    { label: 'Net Cash Flow', value: `${netFlow >= 0 ? '+' : ''}${currencySymbol}${Math.abs(netFlow).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, color: netFlow >= 0 ? [0, 100, 220] as [number,number,number] : [200, 60, 40] as [number,number,number] },
    { label: 'Total Transactions', value: `${transactions.length}`, color: [80, 80, 80] as [number,number,number] },
  ];

  const colW = pageW / summaryItems.length;
  summaryItems.forEach((item, i) => {
    const x = i * colW + 14;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text(item.label, x, 45);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...item.color);
    doc.text(item.value, x, 52);
  });

  // ── Section title ────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 30, 30);
  doc.text('TRANSACTION HISTORY', 14, 66);

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(14, 68, pageW - 14, 68);

  // ── AutoTable ────────────────────────────────────────────────────────────
  autoTable(doc, {
    startY: 71,
    margin: { left: 14, right: 14 },
    head: [['Date', 'Description', 'Category', 'Type', 'Need/Want', 'Amount']],
    body: rows.map((r) => [r.date, r.description, r.category, r.type, r.needWant, r.amount]),
    styles: {
      font: 'helvetica',
      fontSize: 7.5,
      cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
      overflow: 'linebreak',
      lineColor: [230, 230, 230],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [20, 20, 20],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 24 },          // Date
      1: { cellWidth: 'auto' },      // Description
      2: { cellWidth: 28 },          // Category
      3: { cellWidth: 18 },          // Type
      4: { cellWidth: 18 },          // Need/Want
      5: { cellWidth: 28, halign: 'right', fontStyle: 'bold' }, // Amount
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 5) {
        const raw = data.cell.raw as string;
        if (raw.startsWith('+')) {
          data.cell.styles.textColor = [0, 150, 70];
        } else if (raw.startsWith('-')) {
          data.cell.styles.textColor = [210, 40, 60];
        }
      }
    },
    // Footer row with totals
    foot: [[
      '',
      '',
      '',
      '',
      'TOTALS',
      `+${currencySymbol}${totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })} / -${currencySymbol}${totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
    ]],
    footStyles: {
      fillColor: [10, 10, 10],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
    },
  });

  // ── Footer on every page ─────────────────────────────────────────────────
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageH = doc.internal.pageSize.getHeight();
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(160, 160, 160);
    doc.text(
      `Kanakku Financial Statement  •  Confidential  •  Page ${i} of ${pageCount}`,
      pageW / 2,
      pageH - 8,
      { align: 'center' }
    );
  }

  doc.save(`Kanakku_Statement_${now.toISOString().split('T')[0]}.pdf`);
};

// ─── Excel Export ─────────────────────────────────────────────────────────────

export const exportExcel = (
  transactions: Transaction[],
  currencySymbol: string,
  userName: string,
  totalIncome: number,
  totalExpenses: number
): void => {
  const rows = buildExportRows(transactions, currencySymbol);
  const now = new Date();

  // Summary sheet
  const summaryData = [
    ['Kanakku — Personal Finance Statement'],
    [`Account Holder: ${userName}`],
    [`Generated: ${now.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}`],
    [],
    ['Metric', 'Value'],
    ['Total Income', `${currencySymbol}${totalIncome.toFixed(2)}`],
    ['Total Expenses', `${currencySymbol}${totalExpenses.toFixed(2)}`],
    ['Net Cash Flow', `${currencySymbol}${(totalIncome - totalExpenses).toFixed(2)}`],
    ['Total Transactions', transactions.length],
  ];

  // Transactions sheet
  const txData = [
    ['Date', 'Time', 'Description', 'Category', 'Type', 'Need/Want', 'Amount', 'Raw Amount (numeric)'],
    ...rows.map((r) => [r.date, r.time, r.description, r.category, r.type, r.needWant, r.amount, r.isExpense ? -r.rawAmount : r.rawAmount]),
  ];

  const wb = XLSX.utils.book_new();

  // Summary worksheet
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary['!cols'] = [{ wch: 30 }, { wch: 24 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

  // Transactions worksheet
  const wsTx = XLSX.utils.aoa_to_sheet(txData);
  wsTx['!cols'] = [
    { wch: 16 }, { wch: 10 }, { wch: 36 }, { wch: 20 },
    { wch: 12 }, { wch: 12 }, { wch: 18 }, { wch: 20 },
  ];
  XLSX.utils.book_append_sheet(wb, wsTx, 'Transactions');

  XLSX.writeFile(wb, `Kanakku_Statement_${now.toISOString().split('T')[0]}.xlsx`);
};
