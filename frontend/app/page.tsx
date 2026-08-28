"use client";

import { useState, useRef, useEffect } from "react";
import {
  fetchDemo,
  quickAdd,
  analyzeTransactions,
  uploadStatement,
  getTransactions,
  saveTransactions,
  migrateTransactions,
  deleteTransaction,
  resolveMerchants,
  generateRoast,
  Transaction,
  FinancialSummary,
} from "./api";
import { useAuth } from "./contexts/AuthContext";
import { AuthModal } from "./components/AuthModal";
import { UsernameOnboarding } from "./components/UsernameOnboarding";
import { SettingsModal } from "./components/SettingsModal";
import { ShareCard } from "./components/ShareCard";
import { ShareModal } from "./components/ShareModal";
import { OverviewTab } from "./components/dashboard/OverviewTab";
import { TransactionsTab } from "./components/dashboard/TransactionsTab";
import { InsightsTab } from "./components/dashboard/InsightsTab";
import { AutopsyModal } from "./components/dashboard/AutopsyModal";
import { ThermalReceiptVisual } from "./components/landing/ThermalReceiptVisual";
import { LaserScannerVisual } from "./components/landing/LaserScannerVisual";
import { InteractiveRoastVisual } from "./components/landing/InteractiveRoastVisual";
import { SubscriptionStackVisual } from "./components/landing/SubscriptionStackVisual";
import { AutopsyLoadingScreen } from "./components/loading/AutopsyLoadingScreen";
import FinopsyIntro from "./components/FinopsyIntro";
import Lenis from "lenis";

type ViewState =
  | "landing"
  | "quick-add"
  | "confirmation"
  | "upload-beta"
  | "upload-loading"
  | "review-upload"
  | "dashboard";

type DashboardTab = "overview" | "transactions" | "insights";

const CATEGORIES_LIST = [
  "Food",
  "Transport",
  "Shopping",
  "Entertainment",
  "Bills",
  "Groceries",
  "Healthcare",
  "Education",
  "Travel",
  "Subscriptions",
  "Income",
  "Other",
];

