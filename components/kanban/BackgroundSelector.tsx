import React, { useState, useRef } from 'react';

const backgrounds = [
  { id: 'default', name: 'Default', url: '' },
  { id: 'img1', name: 'Mountains', url: 'https://images.unsplash.com/photo-1549880338-65ddcdfd017b?q=80&w=2070&auto=format&fit=crop' },
  { id: 'img2', name: 'Abstract', url: 'https://images.unsplash.com/photo-1553356084-58ef4a67b2a7?q=80&w=1974&auto=format&fit=crop' },
  { id: 'img3', name: 'Forest', url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=2070&auto=format&fit=crop' },
  { id: 'img4', name: 'City', url: 'https://images.unsplash.com/photo-1480714378408-67cf0d136b77?q=80&w=2070&auto=format&fit=crop' },
];

interface BackgroundSelectorProps {
  onSelect: (url: string) => void;
}

const BackgroundSelector: React.FC<BackgroundSelectorProps> = ({ onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit for localStorage safety
        alert('حجم فایل نباید بیشتر از 2 مگابایت باشد.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        onSelect(dataUrl);
        setIsOpen(false);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="relative mb-4">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="bg-white/80 backdrop-blur-sm text-gray-700 font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-white transition-colors text-sm"
      >
        🎨 تغییر پس‌زمینه
      </button>
      {isOpen && (
        <div className="absolute top-full mt-2 bg-white rounded-lg shadow-xl p-2 flex gap-2 z-40">
          {backgrounds.map(bg => (
            <button key={bg.id} onClick={() => { onSelect(bg.url); setIsOpen(false); }} className="w-16 h-12 rounded-md overflow-hidden focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2" title={bg.name}>
              {bg.url ? (
                <img src={bg.url} alt={bg.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-xs text-gray-600">پیش‌فرض</div>
              )}
            </button>
          ))}
          {/* Custom upload button */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-16 h-12 rounded-md overflow-hidden focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 bg-gray-200 flex flex-col items-center justify-center text-xs text-gray-600 hover:bg-gray-300 transition-colors"
            title="آپلود تصویر"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            <span>آپلود</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default BackgroundSelector;