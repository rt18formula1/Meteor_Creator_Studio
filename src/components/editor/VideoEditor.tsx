"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  Play,
  Pause,
  Upload,
  Plus,
  Trash2,
  Volume2,
  Maximize2,
  Video,
  Type,
  Clock,
  Download,
} from "lucide-react";

interface VideoClip {
  id: string;
  name: string;
  url: string;
  duration: number; // 秒
  startOffset: number; // タイムライン上での開始時間（秒）
}

interface SubtitleClip {
  id: string;
  text: string;
  start: number; // 開始秒
  end: number; // 終了秒
}

export function VideoEditor() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [clips, setClips] = useState<VideoClip[]>([]);
  const [subtitles, setSubtitles] = useState<SubtitleClip[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeClipId, setActiveClipId] = useState<string | null>(null);
  const [activeSubId, setActiveSubId] = useState<string | null>(null);

  const [newSubText, setNewSubText] = useState("新規字幕");
  const [newSubStart, setNewSubStart] = useState(0);
  const [newSubEnd, setNewSubEnd] = useState(5);

  // 動画アップロード
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    // 動画の長さを取得するために一時的なエレメントを作成
    const tempVideo = document.createElement("video");
    tempVideo.src = url;
    tempVideo.onloadedmetadata = () => {
      const newClip: VideoClip = {
        id: `clip-${Date.now()}`,
        name: file.name,
        url: url,
        duration: tempVideo.duration,
        startOffset: clips.length === 0 ? 0 : clips[clips.length - 1].startOffset + clips[clips.length - 1].duration,
      };
      setClips([...clips, newClip]);
      if (clips.length === 0) {
        setDuration(tempVideo.duration);
      } else {
        setDuration((prev) => prev + tempVideo.duration);
      }
    };
  };

  // ビデオプレーヤーの時間更新に同期
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleVideoLoaded = () => {
    if (videoRef.current) {
      // 最初のビデオの長さをセット
      setDuration(videoRef.current.duration);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current || clips.length === 0) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(() => {});
    }
    setIsPlaying(!isPlaying);
  };

  // タイムラインシーク
  const handleTimelineSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = x / rect.width;
    const seekTime = pct * duration;
    setCurrentTime(seekTime);
    if (videoRef.current) {
      videoRef.current.currentTime = seekTime;
    }
  };

  // 字幕追加
  const addSubtitle = () => {
    const newSub: SubtitleClip = {
      id: `sub-${Date.now()}`,
      text: newSubText,
      start: newSubStart,
      end: newSubEnd,
    };
    setSubtitles([...subtitles, newSub]);
    setNewSubText("");
  };

  // 字幕削除
  const deleteSubtitle = (id: string) => {
    setSubtitles(subtitles.filter((s) => s.id !== id));
    if (activeSubId === id) setActiveSubId(null);
  };

  // 動画クリップ削除
  const deleteClip = (id: string) => {
    const filtered = clips.filter((c) => c.id !== id);
    setClips(filtered);
    if (activeClipId === id) setActiveClipId(null);
    // duration 再計算
    const newDur = filtered.reduce((acc, c) => acc + c.duration, 0);
    setDuration(newDur);
  };

  // 現在の時間に表示すべき字幕を見つける
  const activeSubtitle = subtitles.find(
    (s) => currentTime >= s.start && currentTime <= s.end
  );

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    const ms = Math.floor((time % 1) * 100);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}:${ms.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex h-full flex-col bg-[#11111b] text-lumina-text select-none">
      {/* ヘッダー */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-lumina-border bg-[#181825] px-4 shadow-md">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-gradient-to-br from-red-600 to-orange-600 text-xs font-bold text-white">Vi</div>
          <span className="text-sm font-semibold tracking-tight">Editional Video</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 rounded bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700 shadow-md"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>素材を追加</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleUpload}
            className="hidden"
          />
        </div>
      </header>

      {/* メインエリア */}
      <div className="flex flex-1 overflow-hidden">
        {/* 左側：ビデオプレビュー */}
        <div className="flex flex-1 flex-col items-center justify-center bg-[#0a0a0f] p-6 relative">
          <div className="relative aspect-video w-full max-w-2xl bg-black rounded-lg overflow-hidden border border-lumina-border/60 shadow-2xl flex items-center justify-center">
            {clips.length > 0 ? (
              <>
                <video
                  ref={videoRef}
                  src={clips[0].url}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleVideoLoaded}
                  className="w-full h-full object-contain"
                />
                {/* 字幕オーバーレイ */}
                {activeSubtitle && (
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/75 px-4 py-1.5 rounded text-sm text-yellow-300 font-medium tracking-wide shadow-md max-w-[80%] text-center">
                    {activeSubtitle.text}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center text-xs text-lumina-text-muted flex flex-col items-center gap-3">
                <Video className="h-8 w-8 opacity-40 text-red-500" />
                <p>動画素材がありません。「素材を追加」から動画ファイルを読み込んでください。</p>
              </div>
            )}
          </div>

          {/* コントロールバー */}
          <div className="mt-4 flex items-center gap-4 bg-[#181825]/90 px-4 py-2.5 rounded-full border border-lumina-border shadow-lg max-w-md w-full">
            <button
              onClick={togglePlay}
              className="h-8 w-8 flex items-center justify-center rounded-full bg-red-600 hover:bg-red-700 text-white transition shadow-md"
            >
              {isPlaying ? <Pause className="h-4 w-4 fill-white" /> : <Play className="h-4 w-4 fill-white translate-x-0.5" />}
            </button>

            <div className="flex flex-1 flex-col">
              <span className="text-[11px] font-mono tracking-wider text-red-400">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <Volume2 className="h-4 w-4 text-lumina-text-muted" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                defaultValue="0.8"
                onChange={(e) => {
                  if (videoRef.current) videoRef.current.volume = parseFloat(e.target.value);
                }}
                className="w-16 h-1 accent-red-600 bg-lumina-border rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* 右側：字幕・クリップ管理 */}
        <aside className="w-80 shrink-0 border-l border-lumina-border bg-[#181825] flex flex-col">
          {/* 字幕編集 */}
          <div className="border-b border-lumina-border p-4">
            <h3 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-lumina-text-muted flex items-center gap-1">
              <Type className="h-3.5 w-3.5" />
              <span>字幕（テロップ）編集</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-[10px] text-lumina-text-muted">テキスト</label>
                <input
                  type="text"
                  value={newSubText}
                  onChange={(e) => setNewSubText(e.target.value)}
                  placeholder="字幕テキストを入力"
                  className="w-full rounded border border-lumina-border bg-[#1e1e2e] px-2.5 py-1.5 text-xs text-lumina-text focus:border-red-500 outline-none"
                />
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="mb-1 block text-[10px] text-lumina-text-muted">開始位置 (秒)</label>
                  <input
                    type="number"
                    value={newSubStart}
                    onChange={(e) => setNewSubStart(parseFloat(e.target.value) || 0)}
                    className="w-full rounded border border-lumina-border bg-[#1e1e2e] px-2 py-1 text-xs text-center"
                  />
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-[10px] text-lumina-text-muted">終了位置 (秒)</label>
                  <input
                    type="number"
                    value={newSubEnd}
                    onChange={(e) => setNewSubEnd(parseFloat(e.target.value) || 0)}
                    className="w-full rounded border border-lumina-border bg-[#1e1e2e] px-2 py-1 text-xs text-center"
                  />
                </div>
              </div>

              <button
                onClick={addSubtitle}
                disabled={!newSubText}
                className="w-full rounded bg-red-600 hover:bg-red-700 disabled:opacity-40 text-xs font-semibold py-1.5 text-white transition flex items-center justify-center gap-1 shadow-md"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>字幕トラックに追加</span>
              </button>
            </div>
          </div>

          {/* 素材クリップ・字幕一覧 */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* クリップリスト */}
            <div className="border-b border-lumina-border p-3 flex flex-col h-1/2 overflow-hidden">
              <span className="text-[10px] font-bold uppercase tracking-wider text-lumina-text-muted mb-2">動画クリップ</span>
              <div className="lumina-scrollbar flex-1 overflow-y-auto space-y-1.5">
                {clips.length === 0 ? (
                  <div className="py-8 text-center text-[10px] text-lumina-text-muted">素材がありません</div>
                ) : (
                  clips.map((clip) => (
                    <div
                      key={clip.id}
                      onClick={() => setActiveClipId(clip.id)}
                      className={`flex items-center justify-between rounded p-2 text-xs transition cursor-pointer border ${
                        activeClipId === clip.id
                          ? "bg-red-600/15 border-red-500/30 text-red-200"
                          : "bg-[#1e1e2e]/40 border-transparent hover:bg-lumina-bg-hover"
                      }`}
                    >
                      <div className="flex flex-col truncate pr-2">
                        <span className="truncate font-medium">{clip.name}</span>
                        <span className="text-[9px] opacity-40 font-mono">{clip.duration.toFixed(2)}s</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteClip(clip.id);
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

            {/* 字幕リスト */}
            <div className="p-3 flex flex-col h-1/2 overflow-hidden">
              <span className="text-[10px] font-bold uppercase tracking-wider text-lumina-text-muted mb-2">配置された字幕</span>
              <div className="lumina-scrollbar flex-1 overflow-y-auto space-y-1.5">
                {subtitles.length === 0 ? (
                  <div className="py-8 text-center text-[10px] text-lumina-text-muted">字幕がありません</div>
                ) : (
                  subtitles.map((sub) => (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between rounded p-2 text-xs bg-[#1e1e2e]/40 border border-transparent hover:border-red-500/20"
                    >
                      <div className="flex flex-col truncate pr-2">
                        <span className="truncate font-medium text-yellow-300/90">{sub.text}</span>
                        <span className="text-[9px] opacity-40 font-mono">
                          {sub.start.toFixed(1)}s - {sub.end.toFixed(1)}s
                        </span>
                      </div>
                      <button
                        onClick={() => deleteSubtitle(sub.id)}
                        className="rounded p-1 text-lumina-text-muted hover:text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* タイムラインエリア */}
      <footer className="h-44 shrink-0 border-t border-lumina-border bg-[#181825] flex flex-col">
        {/* ルーラー / 時間軸 */}
        <div className="h-6 border-b border-lumina-border flex items-center px-4 relative select-none">
          <Clock className="h-3.5 w-3.5 text-lumina-text-muted mr-2" />
          <span className="text-[10px] font-mono text-lumina-text-muted">タイムラインルーラー</span>
          {/* 現在時間マーカー */}
          {duration > 0 && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
              style={{ left: `${(currentTime / duration) * 100}%` }}
            >
              <div className="absolute top-0 -left-1.5 w-3.5 h-3.5 rounded-full bg-red-500 shadow shadow-red-500/30 cursor-ew-resize" />
            </div>
          )}
        </div>

        {/* トラック表示 */}
        <div className="flex-1 overflow-auto p-4 space-y-3 relative bg-[#12121c]">
          {/* ビデオトラック */}
          <div className="flex items-center gap-4">
            <span className="w-16 text-[10px] font-bold text-lumina-text-muted text-right">ビデオ T1</span>
            <div
              onClick={handleTimelineSeek}
              className="flex-1 h-8 rounded bg-[#1e1e2e] relative cursor-pointer border border-lumina-border/40 overflow-hidden"
            >
              {clips.map((clip) => (
                <div
                  key={clip.id}
                  className="absolute top-0 bottom-0 bg-red-600/35 border-r border-red-500/40 px-2 flex items-center text-[10px] font-semibold text-red-200 truncate"
                  style={{
                    left: `${(clip.startOffset / duration) * 100}%`,
                    width: `${(clip.duration / duration) * 100}%`,
                  }}
                >
                  {clip.name}
                </div>
              ))}
            </div>
          </div>

          {/* 字幕トラック */}
          <div className="flex items-center gap-4">
            <span className="w-16 text-[10px] font-bold text-lumina-text-muted text-right">字幕 T2</span>
            <div
              onClick={handleTimelineSeek}
              className="flex-1 h-8 rounded bg-[#1e1e2e] relative cursor-pointer border border-lumina-border/40"
            >
              {subtitles.map((sub) => (
                <div
                  key={sub.id}
                  className="absolute top-0 bottom-0 bg-yellow-500/25 border border-yellow-500/40 rounded px-2 flex items-center text-[10px] font-semibold text-yellow-200 truncate"
                  style={{
                    left: `${(sub.start / duration) * 100}%`,
                    width: `${((sub.end - sub.start) / duration) * 100}%`,
                  }}
                >
                  {sub.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
