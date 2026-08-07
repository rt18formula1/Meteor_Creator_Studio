"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Play, Pause, Upload, Plus, Trash2, Volume2, Volume, VolumeX,
  Video, Type, Clock, Download, ArrowLeft, Scissors, SkipBack,
  SkipForward, ZoomIn, ZoomOut, Copy, Undo2, Redo2, ChevronDown,
  Music, AlignLeft, AlignCenter, AlignRight, Bold, Italic,
  GripVertical, Lock, Eye, EyeOff, Sparkles, Folder,
} from "lucide-react";
import { AiCommandPalette } from "@/components/agent/AiCommandPalette";
import { ProjectBrowserModal } from "@/components/hub/ProjectBrowserModal";

/* ─── 型定義 ─── */
interface VideoClip {
  id: string;
  name: string;
  url: string;
  duration: number;
  startOffset: number;
  trimStart: number;
  trimEnd: number;
  volume: number;
  speed: number;
  muted: boolean;
}

interface SubtitleClip {
  id: string;
  text: string;
  start: number;
  end: number;
  fontSize: number;
  color: string;
  align: "left" | "center" | "right";
  bold: boolean;
  italic: boolean;
  bg: string;
  bgOpacity: number;
  posY: number;
}

interface AudioTrack {
  id: string;
  name: string;
  url: string;
  startOffset: number;
  duration: number;
  volume: number;
}

