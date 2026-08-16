"use client";

import { useState, useRef, useEffect } from "react";
import { fetchDemo, quickAdd, analyzeTransactions, uploadStatement, getTransactions, saveTransactions, migrateTransactions, deleteTransaction } from "./api";
import { useAuth } from "./contexts/AuthContext";
import { AuthModal } from "./components/AuthModal";
import { UsernameOnboarding } from "./components/UsernameOnboarding";
import { SettingsModal } from "./components/SettingsModal";
import { toPng } from "html-to-image";
import { ShareCard } from "./components/ShareCard";

const CATEGORY_COLORS: Record<string, string> = {
  Food: "bg-[#d5ff51]",
  Transport: "bg-[#ff9365]",
  Shopping: "bg-[#b7a1ff]",
  College: "bg-[#6cd4ff]",
  Education: "bg-[#6cd4ff]",
  Entertainment: "bg-[#ffca58]",
  Subscriptions: "bg-[#ff8f8f]",
  "Rent & Bills": "bg-[#4da6ff]",
  Bills: "bg-[#4da6ff]",
  Groceries: "bg-[#7acc7a]",
  Healthcare: "bg-[#ff99cc]",
  Family: "bg-[#ffb366]",
  Other: "bg-[#cccccc]",
};

const ROASTS: Record<string, string> = {
  Food: "Another food delivery? Your kitchen is just a microwave stand.",
  Transport: "Riding in style while your bank balance is walking.",
  Education: "Buying books you'll open exactly once: night before exams.",
  Shopping: "Retail therapy for problems money can't fix.",
  Entertainment: "Paying to distract yourself from your financial reality.",
  Subscriptions: "Paying monthly for gym/streaming you use once a year.",
  "Rent & Bills": "Adulting: paying to exist in a concrete box.",
  Bills: "Adulting: paying to exist in a concrete box.",
  Groceries: "Buying organic kale that will rot in the fridge.",
  Healthcare: "Being sick is too expensive. Just drink water.",
  Family: "Sending money home so they know you're still alive.",
  Other: "We don't even know what this is, but your wallet felt it.",
};

type ViewState = "landing" | "quick-add" | "confirmation" | "upload-loading" | "review-upload" | "dashboard" | "settings";

