"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";
import Link from "next/link";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import UserDetailModal from "./UserDetailModal";
import GrowthChart from "@/components/admin/GrowthChart";

// Mock Admin Check (Replace with real admin check logic or hardcoded email for now)
const ADMIN_EMAILS = ["ryan@example.com", "admin@kingdommemory.com", "hyewonh@gmail.com"]; // Add your email here to test

export default function AdminDashboard() {
    const { user, loading: authLoading } = useAuth();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'subscriptions'>('overview');
    const [selectedUser, setSelectedUser] = useState<any>(null); // For Detail Modal

    // Search & Filter State
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<'all' | 'premium' | 'free'>('all');
    const [faithFilter, setFaithFilter] = useState<string>('all');

    // Update Premium Status Handler
    const handleUpdatePremiumStatus = async (userId: string, isPremium: boolean) => {
        const action = isPremium ? "grant Premium access to" : "revoke Premium access from";
        if (!window.confirm(`Are you sure you want to ${action} this user?`)) {
            return;
        }

        try {
            await import("firebase/firestore").then(({ doc, updateDoc }) =>
                updateDoc(doc(db, "users", userId), { isPremium })
            );
            // Update local state
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, isPremium } : u));
            alert(`User premium status updated successfully.`);
        } catch (error: any) {
            console.error("Error updating user:", error);
            alert("Failed to update user: " + error.message);
        }
    };

    const router = useRouter(); // Add useRouter hook

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/admin/login");
            return;
        }

        const isEmailAllowed = user && ADMIN_EMAILS.includes(user.email || "");
        if (!authLoading && user && !isEmailAllowed) {
            setLoading(false);
            return;
        }

        if (user && isEmailAllowed) {
            const fetchData = async () => {
                try {
                    // Try ordered query first (requires index)
                    try {
                        const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
                        const querySnapshot = await getDocs(q);
                        const usersData = querySnapshot.docs.map(doc => ({
                            id: doc.id,
                            ...doc.data(),
                            createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(doc.data().createdAt)
                        }));
                        setUsers(usersData);
                    } catch (indexError: any) {
                        // Fallback: Fetch all and sort client-side if index is missing
                        console.warn("Index missing, falling back to client-side sort");
                        const q = query(collection(db, "users"));
                        const querySnapshot = await getDocs(q);
                        const usersData = querySnapshot.docs.map(doc => ({
                            id: doc.id,
                            ...doc.data(),
                            createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(doc.data().createdAt || Date.now())
                        }));
                        // Sort desc
                        usersData.sort((a: any, b: any) => b.createdAt - a.createdAt);
                        setUsers(usersData);
                    }
                } catch (error: any) {
                    console.error("Error fetching users:", error);
                    if (error?.code === 'permission-denied') {
                        // Silent failure or toast could be added here
                    }
                } finally {
                    setLoading(false);
                }
            };

            fetchData();
        }

        // Safety timeout: If Firestore hangs (offline/issues), stop loading after 3s so user can see UI
        const timer = setTimeout(() => {
            setLoading((prev) => {
                if (prev) {
                    console.warn("Force releasing loading state.");
                    return false;
                }
                return prev;
            });
        }, 3000);

        return () => clearTimeout(timer);
    }, [user, authLoading, router]);

    // Delete User Handler
    const handleDeleteUser = async (userId: string) => {
        if (!window.confirm("Are you sure you want to delete this user from the database? This action cannot be undone.")) {
            return;
        }

        try {
            await import("firebase/firestore").then(({ deleteDoc, doc }) =>
                deleteDoc(doc(db, "users", userId))
            );
            // Update local state
            setUsers(prev => prev.filter(u => u.id !== userId));
            alert("User data deleted from database.");
        } catch (error: any) {
            console.error("Error deleting user:", error);
            alert("Failed to delete user: " + error.message);
        }
    };

    if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center">Loading Admin...</div>;

    const isEmailAllowed = user && ADMIN_EMAILS.includes(user.email || "");

    if (!isEmailAllowed) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center space-y-6">
                <h1 className="text-2xl font-bold text-stone-800">Access Denied</h1>
                <p className="text-stone-500">You do not have permission to view this page. ({user?.email})</p>

                <div className="flex gap-4">
                    <Link href="/" className="text-stone-900 underline hover:text-stone-600">
                        Return Home
                    </Link>
                    <button
                        onClick={async () => {
                            const { auth } = await import("@/lib/firebase");
                            await auth.signOut();
                            router.push('/admin/login');
                        }}
                        className="bg-stone-900 text-white px-4 py-2 rounded-lg font-bold hover:bg-stone-700 transition-colors"
                    >
                        Switch Account
                    </button>
                </div>
            </div>
        );
    }

    // Filter Logic
    const filteredUsers = users.filter(user => {
        const matchesSearch = (
            (user.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
            (user.email?.toLowerCase() || "").includes(searchQuery.toLowerCase())
        );
        const matchesStatus = statusFilter === 'all'
            ? true
            : statusFilter === 'premium' ? user.isPremium
                : !user.isPremium;
        const matchesFaith = faithFilter === 'all'
            ? true
            : user.survey?.faithStage === faithFilter;

        return matchesSearch && matchesStatus && matchesFaith;
    });

    // --- Analytics Data Prep ---
    const totalUsers = users.length;
    const premiumUsers = users.filter(u => u.isPremium).length;
    const trialUsers = users.filter(u => !u.isPremium).length; // Simplified

    // Faith Stage Data
    const faithStages = users.reduce((acc: any, curr) => {
        const stage = curr.survey?.faithStage || "Unknown";
        acc[stage] = (acc[stage] || 0) + 1;
        return acc;
    }, {});
    const faithChartData = Object.entries(faithStages).map(([name, value]) => ({ name, value }));

    // Goals Data
    const goals = users.reduce((acc: any, curr) => {
        const goal = curr.survey?.goal || "Unknown";
        acc[goal] = (acc[goal] || 0) + 1;
        return acc;
    }, {});
    const goalChartData = Object.entries(goals).map(([name, value]) => ({ name, value }));

    // Growth Data (Last 30 Days)
    const growthData = (() => {
        const last30Days = new Array(30).fill(0).map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (29 - i));
            return d.toISOString().split('T')[0];
        });

        const counts: Record<string, number> = {};
        last30Days.forEach(date => counts[date] = 0);

        users.forEach(u => {
            if (u.createdAt) {
                const dateKey = new Date(u.createdAt).toISOString().split('T')[0];
                if (counts[dateKey] !== undefined) {
                    counts[dateKey]++;
                }
            }
        });

        return last30Days.map(date => ({
            date: date.slice(5), // "MM-DD"
            count: counts[date]
        }));
    })();

    // CSV Export
    const downloadCSV = () => {
        const headers = ["ID", "Email", "Name", "Date Joined", "Age", "Location", "Faith Stage", "Goal", "Is Premium", "Subscription ID"];
        const csvContent = [
            headers.join(","),
            ...users.map(u => [
                u.id,
                u.email || "",
                u.name || "",
                u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "",
                u.survey?.age || "",
                u.survey?.location || "",
                u.survey?.faithStage || "",
                u.survey?.goal || "",
                u.isPremium ? "Yes" : "No",
                u.subscriptionId || ""
            ].map(f => `"${f}"`).join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    return (
        <div className="min-h-screen bg-stone-50 font-sans text-stone-800">
            {/* Header */}
            <header className="bg-white border-b border-stone-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">👑</span>
                        <h1 className="font-serif font-bold text-xl">Kingdom Admin</h1>
                    </div>
                    <div className="flex gap-4 text-sm font-medium">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`px-3 py-1 rounded-full ${activeTab === 'overview' ? 'bg-stone-900 text-white' : 'hover:bg-stone-100'}`}
                        >
                            Overview
                        </button>
                        <button
                            onClick={() => setActiveTab('users')}
                            className={`px-3 py-1 rounded-full ${activeTab === 'users' ? 'bg-stone-900 text-white' : 'hover:bg-stone-100'}`}
                        >
                            Users & Email
                        </button>
                        <button
                            onClick={() => setActiveTab('subscriptions')}
                            className={`px-3 py-1 rounded-full ${activeTab === 'subscriptions' ? 'bg-stone-900 text-white' : 'hover:bg-stone-100'}`}
                        >
                            Subscriptions
                        </button>
                        <Link href="/" className="px-3 py-1 hover:bg-stone-100 rounded-full text-stone-500">
                            Exit
                        </Link>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100">
                        <div className="text-stone-500 text-sm font-bold uppercase tracking-wider">Total Users</div>
                        <div className="text-4xl font-serif font-bold mt-2">{totalUsers}</div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100">
                        <div className="text-stone-500 text-sm font-bold uppercase tracking-wider">Premium Members</div>
                        <div className="text-4xl font-serif font-bold mt-2 text-emerald-600">{premiumUsers}</div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100">
                        <div className="text-stone-500 text-sm font-bold uppercase tracking-wider">Free/Trial</div>
                        <div className="text-4xl font-serif font-bold mt-2 text-amber-600">{trialUsers}</div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100">
                        <div className="text-stone-500 text-sm font-bold uppercase tracking-wider">Est. Monthly Revenue</div>
                        <div className="text-4xl font-serif font-bold mt-2 text-stone-900">${(premiumUsers * 7.99).toFixed(2)}</div>
                    </div>
                </div>

                {/* TAB CONTENT */}

                {/* 1. OVERVIEW TAB */}
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in">
                        {/* 1. Growth Chart (New) */}
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-100 md:col-span-2">
                            <h3 className="text-lg font-bold mb-6">30-Day User Growth</h3>
                            <div className="h-64">
                                <GrowthChart data={growthData} />
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-100">
                            <h3 className="text-lg font-bold mb-6">User Faith Journey</h3>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={faithChartData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {faithChartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-100">
                            <h3 className="text-lg font-bold mb-6">User Goals</h3>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={goalChartData} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12 }} />
                                        <Tooltip />
                                        <Bar dataKey="value" fill="#d97706" radius={[0, 4, 4, 0]} barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. USERS TAB */}
                {activeTab === 'users' && (
                    <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden animate-in fade-in">
                        <div className="p-6 border-b border-stone-100 flex flex-col md:flex-row justify-between items-center gap-4">
                            <h3 className="text-lg font-bold">All Users ({filteredUsers.length})</h3>

                            <div className="flex flex-wrap gap-3 items-center w-full md:w-auto">
                                <input
                                    type="text"
                                    placeholder="Search name or email..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="px-4 py-2 border border-stone-200 rounded-lg text-sm w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-stone-500"
                                />
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value as any)}
                                    className="px-4 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-500"
                                >
                                    <option value="all">All Status</option>
                                    <option value="premium">Premium</option>
                                    <option value="free">Free</option>
                                </select>
                                <select
                                    value={faithFilter}
                                    onChange={(e) => setFaithFilter(e.target.value)}
                                    className="px-4 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-500"
                                >
                                    <option value="all">All Faith Stages</option>
                                    <option value="New Believer">New Believer</option>
                                    <option value="Growing">Growing</option>
                                    <option value="Mature">Mature</option>
                                    <option value="Seeker">Seeker</option>
                                </select>
                                <button
                                    onClick={downloadCSV}
                                    className="flex items-center gap-2 bg-stone-900 text-white px-4 py-2 rounded-lg hover:bg-stone-800 transition-colors text-sm font-bold whitespace-nowrap"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                    CSV
                                </button>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-stone-50 text-stone-500 font-bold uppercase tracking-wider">
                                    <tr>
                                        <th className="p-4">Name/Email</th>
                                        <th className="p-4">Joined</th>
                                        <th className="p-4">Faith Stage</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100">
                                    {filteredUsers.map((u) => (
                                        <tr key={u.id} className="hover:bg-stone-50">
                                            <td className="p-4 cursor-pointer group" onClick={() => setSelectedUser(u)}>
                                                <div className="font-bold text-stone-800 group-hover:text-stone-600 underline decoration-stone-300 underline-offset-4">{u.name || "Anonymous"}</div>
                                                <div className="text-stone-500 text-xs">{u.email}</div>
                                            </td>
                                            <td className="p-4 text-stone-600">
                                                {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "-"}
                                            </td>
                                            <td className="p-4">
                                                <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded text-xs font-bold border border-amber-100">
                                                    {u.survey?.faithStage || "N/A"}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                {u.isPremium ? (
                                                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-bold">Premium</span>
                                                ) : (
                                                    <span className="px-2 py-1 bg-stone-100 text-stone-500 rounded text-xs font-bold">Free</span>
                                                )}
                                            </td>
                                            <td className="p-4 flex justify-end gap-2">
                                                {u.isPremium ? (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleUpdatePremiumStatus(u.id, false); }}
                                                        className="px-2 py-1 text-xs font-bold border border-red-200 text-red-600 rounded hover:bg-red-50 transition-colors"
                                                        title="Revoke Premium"
                                                    >
                                                        Revoke
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleUpdatePremiumStatus(u.id, true); }}
                                                        className="px-2 py-1 text-xs font-bold border border-emerald-200 text-emerald-600 rounded hover:bg-emerald-50 transition-colors"
                                                        title="Grant Premium"
                                                    >
                                                        Grant
                                                    </button>
                                                )}
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteUser(u.id); }}
                                                    className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                                    title="Delete User Data"
                                                >
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredUsers.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-stone-500">
                                                No users found matching your filters.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* User Detail Modal */}
                {selectedUser && (
                    <UserDetailModal
                        user={selectedUser}
                        onClose={() => setSelectedUser(null)}
                    />
                )}

                {/* 3. SUBSCRIPTIONS TAB */}
                {activeTab === 'subscriptions' && (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="bg-amber-50 border border-amber-100 p-6 rounded-xl flex items-start gap-4">
                            <div className="text-3xl">💳</div>
                            <div>
                                <h3 className="font-bold text-amber-900">PayPal Integration Status</h3>
                                <p className="text-amber-800 text-sm mt-1">
                                    We are tracking subscriptions via Firestore. To manage actual refunds or cancellations,
                                    please visit your PayPal Business Dashboard.
                                </p>
                                <a
                                    href="https://www.paypal.com/businessmanage/subscriptions"
                                    target="_blank"
                                    className="inline-block mt-3 text-xs font-bold bg-white text-amber-700 px-3 py-2 rounded border border-amber-200 hover:bg-amber-100"
                                >
                                    Go to PayPal Dashboard &rarr;
                                </a>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
                            <div className="p-6 border-b border-stone-100">
                                <h3 className="text-lg font-bold">Manage Subscriptions ({premiumUsers})</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-stone-50 text-stone-500 font-bold uppercase tracking-wider">
                                        <tr>
                                            <th className="p-4">User</th>
                                            <th className="p-4">Sub ID</th>
                                            <th className="p-4">Started</th>
                                            <th className="p-4">Status</th>
                                            <th className="p-4">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-stone-100">
                                        {users.filter(u => u.isPremium || u.subscriptionId).map((u) => (
                                            <tr key={u.id} className="hover:bg-stone-50">
                                                <td className="p-4">
                                                    <div className="font-bold text-stone-800">{u.email}</div>
                                                </td>
                                                <td className="p-4 font-mono text-xs text-stone-500">
                                                    {u.subscriptionId || "MANUAL_ENTRY"}
                                                </td>
                                                <td className="p-4 text-stone-600">
                                                    {u.trialStartDate ? new Date(u.trialStartDate.toDate()).toLocaleDateString() : "-"}
                                                </td>
                                                <td className="p-4">
                                                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-bold">
                                                        Active
                                                    </span>
                                                </td>
                                                <td className="p-4 text-xs">
                                                    <button className="text-stone-400 hover:text-stone-600 underline">
                                                        Details
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {users.filter(u => u.isPremium || u.subscriptionId).length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="p-8 text-center text-stone-500 italic">
                                                    No active subscriptions found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
