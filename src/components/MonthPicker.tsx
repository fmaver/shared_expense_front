import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MonthPickerProps {
  year: number;
  month: number;
  onNavigate: (year: number, month: number) => void;
}

export function MonthPicker({ year, month, onNavigate }: MonthPickerProps) {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    const newMonth = month === 1 ? 12 : month - 1;
    const newYear = month === 1 ? year - 1 : year;
    onNavigate(newYear, newMonth);
  };

  const handleNextMonth = () => {
    const newMonth = month === 12 ? 1 : month + 1;
    const newYear = month === 12 ? year + 1 : year;
    onNavigate(newYear, newMonth);
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedMonth = parseInt(e.target.value);
    onNavigate(year, selectedMonth);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedYear = parseInt(e.target.value);
    onNavigate(selectedYear, month);
  };

  return (
    <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow mb-4">
      <button
        onClick={handlePrevMonth}
        className="p-2 hover:bg-gray-100 rounded-full"
      >
        <ChevronLeft size={20} />
      </button>

      <div className="flex items-center space-x-4">
        <select
          value={month}
          onChange={handleMonthChange}
          className="border rounded-md p-1"
        >
          {months.map((monthName, index) => (
            <option key={index} value={index + 1}>
              {monthName}
            </option>
          ))}
        </select>

        <select
          value={year}
          onChange={handleYearChange}
          className="border rounded-md p-1"
        >
          {/* You can adjust the range of years as needed */}
          {Array.from({ length: 10 }, (_, i) => year - 5 + i).map((yr) => (
            <option key={yr} value={yr}>
              {yr}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={handleNextMonth}
        className="p-2 hover:bg-gray-100 rounded-full"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
}