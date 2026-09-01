const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://finopsy-api.onrender.com";

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
  extraction_confidence: number;
  category_confidence: number;
  user_edited?: boolean;
  created_at?: string;
}

export interface FinancialSummary {
  total_income: number;
  total_spending: number;
  remaining: number;
  transaction_count: number;
  category_totals: Record<string, number>;
  category_percentages: Record<string, number>;
  daily_spending: { date: string, amount: number }[];
  subscriptions?: Subscription[];
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

export async function resolveMerchants(merchants: string[]): Promise<Record<string, {clean_name: string, category: string}>> {
  const res = await fetch(`${API_URL}/api/merchants/resolve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ merchants })
  });
  if (!res.ok) throw new Error("Failed to resolve merchants");
  const data = await res.json();
  return data.mapping;
}

export interface RoastRequest {
  total_spent: number;
  category_totals: Record<string, number>;
  category_percentages: Record<string, number>;
  top_merchant: string | null;
  top_merchant_amount: number | null;
  transaction_count: number;
  severity?: 'mild' | 'savage' | 'unhinged';
  seen_roasts?: string[];
}

export interface RoastResponse {
  roast_id: string;
  severity: string;
  text: string;
  source: string;
}

export async function generateRoast(data: RoastRequest): Promise<RoastResponse> {
  try {
    const res = await fetch(`${API_URL}/api/roast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn("Roast API call failed, using client fallback", e);
  }
  
  // Safe client fallback if server is unreachable
  return {
    roast_id: `client_${Date.now()}`,
    severity: data.severity || 'savage',
    text: `Your bank account experienced avoidable trauma across ${data.transaction_count} transactions.`,
    source: 'client_fallback'
  };
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

export async function uploadStatement(file: File, password?: string, token?: string): Promise<ParseStatementResponse> {
  const formData = new FormData();
  formData.append("file", file);
  if (password) formData.append("password", password);
  
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  const res = await fetch(`${API_URL}/api/upload-statement`, {
    method: "POST",
    headers,
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
  const res = await fetch(`${API_URL}/api/transactions`, {
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

export interface TransactionBulkUpdate {
  id: string;
  merchant?: string;
  date?: string;
  amount?: number;
  type?: 'income' | 'expense' | 'transfer' | 'refund';
  category?: string;
}

export async function bulkUpdateTransactions(token: string, updates: TransactionBulkUpdate[]): Promise<Transaction[]> {
  const res = await fetch(`${API_URL}/api/transactions/bulk`, {
    method: "PATCH",
    headers: getAuthHeaders(token),
    body: JSON.stringify(updates)
  });
  if (!res.ok) throw new Error("Failed to bulk update transactions");
  return res.json();
}

export interface Subscription {
  merchant: string;
  category: string;
  monthly_amount: number;
  frequency: string;
  occurrence_count: number;
  total_paid_so_far: number;
  annual_projection: number;
  next_predicted_date: string | null;
  confidence: number;
}

export interface BudgetCreate {
  category: string;
  monthly_limit: number;
}

export interface BudgetOut {
  id: string;
  category: string;
  monthly_limit: number;
  spent_this_month: number;
  remaining: number;
  percentage: number;
  status: 'safe' | 'warning' | 'danger' | 'exceeded';
  created_at: string;
}

export async function fetchBudgets(token: string): Promise<BudgetOut[]> {
  const res = await fetch(`${API_URL}/api/budgets`, { headers: getAuthHeaders(token) });
  if (!res.ok) throw new Error("Failed to fetch budgets");
  return res.json();
}

export async function createBudget(token: string, budget: BudgetCreate): Promise<BudgetOut> {
  const res = await fetch(`${API_URL}/api/budgets`, {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify(budget)
  });
  if (!res.ok) throw new Error("Failed to create budget");
  return res.json();
}

export async function updateBudget(token: string, id: string, monthly_limit: number): Promise<void> {
  const res = await fetch(`${API_URL}/api/budgets/${id}`, {
    method: "PATCH",
    headers: getAuthHeaders(token),
    body: JSON.stringify({ monthly_limit })
  });
  if (!res.ok) throw new Error("Failed to update budget");
}

export async function deleteBudget(token: string, id: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/budgets/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(token)
  });
  if (!res.ok) throw new Error("Failed to delete budget");
}