export default function Home() {
  const [view, setView] = useState<ViewState>("landing");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [summary, setSummary] = useState<any | null>(null);
  const [isDemoData, setIsDemoData] = useState<boolean>(false);
  const [lastAddedTransaction, setLastAddedTransaction] = useState<any | null>(null);

  const { user, profile, isAuthenticated, signOut, session, isLoading: authLoading } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUsernameOnboardingOpen, setIsUsernameOnboardingOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated && profile && !profile.username && !authLoading) {
      setIsUsernameOnboardingOpen(true);
    } else {
      setIsUsernameOnboardingOpen(false);
    }
  }, [isAuthenticated, profile, authLoading]);

  useEffect(() => {
    const fetchAuthTxns = async () => {
      if (isAuthenticated && session) {
        try {
          const txns = await getTransactions(session.access_token);
          setTransactions(txns);
          await reAnalyze(txns);
          setIsDemoData(false);
        } catch (e) {
          console.error(e);
        }
      }
    };
    if (isAuthenticated && view === "dashboard") {
      fetchAuthTxns();
    }
  }, [isAuthenticated, session, view]);

  useEffect(() => {
    const doMigrate = async () => {
      if (isAuthenticated && session && transactions.length > 0 && !isDemoData) {
        const hasLocalOnly = transactions.some(t => !t.user_id);
        if (hasLocalOnly) {
          try {
            await migrateTransactions(session.access_token, transactions.filter(t => !t.user_id));
            const fresh = await getTransactions(session.access_token);
            setTransactions(fresh);
            await reAnalyze(fresh);
          } catch(e) {
            console.error("Migration failed", e);
          }
        }
      }
    };
    if (isAuthenticated) {
      doMigrate();
      setIsAuthModalOpen(false);
    }
  }, [isAuthenticated, session]);

  // Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingUploadTransactions, setPendingUploadTransactions] = useState<any[]>([]);
  const [uploadMetadata, setUploadMetadata] = useState<any | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [pdfPasswordRequired, setPdfPasswordRequired] = useState(false);
  const [pdfPassword, setPdfPassword] = useState("");
  const [pendingPdfFile, setPendingPdfFile] = useState<File | null>(null);

  // Form State
  const [amount, setAmount] = useState("");
  const [merchant, setMerchant] = useState("");
  const [category, setCategory] = useState("Other");
  const [loading, setLoading] = useState(false);

  // Share State
  const shareCardRef = useRef<HTMLDivElement>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareImageUrl, setShareImageUrl] = useState<string | null>(null);
  const [isGeneratingShare, setIsGeneratingShare] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  // -- BROWSER HISTORY & SESSION --
  useEffect(() => {
    const storedTxns = sessionStorage.getItem("finopsy_transactions");
    const storedSummary = sessionStorage.getItem("finopsy_summary");
    const storedDemo = sessionStorage.getItem("finopsy_isDemoData");
    if (storedTxns) setTransactions(JSON.parse(storedTxns));
    if (storedSummary) setSummary(JSON.parse(storedSummary));
    if (storedDemo) setIsDemoData(JSON.parse(storedDemo));

    if (!window.history.state?.finopsyView) {
      window.history.replaceState({ finopsyView: "landing" }, "", "#landing");
    } else {
      setView(window.history.state.finopsyView as ViewState);
    }

    const handlePopState = (e: PopStateEvent) => {
      if (e.state && e.state.finopsyView) {
        setView(e.state.finopsyView);
        setIsShareModalOpen(false);
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
  };

  const handleReset = () => {
    setTransactions([]);
    setSummary(null);
    setLastAddedTransaction(null);
    setPendingUploadTransactions([]);
    setUploadMetadata(null);
    setIsDemoData(false);
    sessionStorage.clear();
    if (shareImageUrl) URL.revokeObjectURL(shareImageUrl);
    setShareImageUrl(null);
    setIsShareModalOpen(false);
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

  // -- DEMO AUTOPSY --
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

  // -- UPLOAD PIPELINE --
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement> | { target: { files: FileList | null } }) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadError(null);
    setPdfPasswordRequired(false);
    setPdfPassword("");
    setPendingPdfFile(file);
    navigate("upload-loading");
    
    await processUpload(file);
  };

  const processUpload = async (file: File, password?: string) => {
    try {
      const result = await uploadStatement(file, password);
      setPendingUploadTransactions(result.transactions);
      setUploadMetadata({
        total_rows: result.total_rows,
        parsed_rows: result.parsed_rows,
        skipped_rows: result.skipped_rows,
        warnings: result.warnings,
      });
      setPendingPdfFile(null);
      setPdfPasswordRequired(false);
      navigate("review-upload");
    } catch (error: any) {
      console.error(error);
      if (error.message === "PDF_ENCRYPTED") {
         setPdfPasswordRequired(true);
      } else {
         setUploadError(error.message || "Couldn't read this statement. Make sure it's a valid CSV, XLSX, or PDF bank statement.");
         setPendingPdfFile(null);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handlePdfPasswordSubmit = () => {
    if (pendingPdfFile && pdfPassword) {
       processUpload(pendingPdfFile, pdfPassword);
    }
  };

  const handlePendingEdit = (index: number, field: string, value: any) => {
    const updated = [...pendingUploadTransactions];
    updated[index] = { ...updated[index], [field]: value };
    setPendingUploadTransactions(updated);
  };

  const handlePendingDelete = (index: number) => {
    const updated = [...pendingUploadTransactions];
    updated.splice(index, 1);
    setPendingUploadTransactions(updated);
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
      } catch (e) { console.error(e); }
    }

    setIsDemoData(false);
    setTransactions(updatedTxns);
    await reAnalyze(updatedTxns);
    
    setPendingUploadTransactions([]);
    setUploadMetadata(null);
    navigate("dashboard");
  };

  const handleCancelUpload = () => {
    setPendingUploadTransactions([]);
    setUploadMetadata(null);
    navigate(transactions.length > 0 ? "dashboard" : "landing");
  };

  // -- QUICK ADD PIPELINE --
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
    const updatedTxns = [...transactions, finalTxn];
    setTransactions(updatedTxns);
    await reAnalyze(updatedTxns);
    setAmount(""); setMerchant(""); setCategory("Other"); setLastAddedTransaction(null);
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
    const updatedTxns = [...transactions, finalTxn];
    setTransactions(updatedTxns);
    await reAnalyze(updatedTxns);
    setAmount(""); setMerchant(""); setCategory("Other"); setLastAddedTransaction(null);
    setIsDemoData(false);
    navigate("quick-add");
  };

  const handleUndoQuickAdd = () => {
    setLastAddedTransaction(null);
    navigate(transactions.length > 0 ? "dashboard" : "landing");
  };

  const handleDeleteTransaction = async (id: string) => {
    if (isAuthenticated && session && id) {
      try { await deleteTransaction(session.access_token, id); } catch(e) { console.error(e); }
    }
    const updatedTxns = transactions.filter(t => t.id !== id);
    setTransactions(updatedTxns);
    await reAnalyze(updatedTxns);
  };

  // -- DETERMINISTIC ENGINE --
  const getMoneyPersonality = (currentSummary: any) => {
    if (!currentSummary || currentSummary.transaction_count === 0) return "Clean Slate 🏳️";
    const { category_percentages } = currentSummary;
    if (category_percentages["Food"] > 40) return "SWIGGY SPONSOR";
    if (category_percentages["Entertainment"] > 30) return "DISTRACTION DEVOTEE";
    if (category_percentages["Shopping"] > 30) return "RETAIL THERAPIST";
    
    let maxCat = "";
    let maxVal = -1;
    for (const [cat, val] of Object.entries(category_percentages)) {
      if ((val as number) > maxVal) {
        maxVal = val as number;
        maxCat = cat;
      }
    }
    if (maxCat === "Transport") return "UBER'S BEST FRIEND";
    
    return "BALANCED BROKE";
  };

  const getRoast = (currentSummary: any) => {
    if (!currentSummary || currentSummary.transaction_count === 0) return "Nothing to roast. Yet.";
    const { category_percentages } = currentSummary;
    
    if (category_percentages["Food"] > 40) return "Your kitchen is basically decorative.";
    if (category_percentages["Entertainment"] > 30) return "You didn't spend money. You funded distractions.";
    if (category_percentages["Shopping"] > 30) return "Amazon knows you better than your family.";
    
    let maxCat = "";
    let maxVal = -1;
    for (const [cat, val] of Object.entries(category_percentages)) {
      if ((val as number) > maxVal) {
        maxVal = val as number;
        maxCat = cat;
      }
    }
    
    if (maxCat === "Transport") return "At this point, Uber should put you on payroll.";
    return "Nothing catastrophic. Just financially concerning.";
  };

  // -- SHARE EXPORT --
  const generateSharePreview = async () => {
    if (!shareCardRef.current) return;
    try {
      setIsGeneratingShare(true);
      setShareError(null);
      // Clean up previous blob URL to prevent leaks
      if (shareImageUrl) URL.revokeObjectURL(shareImageUrl);
      
      const dataUrl = await toPng(shareCardRef.current, { cacheBust: true, width: 1080, height: 1080, style: { transform: 'scale(1)', transformOrigin: 'top left' } });
      
      // Convert to blob URL so we can render it safely in the modal
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);
      setShareImageUrl(objUrl);
      setIsShareModalOpen(true);
    } catch (err) {
      console.error("Image generation failed", err);
      setShareError("Couldn't generate your Autopsy card. Try again.");
    } finally {
      setIsGeneratingShare(false);
    }
  };

  const handleNativeShare = async () => {
    if (!shareImageUrl) return;
    const filename = "finopsy-money-autopsy.png";
    if (typeof navigator.share === 'function') {
      try {
        const res = await fetch(shareImageUrl);
        const blob = await res.blob();
        const file = new File([blob], filename, { type: 'image/png' });
        
        if (typeof navigator.canShare === 'function') {
          if (!navigator.canShare({ files: [file] })) return;
        }

        await navigator.share({
          files: [file],
          title: 'My Finopsy Autopsy',
          text: 'Check out my financial damage on Finopsy! 💀'
        });
      } catch (e) {
        console.log("Web share aborted or failed", e);
      }
    }
  };

  const handleCopyImage = async () => {
    if (!shareImageUrl || !navigator.clipboard) return;
    try {
      const res = await fetch(shareImageUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      alert("Image copied to clipboard!");
    } catch (e) {
      console.error("Copy failed", e);
      alert("Copying isn't supported on this browser.");
    }
  };

  const closeShareModal = () => {
    setIsShareModalOpen(false);
  };

  const topCategory = summary && Object.keys(summary.category_percentages).length > 0
    ? Object.entries(summary.category_percentages)
        .map(([name, val]) => ({ name, percentage: val as number }))
        .sort((a, b) => b.percentage - a.percentage)[0]
    : null;

  const sharePersonality = getMoneyPersonality(summary);
  const shareRoast = getRoast(summary);

  return (
    <main className="min-h-screen bg-[#10110f] px-6 py-8 text-[#f6f3e8] sm:px-12 pb-24">
      {/* Invisible render target for the Share Card */}
      <div style={{ position: 'fixed', left: '-10000px', top: 0 }}>
        <div ref={shareCardRef}>
          {summary && (
            <ShareCard
              totalSpent={summary.total_spending}
              topCategory={topCategory}
              moneyPersonality={sharePersonality}
              roast={shareRoast}
              transactionCount={summary.transaction_count}
              username={profile?.username || undefined}
            />
          )}
        </div>
      </div>

      {/* Global File Input */}
      <input type="file" ref={fileInputRef} className="hidden" accept=".csv,.xlsx,.xls,.pdf" onChange={handleFileUpload} />

      {/* Header */}
      <nav className="mx-auto flex max-w-6xl items-center justify-between">
        <button 
          onClick={() => {
            if (isAuthenticated && transactions.length > 0) navigate("dashboard");
            else navigate("landing");
          }} 
          className="text-xl font-black tracking-tight hover:text-[#d5ff51] transition"
        >
          FINOPSY
        </button>
        <div className="flex items-center gap-4">
          {!isAuthenticated && <span className="hidden sm:inline rounded-full border border-[#f6f3e833] px-3 py-1 text-xs text-[#c9c6ba]">No bank login. No BS.</span>}
          {isAuthenticated ? (
            <button onClick={() => setIsSettingsOpen(true)} className="rounded-full border border-[#f6f3e833] px-4 py-1 text-sm font-bold text-[#c9c6ba] hover:text-[#d5ff51] hover:border-[#d5ff51] transition">
              {profile?.username ? `@${profile.username}` : "Settings"} ⚙️
            </button>
          ) : (
            <button onClick={() => setIsAuthModalOpen(true)} className="rounded-full border border-[#f6f3e833] px-4 py-1 text-sm font-bold text-[#c9c6ba] hover:text-[#d5ff51] hover:border-[#d5ff51] transition">
              Log In
            </button>
          )}
        </div>
      </nav>

      {view === "landing" && (
        <section className="mx-auto grid max-w-6xl gap-12 py-16 lg:grid-cols-2 lg:items-center lg:py-20">
          <div>
            <p className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-[#d5ff51]">Student money diagnostics</p>
            <h1 className="max-w-xl text-6xl font-black leading-[0.92] tracking-[-0.07em] sm:text-8xl">Your Money.<br /><span className="text-[#d5ff51]">Autopsied.</span></h1>
            <p className="mt-7 max-w-md text-lg text-[#c9c6ba]">Where the hell did your money go? Upload a statement or add an expense. We’ll show the damage.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <button disabled={loading} onClick={handleDemo} className="rounded-full bg-[#d5ff51] px-5 py-3 font-bold text-[#10110f] transition hover:scale-105">
                {loading ? "Loading..." : "Try Demo Autopsy →"}
              </button>
              
              {!isAuthenticated && transactions.length > 0 && !isDemoData && (
                <button onClick={() => setIsAuthModalOpen(true)} className="rounded-full bg-white px-5 py-2 text-sm font-bold text-[#10110f] hover:bg-[#d5ff51] transition animate-pulse">
                  Save My Autopsy
                </button>
              )}
              <button onClick={() => fileInputRef.current?.click()} disabled={loading} className="rounded-full border border-[#f6f3e855] px-5 py-3 font-bold hover:bg-[#f6f3e811]">
                Upload Statement
              </button>

              <button onClick={() => navigate("quick-add")} className="rounded-full border border-[#f6f3e855] px-5 py-3 font-bold hover:bg-[#f6f3e811]">Quick Add Expense</button>
            </div>
          </div>
        </section>
      )}

      {view === "upload-loading" && (
        <section className="mx-auto flex max-w-lg flex-col items-center justify-center py-32 text-center">
           {pdfPasswordRequired ? (
             <div className="bg-[#1a1b19] p-8 border-l-4 border-l-[#d5ff51] text-left shadow-2xl relative w-full">
               <h3 className="text-xl font-bold text-[#f6f3e8] uppercase tracking-wider mb-4 flex items-center gap-2">
                  <svg className="w-6 h-6 text-[#d5ff51]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  This PDF is protected
               </h3>
               <p className="text-[#8b8b80] mb-6">Enter the password provided by your bank to unlock the statement. We decrypt this locally in memory and never save your password.</p>
               <div className="flex flex-col gap-4">
                 <input 
                   type="password" 
                   value={pdfPassword} 
                   onChange={(e) => setPdfPassword(e.target.value)} 
                   placeholder="Password"
                   className="bg-[#10110f] text-[#f6f3e8] border border-[#30312f] p-4 font-mono w-full focus:outline-none focus:border-[#d5ff51] transition-colors"
                   onKeyDown={(e) => e.key === 'Enter' && handlePdfPasswordSubmit()}
                 />
                 <div className="flex gap-4">
                   <button 
                     onClick={() => { setPdfPasswordRequired(false); setPendingPdfFile(null); navigate("landing"); }}
                     className="flex-1 border border-[#30312f] text-[#f6f3e8] py-4 font-bold uppercase tracking-widest hover:bg-[#20211f] transition-all"
                   >
                     Cancel
                   </button>
                   <button 
                     onClick={handlePdfPasswordSubmit}
                     className="flex-1 bg-[#d5ff51] text-[#10110f] py-4 font-bold uppercase tracking-widest hover:bg-[#c2ef30] transition-all"
                   >
                     Unlock
                   </button>
                 </div>
               </div>
               {uploadError && <p className="text-red-500 mt-4 text-sm font-bold">{uploadError}</p>}
             </div>
           ) : uploadError ? (
             <>
               <div className="h-16 w-16 rounded-full border-4 border-red-500/20 border-t-red-500 mb-6" />
               <p className="text-xl font-bold text-red-400">{uploadError}</p>
               <div className="mt-8 flex gap-4 justify-center">
                 <button onClick={handleCancelUpload} className="rounded-full border border-[#f6f3e855] px-6 py-2 font-bold hover:bg-[#f6f3e811]">Cancel</button>
                 <button onClick={() => fileInputRef.current?.click()} className="rounded-full bg-[#d5ff51] px-6 py-2 font-bold text-[#10110f]">Try Again</button>
               </div>
             </>
           ) : (
             <>
               <div className="h-16 w-16 animate-spin rounded-full border-4 border-[#10110f22] border-t-[#d5ff51]" />
               <p className="mt-6 text-xl font-bold tracking-tight">Extracting financial damage...</p>
             </>
           )}
        </section>
      )}

      {view === "review-upload" && uploadMetadata && (
        <section className="mx-auto max-w-5xl py-12">
          <button onClick={handleCancelUpload} className="mb-6 text-sm font-bold text-[#c9c6ba] hover:text-[#f6f3e8]">← Back to Safety</button>
          
          <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-4xl font-black tracking-tight">Review Upload</h2>
              <p className="mt-2 text-[#c9c6ba]">
                We found <strong className="text-[#f6f3e8]">{uploadMetadata.parsed_rows}</strong> transactions out of {uploadMetadata.total_rows} rows.
                {uploadMetadata.skipped_rows > 0 && ` Skipped ${uploadMetadata.skipped_rows} invalid/empty rows.`}
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={handleCancelUpload} className="rounded-full border border-[#f6f3e855] px-6 py-3 font-bold hover:bg-[#f6f3e811]">Discard</button>
              <button onClick={handleConfirmUpload} disabled={pendingUploadTransactions.length === 0} className="rounded-full bg-[#d5ff51] px-6 py-3 font-bold text-[#10110f] disabled:opacity-50">Confirm & Analyze</button>
            </div>
          </div>

          {uploadMetadata.warnings?.length > 0 && (
            <div className="mb-8 rounded-2xl bg-red-500/10 p-5 border border-red-500/20">
              <p className="mb-2 text-sm font-bold text-red-400 uppercase tracking-widest">Parser Warnings</p>
              <ul className="list-inside list-disc space-y-1 text-sm text-red-300">
                {uploadMetadata.warnings.slice(0, 5).map((w: string, i: number) => (
                  <li key={i}>{w}</li>
                ))}
                {uploadMetadata.warnings.length > 5 && <li>...and {uploadMetadata.warnings.length - 5} more</li>}
              </ul>
            </div>
          )}

          <div className="rounded-3xl border border-[#f6f3e822] bg-[#f6f3e805] overflow-hidden">
            <div className="max-h-[60vh] overflow-y-auto p-4 space-y-2">
              {pendingUploadTransactions.length === 0 ? (
                <p className="p-4 text-center text-[#c9c6ba]">No valid transactions found to import.</p>
              ) : (
                pendingUploadTransactions.map((txn, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-2 rounded-xl bg-[#10110f] p-3 border border-transparent hover:border-[#f6f3e822]">
                    <input 
                      type="date" 
                      value={txn.date} 
                      onChange={(e) => handlePendingEdit(i, 'date', e.target.value)} 
                      className="bg-transparent border border-[#f6f3e833] rounded px-2 py-1 text-sm text-[#f6f3e8]" 
                    />
                    <input 
                      type="text" 
                      value={txn.merchant} 
                      onChange={(e) => handlePendingEdit(i, 'merchant', e.target.value)} 
                      className="bg-transparent border border-[#f6f3e833] rounded px-2 py-1 text-sm font-bold flex-1 min-w-[120px]" 
                    />
                    <select 
                      value={txn.category} 
                      onChange={(e) => handlePendingEdit(i, 'category', e.target.value)} 
                      className="bg-transparent border border-[#f6f3e833] rounded px-2 py-1 text-sm"
                    >
                      {Object.keys(CATEGORY_COLORS).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                    <select 
                      value={txn.type} 
                      onChange={(e) => handlePendingEdit(i, 'type', e.target.value)} 
                      className="bg-transparent border border-[#f6f3e833] rounded px-2 py-1 text-sm"
                    >
                      <option value="expense">Expense</option>
                      <option value="income">Income</option>
                    </select>
                    <input 
                      type="number" 
                      value={txn.amount} 
                      onChange={(e) => handlePendingEdit(i, 'amount', parseFloat(e.target.value) || 0)} 
                      className="bg-transparent border border-[#f6f3e833] rounded px-2 py-1 text-sm font-black w-24 text-right" 
                    />
                    <button onClick={() => handlePendingDelete(i)} className="ml-2 text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-red-500/10 text-xl leading-none">×</button>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      )}

      {view === "quick-add" && (
        <section className="mx-auto max-w-lg py-16">
          <button onClick={() => navigate(transactions.length > 0 ? "dashboard" : "landing")} className="mb-6 text-sm font-bold text-[#c9c6ba] hover:text-[#f6f3e8]">← Back</button>
          <div className="rounded-[2rem] bg-[#f6f3e8] p-8 text-[#10110f] shadow-2xl">
            <h2 className="text-3xl font-black tracking-tight">Quick Add Expense</h2>
            <form onSubmit={handleQuickAddSubmit} className="mt-8 space-y-6">
              <div>
                <label className="mb-2 block text-sm font-bold">Amount (₹)</label>
                <input required type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full rounded-xl border-2 border-[#10110f22] bg-transparent p-4 text-xl font-bold focus:border-[#d5ff51] focus:outline-none" placeholder="250.00" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold">Merchant</label>
                <input required type="text" value={merchant} onChange={(e) => setMerchant(e.target.value)} className="w-full rounded-xl border-2 border-[#10110f22] bg-transparent p-4 font-bold focus:border-[#d5ff51] focus:outline-none" placeholder="Swiggy, Uber, etc." />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold">Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-xl border-2 border-[#10110f22] bg-transparent p-4 font-bold focus:border-[#d5ff51] focus:outline-none">
                  {Object.keys(CATEGORY_COLORS).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={handleUndoQuickAdd} className="w-full rounded-full border-2 border-[#10110f] py-4 font-bold">Cancel</button>
                <button disabled={loading} type="submit" className="w-full rounded-full bg-[#10110f] py-4 font-bold text-[#f6f3e8]">
                  {loading ? "Adding..." : "Add Expense"}
                </button>
              </div>
            </form>
          </div>
        </section>
      )}

      {view === "confirmation" && lastAddedTransaction && (
        <section className="mx-auto max-w-lg py-16 text-center">
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-[#d5ff51]">Expense Recorded! 💀</p>
          <div className="rounded-[2rem] bg-[#f6f3e8] p-8 text-[#10110f] shadow-2xl">
            <p className="text-5xl font-black">₹{lastAddedTransaction.amount}</p>
            <p className="mt-2 font-bold text-[#5c5c54]">at {lastAddedTransaction.merchant}</p>
            
            <div className="mt-8 rounded-2xl bg-[#10110f] p-5 text-[#f6f3e8] text-left">
              <p className="text-xs font-bold text-[#d5ff51]">THE VERDICT</p>
              <p className="mt-2 text-sm font-bold">{ROASTS[lastAddedTransaction.category] || ROASTS["Other"]}</p>
            </div>

            <div className="mt-8 space-y-3">
              <button onClick={handleConfirmQuickAdd} className="w-full rounded-full bg-[#d5ff51] py-4 font-bold">Confirm & View Dashboard</button>
              <button onClick={handleAddAnother} className="w-full rounded-full border-2 border-[#10110f] py-4 font-bold">Confirm & Add Another</button>
              <button onClick={handleUndoQuickAdd} className="w-full font-bold text-[#5c5c54] underline hover:text-[#10110f]">Undo (Discard)</button>
            </div>
          </div>
        </section>
      )}

      {view === "dashboard" && (
        <section className="mx-auto max-w-6xl py-12">
          <button onClick={() => navigate("landing")} className="mb-6 text-sm font-bold text-[#c9c6ba] hover:text-[#f6f3e8]">← Back to Landing</button>
          
          <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-4xl font-black tracking-tight">Dashboard</h2>
            <div className="flex flex-wrap items-center gap-3">
              <button onClick={() => fileInputRef.current?.click()} className="rounded-full border border-[#f6f3e855] px-5 py-2 text-sm font-bold hover:bg-[#f6f3e811]">
                Upload CSV
              </button>
              <button onClick={() => navigate("quick-add")} className="rounded-full border border-[#f6f3e855] px-5 py-2 text-sm font-bold hover:bg-[#f6f3e811]">
                + Quick Add
              </button>
              
              {summary && summary.transaction_count > 0 && (
                <button
                  onClick={generateSharePreview}
                  disabled={isGeneratingShare}
                  className="rounded-full bg-[#d5ff51] px-6 py-2 text-sm font-bold text-[#10110f] hover:scale-105 transition disabled:opacity-50 disabled:hover:scale-100"
                >
                  {isGeneratingShare ? "Generating your Autopsy..." : "Share My Autopsy 📸"}
                </button>
              )}
            </div>
          </div>
          
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-8">
              {/* Transactions List */}
              <div className="rounded-3xl border border-[#f6f3e822] p-6">
                <h3 className="mb-4 text-xl font-bold">Recent Transactions</h3>
                {transactions.length === 0 ? (
                  <p className="text-[#c9c6ba]">No transactions yet. Add some to see the damage.</p>
                ) : (
                  <div className="space-y-4">
                    {transactions.slice().reverse().map((txn, idx) => (
                      <div key={txn.id || idx} className="flex items-center justify-between rounded-xl bg-[#f6f3e80a] p-4">
                        <div>
                          <p className="font-bold">{txn.merchant}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-[#c9c6ba]">{txn.date}</span>
                            <span className={`h-2 w-2 rounded-full ${CATEGORY_COLORS[txn.category] || CATEGORY_COLORS["Other"]}`} />
                            <span className="text-xs text-[#c9c6ba]">{txn.category}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-black ${txn.type === 'income' ? 'text-green-400' : ''}`}>
                            {txn.type === 'expense' ? '-' : '+'}₹{txn.amount}
                          </p>
                          <button onClick={() => handleDeleteTransaction(txn.id)} className="mt-1 text-xs text-red-400 hover:underline">Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-8">
              {/* Autopsy Card */}
              <aside className="rounded-[2rem] bg-[#f6f3e8] p-7 text-[#10110f] shadow-2xl">
                <p className="text-xs font-bold tracking-widest">AUTOPSY RESULT</p>
                <p className="mt-8 text-5xl font-black">₹{summary?.total_spending || 0}</p>
                <p className="font-bold text-[#5c5c54]">TOTAL SPENT</p>
                
                <div className="my-7 h-px bg-[#10110f22]" />
                
                <p className="text-sm font-bold">WHERE DID IT GO?</p>
                <div className="mt-4 space-y-3">
                  {summary && Object.entries(summary.category_percentages).sort((a: any, b: any) => b[1] - a[1]).map(([name, value]: any) => (
                    <div key={name}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span>{name}</span>
                        <b>{value}%</b>
                      </div>
                      <div className="h-2 rounded-full bg-[#10110f15]">
                        <div className={`h-2 rounded-full ${CATEGORY_COLORS[name] || CATEGORY_COLORS["Other"]}`} style={{ width: `${value}%` }} />
                      </div>
                    </div>
                  ))}
                  {!summary && <p className="text-sm text-[#5c5c54]">No data to analyze.</p>}
                </div>

                <div className="mt-8 rounded-2xl bg-[#10110f] p-5 text-[#f6f3e8]">
                  <p className="text-xs font-bold text-[#d5ff51]">MONEY PERSONALITY</p>
                  <p className="mt-2 text-2xl font-black">{sharePersonality}</p>
                </div>
              </aside>
            </div>
          </div>
        </section>
      )}

      {/* Share Modal */}
      {isShareModalOpen && shareImageUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#10110f]/90 p-6 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-[#1a1b18] p-6 shadow-2xl border border-[#f6f3e822]">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-2xl font-black uppercase tracking-tight text-[#d5ff51]">Share Your Autopsy</h3>
              <button onClick={closeShareModal} className="text-3xl font-black text-[#5c5c54] hover:text-[#f6f3e8]">×</button>
            </div>
            
            <div className="overflow-hidden rounded-xl bg-black mb-6">
              <img src={shareImageUrl} alt="Finopsy Share Card" className="w-full object-contain" />
            </div>

            <div className="flex flex-col gap-3">
              {typeof navigator.share === 'function' && (
                <button onClick={handleNativeShare} className="w-full rounded-full bg-[#d5ff51] py-4 font-black text-[#10110f] transition hover:scale-[1.02]">
                  Share Autopsy
                </button>
              )}
              <a href={shareImageUrl} download="finopsy-money-autopsy.png" className="block w-full text-center rounded-full border-2 border-[#f6f3e833] py-4 font-bold hover:bg-[#f6f3e811]">
                Download PNG
              </a>
              {navigator.clipboard && (
                <button onClick={handleCopyImage} className="w-full text-center text-sm font-bold text-[#5c5c54] underline hover:text-[#f6f3e8]">
                  Copy Image
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      {isUsernameOnboardingOpen && <UsernameOnboarding />}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </main>
  );
}
