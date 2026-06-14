import React, { useState, useRef, useEffect } from 'react';
import { CalendarIcon } from './Icons';
import moment from 'moment-jalaali';

interface KamaDatePickerProps {
    value: string; // Expects "YYYY/MM/DD" or empty string
    onChange: (date: string) => void;
}

const KamaDatePicker: React.FC<KamaDatePickerProps> = ({ value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(value || '');
    const inputRef = useRef<HTMLInputElement>(null);
    const calendarRef = useRef<HTMLDivElement>(null);

    // Sync selectedDate with value prop when it changes
    useEffect(() => {
        setSelectedDate(value || '');
    }, [value]);

    // Convert Gregorian to Persian date using moment-jalaali
    const toPersianDate = (dateString: string | Date) => {
        let date: Date;
        if (typeof dateString === 'string') {
            // Handle YYYY/MM/DD format
            const parts = dateString.split('/');
            if (parts.length === 3) {
                // Create date in local timezone to avoid timezone issues
                date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            } else {
                date = new Date(dateString);
            }
        } else {
            date = dateString;
        }
        const m = moment(date);
        return {
            year: (m as any).jYear(),
            month: (m as any).jMonth() + 1,
            day: (m as any).jDate()
        };
    };

    // Convert Persian to Gregorian date using moment-jalaali
    const toGregorianDate = (persianYear: number, persianMonth: number, persianDay: number) => {
        const m = moment(`${persianYear}/${persianMonth}/${persianDay}`, 'jYYYY/jMM/jDD');
        return m.toDate();
    };

    // Get weekday for Persian date (0=Saturday, 1=Sunday, ..., 6=Friday)
    const getPersianWeekday = (persianYear: number, persianMonth: number, persianDay: number): number => {
        const gregorianDate = toGregorianDate(persianYear, persianMonth, persianDay);
        // JavaScript getDay(): 0=Sunday, 1=Monday, ..., 6=Saturday
        // Persian: 0=Saturday, 1=Sunday, 2=Monday, 3=Tuesday, 4=Wednesday, 5=Thursday, 6=Friday
        const jsDay = gregorianDate.getDay();
        // Convert: Saturday(6) -> 0, Sunday(0) -> 1, Monday(1) -> 2, etc.
        return (jsDay + 1) % 7;
    };

    // Generate calendar days
    const generateCalendarDays = () => {
        const today = new Date();
        const persianDate = selectedDate ? toPersianDate(selectedDate) : toPersianDate(today);
        const todayPersian = toPersianDate(today);
        
        // Calculate Persian month days correctly
        let monthDays = 30;
        if (persianDate.month <= 6) {
            monthDays = 31;
        } else if (persianDate.month === 12) {
            // Check if it's a leap year (simple check)
            monthDays = 29;
        }
        
        // Get weekday of first day of month
        const firstDayWeekday = getPersianWeekday(persianDate.year, persianDate.month, 1);
        
        const days = [];
        
        // Add empty cells for days before the first day of month
        for (let i = 0; i < firstDayWeekday; i++) {
            days.push({ day: null, isToday: false, isSelected: false });
        }
        
        // Add actual days of the month
        for (let day = 1; day <= monthDays; day++) {
            days.push({
                day,
                isToday: day === todayPersian.day && persianDate.month === todayPersian.month && persianDate.year === todayPersian.year,
                isSelected: selectedDate && day === persianDate.day
            });
        }
        
        return days;
    };

    const handleDateSelect = (day: number) => {
        const currentPersianDate = selectedDate ? toPersianDate(selectedDate) : toPersianDate(new Date());
        const newPersianDate = { ...currentPersianDate, day };
        const gregorianDate = toGregorianDate(newPersianDate.year, newPersianDate.month, newPersianDate.day);
        
        // Format as YYYY/MM/DD in local timezone to avoid timezone issues
        const year = gregorianDate.getFullYear();
        const month = String(gregorianDate.getMonth() + 1).padStart(2, '0');
        const dayStr = String(gregorianDate.getDate()).padStart(2, '0');
        const formattedDate = `${year}/${month}/${dayStr}`;
        
        setSelectedDate(formattedDate);
        onChange(formattedDate);
        setIsOpen(false);
    };

    const handleInputClick = () => {
        setIsOpen(!isOpen);
    };

    const handleOutsideClick = (e: MouseEvent) => {
        if (calendarRef.current && !calendarRef.current.contains(e.target as Node) && 
            inputRef.current && !inputRef.current.contains(e.target as Node)) {
            setIsOpen(false);
        }
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleOutsideClick);
        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
        };
    }, []);

    const calendarDays = generateCalendarDays();
    const persianMonths = [
        'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
        'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
    ];

    const persianDate = selectedDate ? toPersianDate(selectedDate) : toPersianDate(new Date());

    return (
        <div className="relative">
            <div className="date-input-container">
                <input
                    ref={inputRef}
                    type="text"
                    value={selectedDate}
                    onChange={(e) => {
                        setSelectedDate(e.target.value);
                        onChange(e.target.value);
                    }}
                    onClick={handleInputClick}
                    className="w-full border rounded-lg shadow-sm p-3 date-input text-gray-800 bg-white focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-[var(--color-primary-500)] border-gray-300 cursor-pointer"
                    placeholder="تاریخ را انتخاب کنید"
                    readOnly
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <CalendarIcon className="h-5 w-5 text-gray-400" />
                </div>
            </div>

            {isOpen && (
                <div
                    ref={calendarRef}
                    className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 p-4 min-w-[300px]"
                >
                    <div className="text-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">
                            {persianMonths[persianDate.month - 1]} {persianDate.year}
                        </h3>
                    </div>
                    
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'].map((day, index) => (
                            <div key={index} className="text-center text-sm font-medium text-gray-600 p-2">
                                {day}
                            </div>
                        ))}
                    </div>
                    
                    <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map(({ day, isToday, isSelected }, index) => (
                            day === null ? (
                                <div key={`empty-${index}`} className="p-2 text-sm"></div>
                            ) : (
                                <button
                                    key={day}
                                    onClick={() => handleDateSelect(day)}
                                    className={`
                                        p-2 text-sm rounded hover:bg-blue-100 transition-colors
                                        ${isToday ? 'bg-blue-200 font-semibold' : ''}
                                        ${isSelected ? 'bg-blue-500 text-white' : 'text-gray-700'}
                                    `}
                                >
                                    {day}
                                </button>
                            )
                        ))}
                    </div>
                    
                    <div className="flex justify-between mt-4">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                        >
                            بستن
                        </button>
                        <button
                            onClick={() => {
                                const today = new Date();
                                const year = today.getFullYear();
                                const month = String(today.getMonth() + 1).padStart(2, '0');
                                const day = String(today.getDate()).padStart(2, '0');
                                const formattedToday = `${year}/${month}/${day}`;
                                setSelectedDate(formattedToday);
                                onChange(formattedToday);
                                setIsOpen(false);
                            }}
                            className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                            امروز
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default KamaDatePicker;