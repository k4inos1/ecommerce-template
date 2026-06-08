'use client';

import { useRef, useState } from 'react';
import { Upload, X, ImageIcon } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
}

const sanitizeImageUrl = (raw: string): string => {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  try {
    const parsed = new URL(trimmed, window.location.origin);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.toString() : '';
  } catch {
    return '';
  }
};

export function ImageUploader({ value, onChange }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const safeValue = sanitizeImageUrl(value);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) { setError('Solo se aceptan imágenes'); return; }
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('image', file);
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      const safeUrl = sanitizeImageUrl(String(data.url || ''));
      if (!safeUrl) throw new Error('Invalid image URL');
      onChange(safeUrl);
    } catch {
      setError('Error al subir imagen. Verifica las credenciales de Cloudinary.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-2">
      <label className="text-xs text-gray-400 block">Imagen</label>

      {safeValue ? (
        <div className="relative rounded-lg overflow-hidden border border-gray-700">
          <img src={safeValue} alt="Product" className="w-full h-40 object-cover" />
          <button type="button" onClick={() => onChange('')}
            className="absolute top-2 right-2 bg-black/70 text-white p-1.5 rounded-lg hover:bg-red-500 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center cursor-pointer hover:border-brand transition-colors">
          <input ref={inputRef} type="file" accept="image/*" className="hidden"
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin w-6 h-6 border-2 border-brand border-t-transparent rounded-full" />
              <span className="text-xs text-gray-400">Subiendo a Cloudinary...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-gray-500">
              <ImageIcon className="w-8 h-8" />
              <span className="text-xs">Arrastra una imagen o haz clic para subir</span>
              <span className="text-xs text-gray-600">PNG, JPG, WEBP (máx 5MB)</span>
            </div>
          )}
        </div>
      )}

      {/* URL manual fallback */}
      <input type="url" placeholder="O pega una URL de imagen..."
        value={value} onChange={e => {
          const nextValue = e.target.value;
          const safeUrl = sanitizeImageUrl(nextValue);
          if (!nextValue.trim() || safeUrl) {
            setError('');
            onChange(safeUrl);
          } else {
            setError('URL de imagen inválida. Usa http(s).');
          }
        }}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-xs text-white placeholder-gray-600 focus:border-brand focus:outline-none" />

      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  );
}
