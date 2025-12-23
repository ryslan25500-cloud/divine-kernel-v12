/**
 * 📦 DIVINE KERNEL V12 - Database Models
 */

export interface User {
  id: string;
  email: string;
  password_hash: string;
  role: string;
  created_at: Date;
  updated_at: Date;
}

export interface Sequence {
  id: string;
  user_id: string;
  name: string;
  type: string;
  sequence: string;
  length: number;
  gc_content: number;
  metadata: Record<string, any>;
  created_at: Date;
}

export interface Genome {
  id: string;
  user_id: string;
  name: string;
  organism: string;
  topology: string;
  annotations: Record<string, any>;
  statistics: Record<string, any>;
  created_at: Date;
}

export interface Tree {
  id: string;
  user_id: string;
  name: string;
  newick: string;
  method: string;
  statistics: Record<string, any>;
  created_at: Date;
}

export interface Job {
  id: string;
  user_id: string;
  type: string;
  status: string;
  input: Record<string, any>;
  output: Record<string, any>;
  error: string | null;
  created_at: Date;
  started_at: Date | null;
  completed_at: Date | null;
}
