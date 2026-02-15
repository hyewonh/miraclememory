"use client";

import { Verse } from "@/types";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useProgress } from "@/hooks/useProgress";

interface VerseDetailProps {
    verse: Verse;
    language: 'en' | 'ko' | 'zh' | 'es';
}



export function VerseDetail({ verse, language }: VerseDetailProps) {
    const { isMemorized, toggleVerseMemorized } = useProgress(verse.seriesId);
    const memorized = isMemorized(verse.id);

    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [loopCount, setLoopCount] = useState(0);
    const [targetLoops, setTargetLoops] = useState(1); // 1, 10, or infinity
    const [playbackRate, setPlaybackRate] = useState(1.0);
    const [testMode, setTestMode] = useState(false);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Cleanup URL on unmount
    useEffect(() => {
        return () => {
            if (audioUrl) URL.revokeObjectURL(audioUrl);
        };
    }, [audioUrl]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Use browser default MIME type for best compatibility
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;

            const chunks: BlobPart[] = [];
            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.push(e.data);
            };

            mediaRecorder.onstop = () => {
                // Use the recorder's actual mime type
                const mimeType = mediaRecorder.mimeType || "audio/webm";
                const blob = new Blob(chunks, { type: mimeType });
                setAudioBlob(blob);
                const url = URL.createObjectURL(blob);
                setAudioUrl(url);
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Microphone access denied.");
        }
    };

    const stopRecording = () => {
        mediaRecorderRef.current?.stop();
        setIsRecording(false);
    };

    const togglePlayback = () => {
        if (!audioRef.current) return;

        if (isPlaying) {
            audioRef.current.pause();
            // setIsPlaying(false) handled by onPause
        } else {
            setLoopCount(0);
            audioRef.current.play().catch(error => {
                console.error("Playback failed:", error);
                setIsPlaying(false);
            });
            // setIsPlaying(true) handled by onPlay
        }
    };
    // ... (skip lines 80-180) -> wait I cannot skip lines in replacement content unless I use multi-replace.
    // I will use multi-replace to target specific blocks. 
    // Step 1: Update startRecording and togglePlayback
    // Step 2: Update Play Button CSS
    // Step 3: Update Audio src


    const handleEnded = () => {
        const nextCount = loopCount + 1;
        setLoopCount(nextCount);

        if (targetLoops === -1 || nextCount < targetLoops) {
            // Loop again
            audioRef.current?.play();
        } else {
            setIsPlaying(false);
        }
    };

    const getMaskedText = (text: string) => {
        return text.split(' ').map(word => {
            if (word.length === 0) return word;
            const firstChar = word.charAt(0);
            // Replace rest with asterisk per user request
            const masked = "*".repeat(word.length - 1);
            return firstChar + masked;
        }).join(' ');
    };

    const handleShare = async () => {
        const shareData = {
            title: 'Miracle Memory',
            text: `I just memorized ${verse.reference[language]} on Miracle Memory! "${verse.text[language]}"`,
            url: window.location.href
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.log('Error sharing:', err);
            }
        } else {
            // Fallback to clipboard
            navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
            alert("Copied to clipboard!");
        }
    };

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.playbackRate = playbackRate;
        }
    }, [playbackRate]);

    return (
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-stone-200 max-w-4xl mx-auto my-8 relative">
            {/* Memorized Badge (Visual only if memorized) */}
            {memorized && (
                <div className="absolute top-6 right-6 z-10 animate-in fade-in zoom-in duration-500">
                    <div className="bg-amber-100 text-amber-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-amber-200 shadow-sm">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                        Memorized
                    </div>
                </div>
            )}

            <div className="p-8 md:p-12 text-center space-y-8">
                {/* Header */}
                <div>
                    <div className="text-sm font-bold tracking-widest text-primary uppercase mb-2">
                        Memorize This Verse
                    </div>
                    <h2 className="text-3xl md:text-5xl font-serif font-bold text-stone-900 leading-tight">
                        {testMode ? getMaskedText(verse.text[language]) : verse.text[language]}
                    </h2>
                    <p className="text-xl text-stone-500 mt-4 font-serif italic">
                        — {verse.reference[language]}
                    </p>
                </div>

                {/* Audio Controls */}
                <div className="bg-stone-50 rounded-2xl p-6 border border-stone-100">
                    <div className="flex flex-col items-center gap-6">

                        {/* Recorder */}
                        {!audioUrl ? (
                            <button
                                onClick={isRecording ? stopRecording : startRecording}
                                className={cn(
                                    "w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-lg",
                                    isRecording
                                        ? "bg-red-500 animate-pulse ring-4 ring-red-200"
                                        : "bg-stone-800 hover:bg-stone-700 text-white"
                                )}
                            >
                                {isRecording ? (
                                    <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
                                        <span className="block w-4 h-4 bg-red-500 rounded-sm" />
                                    </div>
                                ) : (
                                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                    </svg>
                                )}
                            </button>
                        ) : (
                            // Player Controls
                            <div className="w-full space-y-4">
                                <div className="flex items-center justify-center gap-6">
                                    <button
                                        onClick={() => setAudioUrl(null)}
                                        className="text-xs text-red-500 hover:underline"
                                    >
                                        Re-record
                                    </button>

                                    <button
                                        onClick={togglePlayback}
                                        className="w-20 h-20 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 hover:bg-emerald-700 transition-all font-bold"
                                    >
                                        {isPlaying ? (
                                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 9v6m4-6v6" /></svg>
                                        ) : (
                                            <svg className="w-10 h-10 translate-x-0" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M8 5v14l11-7z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>

                                {/* Settings */}
                                <div className="flex flex-wrap justify-center gap-4 mt-6">
                                    <div className="flex flex-col items-center gap-2">
                                        <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Repeats</label>
                                        <select
                                            value={targetLoops}
                                            onChange={(e) => setTargetLoops(Number(e.target.value))}
                                            className="h-12 px-4 rounded-xl border-2 border-stone-200 bg-white text-stone-800 font-bold text-base focus:border-amber-500 outline-none cursor-pointer hover:border-amber-300 transition-colors"
                                        >
                                            <option value={1}>1x</option>
                                            <option value={5}>5x</option>
                                            <option value={10}>10x</option>
                                            <option value={-1}>Infinite</option>
                                        </select>
                                    </div>

                                    <div className="flex flex-col items-center gap-2">
                                        <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Speed</label>
                                        <select
                                            value={playbackRate}
                                            onChange={(e) => setPlaybackRate(Number(e.target.value))}
                                            className="h-12 px-4 rounded-xl border-2 border-stone-200 bg-white text-stone-800 font-bold text-base focus:border-amber-500 outline-none cursor-pointer hover:border-amber-300 transition-colors"
                                        >
                                            <option value={1.0}>1.0x</option>
                                            <option value={0.75}>0.75x</option>
                                            <option value={0.5}>0.5x</option>
                                        </select>
                                    </div>

                                    <div className="flex flex-col items-center gap-2">
                                        <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Test</label>
                                        <button
                                            onClick={() => setTestMode(!testMode)}
                                            className={cn(
                                                "h-12 px-6 rounded-xl border-2 font-bold text-base transition-all",
                                                testMode
                                                    ? "bg-amber-100 border-amber-300 text-amber-800"
                                                    : "bg-white border-stone-200 text-stone-400 hover:border-amber-300"
                                            )}
                                        >
                                            {testMode ? 'ON' : 'OFF'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="text-xs text-stone-400">
                            {isRecording ? "Listening..." : "Tap mic to record your voice"}
                        </div>
                    </div>
                </div>

                {/* Action Buttons: Mark as Memorized & Share */}
                <div className="flex items-center justify-center gap-4 pt-4 border-t border-stone-100">
                    <button
                        onClick={() => toggleVerseMemorized(verse.id)}
                        className="flex items-center gap-3 px-4 py-2 rounded-xl hover:bg-stone-50 transition-colors group"
                    >
                        <div className={cn(
                            "w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all",
                            memorized
                                ? "bg-emerald-500 border-emerald-500 text-white"
                                : "border-stone-300 bg-white group-hover:border-emerald-400"
                        )}>
                            {memorized && (
                                <svg className="w-6 h-6 animate-in zoom-in duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </div>
                        <span className={cn(
                            "text-lg font-bold transition-colors",
                            memorized ? "text-emerald-700" : "text-stone-600 group-hover:text-stone-900"
                        )}>
                            Mark as Memorized
                        </span>
                    </button>

                    <button
                        onClick={handleShare}
                        className="p-3 rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors"
                        title="Share this verse"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                    </button>

                    {/* Telegram Share Button specific */}
                    <a
                        href={`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(`I memorized ${verse.reference[language]}!`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 rounded-full bg-blue-50 text-blue-500 hover:bg-blue-100 transition-colors"
                        title="Share on Telegram"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" /></svg>
                    </a>
                </div>
            </div>

            <audio
                ref={audioRef}
                src={audioUrl || undefined}
                onPlay={() => setIsPlaying(true)}
                onEnded={handleEnded}
                onPause={() => setIsPlaying(false)}
                className="hidden"
            />
        </div>
    );
}
