
import { Verse } from "@/types";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface VerseShareCardProps {
    verse: Verse;
    language: 'en' | 'ko' | 'zh' | 'es';
    userName?: string;
    date: string;
    theme?: string;
}

export const VerseShareCard = forwardRef<HTMLDivElement, VerseShareCardProps>(
    ({ verse, language, userName, date, theme }, ref) => {
        return (
            <div
                ref={ref}
                style={{
                    width: '600px',
                    height: '600px',
                    backgroundColor: '#fcf9f2', // Fallback
                    color: '#1c1917',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '3rem',
                    textAlign: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    background: theme || "linear-gradient(135deg, #fcf9f2 0%, #f5f0e1 100%)",
                }}
            >
                {/* Decorative Background Elements */}
                <div
                    style={{
                        position: 'absolute',
                        top: '-5rem',
                        left: '-5rem',
                        width: '16rem',
                        height: '16rem',
                        borderRadius: '9999px',
                        filter: 'blur(64px)',
                        backgroundColor: 'rgba(255, 255, 255, 0.4)'
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        bottom: '-5rem',
                        right: '-5rem',
                        width: '16rem',
                        height: '16rem',
                        borderRadius: '9999px',
                        filter: 'blur(64px)',
                        backgroundColor: 'rgba(255, 255, 255, 0.4)'
                    }}
                />

                {/* Content Container */}
                <div style={{
                    position: 'relative',
                    zIndex: 10,
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    justifyContent: 'space-between',
                    paddingTop: '2rem',
                    paddingBottom: '2rem'
                }}>
                    {/* Header */}
                    <div style={{
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        letterSpacing: '0.2em',
                        textTransform: 'uppercase',
                        color: 'rgba(28, 25, 23, 0.6)'
                    }}>
                        Miracle Memory
                    </div>

                    {/* Verse Text */}
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}>
                        <h1 style={{
                            fontFamily: 'var(--font-libre), serif',
                            fontWeight: 'bold',
                            lineHeight: 1.25,
                            marginBottom: '1.5rem',
                            color: '#1c1917',
                            fontSize: verse.text[language].length > 150 ? '1.5rem' : '1.875rem'
                        }}>
                            "{verse.text[language]}"
                        </h1>
                        <p style={{
                            fontSize: '1.25rem',
                            fontFamily: 'serif',
                            fontStyle: 'italic',
                            fontWeight: 500,
                            color: '#881337'
                        }}>
                            — {verse.reference[language]}
                        </p>
                    </div>

                    {/* Footer / Memorized By */}
                    <div style={{
                        paddingTop: '1.5rem',
                        width: '6rem',
                        margin: '0 auto',
                        borderTop: '1px solid rgba(28, 25, 23, 0.2)'
                    }}>
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.25rem'
                        }}>
                            {userName && (
                                <div style={{
                                    fontSize: '0.875rem',
                                    fontWeight: 500,
                                    color: '#292524'
                                }}>
                                    Memorized by {userName}
                                </div>
                            )}
                            <div style={{
                                fontSize: '0.75rem',
                                fontWeight: 500,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                color: 'rgba(28, 25, 23, 0.5)'
                            }}>
                                {date}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
);

VerseShareCard.displayName = "VerseShareCard";
