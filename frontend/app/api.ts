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

export async function uploadStatement(file: File): Promise<ParseStatementResponse> {
  const formData = new FormData();
  formData.append("file", file);
  
  const res = await fetch(`${API_URL}/api/upload-statement`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
     const data = await res.json().catch(() => null);
     throw new Error(data?.error?.message || "Failed to upload statement");
  }
  return res.json();
}
