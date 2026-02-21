"use client";

import { Verse } from "@/types";
import { useState, useRef, useEffect } from "react";
import { useLiveBibleText } from "@/hooks/useLiveBibleText";
import { cn } from "@/lib/utils";
import { useProgress } from "@/hooks/useProgress";
import html2canvas from "html2canvas";
import { format } from "date-fns";
import { VerseShareCard } from "./VerseShareCard";
import { InlineTypeTest } from "./InlineTypeTest";
import { db, storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, getDoc, setDoc, addDoc, collection } from "firebase/firestore";

import { useAuth } from "@/context/AuthContext";

interface VerseDetailProps {
    verse: Verse;
    language: 'en' | 'ko' | 'zh' | 'es' | 'de' | 'fr';
    onRestrictedAction?: () => void;
    onLoginRequired?: () => void;
}

export function VerseDetail({ verse, language, onRestrictedAction, onLoginRequired }: VerseDetailProps) {
    const { user } = useAuth();
    const { isMemorized, toggleVerseMemorized } = useProgress(verse.seriesId);

    // Live Bible text — API-fetched with IndexedDB cache, falls back to hard-coded
    const { text: liveText } = useLiveBibleText({
        reference: verse.reference.en,
        language,
        fallback: verse.text[language],
    });
    // ... existing code ...

    const handleRecordClick = () => {
        if (onRestrictedAction) {
            onRestrictedAction();
            return;
        }
        if (!user && onLoginRequired) {
            onLoginRequired();
            return;
        }
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    const handleMemorizeClick = () => {
        if (onRestrictedAction) {
            onRestrictedAction();
            return;
        }
        if (!user && onLoginRequired) {
            onLoginRequired();
            return;
        }
        toggleVerseMemorized(verse.id);
    };
    const memorized = isMemorized(verse.id);

    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [loopCount, setLoopCount] = useState(0);
    const [targetLoops, setTargetLoops] = useState(1); // 1, 10, or infinity
    const [playbackRate, setPlaybackRate] = useState(1.0);
    const [testMode, setTestMode] = useState(false);
    const [typeTestMode, setTypeTestMode] = useState(false);
    const [typedInput, setTypedInput] = useState("");
    const [volume, setVolume] = useState(1.0);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
    const shareCardRef = useRef<HTMLDivElement>(null);
    const [shareTheme, setShareTheme] = useState<string>("");
    const [wasSaved, setWasSaved] = useState(false);

    const PASTEL_THEMES = [
        "linear-gradient(135deg, #fcf9f2 0%, #f5f0e1 100%)", // Beige
        "linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)", // Pink
        "linear-gradient(135deg, #fefce8 0%, #fef9c3 100%)", // Yellow
        "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)", // Green
        "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)", // Blue
        "linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)", // Purple
    ];

    useEffect(() => {
        // Set random theme on mount
        const randomTheme = PASTEL_THEMES[Math.floor(Math.random() * PASTEL_THEMES.length)];
        setShareTheme(randomTheme);
    }, []);
    const [isSharing, setIsSharing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Share Modal State
    const [showPreview, setShowPreview] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);

    // Cleanup URL on unmount or verse change
    useEffect(() => {
        return () => {
            if (audioUrl) URL.revokeObjectURL(audioUrl);
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [audioUrl, previewUrl]);

    // Load existing recording and reset state on verse change
    useEffect(() => {
        // Reset state first
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
        setAudioBlob(null);
        setAudioUrl(null);
        setIsPlaying(false);
        setLoopCount(0);
        setTestMode(false); // Reset Test Mode on verse change
        setTypeTestMode(false); // Reset Type Test Mode on verse change
        setTypedInput("");

        // Load existing recording if user is logged in
        if (user && verse.id) {
            const loadRecording = async () => {
                try {
                    // Path: users/{uid}/recordings/{verseId} (Document holding the URL)
                    // Or easier: check valid storage path? Accessing Firestore is faster/cheaper for existence check.
                    // Let's store metadata in Firestore: users/{uid}/recordings/{verseId} -> { url, createdAt }
                    const docRef = doc(db, "users", user.uid, "recordings", verse.id);
                    const docSnap = await getDoc(docRef);

                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        if (data.url) {
                            setAudioUrl(data.url);
                            // We don't have the blob, but we have the URL which is enough for <audio>
                        }
                    }
                } catch (err) {
                    console.error("Error loading recording:", err);
                }
            };
            loadRecording();
        }
    }, [verse.id, user]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                ? 'audio/webm;codecs=opus'
                : 'audio/webm';

            const mediaRecorder = new MediaRecorder(stream, {
                mimeType,
                audioBitsPerSecond: 24000, // 24 kbps — speech-optimized, ~180KB/min
            });
            mediaRecorderRef.current = mediaRecorder;

            const chunks: BlobPart[] = [];
            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.push(e.data);
            };

            mediaRecorder.onstop = async () => {
                const mimeType = mediaRecorder.mimeType || "audio/webm";
                const blob = new Blob(chunks, { type: mimeType });
                setAudioBlob(blob);
                const localUrl = URL.createObjectURL(blob);
                setAudioUrl(localUrl);

                // Auto-save to Firebase
                if (user) {
                    setIsUploading(true);
                    try {
                        const fileExt = mimeType.includes("mp4") ? "m4a" : "webm"; // Basic deduction
                        const storageRef = ref(storage, `recordings/${user.uid}/${verse.id}.${fileExt}`);

                        await uploadBytes(storageRef, blob);
                        const downloadUrl = await getDownloadURL(storageRef);

                        // Save metadata to Firestore
                        await setDoc(doc(db, "users", user.uid, "recordings", verse.id), {
                            url: downloadUrl,
                            verseId: verse.id,
                            seriesId: verse.seriesId,
                            createdAt: new Date().toISOString(),
                            mimeType: mimeType
                        });
                        console.log("Recording saved successfully:", downloadUrl);
                        // Update audioUrl to the remote one? No, keep local for immediate playback speed, 
                        // but maybe update it silently or on next load. Local blob is fine for now.
                    } catch (uploadErr) {
                        console.error("Error uploading recording:", uploadErr);
                        alert("Failed to save recording. Please check your connection.");
                    } finally {
                        setIsUploading(false);
                    }
                }
            };

            mediaRecorder.start();
            setIsRecording(true);

            // AUTO-STOP after 2 minutes (120,000 ms)
            setTimeout(() => {
                if (mediaRecorder.state === "recording") {
                    mediaRecorder.stop();
                    alert("Maximum recording duration (2 minutes) reached.");
                }
            }, 120000);

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
        } else {
            // Set up AudioContext GainNode for volume control (only once per audio element)
            if (!audioContextRef.current) {
                const ctx = new AudioContext();
                const gain = ctx.createGain();
                gain.gain.value = volume;
                audioContextRef.current = ctx;
                gainNodeRef.current = gain;
            }
            // Connect source -> gain -> output (only if not already connected)
            if (!sourceNodeRef.current && audioRef.current && audioContextRef.current) {
                const source = audioContextRef.current.createMediaElementSource(audioRef.current);
                source.connect(gainNodeRef.current!);
                gainNodeRef.current!.connect(audioContextRef.current.destination);
                sourceNodeRef.current = source;
            }
            if (audioContextRef.current?.state === 'suspended') {
                audioContextRef.current.resume();
            }
            setLoopCount(0);
            audioRef.current.play().catch(error => {
                console.error("Playback failed:", error);
                setIsPlaying(false);
            });
        }
    };


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
        return text.split(' ').map((word, idx) => {
            if (word.length === 0) return <span key={idx}> </span>;
            const firstChar = word.charAt(0);
            const hiddenCount = word.length - 1;

            return (
                <span key={idx} className="inline-flex items-center whitespace-pre gap-[2px]">
                    <span className="text-stone-900">{firstChar}</span>
                    {Array.from({ length: hiddenCount }).map((_, i) => (
                        <span
                            key={i}
                            className="inline-block rounded-full bg-stone-300"
                            style={{ width: '0.55em', height: '0.55em' }}
                        />
                    ))}
                    {" "}
                </span>
            );
        });
    };

    const handleShare = async () => {
        if (!shareCardRef.current) return;
        setIsSharing(true);
        setWasSaved(false);

        try {
            // Generate a random theme if not set (though effect handles it, good for refresh)
            const currentTheme = shareTheme || PASTEL_THEMES[Math.floor(Math.random() * PASTEL_THEMES.length)];
            if (!shareTheme) setShareTheme(currentTheme);

            // Wait a tick for render if we just set it? React batches, but shareCardRef is ref.
            // Actually, if we update state, we need to wait for re-render before capturing.
            // For now, assume state is set on mount.

            // 1. Generate canvas ONCE
            const canvas = await html2canvas(shareCardRef.current, {
                scale: 2,
                backgroundColor: null,
                useCORS: true,
                logging: false,
            });

            // 2. Prepare Data URL (for Preview & Download Link)
            const dataUrl = canvas.toDataURL("image/png");
            setPreviewUrl(dataUrl);

            // 3. Prepare Blob (for System Share & Firebase Upload)
            canvas.toBlob((blob) => {
                if (!blob) {
                    setIsSharing(false);
                    alert("Failed to generate image.");
                    return;
                }
                setPreviewBlob(blob);
                setShowPreview(true);
                setIsSharing(false);
            }, 'image/png');

        } catch (err) {
            console.error("Share generation failed:", err);
            setIsSharing(false);
            alert("Could not generate image. Please try again.");
        }
    };

    const saveToHistory = async (blob: Blob) => {
        if (!user) return;

        // Don't block UI with this async operation
        try {
            const timestamp = Date.now();
            const fileName = `users/${user.uid}/shares/${timestamp}_${verse.id}.png`;
            const storageRef = ref(storage, fileName);

            // Upload
            const snapshot = await uploadBytes(storageRef, blob);
            const downloadUrl = await getDownloadURL(snapshot.ref);

            // Save metadata
            await addDoc(collection(db, "users", user.uid, "shared_images"), {
                url: downloadUrl,
                verseId: verse.id,
                seriesId: verse.seriesId,
                reference: verse.reference[language],
                createdAt: new Date().toISOString(),
                language: language,
                theme: shareTheme // Save theme used
            });
            console.log("Image saved to history");
        } catch (error) {
            console.error("Error saving to history:", error);
        }
    };

    const getSafeFilename = () => {
        try {
            const dateStr = format(new Date(), 'yyyy-MM-dd');
            return `miracle-memory-${dateStr}.png`;
        } catch (e) {
            return `miracle-memory-${Date.now()}.png`;
        }
    };

    const performSystemShare = async () => {
        if (!previewBlob) {
            alert("Image not ready to share.");
            return;
        }

        if (!wasSaved) {
            saveToHistory(previewBlob)
                .then(() => setWasSaved(true))
                .catch(err => console.error("Background save failed:", err));
        }

        const filename = getSafeFilename();
        const file = new File([previewBlob], filename, { type: "image/png" });

        // ONLY share the file. Adding text/title often causes apps (Telegram/WhatsApp) 
        // to share the text and ignore the file.
        const shareData = {
            files: [file]
        };

        if (navigator.canShare && navigator.canShare(shareData)) {
            try {
                await navigator.share(shareData);
            } catch (err: any) {
                console.warn('Share API failed:', err);
                if (err.name !== 'AbortError') {
                    // Fallback to Clipboard
                    try {
                        const clipboardItem = new ClipboardItem({ "image/png": previewBlob });
                        await navigator.clipboard.write([clipboardItem]);
                        alert("Sharing failed. Image copied to clipboard!");
                    } catch (clipboardErr) {
                        alert("Sharing failed. Please use the 'Save' button.");
                    }
                }
            }
        } else {
            // Fallback to Clipboard
            try {
                const clipboardItem = new ClipboardItem({ "image/png": previewBlob });
                await navigator.clipboard.write([clipboardItem]);
                alert("Image copied to clipboard!");
            } catch (clipboardErr) {
                alert("Device doesn't support sharing. Use Save.");
            }
        }
    };

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.playbackRate = playbackRate;
        }
    }, [playbackRate]);

    // Update GainNode when volume changes
    useEffect(() => {
        if (gainNodeRef.current) {
            gainNodeRef.current.gain.value = volume;
        }
    }, [volume]);

    return (
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-stone-200/60 max-w-4xl mx-auto my-8 relative">
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
                    {/* Verse Text — or InlineTypeTest when active */}
                    {typeTestMode ? (
                        <InlineTypeTest
                            text={liveText}
                            onClose={() => {
                                setTypeTestMode(false);
                                setTypedInput("");
                            }}
                        />
                    ) : (
                        <div className="text-xl md:text-2xl font-reading font-bold text-stone-900 leading-relaxed min-h-[4rem] flex flex-wrap justify-center items-center">
                            {testMode ? getMaskedText(liveText) : liveText}
                        </div>
                    )}
                    <p className="text-lg text-rose-900 mt-4 font-serif italic font-medium">
                        — {verse.reference[language]}
                    </p>
                </div>

                {/* Audio Controls */}
                <div className="bg-stone-50 rounded-2xl p-6 border border-stone-100">
                    <div className="flex flex-col items-center gap-6">

                        {/* Recorder */}
                        {!audioUrl ? (
                            <button
                                onClick={handleRecordClick}
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
                                    {/* Volume Slider */}
                                    <div className="flex flex-col items-center gap-2">
                                        <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Volume</label>
                                        <div className="flex items-center gap-2 h-12">
                                            <svg className="w-4 h-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M12 6v12m-3.536-9.536a5 5 0 000 7.072" />
                                            </svg>
                                            <input
                                                type="range"
                                                min="0"
                                                max="1"
                                                step="0.05"
                                                value={volume}
                                                onChange={(e) => setVolume(Number(e.target.value))}
                                                className="w-24 accent-amber-500 cursor-pointer"
                                                title={`Volume: ${Math.round(volume * 100)}%`}
                                            />
                                        </div>
                                    </div>

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
                                        <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Test</label>
                                        <button
                                            onClick={() => {
                                                setTestMode(prev => !prev);
                                                setTypeTestMode(false);
                                                setTypedInput("");
                                            }}
                                            className={cn(
                                                "h-12 px-6 rounded-xl border-2 font-bold text-sm tracking-wide transition-all shadow-sm",
                                                testMode
                                                    ? "bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-200"
                                                    : "bg-stone-100 border-stone-300 text-stone-600 hover:bg-amber-50 hover:border-amber-400 hover:text-amber-700"
                                            )}
                                        >
                                            {testMode ? '● ON' : '○ OFF'}
                                        </button>
                                    </div>

                                    <div className="flex flex-col items-center gap-2">
                                        <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Type Test</label>
                                        <button
                                            onClick={() => {
                                                setTypeTestMode(prev => !prev);
                                                setTestMode(false);
                                                setTypedInput("");
                                            }}
                                            className={cn(
                                                "h-12 px-6 rounded-xl border-2 font-bold text-sm tracking-wide transition-all shadow-sm",
                                                typeTestMode
                                                    ? "bg-rose-500 border-rose-500 text-white shadow-md shadow-rose-200"
                                                    : "bg-stone-100 border-stone-300 text-stone-600 hover:bg-rose-50 hover:border-rose-400 hover:text-rose-700"
                                            )}
                                        >
                                            {typeTestMode ? '● ON' : '○ OFF'}
                                        </button>
                                    </div>
                                </div>

                            </div>
                        )}

                        <div className="text-xs text-stone-400 flex items-center justify-center gap-2">
                            {isRecording ? (
                                <span className="text-red-500 font-medium animate-pulse">Recording (Max 2m)...</span>
                            ) : isUploading ? (
                                <span className="text-amber-600 font-medium flex items-center gap-1">
                                    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    Saving...
                                </span>
                            ) : (
                                "Tap mic to record your voice"
                            )}
                        </div>
                    </div>
                </div>

                {/* Action Buttons: Mark as Memorized & Share */}

                <div className="flex items-center justify-center gap-4 pt-4 border-t border-stone-100">
                    <button
                        onClick={handleMemorizeClick}
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
                        disabled={isSharing}
                        className="p-3 rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors disabled:opacity-50"
                        title="Share this verse"
                    >
                        {isSharing ? (
                            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                        )}
                    </button>

                    {/* Removed individual Telegram button as requested/to fix confusion */}
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

            {/* Hidden Share Card for Generation */}
            <div className="absolute -top-[9999px] -left-[9999px]">
                <VerseShareCard
                    ref={shareCardRef}
                    verse={verse}
                    language={language}
                    userName={user?.displayName || "A Miracle Memory User"}
                    date={format(new Date(), "MMMM d, yyyy")}
                    theme={shareTheme}
                />
            </div>
            {/* Share Preview Modal */}
            {showPreview && previewUrl && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl overflow-hidden max-w-sm w-full shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                        <div className="p-4 border-b border-stone-100 flex justify-between items-center bg-stone-50">
                            <h3 className="font-bold text-stone-800">Share Verse</h3>
                            <button
                                onClick={() => setShowPreview(false)}
                                className="p-2 hover:bg-stone-200 rounded-full transition-colors text-stone-500"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="p-6 flex flex-col items-center gap-6">
                            <div className="relative shadow-lg rounded-xl overflow-hidden bg-stone-100 border border-stone-200">
                                <img src={previewUrl} alt="Share Preview" className="max-w-full h-auto max-h-[50vh] object-contain" />
                            </div>
                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={async () => {
                                        if (!previewBlob || wasSaved) return;
                                        setIsUploading(true);
                                        try {
                                            await saveToHistory(previewBlob);
                                            setWasSaved(true);
                                            alert("Saved to your profile!");
                                        } catch (e) {
                                            console.error(e);
                                            alert("Failed to save.");
                                        } finally {
                                            setIsUploading(false);
                                        }
                                    }}
                                    disabled={isUploading || wasSaved}
                                    className={cn(
                                        "flex-1 py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2",
                                        wasSaved
                                            ? "bg-stone-100 text-stone-400 cursor-default"
                                            : "bg-stone-200 text-stone-800 hover:bg-stone-300"
                                    )}
                                >
                                    {isUploading ? (
                                        <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    ) : wasSaved ? (
                                        <>
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                            Saved
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                                            Save
                                        </>
                                    )}
                                </button>

                                <button
                                    onClick={performSystemShare}
                                    className="flex-1 bg-stone-900 text-white py-3 rounded-xl font-bold hover:bg-stone-800 transition-colors flex items-center justify-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                                    Share
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
