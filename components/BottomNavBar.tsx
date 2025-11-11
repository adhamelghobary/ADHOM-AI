
import React from 'react';
import { HomeIcon, SparklesIcon, UserCircleIcon } from './Icons';

interface BottomNavBarProps {
    mode: 'studio' | 'generate' | 'portrait';
    onModeChange: (mode: 'studio' | 'generate' | 'portrait') => void;
}

const NavItem: React.FC<{
    label: string;
    icon: React.ReactNode;
    isActive: boolean;
    onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex flex-col items-center justify-center gap-1 w-full h-full pt-2 pb-1 transition-colors duration-200 ${
            isActive ? 'text-[var(--accent-color)]' : 'text-[var(--text-muted)] hover:text-white'
        }`}
    >
        {icon}
        <span className="text-xs font-bold">{label}</span>
    </button>
);


const BottomNavBar: React.FC<BottomNavBarProps> = ({ mode, onModeChange }) => {
    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-black/50 backdrop-blur-xl border-t border-[var(--border-color)] z-40">
            <div className="flex justify-around items-stretch h-full">
                <NavItem
                    label="Studio"
                    icon={<HomeIcon className="w-7 h-7" />}
                    isActive={mode === 'studio'}
                    onClick={() => onModeChange('studio')}
                />
                <NavItem
                    label="Generate"
                    icon={<SparklesIcon className="w-7 h-7" />}
                    isActive={mode === 'generate'}
                    onClick={() => onModeChange('generate')}
                />
                <NavItem
                    label="Retouch"
                    icon={<UserCircleIcon className="w-7 h-7" />}
                    isActive={mode === 'portrait'}
                    onClick={() => onModeChange('portrait')}
                />
            </div>
        </nav>
    );
};

export default BottomNavBar;
