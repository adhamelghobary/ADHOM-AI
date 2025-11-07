import React from 'react';

// FIX: Added children prop to allow custom loading messages. This resolves type errors in App.tsx.
const Loader: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
    return (
        <div className="absolute inset-0 bg-[var(--panel-bg)]/80 backdrop-blur-lg flex flex-col items-center justify-center z-10 rounded-xl">
            <div className="w-16 h-16 border-4 border-t-[var(--accent-color)] border-gray-700 rounded-full animate-spin"></div>
            {children ? (
                children
            ) : (
                <>
                    <p className="mt-4 text-lg font-semibold text-[var(--accent-color)] uppercase tracking-wider">A moment of magic...</p>
                    <p className="text-sm text-[var(--text-muted)]">ADHOM AI Creative Studio is bringing your idea to life.</p>
                </>
            )}
        </div>
    );
};

export default Loader;