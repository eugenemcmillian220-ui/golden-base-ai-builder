import { getClient } from './supabase/client';
import type { User, AuthChangeEvent, Session } from '@supabase/supabase-js';

export async function signUp(email: string, password: string) {
  const supabase = getClient();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const supabase = getClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const supabase = getClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getUser(): Promise<User | null> {
  const supabase = getClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getSession() {
  const supabase = getClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export function onAuthStateChange(callback: (user: User | null) => void) {
  const supabase = getClient();
  return supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
    callback(session?.user ?? null);
  });
}
