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

    if (images.length === 0) return null;

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-serif font-bold text-stone-900 border-l-4 border-rose-400 pl-3">
                My Shared Moments
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {images.map((img) => (
                    <div key={img.id} className="relative group aspect-square rounded-xl overflow-hidden bg-stone-100 border border-stone-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow">
                        <img
                            src={img.url}
                            alt={img.reference}
                            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                            <p className="text-white text-xs font-bold">{img.reference}</p>
                            <p className="text-white/80 text-[10px]">{new Date(img.createdAt).toLocaleDateString()}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
