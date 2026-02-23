"use client";

import { Verse } from "@/types";
import { useState, useRef, useEffect, useCallback } from "react";
import { useLiveBibleText } from "@/hooks/useLiveBibleText";
import { cn } from "@/lib/utils";
import { useProgress } from "@/hooks/useProgress";
import html2canvas from "html2canvas";
import { format } from "date-fns";
import { VerseShareCard } from "./VerseShareCard";
import { InlineTypeTest } from "./InlineTypeTest";
import { db, storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, getDoc, setDoc } from "firebase/firestore";
import confetti from "canvas-confetti";
import { useAuth } from "@/context/AuthContext";
import { UI_TEXT } from "@/data/translations";

// ─── Types ────────────────────────────────────────────────
type PracticeStep = 1 | 2 | 3 | 4; // 1=Record, 2=Listen10x, 3=HintListen10x, 4=TypeTest

interface VerseDetailProps {
    verse: Verse;
    language: 'en' | 'ko' | 'zh' | 'es' | 'de' | 'fr';
    onRestrictedAction?: () => void;
    onLoginRequired?: () => void;
}

// ─── Step Indicator ───────────────────────────────────────
function StepIndicator({
    currentStep,
    stepDone,
    labels,
    onStepClick,
}: {
    currentStep: PracticeStep;
    stepDone: Record<PracticeStep, boolean>;
    labels: string[];
    onStepClick?: (step: PracticeStep) => void;
}) {
    return (
        <div className="flex flex-col items-center mb-6 select-none">
            {/* Row 1: circles + connectors */}
            <div className="flex items-center">
                {([1, 2, 3, 4] as PracticeStep[]).map((step, i) => {
                    const done = stepDone[step];
                    const active = currentStep === step;
                    const clickable = !!onStepClick;
                    return (
                        <div key={step} className="flex items-center">
                            <div
                                onClick={() => onStepClick?.(step)}
                                className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all",
                                    clickable && "cursor-pointer hover:scale-110",
                                    done
                                        ? "bg-amber-500 border-amber-500 text-white"
                                        : active
                                            ? "bg-white border-amber-500 text-amber-600 ring-4 ring-amber-100 animate-pulse"
                                            : "bg-white border-stone-300 text-stone-400"
                                )}
                            >
                                {done ? "✓" : step}
                            </div>
                            {i < 3 && (
                                <div className={cn(
                                    "w-10 h-0.5 transition-all",
                                    done ? "bg-amber-400" : "bg-stone-200"
                                )} />
                            )}
                        </div>
                    );
                })}
            </div>
            {/* Row 2: labels */}
            <div className="flex items-start mt-1.5">
                {([1, 2, 3, 4] as PracticeStep[]).map((step, i) => {
                    const done = stepDone[step];
                    const active = currentStep === step;
                    return (
                        <div key={step} className="flex items-center">
                            <span className={cn(
                                "text-[9px] font-bold uppercase tracking-wide w-8 text-center leading-tight",
                                done ? "text-amber-600" : active ? "text-stone-700" : "text-stone-300"
                            )}>
                                {labels[i]}
                            </span>
                            {i < 3 && <div className="w-10" />}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────
export function VerseDetail({ verse, language, onRestrictedAction, onLoginRequired }: VerseDetailProps) {
    const { user } = useAuth();
    const { isMemorized, toggleVerseMemorized } = useProgress(verse.seriesId);
    const t = UI_TEXT.bible;
    const tl = (obj: Record<string, string>) => obj[language] ?? obj["en"];

    // Live Bible text
    const { text: liveText } = useLiveBibleText({
        reference: verse.reference.en,
        language,
        fallback: verse.text[language],
    });

    // ── Core state ─────────────────────────────────────────
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [loopCount, setLoopCount] = useState(0);
    const [targetLoops, setTargetLoops] = useState(5);
    const [isUploading, setIsUploading] = useState(false);

    // ── 4-Step practice state ──────────────────────────────
    const [practiceStep, setPracticeStep] = useState<PracticeStep>(1);
    const [stepDone, setStepDone] = useState<Record<PracticeStep, boolean>>({
        1: false, 2: false, 3: false, 4: false,
    });
    const [typeTestCompleted, setTypeTestCompleted] = useState(false);

    const markStepDone = useCallback((step: PracticeStep) => {
        setStepDone(prev => ({ ...prev, [step]: true }));
    }, []);

    const canMarkMemorized = typeTestCompleted || isMemorized(verse.id);

    // ── Refs ────────────────────────────────────────────────
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
    const shareCardRef = useRef<HTMLDivElement>(null);
    const [shareTheme, setShareTheme] = useState<string>("");
    const [wasSaved, setWasSaved] = useState(false);

    const PASTEL_THEMES = [
        "linear-gradient(135deg, #fcf9f2 0%, #f5f0e1 100%)",
        "linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)",
        "linear-gradient(135deg, #fefce8 0%, #fef9c3 100%)",
        "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
        "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
        "linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)",
    ];

    useEffect(() => {
        const randomTheme = PASTEL_THEMES[Math.floor(Math.random() * PASTEL_THEMES.length)];
        setShareTheme(randomTheme);
    }, []);

    const [isSharing, setIsSharing] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);

    // ── Cleanup ────────────────────────────────────────────
    useEffect(() => {
        return () => {
            if (audioUrl) URL.revokeObjectURL(audioUrl);
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [audioUrl, previewUrl]);

    // ── Stop audio when verse changes ──────────────────────
    useEffect(() => {
        if (audioRef.current && !audioRef.current.paused) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        setIsPlaying(false);
    }, [verse.id]);

    // ── Load recording + reset on verse change ─────────────
    useEffect(() => {
        if (mediaRecorderRef.current?.state === "recording") {
            mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
        setAudioBlob(null);
        setAudioUrl(null);
        setIsPlaying(false);
        setLoopCount(0);
        setPracticeStep(1);
        setStepDone({ 1: false, 2: false, 3: false, 4: false });
        setTypeTestCompleted(false);

        if (user && verse.id) {
            const loadRecording = async () => {
                try {
                    const docRef = doc(db, "users", user.uid, "recordings", verse.id);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        if (data.url) {
                            setAudioUrl(data.url);
                            // Already recorded → step 1 done, start at step 2
                            setStepDone(prev => ({ ...prev, 1: true }));
                            setPracticeStep(2);
                        }
                    }
                } catch (err) {
                    console.error("Error loading recording:", err);
                }
            };
            loadRecording();
        }
    }, [verse.id, user]);

    // ── Recording ──────────────────────────────────────────
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100,
                    channelCount: 1,
                }
            });
            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                ? 'audio/webm;codecs=opus' : 'audio/webm';
            const mediaRecorder = new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 128000 });
            mediaRecorderRef.current = mediaRecorder;
            const chunks: BlobPart[] = [];
            mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
            mediaRecorder.onstop = async () => {
                const blob = new Blob(chunks, { type: mimeType });
                setAudioBlob(blob);
                const localUrl = URL.createObjectURL(blob);
                setAudioUrl(localUrl);
                // Mark step 1 done, move to step 2
                markStepDone(1);
                setPracticeStep(2);

                if (user) {
                    setIsUploading(true);
                    try {
                        const fileExt = mimeType.includes("mp4") ? "m4a" : "webm";
                        const storageRef = ref(storage, `recordings/${user.uid}/${verse.id}.${fileExt}`);
                        await uploadBytes(storageRef, blob);
                        const downloadUrl = await getDownloadURL(storageRef);
                        await setDoc(doc(db, "users", user.uid, "recordings", verse.id), {
                            url: downloadUrl,
                            verseId: verse.id,
                            seriesId: verse.seriesId,
                            createdAt: new Date().toISOString(),
                            mimeType,
                        });
                    } catch (uploadErr) {
                        console.error("Error uploading recording:", uploadErr);
                    } finally {
                        setIsUploading(false);
                    }
                }
            };
            mediaRecorder.start();
            setIsRecording(true);
            setTimeout(() => {
                if (mediaRecorder.state === "recording") mediaRecorder.stop();
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

    const handleRecordClick = () => {
        if (onRestrictedAction) { onRestrictedAction(); return; }
        if (!user && onLoginRequired) { onLoginRequired(); return; }
        if (isRecording) stopRecording(); else startRecording();
    };

    // ── Playback ───────────────────────────────────────────
    const togglePlayback = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            if (!audioContextRef.current) {
                const ctx = new AudioContext();
                const gain = ctx.createGain();
                gain.gain.value = 1.0;
                audioContextRef.current = ctx;
                gainNodeRef.current = gain;
            }
            if (!sourceNodeRef.current && audioRef.current && audioContextRef.current) {
                const source = audioContextRef.current.createMediaElementSource(audioRef.current);
                source.connect(gainNodeRef.current!);
                gainNodeRef.current!.connect(audioContextRef.current.destination);
                sourceNodeRef.current = source;
            }
            if (audioContextRef.current?.state === 'suspended') audioContextRef.current.resume();
            setLoopCount(0);
            audioRef.current.play().catch(() => setIsPlaying(false));
        }
    };

    const handleEnded = () => {
        const nextCount = loopCount + 1;
        setLoopCount(nextCount);
        if (nextCount < targetLoops) {
            audioRef.current?.play();
        } else {
            setIsPlaying(false);
            // Mark current listen step done
            if (practiceStep === 2) {
                markStepDone(2);
            } else if (practiceStep === 3) {
                markStepDone(3);
            }
        }
    };

    // ── Text masking ───────────────────────────────────────
    const getMaskedText = (text: string) => {
        return text.split(' ').map((word, idx) => {
            if (word.length === 0) return <span key={idx}> </span>;
            const firstChar = word.charAt(0);
            const hiddenCount = word.length - 1;
            return (
                <span key={idx} className="inline-flex items-center whitespace-pre gap-[2px]">
                    <span className="text-stone-900">{firstChar}</span>
                    {Array.from({ length: hiddenCount }).map((_, i) => (
                        <span key={i} className="inline-block rounded-full bg-stone-300"
                            style={{ width: '0.55em', height: '0.55em' }} />
                    ))}
                    {" "}
                </span>
            );
        });
    };

    // ── Memorize ───────────────────────────────────────────
    const memorized = isMemorized(verse.id);

    const handleMemorizeClick = () => {
        if (!canMarkMemorized) return;
        if (onRestrictedAction) { onRestrictedAction(); return; }
        if (!user && onLoginRequired) { onLoginRequired(); return; }
        toggleVerseMemorized(verse.id);
    };

    // ── Share ──────────────────────────────────────────────
    const handleShare = async () => {
        if (!shareCardRef.current) return;
        setIsSharing(true);
        setWasSaved(false);
        try {
            const canvas = await html2canvas(shareCardRef.current, { scale: 2, backgroundColor: null, useCORS: true, logging: false });
            const dataUrl = canvas.toDataURL("image/png");
            setPreviewUrl(dataUrl);
            canvas.toBlob((blob) => {
                if (!blob) { setIsSharing(false); return; }
                setPreviewBlob(blob);
                setShowPreview(true);
                setIsSharing(false);
            }, 'image/png');
        } catch {
            setIsSharing(false);
        }
    };

    const getSafeFilename = () => {
        try {
            const ref = verse.reference[language] || verse.reference.en;
            return `miracle-memory-${ref.replace(/[^a-zA-Z0-9]/g, '-')}.png`;
        } catch { return `miracle-memory-${Date.now()}.png`; }
    };

    const performSystemShare = async () => {
        if (!previewBlob) return;
        if (!wasSaved) {
            saveToHistory(previewBlob).then(() => setWasSaved(true)).catch(console.error);
        }
        const filename = getSafeFilename();
        const file = new File([previewBlob], filename, { type: "image/png" });
        const shareData = { files: [file] };
        if (navigator.canShare && navigator.canShare(shareData)) {
            try { await navigator.share(shareData); } catch { /* aborted */ }
        } else {
            try {
                const item = new ClipboardItem({ "image/png": previewBlob });
                await navigator.clipboard.write([item]);
            } catch { /* ignore */ }
        }
    };

    const saveToHistory = async (blob: Blob) => {
        if (!user) return;
        try {
            const storageRef = ref(storage, `share-history/${user.uid}/${verse.id}-${Date.now()}.png`);
            await uploadBytes(storageRef, blob);
            const url = await getDownloadURL(storageRef);
            await setDoc(doc(db, "users", user.uid, "shareHistory", `${verse.id}-${Date.now()}`), {
                url, verseId: verse.id, createdAt: new Date().toISOString(),
            });
        } catch (e) { console.error(e); }
    };

    // ── Step-specific listen start ─────────────────────────
    const startListeningForStep = (step: PracticeStep) => {
        setLoopCount(0);
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
            togglePlayback();
        }
    };

    // ── Skip all steps ──────────────────────────────────────
    const skipAllSteps = () => {
        if (audioRef.current && !audioRef.current.paused) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        setIsPlaying(false);
        setStepDone({ 1: true, 2: true, 3: true, 4: true });
        setTypeTestCompleted(true);
        setPracticeStep(4);
    };

    // ─── Step labels ───────────────────────────────────────
    const stepLabels = [
        "RECORD",
        "LISTEN",
        "SHADOW",
        "TEST",
    ];

    // ─── Shadowing helpers ─────────────────────────────────
    // Returns just first letters for each word
    const getFirstLetters = (text: string): { first: string; rest: string; raw: string }[] =>
        text.split(' ').filter(w => w.length > 0).map(w => ({
            first: w[0],
            rest: w.slice(1),
            raw: w,
        }));

    const [shadowInput, setShadowInput] = useState("");
    const [shadowDone, setShadowDone] = useState(false);
    // Shadow repeat tracking: 5 oral repetitions
    const [shadowReps, setShadowReps] = useState<boolean[]>([false, false, false, false, false]);

    // Reset shadowing state on verse change
    useEffect(() => {
        setShadowInput("");
        setShadowDone(false);
        setShadowReps([false, false, false, false, false]);
    }, [verse.id]);

    // Handle step indicator click
    const handleStepClick = (step: PracticeStep) => {
        if (audioRef.current && !audioRef.current.paused) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        setPracticeStep(step);
        setLoopCount(0);
        setIsPlaying(false);
    };

    // ─── Render ─────────────────────────────────────────────
    return (
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-stone-200/60 max-w-4xl mx-auto mt-0 mb-6 relative">
            {/* Memorized Badge */}
            {memorized && (
                <div className="absolute top-6 right-6 z-10 animate-in fade-in zoom-in duration-500">
                    <div className="bg-amber-100 text-amber-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-amber-200 shadow-sm">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                        Memorized
                    </div>
                </div>
            )}

            <div className="p-8 md:p-12 space-y-8">
                {/* Header: title only */}
                <div className="text-center">
                    <div className="text-sm font-bold tracking-widest text-primary uppercase">
                        MEMORIZE THIS VERSE
                    </div>
                </div>

                {/* ─── STEP 1: Record ─────────────────────────────── */}
                {practiceStep === 1 && (
                    <div className="flex flex-col items-center gap-6">
                        {/* Full text + reference */}
                        <div className="text-xl md:text-2xl font-reading font-bold text-stone-900 leading-relaxed text-center">
                            {liveText}
                        </div>
                        <p className="text-lg text-rose-900 font-serif italic font-medium -mt-4">— {verse.reference[language]}</p>
                        {/* Step Indicator — clickable */}
                        <StepIndicator currentStep={practiceStep} stepDone={stepDone} labels={stepLabels} onStepClick={handleStepClick} />

                        <div className="bg-stone-50 rounded-2xl p-6 border border-stone-100 w-full flex flex-col items-center gap-4">
                            <p className="text-xs text-stone-400 font-medium uppercase tracking-widest">{tl(t.step1Record)}</p>

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
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                                        <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <button onClick={() => { setAudioUrl(null); setAudioBlob(null); }} className="text-xs text-red-500 hover:underline">
                                        {tl(t.reRecord)}
                                    </button>
                                </div>
                            )}

                            <p className="text-xs text-stone-400">
                                {isRecording ? tl(t.recording) : isUploading ? tl(t.saving) : "Tap mic to record your voice"}
                            </p>
                        </div>

                        {/* Skip button */}
                        <button onClick={skipAllSteps} className="text-xs text-stone-400 hover:text-stone-600 underline underline-offset-2">
                            {tl(t.skipStep)}
                        </button>
                    </div>
                )}

                {/* ─── STEP 2: Listen 10x ─────────────────────────── */}
                {practiceStep === 2 && (
                    <div className="flex flex-col items-center gap-6">
                        {/* Full text + reference */}
                        <div className="text-xl md:text-2xl font-reading font-bold text-stone-900 leading-relaxed text-center">
                            {liveText}
                        </div>
                        <p className="text-lg text-rose-900 font-serif italic font-medium -mt-4">— {verse.reference[language]}</p>
                        {/* Step Indicator — clickable */}
                        <StepIndicator currentStep={practiceStep} stepDone={stepDone} labels={stepLabels} onStepClick={handleStepClick} />


                        <div className="bg-stone-50 rounded-2xl p-6 border border-stone-100 w-full flex flex-col items-center gap-4">
                            <p className="text-xs text-stone-400 font-medium uppercase tracking-widest">{tl(t.step2Listen)}</p>

                            {/* Play button */}
                            <div className="flex items-center gap-6">
                                <button onClick={() => { setAudioUrl(null); setAudioBlob(null); setPracticeStep(1); setStepDone(p => ({ ...p, 1: false })); }}
                                    className="text-xs text-red-500 hover:underline">{tl(t.reRecord)}</button>
                                <button
                                    onClick={togglePlayback}
                                    className="w-20 h-20 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 hover:bg-emerald-700 transition-all"
                                >
                                    {isPlaying ? (
                                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 9v6m4-6v6" /></svg>
                                    ) : (
                                        <svg className="w-10 h-10 translate-x-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                    )}
                                </button>
                            </div>

                            {/* Repeat selector */}
                            <div className="flex items-center gap-3">
                                <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Repeats</label>
                                <select
                                    value={targetLoops}
                                    onChange={(e) => setTargetLoops(Number(e.target.value))}
                                    className="h-9 px-3 rounded-lg border border-stone-200 bg-white text-stone-800 font-bold text-sm focus:border-amber-500 outline-none cursor-pointer"
                                >
                                    <option value={3}>3x</option>
                                    <option value={5}>5x</option>
                                    <option value={10}>10x</option>
                                </select>
                            </div>

                            {/* Progress */}
                            {(isPlaying || loopCount > 0) && (
                                <div className="w-full space-y-1">
                                    <div className="flex justify-between text-xs text-stone-500 font-medium">
                                        <span>{isPlaying ? tl(t.listenProgress) : stepDone[2] ? tl(t.listenDone) : ""}</span>
                                        <span>{Math.min(loopCount, targetLoops)} / {targetLoops}</span>
                                    </div>
                                    <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                            style={{ width: `${(Math.min(loopCount, targetLoops) / targetLoops) * 100}%` }} />
                                    </div>
                                </div>
                            )}

                            {stepDone[2] && (
                                <div className="text-emerald-600 text-sm font-bold animate-in fade-in">{tl(t.listenDone)}</div>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button onClick={skipAllSteps} className="text-xs text-stone-400 hover:text-stone-600 underline underline-offset-2">
                                {tl(t.skipStep)}
                            </button>
                        </div>
                    </div>
                )}

                {/* ─── STEP 3: Shadowing — 첫 글자 + 5번 체크 ──────── */}
                {practiceStep === 3 && (() => {
                    const words = getFirstLetters(liveText);
                    const allShadowRepsChecked = shadowReps.every(Boolean);

                    // When all 5 reps checked, mark done
                    if (allShadowRepsChecked && !stepDone[3]) {
                        markStepDone(3);
                        setShadowDone(true);
                    }

                    return (
                        <div className="flex flex-col items-center gap-6 w-full">
                            {/* First-letter hints only */}
                            <div className="text-xl md:text-2xl font-reading font-bold text-stone-900 leading-relaxed flex flex-wrap justify-center items-center text-center gap-x-2">
                                {words.map((w, i) => (
                                    <span key={i} className="inline-flex items-center gap-[2px]">
                                        <span className="text-rose-600 font-bold">{w.first}</span>
                                        {Array.from({ length: w.rest.length }).map((_, j) => (
                                            <span key={j} className="inline-block rounded-full bg-stone-300"
                                                style={{ width: '0.5em', height: '0.5em' }} />
                                        ))}
                                    </span>
                                ))}
                            </div>
                            <p className="text-lg text-rose-900 font-serif italic font-medium -mt-4">— {verse.reference[language]}</p>
                            <StepIndicator currentStep={practiceStep} stepDone={stepDone} labels={stepLabels} onStepClick={handleStepClick} />

                            <div className="bg-stone-50 rounded-2xl p-6 border border-stone-100 w-full flex flex-col items-center gap-5">
                                <p className="text-xs text-stone-400 font-medium uppercase tracking-widest">5번 따라 말해보세요</p>

                                {/* 5 repeat check buttons */}
                                <div className="flex items-center gap-3">
                                    {shadowReps.map((checked, i) => (
                                        <button
                                            key={i}
                                            onClick={() => {
                                                if (checked) return; // can't uncheck
                                                const updated = [...shadowReps];
                                                updated[i] = true;
                                                setShadowReps(updated);
                                            }}
                                            className={cn(
                                                "w-12 h-12 rounded-full border-2 flex items-center justify-center text-lg font-bold transition-all",
                                                checked
                                                    ? "bg-amber-500 border-amber-500 text-white scale-105 shadow-md"
                                                    : "bg-white border-stone-300 text-stone-400 hover:border-amber-400 hover:text-amber-500"
                                            )}
                                        >
                                            {checked ? "✓" : i + 1}
                                        </button>
                                    ))}
                                </div>

                                {/* Progress text */}
                                <p className="text-sm text-stone-500">
                                    {shadowReps.filter(Boolean).length} / 5 완료
                                </p>

                                {allShadowRepsChecked && (
                                    <div className="text-emerald-600 text-sm font-bold animate-in fade-in">🎉 잘 하셨어요!</div>
                                )}
                            </div>

                            <button onClick={skipAllSteps} className="text-xs text-stone-400 hover:text-stone-600 underline underline-offset-2">
                                {tl(t.skipStep)}
                            </button>
                        </div>
                    );
                })()}

                {/* ─── STEP 4: Type Test ───────────────────────────── */}
                {practiceStep === 4 && (
                    <div className="flex flex-col items-center gap-4 w-full">
                        <p className="text-lg text-rose-900 font-serif italic font-medium">— {verse.reference[language]}</p>
                        {/* Step Indicator — clickable */}
                        <StepIndicator currentStep={practiceStep} stepDone={stepDone} labels={stepLabels} onStepClick={handleStepClick} />
                        <InlineTypeTest
                            text={liveText}
                            language={language}
                            onClose={() => { setPracticeStep(3); setStepDone(p => ({ ...p, 3: false, 4: false })); setLoopCount(0); }}
                            onComplete={() => {
                                setTypeTestCompleted(true);
                                markStepDone(4);
                            }}
                        />
                    </div>
                )}

                {/* ─── Mark as Memorized + Share ───────────────────── */}
                <div className="flex items-center justify-center gap-4 pt-4 border-t border-stone-100">
                    <button
                        onClick={handleMemorizeClick}
                        disabled={!canMarkMemorized}
                        title={!canMarkMemorized ? tl(t.completeFirst) : ""}
                        className={cn(
                            "flex items-center gap-3 px-4 py-2 rounded-xl transition-all group",
                            canMarkMemorized
                                ? "hover:bg-stone-50 cursor-pointer"
                                : "opacity-40 cursor-not-allowed"
                        )}
                    >
                        <div className={cn(
                            "w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all",
                            memorized
                                ? "bg-emerald-500 border-emerald-500 text-white"
                                : "border-stone-300 bg-white"
                        )}>
                            {memorized && (
                                <svg className="w-6 h-6 animate-in zoom-in duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </div>
                        <span className={cn(
                            "text-lg font-bold transition-colors",
                            memorized
                                ? "text-emerald-700"
                                : canMarkMemorized
                                    ? "text-stone-600 group-hover:text-stone-900"
                                    : "text-stone-400"
                        )}>
                            {tl(t.markMemorized)}
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
                </div>

                {!canMarkMemorized && (
                    <p className="text-center text-xs text-stone-400">{tl(t.completeFirst)}</p>
                )}
            </div>

            {/* Hidden audio element */}
            <audio
                ref={audioRef}
                src={audioUrl || undefined}
                onPlay={() => setIsPlaying(true)}
                onEnded={handleEnded}
                onPause={() => setIsPlaying(false)}
                className="hidden"
            />

            {/* Hidden Share Card */}
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
                            <button onClick={() => setShowPreview(false)} className="p-2 hover:bg-stone-200 rounded-full transition-colors text-stone-500">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="p-6 flex flex-col items-center gap-6">
                            <div className="relative shadow-lg rounded-xl overflow-hidden bg-stone-100 border border-stone-200">
                                <img src={previewUrl} alt="Share Preview" className="max-w-full h-auto max-h-[50vh] object-contain" />
                            </div>
                            <div className="flex gap-3 w-full">
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
