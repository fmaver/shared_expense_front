import { ExpenseResponse, Member } from '../types/expense';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { capitalize } from './format';

interface MonthlyData {
  year: number;
  month: number;
  expenses: ExpenseResponse[];
  balances: Record<string, number>;
  isSettled: boolean;
}

export function exportMonthlyData(data: MonthlyData, members: Member[]) {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getMemberName = (id: number) => {
    return members.find(m => m.id === id)?.name || 'Unknown';
  };

  // Create PDF document
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.width;

  // Add title
  const title = `Expense Report - ${monthNames[data.month - 1]} ${data.year}`;
  pdf.setFontSize(20);
  pdf.text(title, pageWidth / 2, 20, { align: 'center' });

  // Add settlement status if settled
  if (data.isSettled) {
    pdf.setFontSize(12);
    pdf.setTextColor(34, 197, 94); // green-600
    pdf.text('Monthly Share Settled', pageWidth / 2, 30, { align: 'center' });
    pdf.setTextColor(0, 0, 0); // Reset to black
  }

  // Add balances section
  pdf.setFontSize(16);
  pdf.text('Current Balances', 14, 40);
  
  const balanceRows = Object.entries(data.balances).map(([memberId, balance]) => {
    const memberName = getMemberName(parseInt(memberId));
    return [
      memberName,
      `${balance >= 0 ? '+$' : '-$'}${Math.abs(balance).toFixed(2)}`
    ];
  });

  autoTable(pdf, {
    startY: 45,
    head: [['Member', 'Balance']],
    body: balanceRows,
    theme: 'striped',
    headStyles: { fillColor: [75, 85, 99] },
    margin: { left: 14 },
    styles: { fontSize: 10 }
  });

  // Add expenses section
  pdf.setFontSize(16);
  pdf.text('Expenses', 14, pdf.lastAutoTable.finalY + 20);

  // Sort expenses by date
  const sortedExpenses = [...data.expenses].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const expenseRows = sortedExpenses.map(expense => [
    new Date(expense.date).toLocaleDateString(),
    capitalize(expense.description),
    `$${expense.amount.toFixed(2)}`,
    capitalize(expense.category),
    getMemberName(expense.payerId),
    capitalize(expense.paymentType),
    expense.splitStrategy.type === 'percentage' 
      ? Object.entries(expense.splitStrategy.percentages || {})
          .map(([memberId, percentage]) => `${getMemberName(parseInt(memberId))}: ${percentage}%`)
          .join(', ')
      : capitalize(expense.splitStrategy.type)
  ]);

  autoTable(pdf, {
    startY: pdf.lastAutoTable.finalY + 25,
    head: [['Date', 'Description', 'Amount', 'Category', 'Payer', 'Payment Type', 'Split Type']],
    body: expenseRows,
    theme: 'striped',
    headStyles: { fillColor: [75, 85, 99] },
    margin: { left: 14 },
    styles: { fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 22 }, 
      1: { cellWidth: 45 }, 
      2: { cellWidth: 20 }, 
      3: { cellWidth: 25 }, 
      4: { cellWidth: 25 }, 
      5: { cellWidth: 18 }, 
      6: { cellWidth: 27 } 
    }
  });

  // Add footer with total
  const total = data.expenses.reduce((sum, expense) => sum + expense.amount, 0);
  pdf.setFontSize(12);
  pdf.text(`Total Expenses: $${total.toFixed(2)}`, 14, pdf.lastAutoTable.finalY + 15);

  // Save the PDF
  pdf.save(`expenses-${data.year}-${String(data.month).padStart(2, '0')}.pdf`);
}
