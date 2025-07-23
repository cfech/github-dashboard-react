import { DATE_COLORS, TIMELINE_EMOJIS } from '@/lib/constants';

export function formatTimestampToLocal(utcTimestamp: string): string {
  const utcDate = new Date(utcTimestamp);
  return utcDate.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit', 
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short'
  });
}

export function isTimestampTodayLocal(utcTimestamp: string): boolean {
  const utcDate = new Date(utcTimestamp);
  const today = new Date();
  return utcDate.toDateString() === today.toDateString();
}

export function getDateColorAndEmoji(utcTimestamp: string): [string, string] {
  const utcDate = new Date(utcTimestamp);
  const today = new Date();
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const itemDate = utcDate.toDateString();
  
  if (itemDate === today.toDateString()) {
    return [DATE_COLORS.today, TIMELINE_EMOJIS.today];
  } else if (itemDate === yesterday.toDateString()) {
    return [DATE_COLORS.yesterday, TIMELINE_EMOJIS.yesterday];
  } else if (utcDate >= weekAgo) {
    return [DATE_COLORS.this_week, TIMELINE_EMOJIS.this_week];
  } else {
    return [DATE_COLORS.older, TIMELINE_EMOJIS.older];
  }
}

export function getRepositoryDisplayName(repoFullName: string): string {
  return repoFullName.split("/").pop() || repoFullName;
}

export function safeGetCommitField(commit: any, field: string, defaultValue: string = "Unknown"): string {
  return commit?.[field] || defaultValue;
}

export function truncateText(text: string, maxLength: number, suffix: string = "..."): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
}

export function calculateDaysAgo(utcTimestamp: string): number {
  const utcDate = new Date(utcTimestamp);
  const today = new Date();
  return Math.floor((today.getTime() - utcDate.getTime()) / (24 * 60 * 60 * 1000));
}