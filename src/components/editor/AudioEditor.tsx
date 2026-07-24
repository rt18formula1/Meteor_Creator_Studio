"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  Play,
  Pause,
  Upload,
  Volume2,
  Music,
  Trash2,
  Waves,
  SlidersHorizontal,
  SkipBack,
  SkipForward,
  Clock,
  Gauge,
} from "lucide-react";

interface AudioTrack {
  id: string;
  name: string;
  url: string;
  duration: number;
}

interface EffectConfig {
  delay: boolean;
  delayTime: number;
  lowpass: boolean;
  lowpassFreq: number;
  highpass: boolean;
  highpassFreq: number;
}

export function AudioEditor() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const delayNodeRef = useRef<DelayNode | null>(null);
  const lowpassRef = useRef<BiquadFilterNode | null>(null);
  const highpassRef = useRef<BiquadFilterNode | null>(null);

  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const startTimeRef = useRef(0);
  const offsetRef = useRef(0);

  const [tracks, setTracks] = useState<AudioTrack[]>([]);
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [playbackRate, setPlaybackRate] = useState(1);

  const [effects, setEffects] = useState<EffectConfig>({
    delay: false,
    delayTime: 0.3,
    lowpass: false,
    lowpassFreq: 2000,
    highpass: false,
    highpassFreq: 200,
  });

  // AudioContext の初期化
  const ensureAudioCtx = useCallback(() => {
    if (audioCtxRef.current) return audioCtxRef.current;
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyserRef.current = analyser;

    const gain = ctx.createGain();
    gain.gain.value = volume;
    gainNodeRef.current = gain;

    const delay = ctx.createDelay(1.0);
    delay.delayTime.value = effects.delayTime;
    delayNodeRef.current = delay;

    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = effects.lowpassFreq;
    lowpassRef.current = lp;

    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = effects.highpassFreq;
    highpassRef.current = hp;

    return ctx;
  }, [volume, effects.delayTime, effects.lowpassFreq, effects.highpassFreq]);

  // オーディオファイル読み込み
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ctx = ensureAudioCtx();
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    audioBufferRef.current = audioBuffer;

    const track: AudioTrack = {
      id: `track-${Date.now()}`,
      name: file.name,
      url: URL.createObjectURL(file),
      duration: audioBuffer.duration,
    };

    setTracks((prev) => [...prev, track]);
    setActiveTrackId(track.id);
    setDuration(audioBuffer.duration);
    setCurrentTime(0);
    offsetRef.current = 0;

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // エフェクトチェインの再構築
  const rebuildChain = useCallback(
    (source: AudioBufferSourceNode) => {
      const ctx = audioCtxRef.current;
      if (!ctx || !analyserRef.current || !gainNodeRef.current) return;

      const gain = gainNodeRef.current;
      gain.gain.value = volume;

      // source → gain → (effects) → analyser → destination
      let lastNode: AudioNode = gain;
      source.connect(gain);

      if (effects.delay && delayNodeRef.current) {
        delayNodeRef.current.delayTime.value = effects.delayTime;
        lastNode.connect(delayNodeRef.current);
        lastNode = delayNodeRef.current;
      }

      if (effects.lowpass && lowpassRef.current) {
        lowpassRef.current.frequency.value = effects.lowpassFreq;
        lastNode.connect(lowpassRef.current);
        lastNode = lowpassRef.current;
      }

      if (effects.highpass && highpassRef.current) {
        highpassRef.current.frequency.value = effects.highpassFreq;
        lastNode.connect(highpassRef.current);
        lastNode = highpassRef.current;
      }

      lastNode.connect(analyserRef.current);
      analyserRef.current.connect(ctx.destination);
    },
    [volume, effects],
  );

  // 再生
  const play = useCallback(() => {
    const ctx = ensureAudioCtx();
    if (!audioBufferRef.current) return;

    // 既存ソースを停止
    if (sourceRef.current) {
      try {
        sourceRef.current.stop();
      } catch {}
    }

    const source = ctx.createBufferSource();
    source.buffer = audioBufferRef.current;
    source.playbackRate.value = playbackRate;
    sourceRef.current = source;

    rebuildChain(source);

    source.start(0, offsetRef.current);
    startTimeRef.current = ctx.currentTime - offsetRef.current;
    setIsPlaying(true);

    source.onended = () => {
      setIsPlaying(false);
      offsetRef.current = 0;
      setCurrentTime(0);
    };
  }, [ensureAudioCtx, playbackRate, rebuildChain]);

  // 一時停止
  const pause = useCallback(() => {
    if (sourceRef.current && audioCtxRef.current) {
      offsetRef.current =
        audioCtxRef.current.currentTime - startTimeRef.current;
      try {
        sourceRef.current.stop();
      } catch {}
      setIsPlaying(false);
    }
  }, []);

  const togglePlay = () => {
    if (isPlaying) pause();
    else play();
  };

  // 時間更新ループ
  useEffect(() => {
    let raf: number;
    const tick = () => {
      if (isPlaying && audioCtxRef.current) {
        const elapsed =
          audioCtxRef.current.currentTime - startTimeRef.current;
        setCurrentTime(Math.min(elapsed, duration));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying, duration]);

  // 波形描画ループ
  useEffect(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx2d = canvas.getContext("2d");
    if (!ctx2d) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);

      const w = canvas.width;
      const h = canvas.height;
      ctx2d.fillStyle = "#0a0a0f";
      ctx2d.fillRect(0, 0, w, h);

      // グリッド線
      ctx2d.strokeStyle = "rgba(255,255,255,0.04)";
      ctx2d.lineWidth = 1;
      for (let i = 0; i < 8; i++) {
        const y = (h / 8) * i;
        ctx2d.beginPath();
        ctx2d.moveTo(0, y);
        ctx2d.lineTo(w, y);
        ctx2d.stroke();
      }

      // 中央ゼロ線
      ctx2d.strokeStyle = "rgba(157,107,255,0.2)";
      ctx2d.beginPath();
      ctx2d.moveTo(0, h / 2);
      ctx2d.lineTo(w, h / 2);
      ctx2d.stroke();

      // 波形
      const gradient = ctx2d.createLinearGradient(0, 0, w, 0);
      gradient.addColorStop(0, "#7c3aed");
      gradient.addColorStop(0.5, "#a855f7");
      gradient.addColorStop(1, "#c084fc");
      ctx2d.strokeStyle = gradient;
      ctx2d.lineWidth = 2;
      ctx2d.beginPath();

      const sliceWidth = w / bufferLength;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * h) / 2;
        if (i === 0) ctx2d.moveTo(x, y);
        else ctx2d.lineTo(x, y);
        x += sliceWidth;
      }
      ctx2d.lineTo(w, h / 2);
      ctx2d.stroke();

      // グロー効果
      ctx2d.shadowBlur = 8;
      ctx2d.shadowColor = "#a855f7";
      ctx2d.stroke();
      ctx2d.shadowBlur = 0;
    };

    draw();
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  // ボリューム変更
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = volume;
    }
  }, [volume]);

  // シーク
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    const seekTo = pct * duration;
    offsetRef.current = seekTo;
    setCurrentTime(seekTo);
    if (isPlaying) {
      play();
    }
  };

  // トラック削除
  const deleteTrack = (id: string) => {
    if (isPlaying) pause();
    setTracks((prev) => prev.filter((t) => t.id !== id));
    if (activeTrackId === id) {
      setActiveTrackId(null);
      audioBufferRef.current = null;
      setDuration(0);
      setCurrentTime(0);
    }
  };

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex h-full flex-col bg-[#11111b] text-lumina-text select-none">
      {/* ヘッダー */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-lumina-border bg-[#181825] px-4 shadow-md">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-gradient-to-br from-purple-700 to-fuchsia-600 text-xs font-bold text-white">
            Au
          </div>
          <span className="text-sm font-semibold tracking-tight">
            Editional Audio
          </span>
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 rounded bg-purple-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-purple-800 shadow-md"
        >
          <Upload className="h-3.5 w-3.5" />
          <span>音声ファイルを追加</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleUpload}
          className="hidden"
        />
      </header>

      {/* メインエリア */}
      <div className="flex flex-1 overflow-hidden">
        {/* 波形ビジュアライザ */}
        <div className="flex flex-1 flex-col bg-[#0a0a0f]">
          {/* 波形キャンバス */}
          <div className="flex-1 p-6 flex items-center justify-center">
            <div className="relative w-full h-full max-h-[360px] rounded-xl border border-lumina-border/40 overflow-hidden shadow-2xl shadow-purple-900/20">
              <canvas
                ref={canvasRef}
                width={1200}
                height={300}
                className="w-full h-full"
              />
              {!audioBufferRef.current && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-lumina-text-muted bg-[#0a0a0f]/90">
                  <Waves className="h-10 w-10 opacity-30 text-purple-500" />
                  <p className="text-xs">
                    音声ファイルを読み込むと波形が表示されます
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* タイムシークバー */}
          <div className="h-8 border-t border-lumina-border/40 px-6 flex items-center gap-3">
            <span className="text-[10px] font-mono text-purple-400 w-12 text-right">
              {formatTime(currentTime)}
            </span>
            <div
              onClick={handleSeek}
              className="flex-1 h-1.5 bg-[#1e1e2e] rounded-full cursor-pointer relative group"
            >
              <div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-600 to-fuchsia-500 rounded-full transition-all"
                style={{
                  width: duration > 0 ? `${(currentTime / duration) * 100}%` : "0%",
                }}
              />
              {duration > 0 && (
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-purple-400 shadow shadow-purple-500/50 border-2 border-white/20 transition-all"
                  style={{
                    left: `${(currentTime / duration) * 100}%`,
                  }}
                />
              )}
            </div>
            <span className="text-[10px] font-mono text-lumina-text-muted w-12">
              {formatTime(duration)}
            </span>
          </div>

          {/* 再生コントロール */}
          <div className="h-16 border-t border-lumina-border bg-[#181825] flex items-center justify-center gap-6 px-6">
            <button
              onClick={() => {
                offsetRef.current = Math.max(0, currentTime - 5);
                setCurrentTime(offsetRef.current);
                if (isPlaying) play();
              }}
              className="rounded p-2 text-lumina-text-muted hover:text-lumina-text hover:bg-lumina-bg-hover transition"
            >
              <SkipBack className="h-4 w-4" />
            </button>

            <button
              onClick={togglePlay}
              disabled={!audioBufferRef.current}
              className="h-10 w-10 flex items-center justify-center rounded-full bg-purple-700 hover:bg-purple-800 text-white transition shadow-lg shadow-purple-900/30 disabled:opacity-40"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4 fill-white" />
              ) : (
                <Play className="h-4 w-4 fill-white translate-x-0.5" />
              )}
            </button>

            <button
              onClick={() => {
                offsetRef.current = Math.min(duration, currentTime + 5);
                setCurrentTime(offsetRef.current);
                if (isPlaying) play();
              }}
              className="rounded p-2 text-lumina-text-muted hover:text-lumina-text hover:bg-lumina-bg-hover transition"
            >
              <SkipForward className="h-4 w-4" />
            </button>

            <div className="ml-6 flex items-center gap-2 border-l border-lumina-border pl-6">
              <Volume2 className="h-4 w-4 text-lumina-text-muted" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-20 accent-purple-600"
              />
              <span className="text-[10px] text-lumina-text-muted w-8">
                {Math.round(volume * 100)}%
              </span>
            </div>

            <div className="flex items-center gap-2 border-l border-lumina-border pl-6">
              <Gauge className="h-4 w-4 text-lumina-text-muted" />
              <select
                value={playbackRate}
                onChange={(e) => {
                  const rate = parseFloat(e.target.value);
                  setPlaybackRate(rate);
                  if (sourceRef.current) {
                    sourceRef.current.playbackRate.value = rate;
                  }
                }}
                className="rounded border border-lumina-border bg-[#1e1e2e] px-2 py-0.5 text-[10px] text-lumina-text"
              >
                <option value="0.5">0.5x</option>
                <option value="0.75">0.75x</option>
                <option value="1">1.0x</option>
                <option value="1.25">1.25x</option>
                <option value="1.5">1.5x</option>
                <option value="2">2.0x</option>
              </select>
            </div>
          </div>
        </div>

        {/* 右側パネル */}
        <aside className="w-72 shrink-0 border-l border-lumina-border bg-[#181825] flex flex-col">
          {/* エフェクトセクション */}
          <div className="border-b border-lumina-border p-4">
            <h3 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-lumina-text-muted flex items-center gap-1.5">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>エフェクト</span>
            </h3>

            <div className="space-y-4">
              {/* ディレイ */}
              <div className="rounded-lg border border-lumina-border/50 bg-[#1e1e2e]/50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium">ディレイ</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={effects.delay}
                      onChange={(e) =>
                        setEffects({ ...effects, delay: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4 bg-lumina-border rounded-full peer peer-checked:bg-purple-600 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-4" />
                  </label>
                </div>
                {effects.delay && (
                  <div className="mt-2">
                    <div className="flex justify-between text-[9px] text-lumina-text-muted mb-0.5">
                      <span>時間</span>
                      <span>{effects.delayTime.toFixed(2)}s</span>
                    </div>
                    <input
                      type="range"
                      min="0.05"
                      max="1"
                      step="0.05"
                      value={effects.delayTime}
                      onChange={(e) =>
                        setEffects({
                          ...effects,
                          delayTime: parseFloat(e.target.value),
                        })
                      }
                      className="w-full accent-purple-600"
                    />
                  </div>
                )}
              </div>

              {/* ローパスフィルター */}
              <div className="rounded-lg border border-lumina-border/50 bg-[#1e1e2e]/50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium">
                    ローパスフィルター
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={effects.lowpass}
                      onChange={(e) =>
                        setEffects({ ...effects, lowpass: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4 bg-lumina-border rounded-full peer peer-checked:bg-purple-600 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-4" />
                  </label>
                </div>
                {effects.lowpass && (
                  <div className="mt-2">
                    <div className="flex justify-between text-[9px] text-lumina-text-muted mb-0.5">
                      <span>カットオフ</span>
                      <span>{effects.lowpassFreq}Hz</span>
                    </div>
                    <input
                      type="range"
                      min="100"
                      max="10000"
                      step="100"
                      value={effects.lowpassFreq}
                      onChange={(e) =>
                        setEffects({
                          ...effects,
                          lowpassFreq: parseInt(e.target.value),
                        })
                      }
                      className="w-full accent-purple-600"
                    />
                  </div>
                )}
              </div>

              {/* ハイパスフィルター */}
              <div className="rounded-lg border border-lumina-border/50 bg-[#1e1e2e]/50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium">
                    ハイパスフィルター
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={effects.highpass}
                      onChange={(e) =>
                        setEffects({ ...effects, highpass: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4 bg-lumina-border rounded-full peer peer-checked:bg-purple-600 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-4" />
                  </label>
                </div>
                {effects.highpass && (
                  <div className="mt-2">
                    <div className="flex justify-between text-[9px] text-lumina-text-muted mb-0.5">
                      <span>カットオフ</span>
                      <span>{effects.highpassFreq}Hz</span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="5000"
                      step="20"
                      value={effects.highpassFreq}
                      onChange={(e) =>
                        setEffects({
                          ...effects,
                          highpassFreq: parseInt(e.target.value),
                        })
                      }
                      className="w-full accent-purple-600"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* トラックリスト */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-lumina-border px-4 py-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-lumina-text-muted">
                トラック一覧
              </span>
            </div>

            <div className="lumina-scrollbar flex-1 overflow-y-auto p-3 space-y-1.5">
              {tracks.length === 0 ? (
                <div className="py-12 text-center text-[10px] text-lumina-text-muted flex flex-col items-center gap-2">
                  <Music className="h-6 w-6 opacity-30" />
                  <p>音声ファイルがありません</p>
                </div>
              ) : (
                tracks.map((track) => (
                  <div
                    key={track.id}
                    onClick={() => setActiveTrackId(track.id)}
                    className={`flex items-center justify-between rounded-lg p-2.5 text-xs transition cursor-pointer border ${
                      activeTrackId === track.id
                        ? "bg-purple-600/15 border-purple-500/30 text-purple-200"
                        : "bg-[#1e1e2e]/40 border-transparent hover:bg-lumina-bg-hover"
                    }`}
                  >
                    <div className="flex flex-col truncate pr-2">
                      <span className="truncate font-medium">{track.name}</span>
                      <span className="text-[9px] font-mono opacity-40">
                        {formatTime(track.duration)}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteTrack(track.id);
                      }}
                      className="rounded p-1 text-lumina-text-muted hover:text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
