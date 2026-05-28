import { supabase, isSupabaseEnabled } from './supabaseClient';
import { Candidate, KanbanStage, CompanyProfile, TestLibraryItem, ScorecardCriteria, Template } from '../types';
import { DEFAULT_STAGES, DEFAULT_SOURCES, DEFAULT_COMPANY_PROFILE, DEFAULT_TEST_LIBRARY, DEFAULT_TEMPLATES } from '../constants';

export interface CompanySettingsData {
  sources: string[];
  stages: KanbanStage[];
  companyProfile: CompanyProfile;
  testLibrary: TestLibraryItem[];
  slaSettings: Record<string, number>;
  scorecardTemplates: Record<string, ScorecardCriteria[]>;
  commTemplates: Template[];
  themeSettings: Record<string, unknown>;
}

let _cachedCompanyId: string | null = null;

export const supabaseService = {
  // Called by AuthContext after login to cache company_id
  setCompanyId: (id: string | null) => {
    _cachedCompanyId = id;
  },

  getCompanyId: (): string | null => _cachedCompanyId,

  // ── Candidates ───────────────────────────────────────────────────────

  getAllCandidates: async (): Promise<Candidate[]> => {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase
      .from('candidates')
      .select('data')
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data ?? []).map((row: { data: Candidate }) => row.data);
  },

  saveCandidate: async (candidate: Candidate): Promise<void> => {
    if (!supabase || !_cachedCompanyId) throw new Error('Supabase not ready');
    const { error } = await supabase.from('candidates').upsert(
      { id: candidate.id, company_id: _cachedCompanyId, data: candidate },
      { onConflict: 'id' }
    );
    if (error) throw error;
  },

  deleteCandidate: async (id: string): Promise<void> => {
    if (!supabase) throw new Error('Supabase not configured');
    const { error } = await supabase.from('candidates').delete().eq('id', id);
    if (error) throw error;
  },

  clearAllCandidates: async (): Promise<void> => {
    if (!supabase || !_cachedCompanyId) throw new Error('Supabase not ready');
    const { error } = await supabase
      .from('candidates')
      .delete()
      .eq('company_id', _cachedCompanyId);
    if (error) throw error;
  },

  // ── Settings ─────────────────────────────────────────────────────────

  loadSettings: async (): Promise<CompanySettingsData | null> => {
    if (!supabase || !_cachedCompanyId) return null;
    const { data, error } = await supabase
      .from('company_settings')
      .select('*')
      .eq('company_id', _cachedCompanyId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return {
      sources: data.sources ?? DEFAULT_SOURCES,
      stages: data.stages ?? DEFAULT_STAGES,
      companyProfile: data.company_profile ?? DEFAULT_COMPANY_PROFILE,
      testLibrary: data.test_library ?? DEFAULT_TEST_LIBRARY,
      slaSettings: data.sla_settings ?? {},
      scorecardTemplates: data.scorecard_templates ?? {},
      commTemplates: data.comm_templates ?? DEFAULT_TEMPLATES,
      themeSettings: data.theme_settings ?? {},
    };
  },

  saveSettings: async (settings: Partial<CompanySettingsData>): Promise<void> => {
    if (!supabase || !_cachedCompanyId) return;
    const payload: Record<string, unknown> = { company_id: _cachedCompanyId };
    if (settings.sources !== undefined)            payload.sources             = settings.sources;
    if (settings.stages !== undefined)             payload.stages              = settings.stages;
    if (settings.companyProfile !== undefined)     payload.company_profile     = settings.companyProfile;
    if (settings.testLibrary !== undefined)        payload.test_library        = settings.testLibrary;
    if (settings.slaSettings !== undefined)        payload.sla_settings        = settings.slaSettings;
    if (settings.scorecardTemplates !== undefined) payload.scorecard_templates = settings.scorecardTemplates;
    if (settings.commTemplates !== undefined)      payload.comm_templates      = settings.commTemplates;
    if (settings.themeSettings !== undefined)      payload.theme_settings      = settings.themeSettings;

    const { error } = await supabase
      .from('company_settings')
      .upsert(payload, { onConflict: 'company_id' });
    if (error) console.error('Settings save error:', error);
  },

  // ── Company Profile ───────────────────────────────────────────────────

  getCompanyProfile: async (): Promise<CompanyProfile | null> => {
    if (!supabase || !_cachedCompanyId) return null;
    const { data, error } = await supabase
      .from('companies')
      .select('name, website, address')
      .eq('id', _cachedCompanyId)
      .single();
    if (error) return null;
    return {
      name: data.name,
      website: data.website ?? '',
      address: data.address ?? '',
      jobPositions: [],
    };
  },

  // ── Team members ─────────────────────────────────────────────────────

  getTeamMembers: async (): Promise<Array<{ id: string; name: string; isAdmin: boolean; email?: string }>> => {
    if (!supabase || !_cachedCompanyId) return [];
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, is_admin')
      .eq('company_id', _cachedCompanyId);
    if (error) return [];
    return (data ?? []).map((p: { id: string; name: string; is_admin: boolean }) => ({
      id: p.id,
      name: p.name,
      isAdmin: p.is_admin,
    }));
  },

  updateMember: async (userId: string, changes: { name?: string; isAdmin?: boolean }): Promise<void> => {
    if (!supabase) throw new Error('Supabase not configured');
    const payload: Record<string, unknown> = {};
    if (changes.name !== undefined)    payload.name     = changes.name;
    if (changes.isAdmin !== undefined) payload.is_admin = changes.isAdmin;
    const { error } = await supabase.from('profiles').update(payload).eq('id', userId);
    if (error) throw error;
  },

  removeMember: async (userId: string): Promise<void> => {
    if (!supabase) throw new Error('Supabase not configured');
    const { error } = await supabase.from('profiles').delete().eq('id', userId);
    if (error) throw error;
  },
};

export { isSupabaseEnabled };
