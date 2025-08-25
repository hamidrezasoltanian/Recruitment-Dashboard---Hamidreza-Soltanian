import React, { useState } from 'react';

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
        </div>
      )}
    </div>
  );
};

export default BackgroundSelector;