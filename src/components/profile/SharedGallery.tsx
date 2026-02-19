"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

interface SharedImage {
    id: string;
    url: string;
    verseId: string;
    reference: string;
    createdAt: string;
}

export function SharedGallery() {
    const { user } = useAuth();
    const [images, setImages] = useState<SharedImage[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const fetchImages = async () => {
            try {
                const q = query(
                    collection(db, "users", user.uid, "shared_images"),
                    orderBy("createdAt", "desc"),
                    limit(20) // Limit to recent 20 for now
                );

                const snapshot = await getDocs(q);
                const fetchedImages = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as SharedImage[];

                setImages(fetchedImages);
            } catch (error) {
                console.error("Error fetching shared images:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchImages();
    }, [user]);

    if (loading) {
        return (
            <div className="animate-pulse flex gap-4 overflow-x-auto pb-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="flex-shrink-0 w-32 h-32 bg-stone-200 rounded-xl"></div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-serif font-bold text-stone-900 pl-2 border-l-4 border-rose-400">
                My Sharing
            </h2>

            {images.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {images.map((img) => (
                        <div key={img.id} className="relative group aspect-square rounded-xl overflow-hidden bg-stone-100 border border-stone-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow">
                            <img
                                src={img.url}
                                alt={img.reference}
                                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                <p className="text-white text-xs font-bold">{img.reference || "Bible Verse"}</p>
                                <p className="text-white/80 text-[10px]">{new Date(img.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-2xl p-8 text-center border border-stone-100 border-dashed">
                    <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <p className="text-stone-500 mb-2">No shared images yet.</p>
                    <p className="text-stone-400 text-sm">Create and share beautiful verse images from the reader!</p>
                </div>
            )}
        </div>
    );
}
