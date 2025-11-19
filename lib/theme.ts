
export interface ThemePreset {
  id: string;
  name: string;
  primary: string;
  dark: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  { id: 'violet', name: 'Mamaty Violet (Défaut)', primary: '#8B5CF6', dark: '#7C3AED' }, // Violet-500/600
  { id: 'pink', name: 'Rose Bonbon', primary: '#EC4899', dark: '#DB2777' }, // Pink-500/600
  { id: 'blue', name: 'Bleu Océan', primary: '#3B82F6', dark: '#2563EB' }, // Blue-500/600
  { id: 'cyan', name: 'Cyan Frais', primary: '#06B6D4', dark: '#0891B2' }, // Cyan-500/600
  { id: 'emerald', name: 'Vert Nature', primary: '#10B981', dark: '#059669' }, // Emerald-500/600
  { id: 'amber', name: 'Ambre Chaud', primary: '#F59E0B', dark: '#D97706' }, // Amber-500/600
  { id: 'rose', name: 'Rouge Passion', primary: '#F43F5E', dark: '#E11D48' }, // Rose-500/600
  { id: 'slate', name: 'Gris Professionnel', primary: '#64748B', dark: '#475569' }, // Slate-500/600
];

export const applyTheme = (primary: string, dark: string) => {
  const root = document.documentElement;
  root.style.setProperty('--color-premier', primary);
  root.style.setProperty('--color-premier-dark', dark);
  
  // Save to local storage
  localStorage.setItem('app-theme', JSON.stringify({ primary, dark }));
};

export const loadSavedTheme = () => {
  const saved = localStorage.getItem('app-theme');
  if (saved) {
    try {
      const { primary, dark } = JSON.parse(saved);
      applyTheme(primary, dark);
    } catch (e) {
      console.error("Failed to parse saved theme", e);
    }
  }
};
