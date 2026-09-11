import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Crop, Check, X, RotateCcw, Move, Maximize2 } from 'lucide-react';

interface RegionCropperProps {
  imageSrc: string;
  onCrop: (croppedDataUrl: string) => void;
  onCancel: () => void;
}

export const RegionCropper: React.FC<RegionCropperProps> = ({ imageSrc, onCrop, onCancel }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Selection box relative to container display size (pixels)
  const [cropBox, setCropBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragAction, setDragAction] = useState<'move' | 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w' | 'draw' | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number; boxX: number; boxY: number; boxW: number; boxH: number }>({
    x: 0,
    y: 0,
    boxX: 0,
    boxY: 0,
    boxW: 0,
    boxH: 0,
  });

  const [imgLoaded, setImgLoaded] = useState<boolean>(false);

  // Initialize default crop box when image loads
  const handleImageLoad = () => {
    setImgLoaded(true);
    if (containerRef.current && imgRef.current) {
      const { clientWidth, clientHeight } = imgRef.current;
      // Default to 80% width and 60% height in center
      const defaultW = Math.round(clientWidth * 0.85);
      const defaultH = Math.round(clientHeight * 0.65);
      const defaultX = Math.round((clientWidth - defaultW) / 2);
      const defaultY = Math.round((clientHeight - defaultH) / 2);
      setCropBox({ x: defaultX, y: defaultY, w: defaultW, h: defaultH });
    }
  };

  // Helper to get coordinates relative to the image element
  const getRelativeCoords = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    if (!imgRef.current) return { x: 0, y: 0 };
    const rect = imgRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;

    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, clientY - rect.top));
    return { x, y };
  };

  const startDrag = (action: 'move' | 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w' | 'draw', e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!cropBox) return;

    const coords = getRelativeCoords(e);
    setIsDragging(true);
    setDragAction(action);

    if (action === 'draw') {
      setCropBox({ x: coords.x, y: coords.y, w: 10, h: 10 });
      setDragStart({ x: coords.x, y: coords.y, boxX: coords.x, boxY: coords.y, boxW: 10, boxH: 10 });
    } else {
      setDragStart({
        x: coords.x,
        y: coords.y,
        boxX: cropBox.x,
        boxY: cropBox.y,
        boxW: cropBox.w,
        boxH: cropBox.h,
      });
    }
  };

  const handlePointerMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging || !cropBox || !imgRef.current) return;

    const coords = getRelativeCoords(e);
    const deltaX = coords.x - dragStart.x;
    const deltaY = coords.y - dragStart.y;
    const imgW = imgRef.current.clientWidth;
    const imgH = imgRef.current.clientHeight;

    const MIN_SIZE = 25;

    let newX = cropBox.x;
    let newY = cropBox.y;
    let newW = cropBox.w;
    let newH = cropBox.h;

    if (dragAction === 'move') {
      newX = Math.max(0, Math.min(imgW - dragStart.boxW, dragStart.boxX + deltaX));
      newY = Math.max(0, Math.min(imgH - dragStart.boxH, dragStart.boxY + deltaY));
      newW = dragStart.boxW;
      newH = dragStart.boxH;
    } else if (dragAction === 'draw') {
      const startX = dragStart.x;
      const startY = dragStart.y;
      newX = Math.min(startX, coords.x);
      newY = Math.min(startY, coords.y);
      newW = Math.max(MIN_SIZE, Math.abs(coords.x - startX));
      newH = Math.max(MIN_SIZE, Math.abs(coords.y - startY));
    } else {
      // Handles resizing
      if (dragAction?.includes('w')) {
        const potentialW = dragStart.boxW - deltaX;
        if (potentialW >= MIN_SIZE) {
          newX = Math.max(0, dragStart.boxX + deltaX);
          newW = dragStart.boxW + (dragStart.boxX - newX);
        }
      }
      if (dragAction?.includes('e')) {
        newW = Math.max(MIN_SIZE, Math.min(imgW - dragStart.boxX, dragStart.boxW + deltaX));
      }
      if (dragAction?.includes('n')) {
        const potentialH = dragStart.boxH - deltaY;
        if (potentialH >= MIN_SIZE) {
          newY = Math.max(0, dragStart.boxY + deltaY);
          newH = dragStart.boxH + (dragStart.boxY - newY);
        }
      }
      if (dragAction?.includes('s')) {
        newH = Math.max(MIN_SIZE, Math.min(imgH - dragStart.boxY, dragStart.boxH + deltaY));
      }
    }

    setCropBox({ x: Math.round(newX), y: Math.round(newY), w: Math.round(newW), h: Math.round(newH) });
  }, [isDragging, cropBox, dragAction, dragStart]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
    setDragAction(null);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handlePointerMove);
      window.addEventListener('mouseup', handlePointerUp);
      window.addEventListener('touchmove', handlePointerMove);
      window.addEventListener('touchend', handlePointerUp);
    } else {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    }
    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [isDragging, handlePointerMove, handlePointerUp]);

  // Preset Selectors
  const setPresetRegion = (type: 'full' | 'top' | 'bottom' | 'center') => {
    if (!imgRef.current) return;
    const w = imgRef.current.clientWidth;
    const h = imgRef.current.clientHeight;

    if (type === 'full') {
      setCropBox({ x: 0, y: 0, w, h });
    } else if (type === 'top') {
      setCropBox({ x: 0, y: 0, w, h: Math.round(h * 0.5) });
    } else if (type === 'bottom') {
      setCropBox({ x: 0, y: Math.round(h * 0.5), w, h: Math.round(h * 0.5) });
    } else if (type === 'center') {
      const boxW = Math.round(w * 0.8);
      const boxH = Math.round(h * 0.5);
      setCropBox({ x: Math.round((w - boxW) / 2), y: Math.round((h - boxH) / 2), w: boxW, h: boxH });
    }
  };

  // Perform Final Crop on Canvas
  const applyCrop = () => {
    if (!cropBox || !imgRef.current) return;

    const img = imgRef.current;
    const scaleX = img.naturalWidth / img.clientWidth;
    const scaleY = img.naturalHeight / img.clientHeight;

    const pixelX = Math.round(cropBox.x * scaleX);
    const pixelY = Math.round(cropBox.y * scaleY);
    const pixelW = Math.round(cropBox.w * scaleX);
    const pixelH = Math.round(cropBox.h * scaleY);

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, pixelW);
    canvas.height = Math.max(1, pixelH);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(
      img,
      pixelX,
      pixelY,
      pixelW,
      pixelH,
      0,
      0,
      pixelW,
      pixelH
    );

    const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.95);
    onCrop(croppedDataUrl);
  };

  return (
    <div className="space-y-4">
      {/* Instructions & Quick Preset Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950 p-3 rounded-2xl border border-purple-500/30">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-500/20 text-purple-300 rounded-xl">
            <Crop className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-white">Drag or Draw Crop Region</p>
            <p className="text-[11px] text-slate-400">Click & drag on image to draw box, or drag handles to resize question frame.</p>
          </div>
        </div>

        {/* Presets */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setPresetRegion('full')}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold cursor-pointer transition-colors"
          >
            Full
          </button>
          <button
            type="button"
            onClick={() => setPresetRegion('top')}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold cursor-pointer transition-colors"
          >
            Top Half
          </button>
          <button
            type="button"
            onClick={() => setPresetRegion('bottom')}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold cursor-pointer transition-colors"
          >
            Bottom Half
          </button>
          <button
            type="button"
            onClick={() => setPresetRegion('center')}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold cursor-pointer transition-colors flex items-center gap-1"
          >
            <Maximize2 className="w-3 h-3 text-purple-400" />
            <span>Center Box</span>
          </button>
        </div>
      </div>

      {/* Interactive Crop Display Container */}
      <div
        ref={containerRef}
        className="relative mx-auto bg-slate-950 rounded-2xl overflow-hidden border-2 border-slate-800 select-none flex items-center justify-center max-h-[420px] touch-none cursor-crosshair"
        onMouseDown={(e) => {
          if ((e.target as HTMLElement).getAttribute('data-crop-handle') === 'true') return;
          if ((e.target as HTMLElement).getAttribute('data-crop-box') === 'true') return;
          startDrag('draw', e);
        }}
        onTouchStart={(e) => {
          if ((e.target as HTMLElement).getAttribute('data-crop-handle') === 'true') return;
          if ((e.target as HTMLElement).getAttribute('data-crop-box') === 'true') return;
          startDrag('draw', e);
        }}
      >
        <img
          ref={imgRef}
          src={imageSrc}
          alt="Cropper Source"
          onLoad={handleImageLoad}
          className="max-h-[400px] w-auto object-contain block mx-auto pointer-events-none"
        />

        {/* Darkened Overlay and Selection Box */}
        {imgLoaded && cropBox && imgRef.current && (
          <div
            className="absolute top-0 left-0 w-full h-full pointer-events-none"
            style={{
              width: imgRef.current.clientWidth,
              height: imgRef.current.clientHeight,
              top: imgRef.current.offsetTop,
              left: imgRef.current.offsetLeft,
            }}
          >
            {/* Dark Mask Top */}
            <div
              className="absolute bg-slate-950/70 left-0 top-0 w-full"
              style={{ height: `${cropBox.y}px` }}
            />
            {/* Dark Mask Bottom */}
            <div
              className="absolute bg-slate-950/70 left-0 w-full"
              style={{
                top: `${cropBox.y + cropBox.h}px`,
                height: `${Math.max(0, imgRef.current.clientHeight - (cropBox.y + cropBox.h))}px`,
              }}
            />
            {/* Dark Mask Left */}
            <div
              className="absolute bg-slate-950/70 left-0"
              style={{
                top: `${cropBox.y}px`,
                height: `${cropBox.h}px`,
                width: `${cropBox.x}px`,
              }}
            />
            {/* Dark Mask Right */}
            <div
              className="absolute bg-slate-950/70"
              style={{
                top: `${cropBox.y}px`,
                height: `${cropBox.h}px`,
                left: `${cropBox.x + cropBox.w}px`,
                width: `${Math.max(0, imgRef.current.clientWidth - (cropBox.x + cropBox.w))}px`,
              }}
            />

            {/* Active Crop Highlight Box */}
            <div
              data-crop-box="true"
              className="absolute border-2 border-purple-400 bg-purple-500/10 shadow-2xl pointer-events-auto cursor-move flex items-center justify-center"
              style={{
                left: `${cropBox.x}px`,
                top: `${cropBox.y}px`,
                width: `${cropBox.w}px`,
                height: `${cropBox.h}px`,
              }}
              onMouseDown={(e) => startDrag('move', e)}
              onTouchStart={(e) => startDrag('move', e)}
            >
              {/* Inner Rule-of-Thirds Grid Lines */}
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
                <div className="border-r border-b border-purple-300/60" />
                <div className="border-r border-b border-purple-300/60" />
                <div className="border-b border-purple-300/60" />
                <div className="border-r border-b border-purple-300/60" />
                <div className="border-r border-b border-purple-300/60" />
                <div className="border-b border-purple-300/60" />
                <div className="border-r border-purple-300/60" />
                <div className="border-r border-purple-300/60" />
                <div />
              </div>

              <div className="bg-purple-900/90 text-purple-200 text-[10px] font-mono px-2 py-0.5 rounded-full border border-purple-400/50 flex items-center gap-1 shadow-md pointer-events-none">
                <Move className="w-2.5 h-2.5" />
                <span>Question Region ({cropBox.w} x {cropBox.h})</span>
              </div>

              {/* Resize Handles (8 direction anchors) */}
              <div
                data-crop-handle="true"
                className="absolute -top-2 -left-2 w-4 h-4 bg-purple-400 border-2 border-white rounded-full cursor-nwse-resize shadow-md hover:scale-125 transition-transform"
                onMouseDown={(e) => startDrag('nw', e)}
                onTouchStart={(e) => startDrag('nw', e)}
              />
              <div
                data-crop-handle="true"
                className="absolute -top-2 -right-2 w-4 h-4 bg-purple-400 border-2 border-white rounded-full cursor-nesw-resize shadow-md hover:scale-125 transition-transform"
                onMouseDown={(e) => startDrag('ne', e)}
                onTouchStart={(e) => startDrag('ne', e)}
              />
              <div
                data-crop-handle="true"
                className="absolute -bottom-2 -left-2 w-4 h-4 bg-purple-400 border-2 border-white rounded-full cursor-nesw-resize shadow-md hover:scale-125 transition-transform"
                onMouseDown={(e) => startDrag('sw', e)}
                onTouchStart={(e) => startDrag('sw', e)}
              />
              <div
                data-crop-handle="true"
                className="absolute -bottom-2 -right-2 w-4 h-4 bg-purple-400 border-2 border-white rounded-full cursor-nwse-resize shadow-md hover:scale-125 transition-transform"
                onMouseDown={(e) => startDrag('se', e)}
                onTouchStart={(e) => startDrag('se', e)}
              />

              {/* Edge handles */}
              <div
                data-crop-handle="true"
                className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-8 h-3 bg-purple-400 border border-white rounded-full cursor-ns-resize shadow-md"
                onMouseDown={(e) => startDrag('n', e)}
                onTouchStart={(e) => startDrag('n', e)}
              />
              <div
                data-crop-handle="true"
                className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-8 h-3 bg-purple-400 border border-white rounded-full cursor-ns-resize shadow-md"
                onMouseDown={(e) => startDrag('s', e)}
                onTouchStart={(e) => startDrag('s', e)}
              />
              <div
                data-crop-handle="true"
                className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-8 bg-purple-400 border border-white rounded-full cursor-ew-resize shadow-md"
                onMouseDown={(e) => startDrag('w', e)}
                onTouchStart={(e) => startDrag('w', e)}
              />
              <div
                data-crop-handle="true"
                className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-8 bg-purple-400 border border-white rounded-full cursor-ew-resize shadow-md"
                onMouseDown={(e) => startDrag('e', e)}
                onTouchStart={(e) => startDrag('e', e)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Control Actions */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer transition-colors flex items-center gap-1.5"
        >
          <X className="w-3.5 h-3.5" />
          <span>Cancel Crop</span>
        </button>

        <button
          type="button"
          onClick={applyCrop}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-purple-600/30 cursor-pointer flex items-center gap-2 btn-3d"
        >
          <Check className="w-4 h-4 text-emerald-300" />
          <span>Apply Selected Crop</span>
        </button>
      </div>
    </div>
  );
};
