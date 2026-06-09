export type SubtitleFormat = 'vtt' | 'srt' | 'ttml';

export interface CueBlock {
  start: number;
  end: number;
  text: string;
}

export interface CapturedSubtitle {
  id: string;
  url: string;
  tabId: number;
  pageTitle: string;
  platform: string;
  language: string;
  format: SubtitleFormat;
  rawContent: string;
  cleanText: string;
  capturedAt: number;
}

export interface TabCaptures {
  tabId: number;
  captures: CapturedSubtitle[];
}

export interface DetectorResult {
  isSubtitle: boolean;
  format: SubtitleFormat | null;
  language: string;
}

export type MessageType =
  | 'SUBTITLE_CAPTURED'
  | 'SUBTITLE_UPDATED'
  | 'CAPTURES_CLEARED'
  | 'PAGE_TITLE_UPDATE';

export interface SubtitleCapturedPayload {
  type: 'SUBTITLE_CAPTURED';
  url: string;
  rawContent: string;
  pageTitle: string;
  frameUrl: string;
}

export interface PageTitleUpdatePayload {
  type: 'PAGE_TITLE_UPDATE';
  pageTitle: string;
}

export interface SubtitleUpdatedPayload {
  type: 'SUBTITLE_UPDATED';
  tabId: number;
  capture: CapturedSubtitle;
}

export interface CapturesClearedPayload {
  type: 'CAPTURES_CLEARED';
  tabId: number;
}

export type RuntimeMessage =
  | SubtitleCapturedPayload
  | PageTitleUpdatePayload;

export type BroadcastMessage = SubtitleUpdatedPayload | CapturesClearedPayload;

export const SUBSURFACE_MESSAGE_SOURCE = 'subsurface-injected';
export const SUBSURFACE_BRIDGE_SOURCE = 'subsurface-bridge';

export interface InjectedCaptureMessage {
  source: typeof SUBSURFACE_MESSAGE_SOURCE;
  url: string;
  rawContent: string;
}
