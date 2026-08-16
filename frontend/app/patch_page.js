import fs from 'fs';

const pagePath = 'd:\\Project\\Finance\\frontend\\app\\page.tsx';
let content = fs.readFileSync(pagePath, 'utf8');

// 1. Imports
content = content.replace(
  'import { fetchDemo, quickAdd, analyzeTransactions, uploadStatement } from "./api";',
  'import { fetchDemo, quickAdd, analyzeTransactions, uploadStatement, getTransactions, saveTransactions, migrateTransactions, deleteTransaction } from "./api";\nimport { useAuth } from "./contexts/AuthContext";\nimport { AuthModal } from "./components/AuthModal";\nimport { UsernameOnboarding } from "./components/UsernameOnboarding";\nimport { SettingsModal } from "./components/SettingsModal";'
);

// 2. ViewState
content = content.replace(
  'type ViewState = "landing" | "quick-add" | "confirmation" | "upload-loading" | "review-upload" | "dashboard";',
  'type ViewState = "landing" | "quick-add" | "confirmation" | "upload-loading" | "review-upload" | "dashboard" | "settings";'
);

// 3. Hooks inside Home
const hooksInjection = `
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
`;
content = content.replace(
  'export default function Home() {',
  'export default function Home() {' + hooksInjection
);

// 4. Update handleDeleteTransaction
content = content.replace(
  'const handleDeleteTransaction = async (id: string) => {\n    const updatedTxns = transactions.filter(t => t.id !== id);\n    setTransactions(updatedTxns);\n    await reAnalyze(updatedTxns);\n  };',
  'const handleDeleteTransaction = async (id: string) => {\n    if (isAuthenticated && session && id) {\n      try { await deleteTransaction(session.access_token, id); } catch(e) { console.error(e); }\n    }\n    const updatedTxns = transactions.filter(t => t.id !== id);\n    setTransactions(updatedTxns);\n    await reAnalyze(updatedTxns);\n  };'
);

// 5. Update handleConfirmUpload
const confirmUploadCode = `
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
`;
content = content.replace(
  /const handleConfirmUpload = async \(\) => {[\s\S]*?navigate\("dashboard"\);\n  };/,
  confirmUploadCode.trim()
);

// 6. Update handleConfirmQuickAdd and handleAddAnother
const quickAddCode = `
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
`;
content = content.replace(
  /const handleConfirmQuickAdd = async \(\) => {[\s\S]*?navigate\("quick-add"\);\n  };/,
  quickAddCode.trim()
);


// 7. ShareCard props
content = content.replace(
  'transactionCount={summary.transaction_count}',
  'transactionCount={summary.transaction_count}\n              username={profile?.username || undefined}'
);

// 8. Nav Header
const navCode = `
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
              {profile?.username ? \`@\${profile.username}\` : "Settings"} ⚙️
            </button>
          ) : (
            <button onClick={() => setIsAuthModalOpen(true)} className="rounded-full border border-[#f6f3e833] px-4 py-1 text-sm font-bold text-[#c9c6ba] hover:text-[#d5ff51] hover:border-[#d5ff51] transition">
              Log In
            </button>
          )}
        </div>
      </nav>
`;
content = content.replace(
  /<nav className="mx-auto flex max-w-6xl items-center justify-between">[\s\S]*?<\/nav>/,
  navCode.trim()
);

// 9. Dashboard Buttons
content = content.replace(
  '<button onClick={() => fileInputRef.current?.click()}',
  `{!isAuthenticated && transactions.length > 0 && !isDemoData && (
                <button onClick={() => setIsAuthModalOpen(true)} className="rounded-full bg-white px-5 py-2 text-sm font-bold text-[#10110f] hover:bg-[#d5ff51] transition animate-pulse">
                  Save My Autopsy
                </button>
              )}\n              <button onClick={() => fileInputRef.current?.click()}`
);

// 10. Modals injection at the end
content = content.replace(
  '</main>',
  `  <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      {isUsernameOnboardingOpen && <UsernameOnboarding />}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </main>`
);

fs.writeFileSync(pagePath, content);
