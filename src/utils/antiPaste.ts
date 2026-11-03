import React from 'react';

interface AntiPasteOptions {
  onAttemptedPaste?: (fieldName: string) => void;
  onAttemptedCopy?: (fieldName: string) => void;
}

export function createAntiPasteHandlers(fieldName: string, options?: AntiPasteOptions) {
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.preventDefault();
    if (options?.onAttemptedPaste) {
      options.onAttemptedPaste(fieldName);
    }
  };

  const handleCopy = (e: React.ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.preventDefault();
    if (options?.onAttemptedCopy) {
      options.onAttemptedCopy(fieldName);
    }
  };

  const handleCut = (e: React.ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.preventDefault();
  };

  return {
    onPaste: handlePaste,
    onCopy: handleCopy,
    onCut: handleCut,
    onDrop: handleDrop,
  };
}

export function countWords(text: string): number {
  if (!text || !text.trim()) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function calculateTypingMetrics(startTime: number | null, charCount: number): { wpm: number; status: 'handwritten' | 'pasted' | 'typing' } {
  if (!startTime || charCount === 0) {
    return { wpm: 0, status: 'typing' };
  }
  const minutes = (Date.now() - startTime) / 60000;
  if (minutes <= 0) return { wpm: 0, status: 'typing' };
  const words = charCount / 5;
  const wpm = Math.round(words / minutes);
  
  // If typing speed is humanly feasible (< 200 wpm), mark as verified handwritten
  return {
    wpm,
    status: wpm > 250 ? 'pasted' : 'handwritten'
  };
}
