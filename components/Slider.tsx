import React from 'react';

interface SliderProps {
    label: string;
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    valuePrefix?: string;
    valueSuffix?: string;
}

const Slider: React.FC<SliderProps> = ({ label, value, onChange, min = 0, max = 100, step = 1, valuePrefix = '', valueSuffix = '' }) => {
    return (
        <div>
            <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-medium text-[var(--text-muted)]">{label}</label>
                <span className="text-sm font-bold text-[var(--text-light)] bg-black/30 px-2 py-0.5 rounded-md w-20 text-center">
                    {valuePrefix}{value}{valueSuffix}
                </span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                className="w-full"
            />
        </div>
    );
};

export default Slider;