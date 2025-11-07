import React, { useState, useRef, useCallback, useEffect } from 'react';
import { DownloadIcon } from './Icons';
import { ImageFile } from '../types';

interface ImageUploaderProps {
    title: string;
    description: string;
    onImageChange: (image: ImageFile | null) => void;
    image?: ImageFile | null; // Make component controllable
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ title, description, onImageChange, image }) => {
    const [preview, setPreview] = useState<string | null>(null);
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (image) {
            setPreview(`data:${image.mimeType};base64,${image.base64}`);
        } else {
            setPreview(null);
        }
    }, [image]);

    const processFile = useCallback((file: File | null) => {
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Please drop or select an image file.');
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = (reader.result as string).split(',')[1];
            setPreview(reader.result as string);
            onImageChange({ file, base64: base64String, mimeType: file.type });
        };
        reader.readAsDataURL(file);
    }, [onImageChange]);


    const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            processFile(file);
        }
    }, [processFile]);
    
    const handlePaste = useCallback((event: React.ClipboardEvent<HTMLDivElement>) => {
        const items = event.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const file = items[i].getAsFile();
                if(file){
                   processFile(file);
                }
                event.preventDefault();
                break; 
            }
        }
    }, [processFile]);


    const handleRemove = () => {
        setPreview(null);
        onImageChange(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };
    
    // Drag and Drop Handlers
    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(true);
    };
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(false);
    };
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            processFile(file);
        }
    };

    return (
        <div>
            <h3 className="font-semibold text-[var(--text-light)] text-lg">{title}</h3>
            <p className="text-sm text-[var(--text-muted)] mb-3">{description}</p>
            <div
                className={`relative border-2 border-dashed bg-[rgba(16,18,27,0.5)] backdrop-blur-[30px] rounded-2xl p-4 text-center cursor-pointer hover:border-[var(--accent-color)] transition-all duration-300 group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-[var(--accent-color)] ${
                    isDraggingOver ? 'border-[var(--accent-color)] scale-105' : 'border-[var(--border-color)]'
                }`}
                onClick={() => fileInputRef.current?.click()}
                onPaste={handlePaste}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                tabIndex={0}
                role="button"
                aria-label="Image uploader, click to browse, paste, or drag and drop an image"
            >
                {preview ? (
                    <>
                        <img src={preview} alt="Preview" className="max-h-36 mx-auto rounded-lg" />
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRemove();
                            }}
                            className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1.5 hover:bg-red-500 transition-all scale-90 opacity-80 group-hover:scale-100 group-hover:opacity-100"
                            aria-label="Remove image"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </>
                ) : (
                    <div className="py-4 flex flex-col items-center justify-center gap-2">
                        <DownloadIcon className={`h-10 w-10 transition-colors ${isDraggingOver ? 'text-[var(--accent-color)]' : 'text-[var(--text-muted)] group-hover:text-[var(--accent-color)]'}`} />
                        <div>
                            <p className="font-medium text-[var(--text-light)]">{isDraggingOver ? 'Drop your image here!' : 'Click to upload or drag & drop'}</p>
                            <p className="text-xs text-[var(--text-disabled)]">Or paste from clipboard &bull; PNG, JPG, WEBP</p>
                        </div>
                    </div>
                )}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*"
                />
            </div>
        </div>
    );
};

export default ImageUploader;