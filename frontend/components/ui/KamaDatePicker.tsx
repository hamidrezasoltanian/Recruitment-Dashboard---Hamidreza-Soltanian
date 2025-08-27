

import React, { useEffect, useMemo, useRef } from 'react';
import { generateId } from '../../utils/idUtils';
import { CalendarIcon } from './Icons';

// Let TypeScript know about the global functions
declare const kamaDatepicker: any;
declare const persianDate: any;

interface KamaDatePickerProps {
    value: string; // Expects ISO string or empty string
    onChange: (date: string) => void; // Emits ISO string
}

const KamaDatePicker: React.FC<KamaDatePickerProps> = ({ value, onChange }) => {
    const inputId = useMemo(() => `datepicker-${generateId()}`, []);
    const onChangeRef = useRef(onChange);

    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);
    
    const displayedValue = useMemo(() => {
        if (!value || typeof persianDate === 'undefined') return '';
        try {
            // Convert ISO string to a persianDate object and format it
            return new persianDate(new Date(value)).format('YYYY/MM/DD');
        } catch {
            return '';
        }
    }, [value]);

    useEffect(() => {
        if (typeof kamaDatepicker === 'undefined' || typeof persianDate === 'undefined') {
            console.error('kamaDatepicker or persianDate function is not loaded.');
            return;
        }

        const datePickerOptions = {
            format: 'YYYY/MM/DD',
            closeafterselect: true,
            nextButtonIcon: "→",
            previousButtonIcon: "←",
            forceFarsiDigits: true,
            markToday: true,
            gotoToday: true,
            onclose: () => {
                const inputElement = document.getElementById(inputId) as HTMLInputElement;
                if (inputElement && inputElement.value) {
                    try {
                        const [y, m, d] = inputElement.value.split('/').map(Number);
                        const gregorianDate = new persianDate([y, m, d]).toDate();
                        
                        // Create a new Date object in UTC to avoid timezone shifts
                        const utcDate = new Date(Date.UTC(gregorianDate.getFullYear(), gregorianDate.getMonth(), gregorianDate.getDate()));
                        const newIsoValue = utcDate.toISOString();

                        if (newIsoValue !== value) {
                            onChangeRef.current(newIsoValue);
                        }
                    } catch (e) {
                         console.error("Invalid Persian date format in input", e);
                         inputElement.value = displayedValue;
                    }
                } else if (value) {
                    // If input is cleared, send empty string
                    onChangeRef.current('');
                }
            }
        };

        kamaDatepicker(inputId, datePickerOptions);

        return () => {
            const pickerElement = document.querySelector('.bd-main');
            if (pickerElement) {
                pickerElement.remove();
            }
        };
    }, [inputId, value, displayedValue]);

    useEffect(() => {
        const inputElement = document.getElementById(inputId) as HTMLInputElement;
        if (inputElement) {
            inputElement.value = displayedValue;
        }
    }, [displayedValue, inputId]);


    return (
        <div className="date-input-container">
            <input
                id={inputId}
                type="text"
                defaultValue={displayedValue}
                className="w-full border rounded-lg shadow-sm p-3 date-input text-gray-800 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-gray-300"
                placeholder="YYYY/MM/DD"
                autoComplete="off"
            />
            <div className="date-input-icon">
                <CalendarIcon className="h-5 w-5" />
            </div>
        </div>
    );
};

export default KamaDatePicker;