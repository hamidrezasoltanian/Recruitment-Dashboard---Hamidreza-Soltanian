import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CalendarIcon } from './Icons';

declare const persianDate: any;

interface PersianDatePickerProps {
    value: string; // "YYYY/MM/DD" or empty
    onChange: (date: string) => void;
    placeholder?: string;
}

const WEEKDAY_LABELS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];
const MONTH_NAMES = [
    'فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور',
    'مهر','آبان','آذر','دی','بهمن','اسفند'
];

function toPersianDigits(n: number | string): string {
    return String(n).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d]);
}

function toLatinDigits(s: string): string {
    return s
        .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
        .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
}

function parseValue(value: string): { year: number; month: number; day: number } | null {
    if (!value) return null;
    const parts = toLatinDigits(value).split('/').map(Number);
    if (parts.length === 3 && !parts.some(isNaN)) {
        return { year: parts[0], month: parts[1], day: parts[2] };
    }
    return null;
}

function getTodayPersian(): { year: number; month: number; day: number } {
    try {
        const pd = new persianDate();
        return { year: pd.year(), month: pd.month(), day: pd.date() };
    } catch {
        return { year: 1403, month: 1, day: 1 };
    }
}

function buildCalendarDays(year: number, month: number): (number | null)[] {
    try {
        const firstDay = new persianDate([year, month, 1]);
        const daysInMonth = firstDay.daysInMonth();
        // persianDate week starts Saturday=0 ... Friday=6
        let startDow = firstDay.day(); // 0=شنبه, 1=یکشنبه, ... 6=جمعه
        // Our grid header: ش ی د س چ پ ج  → Saturday first
        const cells: (number | null)[] = [];
        for (let i = 0; i < startDow; i++) cells.push(null);
        for (let d = 1; d <= daysInMonth; d++) cells.push(d);
        return cells;
    } catch {
        return [];
    }
}

const PersianDatePicker: React.FC<PersianDatePickerProps> = ({ value, onChange, placeholder = 'YYYY/MM/DD' }) => {
    const today = getTodayPersian();
    const parsed = parseValue(value);

    const [open, setOpen] = useState(false);
    const [viewYear, setViewYear] = useState(parsed?.year ?? today.year);
    const [viewMonth, setViewMonth] = useState(parsed?.month ?? today.month);
    const [inputText, setInputText] = useState(value);

    const containerRef = useRef<HTMLDivElement>(null);

    // Sync input text when value prop changes externally
    useEffect(() => {
        setInputText(value);
        if (value) {
            const p = parseValue(value);
            if (p) { setViewYear(p.year); setViewMonth(p.month); }
        }
    }, [value]);

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const selectDay = useCallback((day: number) => {
        const m = String(viewMonth).padStart(2, '0');
        const d = String(day).padStart(2, '0');
        const formatted = `${viewYear}/${m}/${d}`;
        onChange(formatted);
        setInputText(formatted);
        setOpen(false);
    }, [viewYear, viewMonth, onChange]);

    const prevMonth = () => {
        if (viewMonth === 1) { setViewMonth(12); setViewYear(y => y - 1); }
        else setViewMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (viewMonth === 12) { setViewMonth(1); setViewYear(y => y + 1); }
        else setViewMonth(m => m + 1);
    };

    const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const raw = e.target.value.trim();
        const latin = toLatinDigits(raw);
        if (/^\d{4}\/\d{2}\/\d{2}$/.test(latin) || raw === '') {
            if (latin !== value) onChange(latin);
        } else {
            setInputText(value);
        }
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange('');
        setInputText('');
        setOpen(false);
    };

    const cells = buildCalendarDays(viewYear, viewMonth);

    const isSelected = (day: number) =>
        parsed?.year === viewYear && parsed?.month === viewMonth && parsed?.day === day;

    const isToday = (day: number) =>
        today.year === viewYear && today.month === viewMonth && today.day === day;

    return (
        <div ref={containerRef} className="relative w-full">
            {/* Input Row */}
            <div className="relative">
                <input
                    type="text"
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    onBlur={handleInputBlur}
                    onFocus={() => setOpen(true)}
                    placeholder={placeholder}
                    autoComplete="off"
                    className="w-full border rounded-lg shadow-sm py-3 pl-10 pr-3 text-gray-800 bg-white focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-[var(--color-primary-500)] border-gray-300 text-sm"
                    dir="ltr"
                />
                <button
                    type="button"
                    onClick={() => setOpen(o => !o)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                    tabIndex={-1}
                >
                    <CalendarIcon className="h-5 w-5" />
                </button>
                {value && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 text-lg leading-none"
                        tabIndex={-1}
                        title="پاک کردن"
                    >
                        ×
                    </button>
                )}
            </div>

            {/* Calendar Popup */}
            {open && (
                <div className="absolute z-50 mt-1 bg-white rounded-xl shadow-xl border border-gray-200 w-72 p-3 select-none"
                    style={{ direction: 'rtl' }}>
                    {/* Header: nav + month/year */}
                    <div className="flex items-center justify-between mb-3">
                        <button type="button" onClick={nextMonth}
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 font-bold text-lg">
                            ‹
                        </button>
                        <span className="text-sm font-bold text-gray-800">
                            {MONTH_NAMES[viewMonth - 1]} {toPersianDigits(viewYear)}
                        </span>
                        <button type="button" onClick={prevMonth}
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 font-bold text-lg">
                            ›
                        </button>
                    </div>

                    {/* Weekday headers */}
                    <div className="grid grid-cols-7 mb-1">
                        {WEEKDAY_LABELS.map(d => (
                            <div key={d} className="text-center text-xs font-semibold text-gray-500 py-1">{d}</div>
                        ))}
                    </div>

                    {/* Day grid */}
                    <div className="grid grid-cols-7 gap-y-1">
                        {cells.map((cell, i) => {
                            if (cell === null) return <div key={`e-${i}`} />;
                            const sel = isSelected(cell);
                            const tod = isToday(cell);
                            return (
                                <button
                                    key={`d-${cell}`}
                                    type="button"
                                    onClick={() => selectDay(cell)}
                                    className={[
                                        'w-full aspect-square flex items-center justify-center rounded-full text-xs font-medium transition-colors',
                                        sel ? 'bg-[var(--color-primary-600)] text-white' :
                                        tod ? 'bg-[var(--color-primary-100)] text-[var(--color-primary-700)] font-bold' :
                                              'hover:bg-gray-100 text-gray-700'
                                    ].join(' ')}
                                >
                                    {toPersianDigits(cell)}
                                </button>
                            );
                        })}
                    </div>

                    {/* Footer: today button */}
                    <div className="mt-3 pt-2 border-t border-gray-100 flex justify-center">
                        <button
                            type="button"
                            onClick={() => {
                                setViewYear(today.year);
                                setViewMonth(today.month);
                                selectDay(today.day);
                            }}
                            className="text-xs text-[var(--color-primary-600)] hover:underline font-medium"
                        >
                            امروز: {toPersianDigits(today.year)}/{toPersianDigits(String(today.month).padStart(2,'0'))}/{toPersianDigits(String(today.day).padStart(2,'0'))}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PersianDatePicker;
