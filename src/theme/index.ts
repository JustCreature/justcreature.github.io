import { createTheme } from '@mui/material/styles';

// Film-inspired color palette
const colors = {
  charcoal: '#1a1a1a',      // Primary text, headers
  deepAmber: '#d97706',     // Primary accent (darkroom safelight)
  warmWhite: '#fafaf9',     // Background (photo paper)
  silverGray: '#8c9499',    // Secondary text, metadata
  seleniumGray: '#374151',  // Secondary UI elements
  coolGray: '#f3f4f6',      // Subtle backgrounds, cards
  successGreen: '#22c55e',  // Completed states
  errorRed: '#ef4444',      // Warnings, delete actions
  paper: '#ffffff',         // Pure white for cards
};

// Animation tokens
export const animations = {
  cardHover: 'transform 200ms ease-out, box-shadow 200ms ease-out',
  buttonPress: 'transform 150ms ease-out',
  screenTransition: '300ms ease-out',
  modalAppear: '250ms ease-out',
  chipGlow: 'box-shadow 200ms ease-out',
};

// Custom shadows for depth
const customShadows = {
  card: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
  cardHover: '0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.12)',
  dialog: '0 10px 25px rgba(0, 0, 0, 0.3)',
};

export const filmTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: colors.deepAmber,
      dark: '#b45309',
      light: '#f59e0b',
      contrastText: '#ffffff',
    },
    secondary: {
      main: colors.seleniumGray,
      dark: '#1f2937',
      light: '#6b7280',
      contrastText: '#ffffff',
    },
    background: {
      default: colors.warmWhite,
      paper: colors.paper,
    },
    text: {
      primary: colors.charcoal,
      secondary: colors.silverGray,
    },
    success: {
      main: colors.successGreen,
      dark: '#16a34a',
      light: '#4ade80',
    },
    error: {
      main: colors.errorRed,
      dark: '#dc2626',
      light: '#f87171',
    },
    divider: '#e5e7eb',
  },
  typography: {
    fontFamily: "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
    h4: {
      fontSize: 32,
      fontWeight: 600,
      letterSpacing: '-0.02em',
      color: colors.charcoal,
    },
    h5: {
      fontSize: 24,
      fontWeight: 600,
      letterSpacing: '-0.01em',
      color: colors.charcoal,
    },
    h6: {
      fontSize: 20,
      fontWeight: 600,
      letterSpacing: '-0.01em',
      color: colors.charcoal,
    },
    body1: {
      fontSize: 16,
      lineHeight: 1.6,
    },
    body2: {
      fontSize: 14,
      lineHeight: 1.5,
    },
    caption: {
      fontSize: 12,
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
      color: colors.silverGray,
    },
    button: {
      fontWeight: 600,
      letterSpacing: '0.02em',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: customShadows.card,
          transition: animations.cardHover,
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: customShadows.cardHover,
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
          transition: animations.buttonPress,
          '&:active': {
            transform: 'scale(0.98)',
          },
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 2px 8px rgba(217, 119, 6, 0.3)',
          },
        },
        sizeLarge: {
          fontSize: 16,
          padding: '12px 24px',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontVariantNumeric: 'tabular-nums',
          fontWeight: 500,
          transition: animations.chipGlow,
        },
        filled: {
          backgroundColor: colors.coolGray,
          color: colors.charcoal,
          '&:hover': {
            backgroundColor: '#e5e7eb',
            boxShadow: '0 0 0 2px rgba(217, 119, 6, 0.2)',
          },
        },
        clickable: {
          '&:hover': {
            backgroundColor: '#e5e7eb',
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: animations.buttonPress,
          '&:active': {
            transform: 'scale(0.95)',
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          boxShadow: customShadows.dialog,
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: 20,
          fontWeight: 600,
          color: colors.charcoal,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          fontSize: 15,
          minHeight: 56,
          color: colors.silverGray,
          transition: 'color 200ms ease-out',
          '&.Mui-selected': {
            color: colors.deepAmber,
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          height: 3,
          borderRadius: '3px 3px 0 0',
          backgroundColor: colors.deepAmber,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: colors.deepAmber,
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: colors.deepAmber,
              borderWidth: 2,
            },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)',
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 12px rgba(217, 119, 6, 0.3)',
          transition: `${animations.buttonPress}, ${animations.chipGlow}`,
          '&:hover': {
            boxShadow: '0 6px 16px rgba(217, 119, 6, 0.4)',
          },
          '&:active': {
            transform: 'scale(0.95)',
          },
        },
      },
    },
    MuiSnackbar: {
      styleOverrides: {
        root: {
          '& .MuiAlert-root': {
            borderRadius: 8,
          },
        },
      },
    },
  },
});

// Export colors for use in styled components
export { colors, customShadows };
