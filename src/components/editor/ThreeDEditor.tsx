"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Box,
  Circle,
  Sun,
  Layers,
  Sparkles,
  Sliders,
  RotateCw,
  Eye,
} from "lucide-react";

interface Object3D {
  id: string;
  name: string;
  type: "cube" | "sphere" | "cylinder" | "torus";
  color: string;
  metalness: number;
  roughness: number;
  wireframe: boolean;
  x: number;
  y: number;
  z: number;
  rotationX: number;
  rotationY: number;
  scale: number;
}

export function ThreeDEditor() {
  const [objects, setObjects] = useState<Object3D[]>([
    {
      id: "obj-1",
      name: "3D メッシュ 1",
      type: "cube",
      color: "#00E5A3",
      metalness: 0.5,
      roughness: 0.2,
      wireframe: false,
      x: 0,
      y: 0,
      z: 0,
      rotationX: 25,
      rotationY: 45,
      scale: 1,
    },
  ]);

  const [selectedObjId, setSelectedObjId] = useState<string>("obj-1");
  const [viewRotationX, setViewRotationX] = useState(20);
  const [viewRotationY, setViewRotationY] = useState(30);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 3Dレンダリング
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height / 2;

    ctx.fillStyle = "#0f0f18";
    ctx.fillRect(0, 0, width, height);

    // 3Dグリッド
    ctx.strokeStyle = "rgba(0, 229, 163, 0.15)";
    ctx.lineWidth = 1;
    for (let i = -5; i <= 5; i++) {
      ctx.beginPath();
      ctx.moveTo(cx + i * 40, cy + 100);
      ctx.lineTo(cx + i * 60, cy + 300);
      ctx.stroke();
    }

    // オブジェクトの描画 (投影)
    objects.forEach((obj) => {
      const isSelected = obj.id === selectedObjId;

      ctx.save();
      ctx.translate(cx + obj.x, cy + obj.y);

      const rotX = (obj.rotationX + viewRotationX) * (Math.PI / 180);
      const rotY = (obj.rotationY + viewRotationY) * (Math.PI / 180);

      const size = 100 * obj.scale;

      ctx.fillStyle = obj.color;
      ctx.strokeStyle = isSelected ? "#00E5A3" : "rgba(255,255,255,0.4)";
      ctx.lineWidth = isSelected ? 3 : 1;

      if (obj.wireframe) {
        ctx.fillStyle = "transparent";
      }

      if (obj.type === "cube") {
        ctx.beginPath();
        ctx.rect(-size / 2, -size / 2, size, size);
        ctx.fill();
        ctx.stroke();

        // 3D立方体ワイヤーフレーム表現
        ctx.beginPath();
        ctx.moveTo(-size / 2, -size / 2);
        ctx.lineTo(-size / 2 + 30, -size / 2 - 30);
        ctx.lineTo(size / 2 + 30, -size / 2 - 30);
        ctx.lineTo(size / 2, -size / 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(size / 2, -size / 2);
        ctx.lineTo(size / 2 + 30, -size / 2 - 30);
        ctx.lineTo(size / 2 + 30, size / 2 - 30);
        ctx.lineTo(size / 2, size / 2);
        ctx.stroke();
      } else if (obj.type === "sphere") {
        const grad = ctx.createRadialGradient(-20, -20, 10, 0, 0, size / 2);
        grad.addColorStop(0, "#ffffff");
        grad.addColorStop(0.3, obj.color);
        grad.addColorStop(1, "#000000");

        ctx.beginPath();
        ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
        ctx.fillStyle = obj.wireframe ? "transparent" : grad;
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      ctx.restore();
    });
  }, [objects, selectedObjId, viewRotationX, viewRotationY]);

  const addObject = (type: "cube" | "sphere" | "cylinder" | "torus") => {
    const colors = ["#00E5A3", "#31A8FF", "#FF9A00", "#FF61F6", "#9999FF"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const newObj: Object3D = {
      id: `obj-${Date.now()}`,
      name: `3D ${type === "cube" ? "キューブ" : type === "sphere" ? "球体" : "パーツ"} ${objects.length + 1}`,
      type,
      color: randomColor,
      metalness: 0.5,
      roughness: 0.3,
      wireframe: false,
      x: (Math.random() - 0.5) * 100,
      y: (Math.random() - 0.5) * 100,
      z: 0,
      rotationX: 20,
      rotationY: 30,
      scale: 1,
    };
    setObjects([...objects, newObj]);
    setSelectedObjId(newObj.id);
  };

  const selectedObj = objects.find((o) => o.id === selectedObjId);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;

    setViewRotationY((prev) => prev + dx * 0.5);
    setViewRotationX((prev) => prev + dy * 0.5);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div className="flex h-full flex-col bg-[#11111b] text-lumina-text select-none">
      {/* ヘッダー */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-lumina-border bg-[#181825] px-4 shadow-md">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-1 rounded px-2 py-1 text-xs text-lumina-text-muted transition hover:bg-lumina-bg-hover hover:text-lumina-text"
            title="ホームに戻る"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>ホーム</span>
          </Link>
          <div className="flex items-center gap-2 border-l border-lumina-border pl-4">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-gradient-to-br from-emerald-500 to-teal-700 text-xs font-bold text-white">
              3D
            </div>
            <span className="text-sm font-semibold tracking-tight">Editional 3D</span>
          </div>
        </div>
      </header>

      {/* メインエリア */}
      <div className="flex flex-1 overflow-hidden">
        {/* 左側ツールバー */}
        <aside className="flex w-12 shrink-0 flex-col items-center gap-1 border-r border-lumina-border bg-[#181825] py-2">
          <button
            onClick={() => addObject("cube")}
            className="flex h-9 w-9 items-center justify-center rounded text-lumina-text-muted transition hover:bg-lumina-bg-hover hover:text-lumina-text"
            title="キューブ追加"
          >
            <Box className="h-4 w-4" />
          </button>
          <button
            onClick={() => addObject("sphere")}
            className="flex h-9 w-9 items-center justify-center rounded text-lumina-text-muted transition hover:bg-lumina-bg-hover hover:text-lumina-text"
            title="球体追加"
          >
            <Circle className="h-4 w-4" />
          </button>
        </aside>

        {/* 3D ビューポート (キャンバス) */}
        <div
          className="relative flex flex-1 items-center justify-center bg-[#07070c] overflow-hidden cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          <canvas ref={canvasRef} width={800} height={600} className="w-full h-full" />
        </div>

        {/* 右側パネル */}
        <aside className="flex w-64 shrink-0 flex-col border-l border-lumina-border bg-[#181825]">
          <div className="border-b border-lumina-border p-4">
            <h3 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-lumina-text-muted">
              マテリアル・3D設定
            </h3>
            {selectedObj ? (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="text-[10px] text-lumina-text-muted">マテリアルカラー</label>
                  <input
                    type="color"
                    value={selectedObj.color}
                    onChange={(e) => {
                      const color = e.target.value;
                      setObjects(objects.map((o) => (o.id === selectedObj.id ? { ...o, color } : o)));
                    }}
                    className="h-8 w-full cursor-pointer rounded border border-lumina-border bg-transparent p-1"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[10px] text-lumina-text-muted mb-1">
                    <span>メタリック (金属感)</span>
                    <span>{Math.round(selectedObj.metalness * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={selectedObj.metalness}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setObjects(objects.map((o) => (o.id === selectedObj.id ? { ...o, metalness: val } : o)));
                    }}
                    className="w-full accent-teal-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[10px] text-lumina-text-muted mb-1">
                    <span>ラフネス (粗さ)</span>
                    <span>{Math.round(selectedObj.roughness * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={selectedObj.roughness}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setObjects(objects.map((o) => (o.id === selectedObj.id ? { ...o, roughness: val } : o)));
                    }}
                    className="w-full accent-teal-500"
                  />
                </div>

                <div className="flex items-center justify-between border-t border-lumina-border/60 pt-3">
                  <span className="text-[10px] text-lumina-text-muted">ワイヤーフレーム表示</span>
                  <input
                    type="checkbox"
                    checked={selectedObj.wireframe}
                    onChange={(e) => {
                      const wireframe = e.target.checked;
                      setObjects(objects.map((o) => (o.id === selectedObj.id ? { ...o, wireframe } : o)));
                    }}
                    className="accent-teal-500"
                  />
                </div>
              </div>
            ) : (
              <p className="text-[10px] text-lumina-text-muted">3Dオブジェクトを選択してください</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
