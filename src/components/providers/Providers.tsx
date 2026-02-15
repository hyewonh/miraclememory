"use client";

import { AuthProvider } from "@/context/AuthContext";
import { PaypalProvider } from "@/components/providers/PaypalProvider";
import { LanguageProvider } from "@/context/LanguageContext";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <LanguageProvider>
                <PaypalProvider>
                    {children}
                </PaypalProvider>
            </LanguageProvider>
        </AuthProvider>
    );
}
