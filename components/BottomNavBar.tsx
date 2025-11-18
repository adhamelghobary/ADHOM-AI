
import React from 'react';
import { HomeIcon, SparklesIcon, UserCircleIcon, FilmIcon } from './Icons';

interface BottomNavBarProps {
    mode: 'studio' | 'generate' | 'portrait' | 'director';
    onModeChange: (mode: 'studio' | 'generate' | 'portrait' | 'director') => void;
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
        <span className="text-[10px] xs:text-xs font-bold">{label}</span>
    </button>
);


const BottomNavBar: React.FC<BottomNavBarProps> = ({ mode, onModeChange }) => {
    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-black/50 backdrop-blur-xl border-t border-[var(--border-color)] z-40">
            <div className="flex justify-between items-stretch h-full px-2">
                <NavItem
                    label="Studio"
                    icon={<HomeIcon className="w-6 h-6" />}
                    isActive={mode === 'studio'}
                    onClick={() => onModeChange('studio')}
                />
                 <NavItem
                    label="Magic Shot"
                    icon={<FilmIcon className="w-6 h-6" />}
                    isActive={mode === 'director'}
                    onClick={() => onModeChange('director')}
                />
                <NavItem
                    label="Generate"
                    icon={<SparklesIcon className="w-6 h-6" />}
                    isActive={mode === 'generate'}
                    onClick={() => onModeChange('generate')}
                />
                <NavItem
                    label="Retouch"
                    icon={<UserCircleIcon className="w-6 h-6" />}
                    isActive={mode === 'portrait'}
                    onClick={() => onModeChange('portrait')}
                />
            </div>
        </nav>
    );
};

export default BottomNavBar;
