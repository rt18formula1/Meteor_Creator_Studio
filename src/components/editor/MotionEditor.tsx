"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Play,
  Pause,
  RotateCcw,
  Plus,
  Trash2,
  Square,
  Circle as CircleIcon,
  Type,
  ArrowLeft,
  Key,
  Layers,
  Sparkles,
  Sliders,
  Film,
} from "lucide-react";

interface Keyframe {
  time: number; // 秒
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
}

interface MotionLayer {
  id: string;
  name: string;
  type: "rect" | "circle" | "text";
  color: string;
  text?: string;
  keyframes: Keyframe[];
}

export function MotionEditor() {
  const [layers, setLayers] = useState<MotionLayer[]>([
    {
      id: "motion-1",
      name: "モーショングラフィック 1",
      type: "rect",
      color: "#9999FF",
      keyframes: [
        { time: 0, x: 150, y: 150, scale: 1, rotation: 0, opacity: 1 },
        { time: 2, x: 450, y: 150, scale: 1.5, rotation: 180, opacity: 1 },
        { time: 4, x: 300, y: 300, scale: 1, rotation: 360, opacity: 0.5 },
      ],
    },
  ]);

  const [selectedLayerId, setSelectedLayerId] = useState<string | null>("motion-1");
  const [currentTime, setCurrentTime] = useState(0); // 秒
  const [duration, setDuration] = useState(5); // 総フレーム長 (5秒)
  const [isPlaying, setIsPlaying] = useState(false);

  const requestRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // アニメーション再生ループ
  const animate = useCallback((timestamp: number) => {
    if (!startTimeRef.current) startTimeRef.current = timestamp;
    const elapsed = (timestamp - startTimeRef.current) / 1000;

    setCurrentTime((prev) => {
      const nextTime = prev + 0.033; // 約30fps
      if (nextTime >= duration) {
        return 0; // ループ
      }
      return nextTime;
    });

    requestRef.current = requestAnimationFrame(animate);
  }, [duration]);

  useEffect(() => {
    if (isPlaying) {
      requestRef.current = requestAnimationFrame(animate);
    } else if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, animate]);

  // レイヤー追加
  const addLayer = (type: "rect" | "circle" | "text") => {
    const colors = ["#9999FF", "#FF61F6", "#00E5A3", "#FF9A00", "#31A8FF"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const newLayer: MotionLayer = {
      id: `motion-${Date.now()}`,
      name: `${type === "rect" ? "シェイプ" : type === "circle" ? "円" : "テキスト"} ${layers.length + 1}`,
      type,
      color: randomColor,
      text: type === "text" ? "MOTION" : undefined,
      keyframes: [
        { time: 0, x: 200, y: 200, scale: 1, rotation: 0, opacity: 1 },
        { time: duration, x: 400, y: 200, scale: 1, rotation: 90, opacity: 1 },
      ],
    };
    setLayers([...layers, newLayer]);
    setSelectedLayerId(newLayer.id);
  };

  // キーフレームの補間計算 (現在時間での座標や状態を決定)
  const getInterpolatedState = (layer: MotionLayer, time: number) => {
    const kfs = [...layer.keyframes].sort((a, b) => a.time - b.time);
    if (kfs.length === 0) return { x: 100, y: 100, scale: 1, rotation: 0, opacity: 1 };
    if (time <= kfs[0].time) return kfs[0];
    if (time >= kfs[kfs.length - 1].time) return kfs[kfs.length - 1];

    let prev = kfs[0];
    let next = kfs[kfs.length - 1];
    for (let i = 0; i < kfs.length - 1; i++) {
      if (time >= kfs[i].time && time <= kfs[i + 1].time) {
        prev = kfs[i];
        next = kfs[i + 1];
        break;
      }
    }

    const ratio = (time - prev.time) / (next.time - prev.time || 1);
    return {
      x: prev.x + (next.x - prev.x) * ratio,
      y: prev.y + (next.y - prev.y) * ratio,
      scale: prev.scale + (next.scale - prev.scale) * ratio,
      rotation: prev.rotation + (next.rotation - prev.rotation) * ratio,
      opacity: prev.opacity + (next.opacity - prev.opacity) * ratio,
    };
  };

  // キーフレーム追加
  const addKeyframeAtCurrentTime = () => {
    if (!selectedLayerId) return;
    setLayers(
      layers.map((l) => {
        if (l.id !== selectedLayerId) return l;
        const currentState = getInterpolatedState(l, currentTime);
        const existingKfIndex = l.keyframes.findIndex((k) => Math.abs(k.time - currentTime) < 0.1);
        
        let updatedKfs = [...l.keyframes];
        if (existingKfIndex >= 0) {
          updatedKfs[existingKfIndex] = { ...currentState, time: currentTime };
        } else {
          updatedKfs.push({ ...currentState, time: currentTime });
        }
        return { ...l, keyframes: updatedKfs };
      })
    );
  };

  const selectedLayer = layers.find((l) => l.id === selectedLayerId);
  const selectedState = selectedLayer ? getInterpolatedState(selectedLayer, currentTime) : null;

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
            <div className="flex h-7 w-7 items-center justify-center rounded bg-gradient-to-br from-indigo-600 to-purple-800 text-xs font-bold text-white">
              Mo
            </div>
            <span className="text-sm font-semibold tracking-tight">Editional Motion</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-semibold text-white transition shadow-md ${
              isPlaying ? "bg-amber-600 hover:bg-amber-700" : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            <span>{isPlaying ? "一時停止" : "再生"}</span>
          </button>
        </div>
      </header>

      {/* メインエリア */}
      <div className="flex flex-1 overflow-hidden">
        {/* 左側ツールバー */}
        <aside className="flex w-12 shrink-0 flex-col items-center gap-1 border-r border-lumina-border bg-[#181825] py-2">
          <button
            onClick={() => addLayer("rect")}
            className="flex h-9 w-9 items-center justify-center rounded text-lumina-text-muted transition hover:bg-lumina-bg-hover hover:text-lumina-text"
            title="矩形を追加"
          >
            <Square className="h-4 w-4" />
          </button>
          <button
            onClick={() => addLayer("circle")}
            className="flex h-9 w-9 items-center justify-center rounded text-lumina-text-muted transition hover:bg-lumina-bg-hover hover:text-lumina-text"
            title="円を追加"
          >
            <CircleIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => addLayer("text")}
            className="flex h-9 w-9 items-center justify-center rounded text-lumina-text-muted transition hover:bg-lumina-bg-hover hover:text-lumina-text"
            title="テキストを追加"
          >
            <Type className="h-4 w-4" />
          </button>
        </aside>

        {/* プレビューキャンバス */}
        <div className="relative flex flex-1 items-center justify-center overflow-auto bg-[#0a0a0f] p-8">
          <div className="relative h-[480px] w-[720px] rounded-lg border border-lumina-border/60 bg-[#181825] shadow-2xl overflow-hidden">
            {/* 各レイヤーのアニメーションレンダリング */}
            {layers.map((layer) => {
              const state = getInterpolatedState(layer, currentTime);
              const isSelected = layer.id === selectedLayerId;

              return (
                <div
                  key={layer.id}
                  onClick={() => setSelectedLayerId(layer.id)}
                  className={`absolute cursor-pointer transition-all duration-75 ${
                    isSelected ? "ring-2 ring-indigo-500" : ""
                  }`}
                  style={{
                    left: `${state.x}px`,
                    top: `${state.y}px`,
                    transform: `scale(${state.scale}) rotate(${state.rotation}deg)`,
                    opacity: state.opacity,
                    transformOrigin: "center center",
                  }}
                >
                  {layer.type === "rect" && (
                    <div
                      className="h-24 w-24 rounded-md shadow-lg"
                      style={{ backgroundColor: layer.color }}
                    />
                  )}
                  {layer.type === "circle" && (
                    <div
                      className="h-24 w-24 rounded-full shadow-lg"
                      style={{ backgroundColor: layer.color }}
                    />
                  )}
                  {layer.type === "text" && (
                    <span
                      className="text-3xl font-black tracking-widest shadow-sm"
                      style={{ color: layer.color }}
                    >
                      {layer.text || "MOTION"}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 右側プロパティパネル */}
        <aside className="flex w-64 shrink-0 flex-col border-l border-lumina-border bg-[#181825]">
          <div className="border-b border-lumina-border p-4">
            <h3 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-lumina-text-muted flex items-center gap-1.5">
              <Sliders className="h-3.5 w-3.5" />
              <span>レイヤー・プロパティ</span>
            </h3>

            {selectedLayer && selectedState ? (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[10px] text-lumina-text-muted">名前</label>
                  <input
                    type="text"
                    value={selectedLayer.name}
                    onChange={(e) => {
                      const val = e.target.value;
                      setLayers(layers.map((l) => (l.id === selectedLayer.id ? { ...l, name: val } : l)));
                    }}
                    className="w-full rounded border border-lumina-border bg-[#1e1e2e] px-2 py-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-lumina-text-muted">X 位置</label>
                    <input
                      type="number"
                      value={Math.round(selectedState.x)}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setLayers(
                          layers.map((l) => {
                            if (l.id !== selectedLayer.id) return l;
                            return {
                              ...l,
                              keyframes: l.keyframes.map((k) => ({ ...k, x: val })),
                            };
                          })
                        );
                      }}
                      className="w-full rounded border border-lumina-border bg-[#1e1e2e] px-2 py-1"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-lumina-text-muted">Y 位置</label>
                    <input
                      type="number"
                      value={Math.round(selectedState.y)}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setLayers(
                          layers.map((l) => {
                            if (l.id !== selectedLayer.id) return l;
                            return {
                              ...l,
                              keyframes: l.keyframes.map((k) => ({ ...k, y: val })),
                            };
                          })
                        );
                      }}
                      className="w-full rounded border border-lumina-border bg-[#1e1e2e] px-2 py-1"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[10px] text-lumina-text-muted">
                    <span>回転角度</span>
                    <span>{Math.round(selectedState.rotation)}°</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={selectedState.rotation}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setLayers(
                        layers.map((l) => {
                          if (l.id !== selectedLayer.id) return l;
                          return {
                            ...l,
                            keyframes: l.keyframes.map((k) => ({ ...k, rotation: val })),
                          };
                        })
                      );
                    }}
                    className="w-full accent-indigo-500"
                  />
                </div>

                <button
                  onClick={addKeyframeAtCurrentTime}
                  className="mt-2 flex w-full items-center justify-center gap-1.5 rounded bg-indigo-600/30 border border-indigo-500/40 py-1.5 text-xs font-semibold text-indigo-300 transition hover:bg-indigo-600/50"
                >
                  <Key className="h-3.5 w-3.5" />
                  <span>キーフレーム打刻 ({currentTime.toFixed(1)}s)</span>
                </button>
              </div>
            ) : (
              <p className="text-[10px] text-lumina-text-muted">レイヤーを選択してください</p>
            )}
          </div>

          {/* レイヤーリスト */}
          <div className="flex-1 overflow-y-auto p-3">
            <h4 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-lumina-text-muted">レイヤー一覧</h4>
            <div className="space-y-1">
              {layers.map((l) => (
                <div
                  key={l.id}
                  onClick={() => setSelectedLayerId(l.id)}
                  className={`flex items-center justify-between rounded p-2 text-xs transition cursor-pointer border ${
                    l.id === selectedLayerId
                      ? "bg-indigo-600/20 border-indigo-500/40 text-indigo-200"
                      : "bg-[#1e1e2e]/40 border-transparent hover:bg-lumina-bg-hover"
                  }`}
                >
                  <span className="truncate">{l.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setLayers(layers.filter((item) => item.id !== l.id));
                    }}
                    className="rounded p-1 hover:text-red-400"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* タイムラインエリア */}
      <footer className="h-40 shrink-0 border-t border-lumina-border bg-[#181825] flex flex-col p-3">
        <div className="flex items-center justify-between border-b border-lumina-border pb-2 mb-2">
          <div className="flex items-center gap-2">
            <Film className="h-4 w-4 text-indigo-400" />
            <span className="text-xs font-semibold">タイムライン ({currentTime.toFixed(2)}s / {duration}s)</span>
          </div>
          <input
            type="range"
            min="0"
            max={duration}
            step="0.05"
            value={currentTime}
            onChange={(e) => setCurrentTime(Number(e.target.value))}
            className="w-48 accent-indigo-500"
          />
        </div>

        {/* タイムライントラック */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {layers.map((l) => (
            <div key={l.id} className="flex items-center gap-3 text-xs">
              <span className="w-28 truncate text-[10px] text-lumina-text-muted">{l.name}</span>
              <div className="relative flex-1 h-6 bg-[#1e1e2e] rounded border border-lumina-border/40">
                {l.keyframes.map((k, i) => (
                  <div
                    key={i}
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-3.5 w-3.5 rotate-45 bg-indigo-400 border border-white shadow cursor-pointer"
                    style={{ left: `${(k.time / duration) * 100}%` }}
                    title={`Keyframe at ${k.time}s`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
}
