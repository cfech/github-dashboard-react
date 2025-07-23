import { createTheme, ThemeOptions } from '@mui/material/styles';

const baseTheme: ThemeOptions = {
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  shape: {
    borderRadius: 8,
  },
};

export const lightTheme = createTheme({
  ...baseTheme,
  palette: {
    mode: 'light',
    primary: {
      main: '#4A90E2',
    },
    secondary: {
      main: '#9C27B0',
    },
    background: {
      default: '#fafafa',
      paper: '#ffffff',
    },
    text: {
      primary: '#333333',
      secondary: '#666666',
    },
  },
});

export const darkTheme = createTheme({
  ...baseTheme,
  palette: {
    mode: 'dark',
    primary: {
      main: '#5B9BD5',
    },
    secondary: {
      main: '#9C27B0',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
    text: {
      primary: '#ffffff',
      secondary: '#aaaaaa',
    },
  },
});

export const PROJECT_COLORS = {
  today: '#9C27B0',
  yesterday: '#43A047',
  thisWeek: '#FB8C00',
  older: '#FFFFFF',
  chartBlue: '#4A90E2',
  chartBlueAlt: '#5B9BD5',
  chartBorderCommit: '#2C5AA0',
  chartBorderPR: '#3A7BD5',
  badgeOrange: '#ff6f00',
  openPRBg: '#e3f2fd',
  openPRText: '#1565c0',
  mergedPRBg: '#e8f5e8',
  mergedPRText: '#2e7d32',
  closedPRBg: '#ffebee',
  closedPRText: '#c62828',
};