const genId = () => "v" + Date.now() + Math.random().toString(36).slice(2, 5);
const fmt = (t: number) => {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  const f = Math.floor((t % 1) * 30);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}:${String(f).padStart(2, "0")}`;
};
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function VideoEditor() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [clips, setClips] = useState<VideoClip[]>([]);
  const [subtitles, setSubtitles] = useState<SubtitleClip[]>([]);
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [timelineZoom, setTimelineZoom] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"sub" | "clip" | "audio">("sub");
  const [subForm, setSubForm] = useState<Omit<SubtitleClip, "id">>({
    text: "字幕テキスト", start: 0, end: 5,
    fontSize: 28, color: "#ffffff", align: "center",
    bold: false, italic: false, bg: "#000000", bgOpacity: 0.6, posY: 85,
  });
  const [history, setHistory] = useState<{clips: VideoClip[]; subs: SubtitleClip[]; audio: AudioTrack[]}[]>([{clips:[], subs:[], audio:[]}]);
  const [histIdx, setHistIdx] = useState(0);
  const [showAiPalette, setShowAiPalette] = useState(false);
  const [showProjectBrowser, setShowProjectBrowser] = useState(false);
  const pushHistory = useCallback((n:{clips: VideoClip[];subs:SubtitleClip[];audio:AudioTrack[]}) => {
    setHistory(h => [...h.slice(0, histIdx + 1), n]);
    setHistIdx(i => i + 1);
  }, [histIdx]);
  const undo = useCallback(() => {
    if (histIdx <= 0) return;
    const p = history[histIdx - 1];
    setClips(p.clips); setSubtitles(p.subs); setAudioTracks(p.audio);
    setHistIdx(i => i - 1);
  }, [histIdx, history]);
  const redo = useCallback(() => {
    if (histIdx >= history.length - 1) return;
    const n = history[histIdx + 1];
    setClips(n.clips); setSubtitles(n.subs); setAudioTracks(n.audio);
    setHistIdx(i => i + 1);
  }, [histIdx, history]);
  useEffect(() => {
    if (clips.length === 0) { setTotalDuration(0); return; }
    setTotalDuration(clips.reduce((m, c) => Math.max(m, c.startOffset + (c.duration - c.trimStart - c.trimEnd) / c.speed), 0));
  }, [clips]);
  const handleUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const url = URL.createObjectURL(file);
    const tmp = document.createElement("video"); tmp.src = url;
    tmp.onloadedmetadata = () => {
      const tail = clips.length === 0 ? 0 : clips[clips.length - 1].startOffset + clips[clips.length - 1].duration;
      const c: VideoClip = { id: genId(), name: file.name, url, duration: tmp.duration, startOffset: tail, trimStart: 0, trimEnd: 0, volume: 1, speed: 1, muted: false };
      const next = { clips: [...clips, c], subs: subtitles, audio: audioTracks };
      setClips(next.clips); pushHistory(next);
    };
    e.target.value = "";
  }, [clips, subtitles, audioTracks, pushHistory]);
  const handleAudioUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const url = URL.createObjectURL(file);
    const tmp = new Audio(url);
    tmp.onloadedmetadata = () => {
      const a: AudioTrack = { id: genId(), name: file.name, url, startOffset: 0, duration: tmp.duration, volume: 0.8 };
      const next = { clips, subs: subtitles, audio: [...audioTracks, a] };
      setAudioTracks(next.audio); pushHistory(next);
    };
    e.target.value = "";
  }, [clips, subtitles, audioTracks, pushHistory]);
  const togglePlay = useCallback(() => {
    const v = videoRef.current; if (!v || clips.length === 0) return;
    if (isPlaying) { v.pause(); setIsPlaying(false); }
    else { v.play().catch(() => {}); setIsPlaying(true); }
  }, [isPlaying, clips]);
  const handleTimeUpdate = () => { if (videoRef.current) setCurrentTime(videoRef.current.currentTime); };
  useEffect(() => { const v = videoRef.current; if (!v) return; v.volume = isMuted ? 0 : volume; }, [volume, isMuted]);
  const handleTimelineClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const t = clamp((e.clientX - rect.left) / (timelineZoom * 80), 0, totalDuration);
    setCurrentTime(t); if (videoRef.current) videoRef.current.currentTime = t;
  }, [timelineZoom, totalDuration]);
  const addSubtitle = useCallback(() => {
    if (!subForm.text.trim()) return;
    const s: SubtitleClip = { id: genId(), ...subForm };
    const next = { clips, subs: [...subtitles, s], audio: audioTracks };
    setSubtitles(next.subs); pushHistory(next);
  }, [subForm, clips, subtitles, audioTracks, pushHistory]);
  const deleteClip = useCallback((id: string) => {
    const next = { clips: clips.filter(c => c.id !== id), subs: subtitles, audio: audioTracks };
    setClips(next.clips); pushHistory(next); if (selectedId === id) setSelectedId(null);
  }, [clips, subtitles, audioTracks, pushHistory, selectedId]);
  const deleteSub = useCallback((id: string) => {
    const next = { clips, subs: subtitles.filter(s => s.id !== id), audio: audioTracks };
    setSubtitles(next.subs); pushHistory(next); if (selectedId === id) setSelectedId(null);
  }, [clips, subtitles, audioTracks, pushHistory, selectedId]);
  const activeSub = subtitles.find(s => currentTime >= s.start && currentTime <= s.end);
  const activeClip = clips.find(c => currentTime >= c.startOffset && currentTime < c.startOffset + (c.duration - c.trimStart - c.trimEnd) / c.speed) ?? clips[0];
  useEffect(() => {
    const v = videoRef.current; if (!v || !activeClip) return;
    if (v.src !== activeClip.url) { v.src = activeClip.url; v.currentTime = activeClip.trimStart + (currentTime - activeClip.startOffset) * activeClip.speed; }
    v.playbackRate = activeClip.speed; v.muted = activeClip.muted;
  }, [activeClip, currentTime]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setShowAiPalette((v) => !v);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const runAiCommand = async (prompt: string): Promise<string> => {
    const t = prompt.toLowerCase();
    if (t.includes("再生") || t.includes("play")) {
      setIsPlaying(true);
      videoRef.current?.play();
      return "再生を開始しました。";
    }
    if (t.includes("停止") || t.includes("pause") || t.includes("一時停止")) {
      setIsPlaying(false);
      videoRef.current?.pause();
      return "再生を一時停止しました。";
    }
    if (t.includes("字幕") || t.includes("subtitle") || t.includes("テロップ")) {
      addSubtitle();
      return "字幕クリップを追加しました。";
    }
    if (t.includes("動画") || t.includes("クリップ") || t.includes("upload")) {
      fileInputRef.current?.click();
      return "動画ファイル選択ダイアログを開きました。";
    }
    if (t.includes("bgm") || t.includes("音声") || t.includes("audio")) {
      audioInputRef.current?.click();
      return "BGM選択ダイアログを開きました。";
    }
    return "例: 「字幕を追加」「再生」「BGMを追加」";
  };

  const pxPerSec = timelineZoom * 80;
  const timelineWidth = Math.max(totalDuration * pxPerSec + 200, 800);
  return (
    <div className="flex h-full flex-col bg-[#0f0f17] text-[var(--lumina-text)] select-none">
      <header className="flex h-11 shrink-0 items-center justify-between border-b border-[var(--lumina-border)] bg-[#181825] px-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-1 rounded px-2 py-1 text-xs text-[var(--lumina-text-muted)] hover:bg-[var(--lumina-bg-hover)] hover:text-[var(--lumina-text)] transition">
            <ArrowLeft className="h-3.5 w-3.5" /><span>ホーム</span>
          </Link>
          <div className="h-4 w-px bg-[var(--lumina-border)]" />
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-gradient-to-br from-red-600 to-orange-500 text-[10px] font-bold text-white">V</div>
            <span className="text-sm font-semibold">Editional Video</span>
            <span className="rounded bg-orange-500/20 px-1.5 py-0.5 text-[10px] text-orange-400">Beta</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={undo} disabled={histIdx<=0} className="rounded p-1.5 text-[var(--lumina-text-muted)] hover:bg-[var(--lumina-bg-hover)] disabled:opacity-30"><Undo2 className="h-3.5 w-3.5"/></button>
          <button onClick={redo} disabled={histIdx>=history.length-1} className="rounded p-1.5 text-[var(--lumina-text-muted)] hover:bg-[var(--lumina-bg-hover)] disabled:opacity-30"><Redo2 className="h-3.5 w-3.5"/></button>
          <div className="h-4 w-px bg-[var(--lumina-border)] mx-1" />
          <button onClick={()=>fileInputRef.current?.click()} className="flex items-center gap-1.5 rounded bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition"><Upload className="h-3.5 w-3.5"/>動画を追加</button>
          <button type="button" onClick={()=>audioInputRef.current?.click()} className="flex items-center gap-1.5 rounded border border-[var(--lumina-border)] px-3 py-1.5 text-xs text-[var(--lumina-text-muted)] hover:bg-[var(--lumina-bg-hover)] transition"><Music className="h-3.5 w-3.5"/>BGMを追加</button>
          <button type="button" onClick={() => setShowAiPalette(true)} className="flex items-center gap-1.5 rounded border border-orange-500/30 bg-orange-600/15 px-3 py-1.5 text-xs font-medium text-orange-300 transition hover:bg-orange-600/30"><Sparkles className="h-3.5 w-3.5"/><span>AI</span></button>
          <button type="button" onClick={() => setShowProjectBrowser(true)} className="flex items-center gap-1.5 rounded border border-[var(--lumina-border)] px-3 py-1.5 text-xs text-[var(--lumina-text-muted)] hover:bg-[var(--lumina-bg-hover)] transition"><Folder className="h-3.5 w-3.5"/><span>プロジェクト</span></button>
          <input ref={fileInputRef} type="file" accept="video/*" onChange={handleUpload} className="hidden"/>
          <input ref={audioInputRef} type="file" accept="audio/*" onChange={handleAudioUpload} className="hidden"/>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col items-center justify-center bg-[#08080f] p-6 relative">
          <div className="relative w-full max-w-2xl" style={{aspectRatio:"16/9"}}>
            <div className="absolute inset-0 rounded-lg overflow-hidden bg-black border border-[var(--lumina-border)]/60 shadow-2xl flex items-center justify-center">
              {clips.length>0?(
                <>
                  <video ref={videoRef} src={clips[0].url} onTimeUpdate={handleTimeUpdate} className="w-full h-full object-contain"/>
                  {activeSub&&(
                    <div className="absolute left-4 right-4 flex" style={{top:activeSub.posY+"%",justifyContent:activeSub.align==="left"?"flex-start":activeSub.align==="right"?"flex-end":"center"}}>
                      <span style={{fontSize:activeSub.fontSize,color:activeSub.color,fontWeight:activeSub.bold?"bold":"normal",fontStyle:activeSub.italic?"italic":"normal",background:activeSub.bg+Math.round(activeSub.bgOpacity*255).toString(16).padStart(2,"0"),padding:"4px 12px",borderRadius:4,maxWidth:"90%",textAlign:activeSub.align}}>{activeSub.text}</span>
                    </div>
                  )}
                </>
              ):( <div className="text-center text-xs text-[var(--lumina-text-muted)] flex flex-col items-center gap-3 pointer-events-none"><Video className="h-10 w-10 opacity-30"/><p>動画ファイルを追加してくください</p></div> )}
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3 bg-[#181825]/90 backdrop-blur px-4 py-2 rounded-xl border border-[var(--lumina-border)] shadow max-w-lg w-full">
            <button onClick={()=>{if(videoRef.current){videoRef.current.currentTime=0;setCurrentTime(0);}}} className="text-[var(--lumina-text-muted)] hover:text-[var(--lumina-text)]"><SkipBack className="h-4 w-4"/></button>
            <button onClick={togglePlay} className="h-8 w-8 flex items-center justify-center rounded-full bg-red-600 hover:bg-red-700 text-white shadow">
              {isPlaying?<Pause className="h-4 w-4 fill-white"/>:<Play className="h-4 w-4 fill-white translate-x-0.5"/>}
            </button>
            <button onClick={()=>{if(videoRef.current){videoRef.current.currentTime=Math.min(videoRef.current.currentTime+5,totalDuration);}}} className="text-[var(--lumina-text-muted)] hover:text-[var(--lumina-text)]"><SkipForward className="h-4 w-4"/></button>
            <span className="font-mono text-[11px] text-red-400 w-28 shrink-0">{fmt(currentTime)} / {fmt(totalDuration)}</span>
            <div className="flex-1 h-1 bg-[var(--lumina-border)] rounded cursor-pointer" onClick={e=>{const r=e.currentTarget.getBoundingClientRect();const t=clamp((e.clientX-r.left)/r.width*totalDuration,0,totalDuration);setCurrentTime(t);if(videoRef.current)videoRef.current.currentTime=t;}}>
              <div className="h-full bg-red-500 rounded" style={{width:totalDuration?`${currentTime/totalDuration*100}%`:"0%"}}/>
            </div>
            <button onClick={()=>setIsMuted(m => !m)} className="text-[var(--lumina-text-muted)] hover:text-[var(--lumina-text)]">{isMuted?<VolumeX className="h-4 w-4"/>:volume<0.3?<Volume className="h-4 w-4"/>:<Volume2 className="h-4 w-4"/>}</button>
            <input type="range" min={0} max={1} step={0.05} value={isMuted?0:volume} onChange={e=>{setVolume(Number(e.target.value));setIsMuted(false);}} className="w-16 accent-red-500"/>
          </div>
        </div>
        <aside className="w-72 shrink-0 border-l border-[var(--lumina-border)] bg-[#181825] flex flex-col">
          <div className="flex border-b border-[var(--lumina-border)]">
            {[(["sub","字幕"],["clip","クリップ"],["audio","オーディオ"]] as const).map(([id,label])=>(
              <button key={id} onClick={()=>setActiveTab(id)} className={`flex-1 py-2 text-[11px] font-semibold transition ${activeTab===id?"border-b-2 border-red-500 text-[var(--lumina-text)]":"text-[var(--lumina-text-muted)] hover:text-[var(--lumina-text)]"}`}>{label}</button>
            ))}
          </div>
          {activeTab==="sub"&&(
            <div className="lumina-scrollbar flex-1 overflow-y-auto p-3 space-y-2">
              <div><label className="text-[10px] text-[var(--lumina-text-muted)]">テキスト</label><input value={subForm.text} onChange={e=>setSubForm(f=>({...f,text:e.target.value}))} className="mt-0.5 w-full rounded border border-[var(--lumina-border)] bg-[#1e1e2e] px-2 py-1 text-xs outline-none focus:border-red-500"/></div>
              <div className="flex gap-2">
                <div className="flex-1"><label className="text-[10px] text-[var(--lumina-text-muted)]">開h��(��)</label><input type="number" value={subForm.start} onChange={e=>setSubForm(f=>({...f,start:Number(e.target.value)}))} className="mt-0.5 w-full rounded border border-[var(--lumina-border)] bg-[#1e1e2e] px-2 py-1 text-xs text-center outline-none"/></div>
                <div className="flex-1"><label className="text-[10px] text-[var(--lumina-text-muted)]">終了(科)</label><input type="number" value={subForm.end} onChange={e=>setSubForm(f=>({...f,end:Number(e.target.value)}))} className="mt-0.5 w-full rounded border border-[var(--lumina-border)] bg-[#1e1e2e] px-2 py-1 text-xs text-center outline-none"/></div>
              </div>
              <div className="flex gap-2 items-end">
                <div className="flex-1"><label className="text-[10px] text-[var(--lumina-text-muted)]">色</label><input type="color" value={subForm.color} onChange={e=>setSubForm(f=>({...f,color:e.target.value}))} className="mt-0.5 h-7 w-full cursor-pointer rounded border border-[var(--lumina-border)]"/></div>
                <div className="flex-1"><label className="text-[10px] text-[var(--lumina-text-muted)]">背景</label><input type="color" value={subForm.bg} onChange={e=>setSubForm(f=>({...f,bg:e.target.value}))} className="mt-0.5 h-7 w-full cursor-pointer rounded border border-[var(--lumina-border)]"/></div>
                <div className="flex-1"><label className="text-[10px] text-[var(--lumina-text-muted)]">フォントサイズ</label><input type="number" min={10} max={80} value={subForm.fontSize} onChange={e=>setSubForm(f=>({...f,fontSize:Number(e.target.value)}))} className="mt-0.5 w-full rounded border border-[var(--lumina-border)] bg-[#1e1e2e] px-2 py-1 text-xs text-center outline-none"/></div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[var(--lumina-text-muted)]">配置</span>
                {([["left",<AlignLeft className="h-3 w-3"/>],["center",<AlignCenter className="h-3 w-3"/>],["right",<AlignRight className="h-3 w-3"/>]] as const).map(([a,icon])=>(
                  <button key={a} onClick={()=>setSubForm(f=>({...f,align:a}))} className={`rounded p-1 ${subForm.align===a?"bg-red-600/30 text-red-300":"text-[var(--lumina-text-muted)] hover:bg-[var(--lumina-bg-hover)]"}`}>{icon}</button>
                ))}
                <button onClick={()=>setSubForm(f=>({...f,bold:!f.bold}))} className={`ml-1 rounded p-1 ${subForm.bold?"bg-red-600/30 text-red-300":"text-[var(--lumina-text-muted)] hover:bg-[var(--lumina-bg-hover)]"}`}><Bold className="h-3 w-3"/></button>
                <button onClick={()=>setSubForm(f=>({...f,italic:!f.italic}))} className={`rounded p-1 ${subForm.italic?"bg-red-600/30 text-red-300":"text-[var(--lumina-text-muted)] hover:bg-[var(--lumina-bg-hover)]"}`}><Italic className="h-3 w-3"/></button>
              </div>
              <div><label className="text-[10px] text-[var(--lumina-text-muted)]">縦位置 ({subForm.posY}%)</label><input type="range" min={0} max={95} value={subForm.posY} onChange={e=>setSubForm(f=>({...f,posY:Number(e.target.value)}))} className="w-full accent-red-500"/></div>
              <button onClick={addSubtitle} disabled={!subForm.text.trim()} className="w-full rounded bg-red-600 hover:bg-red-700 disabled:opacity-40 text-xs font-semibold py-1.5 text-white transition flex items-center justify-center gap-1"><Plus className="h-3.5 w-3.5"/>字幕を追加</button>
              <div className="space-y-1 pt-1">
                {subtitles.map(sub=>(
                  <div key={sub.id} onClick={()=>setSelectedId(sub.id)} className={`flex items-center justify-between rounded p-2 text-xs cursor-pointer border ${selectedId===sub.id?"bg-red-600/10 border-red-500/30":"bg-[#1e1e2e]/40 border-transparent hover:bg-[var(--lumina-bg-hover)]"}`}>
                    <div className="flex flex-col truncate pr-2"><span className="truncate" style={{color:sub.color}}>{sub.text}</span><span className="text-[9px] text-[var(--lumina-text-muted)] font-mono">{sub.start.toFixed(1)}s – {sub.end.toFixed(1)}s</span></div>
                    <button onClick={e=>{e.stopPropagation();deleteSub(sub.id);}} className="rounded p-1 text-[var(--lumina-text-muted)] hover:text-red-400"><Trash2 className="h-3 w-3"/></button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {activeTab==="clip"&&(
            <div className="lumina-scrollbar flex-1 overflow-y-auto p-3 space-y-2">
              {clips.length===0?(<p className="py-8 text-center text-[11px] text-[var(--lumina-text-muted)]">動画を追加してください</p>):clips.map(clip=>(
                <div key={clip.id} onClick={()=>setSelectedId(clip.id)} className={`rounded border p-2 cursor-pointer space-y-1.5 ${selectedId===clip.id?"border-red-500/40 bg-red-600/10":"border-[var(--lumina-border)] bg-[#1e1e2e]/40 hover:bg-[var(--lumina-bg-hover)]"}`}>
                  <div className="flex items-center justify-between"><span className="truncate text-xs font-medium">{clip.name}</span><button onClick={e=>{e.stopPropagation();deleteClip(clip.id);}} className="rounded p-0.5 text-[var(--lumina-text-muted)] hover:text-red-400"><Trash2 className="h-3 w-3"/></button></div>
                  <div className="text-[10px] text-[var(--lumina-text-muted)] font-mono">{clip.duration.toFixed(2)}s • offset {clip.startOffset.toFixed(2)}s</div>
                  <div className="flex gap-2 items-center"><span className="text-[10px] text-[var(--lumina-text-muted)]">速度</span>{[0.5,1,1.5,2].map(sp=>(<button key={sp} onClick={e=>{e.stopPropagation();setClips(prev=>prev.map(c=>c.id===clip.id?{...c,speed:sp}:c));}} className={`rounded px-1.5 py-0.5 text-[10px] ${clip.speed===sp?"bg-red-600/30 text-red-300":"bg-[var(--lumina-bg-hover)] text-[var(--lumina-text-muted)]"}`}>{sp}x</button>))}</div>
                  <div className="flex items-center gap-2"><Volume2 className="h-3 w-3 text-[var(--lumina-text-muted)]"/><input type="range" min={0} max={1} step={0.05} value={clip.volume} onClick={e=>e.stopPropagation()} onChange={e=>{setClips(prev=>prev.map(c=>c.id===clip.id?{...c,volume:Number(e.target.value)}:c));}} className="flex-1 accent-red-500"/><span className="text-[10px] text-[var(--lumina-text-muted)] w-8 text-right">{Math.round(clip.volume*100)}%</span></div>
                </div>
              ))}
            </div>
          )}
          {activeTab==="audio"&&(
            <div className="lumina-scrollbar flex-1 overflow-y-auto p-3 space-y-2">
              <button onClick={()=>audioInputRef.current?.click()} className="w-full rounded border border-dashed border-[var(--lumina-border)] py-3 text-xs text-[var(--lumina-text-muted)] hover:border-red-500/50 hover:text-[var(--lumina-text)] transition flex items-center justify-center gap-1"><Music className="h-3.5 w-3.5"/>BGM / SE を追加</button>
              {audioTracks.length===0?(<p className="py-4 text-center text-[11px] text-[var(--lumina-text-muted)]">音声トラックがありませゔ0�>):audioTracks.map(at=>(
                <div key={at.id} className="rounded border border-[var(--lumina-border)] bg-[#1e1e2e]/40 p-2 space-y-1.5">
                  <div className="flex items-center justify-between"><span className="truncate text-xs font-medium">{at.name}</span><button onClick={()=>{const n={clips,subs:subtitles,audio:audioTracks.filter(a=>a.id!==at.id)};setAudioTracks(n.audio);pushHistory(n);}} className="rounded p-0.5 text-[var(--lumina-text-muted)] hover:text-red-400"><Trash2 className="h-3 w-3"/></button></div>
                  <div className="flex items-center gap-2"><Volume2 className="h-3 w-3 text-[var(--lumina-text-muted)]"/><input type="range" min={0} max={1} step={0.05} value={at.volume} onChange={e=>{setAudioTracks(prev=>prev.map(a=>a.id===at.id?{...a,volume:Number(e.target.value)}:a));}} className="flex-1 accent-red-500"/><span className="text-[10px] text-[var(--lumina-text-muted)] w-8 text-right">{Math.round(at.volume*100)}%</span></div>
                  <div className="text-[10px] font-mono text-[var(--lumina-text-muted)]">{at.duration.toFixed(2)}s</div>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
      <footer className="h-48 shrink-0 border-t border-[var(--lumina-border)] bg-[#181825] flex flex-col">
        <div className="flex items-center gap-3 border-b border-[var(--lumina-border)] px-3 py-1.5"><Clock className="h-3.5 w-3.5 text-[var(--lumina-text-muted)]"/><span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--lumina-text-muted)]">タイムライン</span><div className="ml-auto flex items-center gap-1"><button onClick={()=>setTimelineZoom(z=>Math.max(0.25,z-0.25))} className="rounded p-1 text-[var(--lumina-text-muted)] hover:bg-[var(--lumina-bg-hover)]"><ZoomOut className="h-3 w-3"/></button><span className="text-[10px] text-[var(--lumina-text-muted)] w-10 text-center">{Math.round(timelineZoom*100)}%</span><button onClick={()=>setTimelineZoom(z=>Math.min(4,z+0.25))} className="rounded p-1 text-[var(--lumina-text-muted)] hover:bg-[var(--lumina-bg-hover)]"><ZoomIn className="h-3 w-3"/></button></div></div>
        <div className="flex flex-1 overflow-hidden">
          <div className="w52 shrink-0 border-r border-[var(--lumina-border)] flex flex-col">
            <div className="h-5 border-b border-[var(--lumina-border)]"/>
            {[`動画 V1`,`字幕 T2`,`BGM T3`].map(l=>(<div key={l} className="flex h-10 items-center justify-end pr-2 border-b border-[var(--lumina-border)]/30"><span className="text-[9px] font-semibold text-[var(--lumina-text-muted)] uppercase">{l}</span></div>))}
          </div>
          <div ref={timelineRef} className="flex-1 overflow-x-auto overflow-y-hidden">
            <div style={{width:timelineWidth,position:"relative"}}>
              <div className="h-5 border-b border-[var(--lumina-border)] relative cursor-pointer" onClick={handleTimelineClick}>
                {Array.from({length:Math.ceil(totalDuration)+1},(_,i)=>(<div key={i} className="absolute top-0 bottom-0 border-l border-[var(--lumina-border)]/40 flex items-end pb-0.5" style={{left:i*pxPerSec}}><span className="text-[9px] text-[var(--lumina-text-muted)] pl-0.5">{fmt(i)}</span></div>))}
              </div>
              <div className="h-10 border-b border-[var(--lumina-border)]/30 relative cursor-pointer" onClick={handleTimelineClick}>
                {clips.map(c=>{const e=(c.duration-c.trimStart-c.trimEnd)/c.speed;return(<div key={c.id} onClick={e=>{e.stopPropagation();setSelectedId(c.id);}} className={`absolute top-1 bottom-1 rounded flex items-center px-2 overflow-hidden cursor-pointer border ${selectedId===c.id?"border-red-400 bg-red-600/40":"border-red-500/30 bg-red-600/25 hover:bg-red-600/35"}`} style={{left:c.startOffset*pxPerSec,width:e*pxPerSec-2}}><span className="text-[9px] text-red-200 truncate">{c.name}</span></div>);})}
              </div>
              <div className="h-10 border-b border-[var(--lumina-border)]/30 relative cursor-pointer" onClick={handleTimelineClick}>
                {subtitles.map(s=>(<div key={s.id} onClick={e=>{e.stopPropagation();setSelectedId(s.id);}} className={`absolute top-1 bottom-1 rounded flex items-center px-2 overflow-hidden cursor-pointer border ${selectedId===s.id?"border-yellow-400 bg-yellow-500/40":"border-yellow-500/30 bg-yellow-500/20 hover:bg-yellow-500/30"}`} style={{left:s.start*pxPerSec,width:Math.max((s.end-s.start)*pxPerSec-2,20)}}><span className="text-[9px] text-yellow-200 truncate">{s.text}</span></div>))}
              </div>
              <div className="h-10 relative cursor-pointer" onClick={handleTimelineClick}>
                {audioTracks.map(at=>(<div key={at.id} className="absolute top-1 bottom-1 rounded flex items-center px-2 overflow-hidden border border-green-500/30 bg-green-500/20 hover:bg-green-500/30" style={{left:at.startOffset*pxPerSec,width:Math.max(at.duration*pxPerSec-2,20)}}><span className="text-[9px] text-green-200 truncate">{at.name}</span></div>))}
              </div>
              {totalDuration>0&&(<div className="absolute top-0 bottom-0 w-px bg-red-500 z-20 pointer-events-none" style={{left:currentTime*pxPerSec}}><div className="absolute -top-0 -left-1.5 w-3 h-3 rounded-full bg-red-500"/></div>)}
            </div>
          </div>
        </div>
      </footer>
      <AiCommandPalette
        appName="Editional Video"
        isOpen={showAiPalette}
        onClose={() => setShowAiPalette(false)}
        onExecuteCommand={runAiCommand}
        suggestions={["字幕を追加", "再生", "一時停止", "BGMを追加"]}
      />
      <ProjectBrowserModal
        isOpen={showProjectBrowser}
        onClose={() => setShowProjectBrowser(false)}
        defaultAppId="video"
      />
    </div>
  );
}
