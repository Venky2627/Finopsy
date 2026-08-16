const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface Transaction {
  id: string;
  user_id?: string | null;
  date: string;
  amount: number;
  merchant: string;
  description?: string | null;
  category: string;
  type: 'income' | 'expense' | 'transfer' | 'refund';
  payment_method?: string | null;
  source: 'manual' | 'statement';
  confidence: number;
  created_at: string;
}

export interface FinancialSummary {
  total_income: number;
  total_spending: number;
  remaining: number;
  transaction_count: number;
  category_totals: Record<string, number>;
  category_percentages: Record<string, number>;
}

export interface DemoResponse {
  transactions: Transaction[];
  summary: FinancialSummary;
}

export interface ParseStatementResponse {
  transactions: Transaction[];
  total_rows: number;
  parsed_rows: number;
  skipped_rows: number;
  warnings: string[];
}

export async function fetchDemo(): Promise<DemoResponse> {
  const res = await fetch(`${API_URL}/api/demo`);
  if (!res.ok) throw new Error("Failed to fetch demo");
  return res.json();
}

export async function quickAdd(payload: {
  amount: number;
  merchant: string;
  category: string;
  date?: string;
  description?: string;
  type?: 'expense' | 'income';
}): Promise<Transaction> {
  const res = await fetch(`${API_URL}/api/quick-add`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to quick add");
  return res.json();
}

export async function analyzeTransactions(transactions: any[]): Promise<FinancialSummary> {
  const res = await fetch(`${API_URL}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(transactions),
  });
  if (!res.ok) throw new Error("Failed to analyze transactions");
  return res.json();
}

export async function uploadStatement(file: File, password?: string): Promise<ParseStatementResponse> {
  const formData = new FormData();
  formData.append("file", file);
  if (password) formData.append("password", password);
  
  const res = await fetch(`${API_URL}/api/upload-statement`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
     const data = await res.json().catch(() => null);
     if (data?.error?.code === "PDF_ENCRYPTED") {
       throw new Error("PDF_ENCRYPTED");
     }
     throw new Error(data?.error?.message || "Failed to upload statement");
  }
  return res.json();
}
export interface Profile {
  id: string;
  username?: string | null;
  display_name?: string | null;
  created_at: string;
}

function getAuthHeaders(token: string) {
  return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
}

export async function getProfile(token: string): Promise<Profile> {
  const res = await fetch(`${API_URL}/api/me`, { headers: getAuthHeaders(token) });
  if (!res.ok) throw new Error("Failed to get profile");
  return res.json();
}

export async function updateProfile(token: string, data: {username?: string, display_name?: string}): Promise<Profile> {
  const res = await fetch(`${API_URL}/api/me`, {
    method: "PATCH",
    headers: getAuthHeaders(token),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error("Failed to update profile");
  return res.json();
}

export async function deleteAccount(token: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/me`, { method: "DELETE", headers: getAuthHeaders(token) });
  if (!res.ok) throw new Error("Failed to delete account");
}

export async function getTransactions(token: string): Promise<Transaction[]> {
  const res = await fetch(`${API_URL}/api/transactions`, { headers: getAuthHeaders(token) });
  if (!res.ok) throw new Error("Failed to get transactions");
  return res.json();
}

export async function saveTransactions(token: string, transactions: Transaction[]): Promise<Transaction[]> {
  const res = await fetch(`${API_URL}/api/transactions/bulk`, {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify(transactions)
  });
  if (!res.ok) throw new Error("Failed to save transactions");
  return res.json();
}

export async function migrateTransactions(token: string, transactions: any[]): Promise<void> {
  const res = await fetch(`${API_URL}/api/transactions/migrate`, {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify({ transactions })
  });
  if (!res.ok) throw new Error("Failed to migrate transactions");
}

export async function updateTransaction(token: string, id: string, data: Partial<Transaction>): Promise<Transaction> {
  const res = await fetch(`${API_URL}/api/transactions/${id}`, {
    method: "PATCH",
    headers: getAuthHeaders(token),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error("Failed to update transaction");
  return res.json();
}

export async function deleteTransaction(token: string, id: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/transactions/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(token)
  });
  if (!res.ok) throw new Error("Failed to delete transaction");
}

export async function deleteAllTransactions(token: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/transactions`, {
    method: "DELETE",
    headers: getAuthHeaders(token)
  });
  if (!res.ok) throw new Error("Failed to delete all transactions");
}

export async function checkUsername(username: string): Promise<{available: boolean}> {
  const res = await fetch(`${API_URL}/api/users/check-username?username=${encodeURIComponent(username)}`);
  if (!res.ok) throw new Error("Failed to check username");
  return res.json();
}