export default function Home() {
  const [view, setView] = useState<ViewState>("landing");
  const [dashboardTab, setDashboardTab] = useState<DashboardTab>("overview");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [isDemoData, setIsDemoData] = useState<boolean>(false);
  const [lastAddedTransaction, setLastAddedTransaction] = useState<any | null>(null);

  const { profile, isAuthenticated, session, isLoading: authLoading } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUsernameOnboardingOpen, setIsUsernameOnboardingOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAutopsyModalOpen, setIsAutopsyModalOpen] = useState(false);

  // Upload & Partial Parse State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingUploadTransactions, setPendingUploadTransactions] = useState<any[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [pdfPasswordRequired, setPdfPasswordRequired] = useState(false);
  const [pendingPdfFile, setPendingPdfFile] = useState<File | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [uploadStats, setUploadStats] = useState<{ total: number; parsed: number; skipped: number } | null>(null);

  // Form State
  const [amount, setAmount] = useState("");
  const [merchant, setMerchant] = useState("");
  const [category, setCategory] = useState("Other");
  const [loading, setLoading] = useState(false);

  // Share State
  const shareCardRef = useRef<HTMLDivElement>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareImageUrl, setShareImageUrl] = useState<string | null>(null);

  // AI Roast State
  const [aiRoast, setAiRoast] = useState<string | null>(null);
  const [isRoasting, setIsRoasting] = useState(false);
  const [displayedRoast, setDisplayedRoast] = useState("");
  const [roastLevel, setRoastLevel] = useState<number>(1);
  const [seenRoasts, setSeenRoasts] = useState<string[]>([]);

  // Inertial Smooth Scroll on Landing Page (Lenis)
  useEffect(() => {
    if (view === "landing") {
      const lenis = new Lenis({
        duration: 1.15,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: "vertical",
        gestureOrientation: "vertical",
        smoothWheel: true,
      });

      let rafId: number;
      function raf(time: number) {
        lenis.raf(time);
        rafId = requestAnimationFrame(raf);
      }
      rafId = requestAnimationFrame(raf);

      return () => {
        cancelAnimationFrame(rafId);
        lenis.destroy();
      };
    }
  }, [view]);

  // Username onboarding prompt
  useEffect(() => {
    if (isAuthenticated && profile && !profile.username && !authLoading) {
      setIsUsernameOnboardingOpen(true);
    } else {
      setIsUsernameOnboardingOpen(false);
    }
  }, [isAuthenticated, profile, authLoading]);

  // Fetch server-authoritative transactions on authenticated login/refresh
  useEffect(() => {
    const fetchAuthTxns = async () => {
      if (isAuthenticated && session?.access_token) {
        try {
          const txns = await getTransactions(session.access_token);
          if (txns && txns.length > 0) {
            setTransactions(txns);
            await reAnalyze(txns);
            setIsDemoData(false);
          }
        } catch (e) {
          // Graceful fallback
        }
      }
    };
    if (isAuthenticated) {
      fetchAuthTxns();
    }
  }, [isAuthenticated, session]);

  // Idempotent Migration: Anonymous real data -> Authenticated server state
  useEffect(() => {
    const doMigrate = async () => {
      if (isAuthenticated && session?.access_token && transactions.length > 0 && !isDemoData) {
        const hasLocalOnly = transactions.some((t) => !t.user_id);
        if (hasLocalOnly) {
          try {
            const unpersisted = transactions.filter((t) => !t.user_id);
            await migrateTransactions(session.access_token, unpersisted);
            const fresh = await getTransactions(session.access_token);
            setTransactions(fresh);
            await reAnalyze(fresh);
          } catch (e) {
            // Keep local data on migration error
          }
        }
      }
    };
    if (isAuthenticated) {
      doMigrate();
      setIsAuthModalOpen(false);
    }
  }, [isAuthenticated, session]);

  // Browser History & Storage Restoration
  useEffect(() => {
    const storedTxns = sessionStorage.getItem("finopsy_transactions");
    const storedSummary = sessionStorage.getItem("finopsy_summary");
    const storedDemo = sessionStorage.getItem("finopsy_isDemoData");
    if (storedTxns) setTransactions(JSON.parse(storedTxns));
    if (storedSummary) setSummary(JSON.parse(storedSummary));
    if (storedDemo) setIsDemoData(JSON.parse(storedDemo));

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("mode") === "demo" && !storedTxns) {
      fetchDemo()
        .then((data) => {
          setTransactions(data.transactions);
          setSummary(data.summary);
          setIsDemoData(true);
          setView("dashboard");
        })
        .catch(console.error);
    }

    if (!window.history.state?.finopsyView) {
      window.history.replaceState({ finopsyView: "landing" }, "", "#landing");
    } else {
      setView(window.history.state.finopsyView as ViewState);
    }

    const handlePopState = (e: PopStateEvent) => {
      if (e.state && e.state.finopsyView) {
        setView(e.state.finopsyView);
        setIsShareModalOpen(false);
        setIsAutopsyModalOpen(false);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    sessionStorage.setItem("finopsy_transactions", JSON.stringify(transactions));
    sessionStorage.setItem("finopsy_summary", JSON.stringify(summary));
    sessionStorage.setItem("finopsy_isDemoData", JSON.stringify(isDemoData));
  }, [transactions, summary, isDemoData]);

  const navigate = (newView: ViewState) => {
    window.history.pushState({ finopsyView: newView }, "", `#${newView}`);
    setView(newView);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleReset = () => {
    setTransactions([]);
    setSummary(null);
    setLastAddedTransaction(null);
    setPendingUploadTransactions([]);
    setIsDemoData(false);
    sessionStorage.clear();
    if (shareImageUrl) URL.revokeObjectURL(shareImageUrl);
    setShareImageUrl(null);
    setIsShareModalOpen(false);
    setIsAutopsyModalOpen(false);
    navigate("landing");
  };

  const reAnalyze = async (txns: any[]) => {
    if (txns.length === 0) {
      setSummary(null);
      return;
    }
    const newSummary = await analyzeTransactions(txns);
    setSummary(newSummary);
  };

  // Demo Ingestion
  const handleDemo = async () => {
    setLoading(true);
    try {
      const data = await fetchDemo();
      setTransactions(data.transactions);
      setSummary(data.summary);
      setIsDemoData(true);
      navigate("dashboard");
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  // Upload Pipeline
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement> | { target: { files: FileList | null } }
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setPdfPasswordRequired(false);
    setPendingPdfFile(file);
    navigate("upload-loading");

    await processUpload(file);
  };

  const processUpload = async (file: File, password?: string) => {
    try {
      const token = isAuthenticated && session ? session.access_token : undefined;
      const result = await uploadStatement(file, password, token);
      setPendingUploadTransactions(result.transactions);
      setUploadStats({
        total: result.total_rows,
        parsed: result.parsed_rows,
        skipped: result.skipped_rows,
      });
      setPendingPdfFile(null);
      setPdfPasswordRequired(false);
      navigate("review-upload");
    } catch (error: any) {
      if (error.message === "PDF_ENCRYPTED") {
        setPdfPasswordRequired(true);
      } else {
        setUploadError(
          error.message ||
            "Unable to parse this statement. Please check that it is a valid PDF, CSV, or XLSX file."
        );
        setPendingPdfFile(null);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handlePdfPasswordSubmit = (pw: string) => {
    if (pendingPdfFile && pw) {
      processUpload(pendingPdfFile, pw);
    }
  };

  const handlePendingEdit = (index: number, field: string, value: any) => {
    const updated = [...pendingUploadTransactions];
    const txn = { ...updated[index], [field]: value };
    if (field === "category") {
      txn.user_edited = true;
    }
    updated[index] = txn;
    setPendingUploadTransactions(updated);
  };

  const handlePendingDelete = (index: number) => {
    const updated = [...pendingUploadTransactions];
    updated.splice(index, 1);
    setPendingUploadTransactions(updated);
  };

  const handleResolveUnknowns = async () => {
    try {
      setIsResolving(true);
      const unknowns = pendingUploadTransactions.filter(
        (t) => t.category === "Other" || (t.category_confidence ?? 1.0) < 0.8
      );
      const uniqueRawMerchants = Array.from(new Set(unknowns.map((t) => t.merchant)));

      if (uniqueRawMerchants.length === 0) return;

      const mapping = await resolveMerchants(uniqueRawMerchants);
      const updated = [...pendingUploadTransactions];
      let hasUpdates = false;

      for (let i = 0; i < updated.length; i++) {
        const raw = updated[i].merchant;
        if (mapping[raw]) {
          updated[i] = {
            ...updated[i],
            merchant: mapping[raw].clean_name,
            category: mapping[raw].category,
            category_confidence: 1.0,
            user_edited: true,
          };
          hasUpdates = true;
        }
      }

      if (hasUpdates) setPendingUploadTransactions(updated);
    } catch (e) {
      console.error(e);
    } finally {
      setIsResolving(false);
    }
  };

  const handleConfirmUpload = async () => {
    let updatedTxns = pendingUploadTransactions;
    if (!isDemoData && transactions.length > 0) {
      updatedTxns = [...transactions, ...pendingUploadTransactions];
    }

    if (isAuthenticated && session) {
      try {
        const saved = await saveTransactions(session.access_token, pendingUploadTransactions);
        updatedTxns = !isDemoData && transactions.length > 0 ? [...transactions, ...saved] : saved;
      } catch (e) {
        console.error(e);
      }
    }

    setIsDemoData(false);
    setTransactions(updatedTxns);
    await reAnalyze(updatedTxns);

    setPendingUploadTransactions([]);
    setUploadStats(null);
    navigate("dashboard");
  };

  const handleCancelUpload = () => {
    setPendingUploadTransactions([]);
    setUploadStats(null);
    navigate(transactions.length > 0 ? "dashboard" : "landing");
  };

  // Daily Check-In inline Quick Add from OverviewTab
  const handleOverviewQuickAdd = async (data: {
    amount: number;
    merchant: string;
    category: string;
    date: string;
  }) => {
    let newTxn: Transaction = {
      id: `local-${Date.now()}`,
      amount: data.amount,
      merchant: data.merchant,
      category: data.category as any,
      date: data.date,
      type: "expense" as any,
      source: "manual" as any,
      extraction_confidence: 1.0,
      category_confidence: 1.0,
      created_at: new Date().toISOString(),
    };

    if (isAuthenticated && session) {
      try {
        const saved = await saveTransactions(session.access_token, [newTxn]);
        if (saved && saved.length > 0) newTxn = saved[0];
      } catch (e) {
        console.error("Failed to persist manual check-in", e);
      }
    }

    const updated = [newTxn, ...(!isDemoData ? transactions : [])];
    setIsDemoData(false);
    setTransactions(updated);
    await reAnalyze(updated);
  };

  // Quick Add View Flow
  const handleQuickAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const txn = await quickAdd({
        amount: parseFloat(amount),
        merchant,
        category,
      });
      setLastAddedTransaction(txn);
      navigate("confirmation");
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleConfirmQuickAdd = async () => {
    let finalTxn = lastAddedTransaction;
    if (isAuthenticated && session) {
      try {
        const savedList = await saveTransactions(session.access_token, [lastAddedTransaction]);
        finalTxn = savedList[0];
      } catch (e) {}
    }
    const updatedTxns = [...(!isDemoData ? transactions : []), finalTxn];
    setTransactions(updatedTxns);
    await reAnalyze(updatedTxns);
    setAmount("");
    setMerchant("");
    setCategory("Other");
    setLastAddedTransaction(null);
    setIsDemoData(false);
    navigate("dashboard");
  };

  const handleAddAnother = async () => {
    let finalTxn = lastAddedTransaction;
    if (isAuthenticated && session) {
      try {
        const savedList = await saveTransactions(session.access_token, [lastAddedTransaction]);
        finalTxn = savedList[0];
      } catch (e) {}
    }
    const updatedTxns = [...(!isDemoData ? transactions : []), finalTxn];
    setTransactions(updatedTxns);
    await reAnalyze(updatedTxns);
    setAmount("");
    setMerchant("");
    setCategory("Other");
    setLastAddedTransaction(null);
    setIsDemoData(false);
    navigate("quick-add");
  };

  const handleDeleteTransaction = async (id: string) => {
    if (isAuthenticated && session && id) {
      try {
        await deleteTransaction(session.access_token, id);
      } catch (e) {
        console.error(e);
      }
    }
    const updatedTxns = transactions.filter((t) => t.id !== id);
    setTransactions(updatedTxns);
    await reAnalyze(updatedTxns);
  };

  // Money Personality & Roast
  const getMoneyPersonality = (currentSummary: any) => {
    if (!currentSummary || currentSummary.transaction_count === 0) return "Clean Slate";
    const { category_percentages } = currentSummary;
    if (category_percentages["Food"] > 40) return "Swiggy Sponsor";
    if (category_percentages["Entertainment"] > 30) return "Distraction Devotee";
    if (category_percentages["Shopping"] > 30) return "Retail Receptacle";

    let maxCat = "";
    let maxVal = -1;
    for (const [cat, val] of Object.entries(category_percentages)) {
      if ((val as number) > maxVal) {
        maxVal = val as number;
        maxCat = cat;
      }
    }
    if (maxCat === "Transport") return "Locomotive Drain";
    return "Balanced Broke";
  };

  const getRoast = (currentSummary: any) => {
    if (!currentSummary || currentSummary.transaction_count === 0)
      return "Upload a statement to generate your diagnosis.";
    if (aiRoast) return aiRoast;

    const { category_percentages } = currentSummary;
    if (category_percentages["Food"] > 40)
      return "Your kitchen is basically a glorified microwave stand. 42 orders this month is a hostage situation.";
    if (category_percentages["Entertainment"] > 30)
      return "You did not spend money. You funded distractions.";
    if (category_percentages["Shopping"] > 30)
      return "Amazon delivery drivers know your dogs by name. Retail therapy won't fix your GPA.";

    return "Respectfully, the shopping mall won against your bank account this month.";
  };

  const handleTriggerRoast = async () => {
    if (!summary || summary.transaction_count === 0) return;
    setIsRoasting(true);
    try {
      const merchantTotals: Record<string, number> = {};
      transactions
        .filter((t: any) => t.type === "expense")
        .forEach((t: any) => {
          merchantTotals[t.merchant] = (merchantTotals[t.merchant] || 0) + t.amount;
        });
      const topMerchant = Object.entries(merchantTotals).sort((a, b) => b[1] - a[1])[0];

      const severity: "mild" | "savage" | "unhinged" =
        roastLevel === 1 ? "mild" : roastLevel === 2 ? "savage" : "unhinged";

      const res = await generateRoast({
        total_spent: summary.total_spending,
        category_totals: summary.category_totals,
        category_percentages: summary.category_percentages,
        top_merchant: topMerchant ? topMerchant[0] : null,
        top_merchant_amount: topMerchant ? topMerchant[1] : null,
        transaction_count: summary.transaction_count,
        severity,
        seen_roasts: seenRoasts,
      });

      if (res && res.text) {
        setAiRoast(res.text);
        setSeenRoasts((prev) => [...prev, res.text]);
        setRoastLevel((prev) => (prev >= 3 ? 3 : prev + 1));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRoasting(false);
    }
  };

  // Typewriter effect for roast
  useEffect(() => {
    const rawRoast = aiRoast || (summary ? getRoast(summary) : "");
    if (!rawRoast) {
      setDisplayedRoast("");
      return;
    }
    let i = 0;
    setDisplayedRoast("");
    const interval = setInterval(() => {
      if (i < rawRoast.length) {
        setDisplayedRoast(rawRoast.substring(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 15);
    return () => clearInterval(interval);
  }, [aiRoast, summary]);

  const topCategoryEntry = summary
    ? Object.entries(summary.category_totals || {}).sort((a, b) => b[1] - a[1])[0]
    : null;

  const topCategory = topCategoryEntry
    ? {
        name: topCategoryEntry[0],
        percentage:
          summary?.total_spending && summary.total_spending > 0
            ? Math.round((topCategoryEntry[1] / summary.total_spending) * 100)
            : 0,
      }
    : null;

  const isAnonymousWithData = !isAuthenticated && !isDemoData && transactions.length > 0;

  return (
    <>
      <FinopsyIntro />

      <main className="min-h-screen bg-[#0A0B0A] text-[#F4F3EE] px-4 sm:px-8 lg:px-12 py-6 pb-24">
        {/* Hidden 1080x1080 Render Target for html-to-image */}
        <div style={{ position: "fixed", left: "-10000px", top: 0 }}>
          <div ref={shareCardRef}>
            {summary && (
              <ShareCard
                totalSpent={summary.total_spending}
                topCategory={topCategory}
                moneyPersonality={getMoneyPersonality(summary)}
                roast={displayedRoast || getRoast(summary)}
                transactionCount={summary.transaction_count}
                username={profile?.username || undefined}
              />
            )}
          </div>
        </div>

        {/* Global File Input */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".csv,.xlsx,.xls,.pdf"
          onChange={handleFileUpload}
        />

        {/* ========================================================================= */}
        {/* VIEW 1: LANDING PAGE                                                      */}
        {/* ========================================================================= */}
        {view === "landing" && (
          <div className="max-w-6xl mx-auto space-y-24">
            {/* Top Navigation Bar */}
            <header className="flex items-center justify-between py-6 border-b border-[rgba(255,255,255,0.06)]">
              <div className="flex items-center gap-3">
                <span className="font-display text-xl font-extrabold tracking-tight text-[#F4F3EE]">
                  FINOPSY
                </span>
              </div>

              <div className="flex items-center gap-3">
                {isAuthenticated ? (
                  <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="font-mono-num text-xs text-[#8E9089] hover:text-[#F4F3EE] px-3 py-1.5 rounded border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.2)] transition"
                  >
                    @{profile?.username || "user"}
                  </button>
                ) : (
                  <button
                    onClick={() => setIsAuthModalOpen(true)}
                    className="font-sans text-xs text-[#8E9089] hover:text-[#F4F3EE] px-3.5 py-1.5 rounded border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.2)] transition"
                  >
                    Sign In
                  </button>
                )}

                {transactions.length > 0 && (
                  <button
                    onClick={() => navigate("dashboard")}
                    className="btn-secondary text-xs py-1.5 px-3.5"
                  >
                    Dashboard
                  </button>
                )}
              </div>
            </header>

            {/* Hero Section */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center py-4 sm:py-8">
              <div className="lg:col-span-7 flex flex-col justify-center pr-0 lg:pr-6">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className="font-mono-num text-[10px] text-[#0A0B0A] bg-[#D4FF00] font-bold px-2 py-0.5 rounded shadow-sm">
                    TOP KILLER: SHOPPING
                  </span>
                  <span className="font-mono-num text-[10px] text-[#F4F3EE] bg-white/10 font-bold px-2 py-0.5 rounded border border-white/10">
                    CASUALTY: ₹27,205
                  </span>
                  <span className="font-mono-num text-[10px] text-[#FF4560] bg-[#FF4560]/10 font-bold px-2 py-0.5 rounded border border-[#FF4560]/20">
                    VAMPIRES DETECTED
                  </span>
                </div>

                <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-[#F4F3EE] leading-[1.02] mb-6">
                  Your money.
                  <br />
                  <span className="text-[#D4FF00]">Autopsied.</span>
                </h1>

                <p className="font-sans text-base sm:text-lg text-[#8E9089] max-w-lg mb-9 leading-relaxed">
                  Upload your bank statement. Finopsy calculates the damage, exposes the vampires, and delivers a brutally honest diagnosis.
                </p>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
                  <button
                    onClick={handleDemo}
                    disabled={loading}
                    className="btn-primary text-sm py-3 px-7"
                  >
                    {loading ? "Loading..." : "Try Live Demo"}
                  </button>

                  <button
                    onClick={() => navigate("upload-beta")}
                    className="btn-secondary text-sm py-3 px-7 flex items-center justify-center gap-2"
                  >
                    <span>Upload Statement</span>
                    <span className="font-mono-num text-[10px] font-extrabold uppercase bg-[#D4FF00]/15 text-[#D4FF00] px-1.5 py-0.5 rounded border border-[#D4FF00]/30">
                      BETA
                    </span>
                  </button>
                </div>
              </div>

              <div className="lg:col-span-5 flex justify-center w-full">
                <ThermalReceiptVisual />
              </div>
            </section>

            {/* Live Decoder */}
            <section className="border-t border-[rgba(255,255,255,0.06)] pt-16 text-center space-y-8">
              <div className="max-w-xl mx-auto space-y-2">
                <span className="font-mono-num text-xs text-[#D4FF00] font-bold uppercase tracking-wider block">
                  Act 02 • The Live Decoder
                </span>
                <h2 className="font-display text-3xl font-extrabold text-[#F4F3EE]">
                  Unmasking The Noise
                </h2>
                <p className="text-xs text-[#8E9089] leading-relaxed">
                  Watch cryptic UPI reference strings glitch and transform into clean merchant names in real-time.
                </p>
              </div>
              <LaserScannerVisual />
            </section>

            {/* Verdict Engine */}
            <section className="border-t border-[rgba(255,255,255,0.06)] pt-16 text-center space-y-8">
              <div className="max-w-xl mx-auto space-y-2">
                <span className="font-mono-num text-xs text-[#D4FF00] font-bold uppercase tracking-wider block">
                  Act 03 • The Verdict Engine
                </span>
                <h2 className="font-display text-3xl font-extrabold text-[#F4F3EE]">
                  The Honest Diagnosis
                </h2>
                <p className="text-xs text-[#8E9089] leading-relaxed">
                  Finopsy doesn&apos;t just categorize your spending. It delivers a razor-sharp commentary on where it went.
                </p>
              </div>
              <InteractiveRoastVisual />
            </section>

            {/* Subscription Vampire Detector */}
            <section className="border-t border-[rgba(255,255,255,0.06)] pt-16 text-center space-y-8">
              <div className="max-w-xl mx-auto space-y-2">
                <span className="font-mono-num text-xs text-[#D4FF00] font-bold uppercase tracking-wider block">
                  Act 04 • Silent Drains
                </span>
                <h2 className="font-display text-3xl font-extrabold text-[#F4F3EE]">
                  The Vampire Detector
                </h2>
                <p className="text-xs text-[#8E9089] leading-relaxed">
                  Expose recurring card charges and projected annual leakage before next month hits.
                </p>
              </div>
              <SubscriptionStackVisual />
            </section>

            {/* Bottom CTA */}
            <section className="border-t border-[rgba(255,255,255,0.06)] pt-16 pb-12 text-center space-y-6">
              <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[#F4F3EE]">
                Ready for your autopsy?
              </h2>
              <p className="text-xs sm:text-sm text-[#8E9089] max-w-md mx-auto">
                No bank credentials required. Upload a statement or start with the live demo.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-3.5 pt-2">
                <button onClick={handleDemo} className="btn-primary text-sm py-3 px-8">
                  Try Live Demo
                </button>
                <button onClick={() => navigate("upload-beta")} className="btn-secondary text-sm py-3 px-8">
                  Upload Statement [BETA]
                </button>
              </div>
            </section>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: DASHBOARD                                                         */}
        {/* ========================================================================= */}
        {view === "dashboard" && (
          <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn">
            {/* HEADER */}
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[rgba(255,255,255,0.06)] pb-4">
              <div className="flex items-center gap-6">
                <button
                  onClick={() => navigate("landing")}
                  className="font-display text-xl font-extrabold tracking-tight text-[#F4F3EE] hover:text-[#D4FF00] transition"
                >
                  FINOPSY
                </button>

                {/* TAB SWITCHER */}
                <nav className="flex items-center gap-1 bg-[#121312] p-1 rounded-lg border border-[rgba(255,255,255,0.06)]">
                  <button
                    onClick={() => setDashboardTab("overview")}
                    className={`font-sans text-xs font-semibold px-3 py-1.5 rounded-md transition ${
                      dashboardTab === "overview"
                        ? "bg-[#1F201E] text-[#F4F3EE]"
                        : "text-[#8E9089] hover:text-[#F4F3EE]"
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setDashboardTab("transactions")}
                    className={`font-sans text-xs font-semibold px-3 py-1.5 rounded-md transition ${
                      dashboardTab === "transactions"
                        ? "bg-[#1F201E] text-[#F4F3EE]"
                        : "text-[#8E9089] hover:text-[#F4F3EE]"
                    }`}
                  >
                    Ledger ({transactions.length})
                  </button>
                  <button
                    onClick={() => setDashboardTab("insights")}
                    className={`font-sans text-xs font-semibold px-3 py-1.5 rounded-md transition ${
                      dashboardTab === "insights"
                        ? "bg-[#1F201E] text-[#F4F3EE]"
                        : "text-[#8E9089] hover:text-[#F4F3EE]"
                    }`}
                  >
                    Insights
                  </button>
                </nav>
              </div>

              {/* ACTIONS */}
              <div className="flex items-center gap-2.5">
                {isAnonymousWithData && (
                  <button
                    onClick={() => setIsAuthModalOpen(true)}
                    className="font-mono-num text-xs font-bold bg-[#D4FF00] text-[#0A0B0A] px-3 py-1.5 rounded hover:bg-[#b8e000] transition shadow-sm"
                  >
                    Save My Autopsy
                  </button>
                )}

                <button
                  onClick={() => navigate("upload-beta")}
                  className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
                >
                  <span>Upload</span>
                  <span className="font-mono-num text-[9px] font-bold text-[#D4FF00]">BETA</span>
                </button>

                <button
                  onClick={() => navigate("quick-add")}
                  className="btn-secondary text-xs py-1.5 px-3"
                >
                  + Add
                </button>

                {summary && summary.transaction_count > 0 && (
                  <button
                    onClick={() => setIsShareModalOpen(true)}
                    className="btn-primary text-xs py-1.5 px-3.5"
                  >
                    Autopsy Report
                  </button>
                )}

                <button
                  onClick={() => (isAuthenticated ? setIsSettingsOpen(true) : setIsAuthModalOpen(true))}
                  className="btn-ghost text-xs font-mono-num"
                >
                  {isAuthenticated ? `@${profile?.username || "user"}` : "Sign In"}
                </button>
              </div>
            </header>

            {/* TAB CONTENT */}
            {dashboardTab === "overview" && (
              <OverviewTab
                summary={summary || { total_spending: 0, total_income: 0, remaining: 0, transaction_count: 0, category_totals: {}, category_percentages: {}, daily_spending: [], subscriptions: [] }}
                username={profile?.username}
                roast={displayedRoast || getRoast(summary)}
                isRoasting={isRoasting}
                roastLevel={roastLevel}
                transactions={transactions}
                onRegenerateRoast={handleTriggerRoast}
                onOpenAutopsy={() => setIsShareModalOpen(true)}
                onUploadClick={() => navigate("upload-beta")}
                onDemoClick={handleDemo}
                onQuickAdd={handleOverviewQuickAdd}
              />
            )}

            {dashboardTab === "transactions" && (
              <TransactionsTab
                transactions={transactions}
                onDeleteTransaction={handleDeleteTransaction}
                onUploadClick={() => navigate("upload-beta")}
                onAddClick={() => navigate("quick-add")}
              />
            )}

            {dashboardTab === "insights" && (
              <InsightsTab
                summary={summary || { total_spending: 0, total_income: 0, remaining: 0, transaction_count: 0, category_totals: {}, category_percentages: {}, daily_spending: [], subscriptions: [] }}
                isDemo={isDemoData}
              />
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: UPLOAD STATEMENT                                                  */}
        {/* ========================================================================= */}
        {view === "upload-beta" && (
          <div className="max-w-xl mx-auto py-12 animate-fadeIn">
            <button
              onClick={() => navigate(transactions.length > 0 ? "dashboard" : "landing")}
              className="text-xs text-[#8E9089] hover:text-[#F4F3EE] mb-6 block font-medium"
            >
              ← Back
            </button>

            <div className="surface-card p-7 sm:p-9 border border-[rgba(255,255,255,0.08)] bg-[#121312]">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono-num text-[11px] text-[#D4FF00] font-semibold uppercase tracking-wider block">
                  Statement Ingestion
                </span>
                <span className="font-mono-num text-[9px] font-extrabold uppercase bg-[#D4FF00]/15 text-[#D4FF00] px-1.5 py-0.2 rounded border border-[#D4FF00]/30">
                  BETA
                </span>
              </div>
              <h2 className="font-display text-2xl font-bold text-[#F4F3EE] mb-2">
                Upload Bank Statement
              </h2>
              <p className="text-xs text-[#8E9089] mb-7 leading-relaxed">
                Download your statement from your banking app (PDF, CSV, or XLSX). We parse and categorize your spending locally.
              </p>

              {/* Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[rgba(255,255,255,0.12)] hover:border-[rgba(255,255,255,0.25)] bg-[#181918] p-9 text-center rounded-lg cursor-pointer transition mb-6"
              >
                <p className="font-sans text-sm font-semibold text-[#F4F3EE] mb-1">
                  Choose a statement file
                </p>
                <p className="text-xs text-[#8E9089]">
                  PDF, CSV, or XLSX formats (Max 10MB)
                </p>
              </div>

              <div className="text-xs text-[#8E9089] border-t border-[rgba(255,255,255,0.06)] pt-4 space-y-1 font-mono-num">
                <p>Supports: HDFC, Kotak, ICICI, SBI, Axis, and all Indian UPI statements.</p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 4: AUTOPSY LOADING SCREEN                                            */}
        {/* ========================================================================= */}
        {view === "upload-loading" && (
          <AutopsyLoadingScreen
            isEncrypted={pdfPasswordRequired}
            errorMessage={uploadError}
            onPasswordSubmit={handlePdfPasswordSubmit}
            onRetry={() => navigate("upload-beta")}
          />
        )}

        {/* ========================================================================= */}
        {/* VIEW 5: REVIEW UPLOAD (WITH PARTIAL PARSE HANDLER)                        */}
        {/* ========================================================================= */}
        {view === "review-upload" && (
          <div className="max-w-4xl mx-auto py-8 space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[rgba(255,255,255,0.06)] pb-4">
              <div>
                <h2 className="font-display text-2xl font-bold text-[#F4F3EE]">
                  Review Statement Entries
                </h2>
                <p className="text-xs text-[#8E9089] mt-0.5">
                  Check extracted entries before adding to your dashboard
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleResolveUnknowns}
                  disabled={isResolving}
                  className="btn-secondary text-xs py-2 px-3.5"
                >
                  {isResolving ? "Resolving..." : "Clean Merchants"}
                </button>

                <button
                  onClick={handleConfirmUpload}
                  className="btn-primary text-xs py-2 px-5 font-semibold"
                >
                  Import {pendingUploadTransactions.length} Transactions
                </button>
              </div>
            </div>

            {/* Partial Parse Warning Banner */}
            {uploadStats && uploadStats.skipped > 0 && (
              <div className="bg-[#1C1612] border border-[#FFB347]/30 p-4 rounded-xl flex items-center justify-between text-xs animate-fadeIn">
                <div>
                  <span className="font-mono-num text-[11px] font-bold text-[#FFB347] block mb-0.5 uppercase">
                    WE FOUND MOST OF IT.
                  </span>
                  <span className="text-[#8E9089]">
                    {uploadStats.parsed} transactions imported. {uploadStats.skipped} rows couldn&apos;t be read.
                  </span>
                </div>
              </div>
            )}

            {/* Extracted table */}
            <div className="surface-card p-4 border border-[rgba(255,255,255,0.06)] overflow-x-auto">
              <table className="w-full text-left font-sans text-xs">
                <thead>
                  <tr className="border-b border-[rgba(255,255,255,0.06)] text-[#8E9089] text-[11px]">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Merchant</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(255,255,255,0.04)]">
                  {pendingUploadTransactions.map((txn, idx) => (
                    <tr key={idx} className="hover:bg-[#181918] transition-colors">
                      <td className="py-2.5 px-3 font-mono-num text-[#8E9089]">{txn.date}</td>
                      <td className="py-2.5 px-3 font-medium text-[#F4F3EE]">{txn.merchant}</td>
                      <td className="py-2.5 px-3">
                        <select
                          value={txn.category}
                          onChange={(e) => handlePendingEdit(idx, "category", e.target.value)}
                          className="bg-[#121312] border border-[rgba(255,255,255,0.08)] text-[#F4F3EE] text-xs px-2 py-1 rounded"
                        >
                          {CATEGORIES_LIST.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2.5 px-3 font-mono-num font-semibold text-right text-[#F4F3EE]">
                        ₹{txn.amount.toLocaleString("en-IN")}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => handlePendingDelete(idx)}
                          className="text-[#8E9089] hover:text-[#FF4560] text-xs"
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center text-xs text-[#8E9089] pt-2">
              <button onClick={handleCancelUpload} className="hover:text-[#F4F3EE]">
                ← Cancel
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 6: QUICK ADD FORM                                                    */}
        {/* ========================================================================= */}
        {view === "quick-add" && (
          <div className="max-w-md mx-auto py-12 animate-fadeIn">
            <button
              onClick={() => navigate(transactions.length > 0 ? "dashboard" : "landing")}
              className="text-xs text-[#8E9089] hover:text-[#F4F3EE] mb-6 block font-medium"
            >
              ← Back
            </button>

            <div className="surface-card p-6 sm:p-8">
              <h2 className="font-display text-2xl font-bold text-[#F4F3EE] mb-1">
                Log Expense
              </h2>
              <p className="text-xs text-[#8E9089] mb-6">
                Add an expense manually to update your financial position
              </p>

              <form onSubmit={handleQuickAddSubmit} className="space-y-4">
                <div>
                  <label className="text-[11px] font-mono-num font-bold text-[#8E9089] block mb-1">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="250"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-[#121312] border border-[rgba(255,255,255,0.08)] text-sm text-[#F4F3EE] p-3 rounded-lg focus:outline-none focus:border-[rgba(255,255,255,0.2)] font-mono-num"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono-num font-bold text-[#8E9089] block mb-1">
                    Merchant / Description
                  </label>
                  <input
                    type="text"
                    placeholder="Swiggy, Blue Tokai, Uber..."
                    value={merchant}
                    onChange={(e) => setMerchant(e.target.value)}
                    className="w-full bg-[#121312] border border-[rgba(255,255,255,0.08)] text-sm text-[#F4F3EE] p-3 rounded-lg focus:outline-none focus:border-[rgba(255,255,255,0.2)]"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono-num font-bold text-[#8E9089] block mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#121312] border border-[rgba(255,255,255,0.08)] text-sm text-[#F4F3EE] p-3 rounded-lg focus:outline-none"
                  >
                    {CATEGORIES_LIST.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-2">
                  <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-xs">
                    {loading ? "Processing..." : "Add Expense"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 7: QUICK ADD CONFIRMATION                                            */}
        {/* ========================================================================= */}
        {view === "confirmation" && lastAddedTransaction && (
          <div className="max-w-md mx-auto py-12 animate-fadeIn">
            <div className="surface-card p-6 sm:p-8 space-y-6 text-center">
              <div className="w-12 h-12 rounded-full bg-[#D4FF00]/10 text-[#D4FF00] flex items-center justify-center mx-auto text-xl font-bold">
                ✓
              </div>

              <div>
                <span className="font-mono-num text-[11px] text-[#8E9089] uppercase tracking-wider block mb-1">
                  Recorded Successfully
                </span>
                <h3 className="font-display text-2xl font-bold text-[#F4F3EE]">
                  ₹{lastAddedTransaction.amount.toLocaleString("en-IN")} at {lastAddedTransaction.merchant}
                </h3>
                <span className="font-mono-num text-xs text-[#D4FF00] mt-1 inline-block">
                  Categorized as {lastAddedTransaction.category}
                </span>
              </div>

              <div className="flex flex-col gap-2.5 pt-2">
                <button onClick={handleConfirmQuickAdd} className="btn-primary w-full py-2.5 text-xs">
                  Go to Dashboard
                </button>
                <button onClick={handleAddAnother} className="btn-secondary w-full py-2.5 text-xs">
                  + Add Another
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modals */}
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
        <UsernameOnboarding isOpen={isUsernameOnboardingOpen} />
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onDataCleared={handleReset}
        />
        {summary && summary.transaction_count > 0 && (
          <>
            <ShareModal
              isOpen={isShareModalOpen}
              onClose={() => setIsShareModalOpen(false)}
              summary={summary}
              username={profile?.username || undefined}
              initialRoast={displayedRoast || getRoast(summary)}
              transactions={transactions}
            />
            <AutopsyModal
              isOpen={isAutopsyModalOpen}
              onClose={() => setIsAutopsyModalOpen(false)}
              summary={summary}
              username={profile?.username || undefined}
              roast={displayedRoast || getRoast(summary)}
              isRoasting={isRoasting}
              onOpenShareCard={() => {
                setIsAutopsyModalOpen(false);
                setIsShareModalOpen(true);
              }}
            />
          </>
        )}
      </main>
    </>
  );
}
