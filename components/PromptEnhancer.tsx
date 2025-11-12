import React from 'react';
import { PROMPT_ENHANCER_KEYWORDS } from '../constants';

interface PromptEnhancerProps {
    onSelectKeyword: (keyword: string) => void;
}

const PromptEnhancer: React.FC<PromptEnhancerProps> = ({ onSelectKeyword }) => {
    return (
        <div className="space-y-3">
            {PROMPT_ENHANCER_KEYWORDS.map(({ category, keywords }) => (
                <div key={category}>
                    <h4 className="font-semibold text-sm text-[var(--text-muted)] mb-2">{category}</h4>
                    <div className="flex flex-wrap gap-2">
                        {keywords.map(keyword => (
                            <button
                                key={keyword}
                                onClick={() => onSelectKeyword(keyword)}
                                className="px-3 py-1.5 text-xs font-semibold bg-[rgba(255,255,255,0.05)] text-gray-300 rounded-full border border-transparent hover:border-[var(--accent-color)]/50 hover:bg-[var(--accent-color)]/10 hover:text-white transition-all transform hover:scale-105"
                            >
                                {keyword}
                            </button>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default PromptEnhancer;
