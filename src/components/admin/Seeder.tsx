"use client";

import { db } from "@/lib/firebase";
import { writeBatch, doc, collection } from "firebase/firestore";
import { INITIAL_SERIES, INITIAL_VERSES } from "@/data/seedData";
import { useState } from "react";

export function Seeder() {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState("");

    const seedDatabase = async () => {
        setLoading(true);
        setStatus("Starting seed...");

        try {
            const batch = writeBatch(db);

            // Seed Series
            INITIAL_SERIES.forEach((series) => {
                const ref = doc(db, "series", series.id);
                batch.set(ref, series);
            });

            // Seed Verses
            INITIAL_VERSES.forEach((verse) => {
                const ref = doc(db, "verses", verse.id);
                batch.set(ref, verse);
            });

            await batch.commit();
            setStatus("Success! Database populated.");
        } catch (error: any) {
            console.error(error);
            setStatus(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-4 right-4 z-50">
            <button
                onClick={seedDatabase}
                disabled={loading}
                className="bg-red-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg hover:bg-red-700 disabled:opacity-50"
            >
                {loading ? "Seeding..." : "Admin: Seed DB"}
            </button>
            {status && <div className="absolute bottom-full right-0 mb-2 bg-black/80 text-white text-xs p-2 rounded whitespace-nowrap">{status}</div>}
        </div>
    );
}
