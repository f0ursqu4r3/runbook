export type Tone = "accent" | "info" | "neutral" | "danger";

export type ToneTheme = {
  line: string;
  glow: string;
  panel: string;
  chip: string;
};

export const TONES: Record<Tone, ToneTheme> = {
  accent: {
    line: "#f59e0b",
    glow: "rgba(245, 158, 11, 0.12)",
    panel: "rgba(15,23,42,0.92)",
    chip: "#f59e0b"
  },
  info: {
    line: "#38bdf8",
    glow: "rgba(56, 189, 248, 0.1)",
    panel: "rgba(15,23,42,0.92)",
    chip: "#38bdf8"
  },
  neutral: {
    line: "#94a3b8",
    glow: "rgba(148, 163, 184, 0.1)",
    panel: "rgba(15,23,42,0.9)",
    chip: "#64748b"
  },
  danger: {
    line: "#fb7185",
    glow: "rgba(251, 113, 133, 0.1)",
    panel: "rgba(76,5,25,0.9)",
    chip: "#fb7185"
  }
};
