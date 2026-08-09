// GENERATED FROM contracts/design/. DO NOT EDIT. design-sha256: effd6f4372b1a780576c0c3695c0cca36f4ead3dca1712126217cda39d519ecb
const Map<String, Object?> enistereDesignContract = <String, Object?>{
  "experience": {
    "schemaVersion": "1",
    "id": "design-experience",
    "semanticColorKeys": [
      "background.default",
      "background.muted",
      "background.elevated",
      "foreground.default",
      "foreground.muted",
      "foreground.inverse",
      "border.default",
      "border.strong",
      "border.focus",
      "action.primary",
      "action.primaryHover",
      "action.primaryPressed",
      "action.disabled",
      "status.success",
      "status.warning",
      "status.danger",
      "status.info",
      "focus.ring",
      "overlay"
    ],
    "patterns": [
      {
        "id": "loading",
        "applicability": [
          "web",
          "mobile"
        ],
        "announcement": "polite",
        "action": "none",
        "focus": "preserve",
        "motion": "reduced-safe",
        "safeContent": true,
        "revealTechnicalDetails": false,
        "messageKey": "experience.loading"
      },
      {
        "id": "empty",
        "applicability": [
          "web",
          "mobile"
        ],
        "announcement": "none",
        "action": "optional",
        "focus": "preserve",
        "motion": "none",
        "safeContent": true,
        "revealTechnicalDetails": false,
        "messageKey": "experience.empty"
      },
      {
        "id": "error",
        "applicability": [
          "web",
          "mobile"
        ],
        "announcement": "assertive",
        "action": "optional",
        "focus": "move-to-state",
        "motion": "none",
        "safeContent": true,
        "revealTechnicalDetails": false,
        "messageKey": "experience.error"
      },
      {
        "id": "success",
        "applicability": [
          "web",
          "mobile"
        ],
        "announcement": "polite",
        "action": "optional",
        "focus": "preserve",
        "motion": "none",
        "safeContent": true,
        "revealTechnicalDetails": false,
        "messageKey": "experience.success"
      },
      {
        "id": "unauthorized",
        "applicability": [
          "web",
          "mobile"
        ],
        "announcement": "polite",
        "action": "required",
        "focus": "move-to-state",
        "motion": "none",
        "safeContent": true,
        "revealTechnicalDetails": false,
        "messageKey": "experience.unauthorized"
      },
      {
        "id": "forbidden",
        "applicability": [
          "web",
          "mobile"
        ],
        "announcement": "polite",
        "action": "optional",
        "focus": "move-to-state",
        "motion": "none",
        "safeContent": true,
        "revealTechnicalDetails": false,
        "messageKey": "experience.forbidden"
      },
      {
        "id": "offline",
        "applicability": [
          "mobile",
          "web"
        ],
        "announcement": "polite",
        "action": "optional",
        "focus": "preserve",
        "motion": "none",
        "safeContent": true,
        "revealTechnicalDetails": false,
        "messageKey": "experience.offline"
      }
    ]
  },
  "themePacks": [
    {
      "schemaVersion": "1",
      "id": "enistere-default",
      "version": "1.0.0",
      "contractVersion": "1",
      "institution": {
        "id": "enistere",
        "displayName": "Enistere"
      },
      "selection": {
        "contexts": [
          "default"
        ],
        "allowUserMode": true,
        "followSystem": true,
        "fallbackThemeId": null
      },
      "shared": {
        "spacing": {
          "xs": 4,
          "sm": 8,
          "md": 16,
          "lg": 24,
          "xl": 32,
          "xxl": 48
        },
        "radius": {
          "xs": 0,
          "sm": 4,
          "md": 8,
          "lg": 12,
          "xl": 20,
          "xxl": 9999
        },
        "minimumTouchTarget": 44
      },
      "modes": {
        "light": {
          "colors": {
            "background.default": "#FFFFFF",
            "background.muted": "#F8FAFC",
            "background.elevated": "#FFFFFF",
            "foreground.default": "#0F172A",
            "foreground.muted": "#64748B",
            "foreground.inverse": "#FFFFFF",
            "border.default": "#E2E8F0",
            "border.strong": "#CBD5E1",
            "border.focus": "#3B82F6",
            "action.primary": "#2563EB",
            "action.primaryHover": "#1D4ED8",
            "action.primaryPressed": "#1E40AF",
            "action.disabled": "#CBD5E1",
            "status.success": "#16A34A",
            "status.warning": "#D97706",
            "status.danger": "#DC2626",
            "status.info": "#2563EB",
            "focus.ring": "#3B82F6",
            "overlay": "#0F172ACC"
          }
        },
        "dark": {
          "colors": {
            "background.default": "#020617",
            "background.muted": "#0F172A",
            "background.elevated": "#1E293B",
            "foreground.default": "#F8FAFC",
            "foreground.muted": "#94A3B8",
            "foreground.inverse": "#0F172A",
            "border.default": "#334155",
            "border.strong": "#475569",
            "border.focus": "#60A5FA",
            "action.primary": "#3B82F6",
            "action.primaryHover": "#60A5FA",
            "action.primaryPressed": "#93C5FD",
            "action.disabled": "#334155",
            "status.success": "#22C55E",
            "status.warning": "#F59E0B",
            "status.danger": "#EF4444",
            "status.info": "#3B82F6",
            "focus.ring": "#60A5FA",
            "overlay": "#020617CC"
          }
        }
      },
      "assets": []
    },
    {
      "schemaVersion": "1",
      "id": "sunrise-institute",
      "version": "1.0.0",
      "contractVersion": "1",
      "institution": {
        "id": "sunrise",
        "displayName": "Sunrise Institute"
      },
      "selection": {
        "contexts": [
          "default",
          "learning"
        ],
        "allowUserMode": true,
        "followSystem": true,
        "fallbackThemeId": "enistere-default"
      },
      "shared": {
        "spacing": {
          "xs": 4,
          "sm": 8,
          "md": 16,
          "lg": 24,
          "xl": 32,
          "xxl": 48
        },
        "radius": {
          "xs": 0,
          "sm": 6,
          "md": 10,
          "lg": 14,
          "xl": 22,
          "xxl": 9999
        },
        "minimumTouchTarget": 48
      },
      "modes": {
        "light": {
          "colors": {
            "background.default": "#FFFBEB",
            "background.muted": "#FEF3C7",
            "background.elevated": "#FFFFFF",
            "foreground.default": "#451A03",
            "foreground.muted": "#78350F",
            "foreground.inverse": "#FFFFFF",
            "border.default": "#FCD34D",
            "border.strong": "#F59E0B",
            "border.focus": "#7C3AED",
            "action.primary": "#7C3AED",
            "action.primaryHover": "#6D28D9",
            "action.primaryPressed": "#5B21B6",
            "action.disabled": "#D6D3D1",
            "status.success": "#15803D",
            "status.warning": "#B45309",
            "status.danger": "#B91C1C",
            "status.info": "#6D28D9",
            "focus.ring": "#7C3AED",
            "overlay": "#451A03CC"
          }
        },
        "dark": {
          "colors": {
            "background.default": "#1C1917",
            "background.muted": "#292524",
            "background.elevated": "#44403C",
            "foreground.default": "#FAFAF9",
            "foreground.muted": "#D6D3D1",
            "foreground.inverse": "#1C1917",
            "border.default": "#57534E",
            "border.strong": "#78716C",
            "border.focus": "#FBBF24",
            "action.primary": "#F59E0B",
            "action.primaryHover": "#FBBF24",
            "action.primaryPressed": "#FCD34D",
            "action.disabled": "#57534E",
            "status.success": "#4ADE80",
            "status.warning": "#FBBF24",
            "status.danger": "#F87171",
            "status.info": "#A78BFA",
            "focus.ring": "#FBBF24",
            "overlay": "#1C1917CC"
          }
        }
      },
      "assets": []
    }
  ]
};
