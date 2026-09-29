import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  X,
  CheckCircle,
  Eye,
} from 'lucide-react';

export interface SelectedFileMetadata {
  fileName: string;
  fileType: string;
  fileSize: string;
  fileBlobUrl: string;
  file: File;
}

interface FileUploadZoneProps {
  onFileSelect: (metadata: SelectedFileMetadata) => void;
  onFileRemove?: () => void;
  selectedFile?: SelectedFileMetadata | null;
  accept?: string;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function detectFileType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toUpperCase() || 'PDF';
  if (['PDF'].includes(ext)) return 'PDF';
  if (['DOC', 'DOCX'].includes(ext)) return 'DOCX';
  if (['XLS', 'XLSX'].includes(ext)) return 'XLSX';
  if (['ZIP', 'RAR', '7Z'].includes(ext)) return 'ZIP';
  if (['CSV'].includes(ext)) return 'CSV';
  return ext;
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  onFileSelect,
  onFileRemove,
  selectedFile,
  accept = '.pdf,.doc,.docx,.xls,.xlsx,.zip,.csv,.txt',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const processFile = (file: File) => {
    const fileName = file.name;
    const fileType = detectFileType(fileName);
    const fileSize = formatFileSize(file.size);
    const fileBlobUrl = URL.createObjectURL(file);

    onFileSelect({
      fileName,
      fileType,
      fileSize,
      fileBlobUrl,
      file,
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-2">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleInputChange}
        accept={accept}
        className="hidden"
      />

      {selectedFile ? (
        <div className="p-3 bg-surface border border-emerald-300 rounded-sm shadow-subtle flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-sm shrink-0 border border-emerald-200">
              <FileText className="w-5 h-5" />
            </div>

            <div className="truncate">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-ink text-xs truncate">
                  {selectedFile.fileName}
                </span>
                <span className="font-mono text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-1.5 py-0.2 rounded-sm border border-emerald-300 shrink-0">
                  {selectedFile.fileType}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-ink-muted mt-0.5">
                <span>{selectedFile.fileSize}</span>
                <span>•</span>
                <span className="text-emerald-700 font-medium flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Ready for upload
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {selectedFile.fileBlobUrl && (
              <a
                href={selectedFile.fileBlobUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 text-ink-muted hover:text-primary hover:bg-surface-soft rounded-sm transition-colors"
                title="Preview selected file in new tab"
              >
                <Eye className="w-4 h-4" />
              </a>
            )}

            <button
              type="button"
              onClick={() => {
                if (fileInputRef.current) fileInputRef.current.value = '';
                onFileRemove && onFileRemove();
              }}
              className="p-1.5 text-ink-muted hover:text-rose-700 hover:bg-rose-50 rounded-sm transition-colors"
              title="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-sm p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
            isDragging
              ? 'border-primary bg-primary/5 text-primary scale-[0.99]'
              : 'border-border hover:border-primary/50 bg-surface-soft/30 hover:bg-surface-soft/60 text-ink-muted'
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center mb-2 text-primary shadow-xs">
            <UploadCloud className="w-5 h-5" />
          </div>

          <p className="text-xs font-semibold text-ink leading-tight">
            Click to browse or drag and drop document file
          </p>
          <p className="text-[11px] text-ink-muted mt-1">
            Supported formats: PDF, DOCX, XLSX, ZIP (Max 50 MB)
          </p>

          <button
            type="button"
            className="mt-3 px-3 py-1 text-[11px] font-semibold text-primary bg-surface border border-primary/30 rounded-sm hover:bg-primary/10 transition-colors shadow-2xs"
          >
            Select File from Device
          </button>
        </div>
      )}
    </div>
  );
};
