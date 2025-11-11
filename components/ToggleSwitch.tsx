import React from 'react';

interface ToggleSwitchProps {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ label, checked, onChange }) => {
    const id = React.useId();
    return (
        <div className="flex items-center justify-between">
            <label htmlFor={id} className="text-sm font-medium text-[var(--text-muted)] cursor-pointer">
                {label}
            </label>
            <div className="relative inline-flex items-center cursor-pointer">
                <input 
                    type="checkbox" 
                    id={id}
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                    className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-black/30 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[var(--accent-color)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent-color)]"></div>
            </div>
        </div>
    );
};

export default ToggleSwitch;
