import { CalendarEvent, EventType } from '../types';

export interface CalendarParseResult {
  success: boolean;
  sourceFileName: string;
  events: CalendarEvent[];
  summary: {
    totalEvents: number;
    exams: number;
    holidays: number;
    deadlines: number;
    events: number;
    instructionalDays: number;
  };
  warnings?: string[];
}

/**
 * Common holiday keywords for engineering colleges and national academic calendars.
 * Scanning matches these keywords to automatically tag events as "holiday" (Green).
 */
export const HOLIDAY_KEYWORDS: string[] = [
  'holiday',
  'holidays',
  'public holiday',
  'national holiday',
  'gazetted holiday',
  'restricted holiday',
  'state holiday',
  'bank holiday',
  'break',
  'breaks',
  'festival',
  'festivals',
  'festive',
  'diwali',
  'deepavali',
  'dipawali',
  'dussehra',
  'dasara',
  'dashami',
  'vijayadashami',
  'republic day',
  'independence day',
  'vacation',
  'vacations',
  'gandhi jayanti',
  'jayanti',
  'eid',
  'id-ul',
  'id ul',
  'ramzan',
  'ramadan',
  'bakrid',
  'muharram',
  'christmas',
  'xmas',
  'good friday',
  'easter',
  'pongal',
  'makar sankranti',
  'sankranti',
  'lohri',
  'holi',
  'ganesh chaturthi',
  'vinayaka chaturthi',
  'navratri',
  'durga puja',
  'puja vacation',
  'maha shivratri',
  'shivratri',
  'onam',
  'buddha purnima',
  'mahavir jayanti',
  'guru nanak',
  'gurpurab',
  'new year',
  'recess',
  'semester break',
  'autumn break',
  'winter break',
  'summer break',
  'spring break',
  'term break',
  'mid-term break',
  'mid term break',
  'study break',
  'prep break',
  'preparatory break',
  'reading day',
  'reading days',
  'reading period',
  'thanksgiving',
  'labor day',
  'memorial day',
  'martin luther king',
  'mlk',
  'presidents day',
  'veterans day',
  'columbus day',
  'ugadi',
  'baisakhi',
  'raksha bandhan',
  'janmashtami',
  'closed',
  'college closed',
  'campus closed',
  'day off',
  'holiday observed',
  'non-instructional',
  'no classes',
];

/**
 * Checks if a string contains any holiday keywords.
 */
export function matchesHolidayKeyword(text: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();

  return HOLIDAY_KEYWORDS.some((kw) => {
    // For very short words (length <= 4), enforce word boundary to avoid false positives
    if (kw.length <= 4) {
      const regex = new RegExp(`\\b${kw}\\b`, 'i');
      return regex.test(lower);
    }
    return lower.includes(kw);
  });
}

/**
 * Normalizes date string into YYYY-MM-DD format.
 * Supports ISO (YYYY-MM-DD), European (DD/MM/YYYY, DD-MM-YYYY),
 * and English textual dates ("15 Oct 2026", "15th August 2026", "October 20, 2026").
 */
export function normalizeDate(dateStr: string): string {
  if (!dateStr) return '2026-09-19';
  let clean = dateStr.trim();

  // Strip ordinals like 15th -> 15, 1st -> 1, 2nd -> 2, 3rd -> 3
  clean = clean.replace(/(\d+)(st|nd|rd|th)/gi, '$1');

  // If already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    return clean;
  }

  // Handle DD-MM-YYYY or DD/MM/YYYY
  const dmyMatch = clean.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmyMatch) {
    const d = String(dmyMatch[1]).padStart(2, '0');
    const m = String(dmyMatch[2]).padStart(2, '0');
    const y = dmyMatch[3];
    return `${y}-${m}-${d}`;
  }

  // Handle textual dates like "15 Oct 2026" or "October 15, 2026"
  const parsed = new Date(clean);
  if (!isNaN(parsed.getTime())) {
    let y = parsed.getFullYear();
    // If year was defaulted to something unreasonable (e.g. 2001 or 1970 due to missing year), anchor to 2026
    if (y < 2020 || y > 2030) y = 2026;
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return '2026-09-19';
}

/**
 * Classifies raw event type string, title, and surrounding row context into a valid EventType.
 * Priority 1: Holiday detection (mapped to 'holiday', styled in green)
 * Priority 2: Examination detection (mapped to 'exam', styled in red)
 * Priority 3: Deadlines & submissions (mapped to 'deadline', styled in purple)
 * Priority 4: College events & fests (mapped to 'event', styled in purple)
 * Default: 'college_day' (styled in orange)
 */
export function classifyEventType(rawType = '', title = '', contextText = ''): EventType {
  const combined = `${rawType} ${title} ${contextText}`.toLowerCase();

  // 1. Holiday Keywords (Top Priority as requested)
  if (matchesHolidayKeyword(combined)) {
    return 'holiday';
  }

  // 2. Exam Keywords
  if (
    combined.includes('exam') ||
    combined.includes('midterm') ||
    combined.includes('mid-term') ||
    combined.includes('endsem') ||
    combined.includes('end-sem') ||
    combined.includes('quiz') ||
    combined.includes('test') ||
    combined.includes('viva') ||
    combined.includes('evaluation')
  ) {
    return 'exam';
  }

  // 3. Deadline Keywords
  if (
    combined.includes('deadline') ||
    combined.includes('submission') ||
    combined.includes('due') ||
    combined.includes('proposal') ||
    combined.includes('report') ||
    combined.includes('assignment') ||
    combined.includes('milestone')
  ) {
    return 'deadline';
  }

  // 4. College Events / Fests
  if (
    combined.includes('fest') ||
    combined.includes('hackathon') ||
    combined.includes('seminar') ||
    combined.includes('workshop') ||
    combined.includes('symposium') ||
    combined.includes('conference') ||
    combined.includes('orientation') ||
    combined.includes('sports meet') ||
    combined.includes('event')
  ) {
    return 'event';
  }

  // Fallback check on rawType explicitly
  const lowerRaw = rawType.toLowerCase();
  if (lowerRaw.includes('holiday')) return 'holiday';
  if (lowerRaw.includes('exam')) return 'exam';
  if (lowerRaw.includes('deadline')) return 'deadline';
  if (lowerRaw.includes('event')) return 'event';

  return 'college_day';
}

/**
 * Parses JSON academic calendar string
 */
export function parseJSONCalendar(jsonText: string, fileName = 'calendar.json'): CalendarParseResult {
  try {
    const parsed = JSON.parse(jsonText);
    const rawList = Array.isArray(parsed) ? parsed : parsed.events || parsed.dates || [];

    const events: CalendarEvent[] = rawList.map((item: any, idx: number) => {
      const type = classifyEventType(
        item.type || item.category || '',
        item.title || item.name || '',
        `${item.description || ''} ${item.notes || ''}`
      );

      return {
        id: item.id || `cal-parsed-${Date.now()}-${idx}`,
        title: item.title || item.name || 'Academic Event',
        date: normalizeDate(item.date || '2026-09-19'),
        type,
        startTime: item.startTime,
        endTime: item.endTime,
        location: item.location || item.room,
        description: item.description || item.notes || item.details,
      };
    });

    return createCalendarResult(events, fileName);
  } catch (err: any) {
    return {
      success: false,
      sourceFileName: fileName,
      events: [],
      summary: { totalEvents: 0, exams: 0, holidays: 0, deadlines: 0, events: 0, instructionalDays: 0 },
      warnings: [`JSON calendar error: ${err.message}`],
    };
  }
}

/**
 * Parses CSV/TSV academic calendar text
 */
export function parseCSVCalendar(csvText: string, fileName = 'calendar.csv'): CalendarParseResult {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    return {
      success: false,
      sourceFileName: fileName,
      events: [],
      summary: { totalEvents: 0, exams: 0, holidays: 0, deadlines: 0, events: 0, instructionalDays: 0 },
      warnings: ['CSV file is empty or missing headers.'],
    };
  }

  const delimiter = lines[0].includes('\t') ? '\t' : ',';
  const headers = lines[0].split(delimiter).map((h) => h.trim().toLowerCase());

  const dateIdx = headers.findIndex((h) => h.includes('date'));
  const titleIdx = headers.findIndex((h) => h.includes('title') || h.includes('event') || h.includes('name') || h.includes('activity'));
  const typeIdx = headers.findIndex((h) => h.includes('type') || h.includes('category') || h.includes('tag'));
  const startIdx = headers.findIndex((h) => h.includes('start'));
  const endIdx = headers.findIndex((h) => h.includes('end'));
  const locIdx = headers.findIndex((h) => h.includes('location') || h.includes('venue') || h.includes('room'));
  const notesIdx = headers.findIndex((h) => h.includes('notes') || h.includes('desc') || h.includes('details') || h.includes('remarks'));

  const events: CalendarEvent[] = [];

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i];
    const cols = rawLine.split(delimiter).map((c) => c.trim().replace(/^"(.*)"$/, '$1'));
    if (cols.length < 2 && !rawLine.includes('2026')) continue;

    const rawDate = dateIdx !== -1 && cols[dateIdx] ? cols[dateIdx] : cols[0];
    const rawTitle = titleIdx !== -1 && cols[titleIdx] ? cols[titleIdx] : (cols[1] || `Event ${i}`);
    const rawType = typeIdx !== -1 ? cols[typeIdx] : '';

    if (!rawTitle || rawTitle.toLowerCase() === 'date' || rawTitle.toLowerCase() === 'title') continue;

    // Scan full row text for holiday keywords
    const type = classifyEventType(rawType, rawTitle, rawLine);
    const startTime = startIdx !== -1 && cols[startIdx] ? cols[startIdx] : undefined;
    const endTime = endIdx !== -1 && cols[endIdx] ? cols[endIdx] : undefined;
    const location = locIdx !== -1 && cols[locIdx] ? cols[locIdx] : undefined;
    const description = notesIdx !== -1 && cols[notesIdx] ? cols[notesIdx] : undefined;

    events.push({
      id: `cal-csv-${Date.now()}-${i}`,
      title: rawTitle,
      date: normalizeDate(rawDate),
      type,
      startTime: type === 'holiday' && !startTime ? undefined : startTime,
      endTime: type === 'holiday' && !endTime ? undefined : endTime,
      location,
      description,
    });
  }

  return createCalendarResult(events, fileName);
}

/**
 * Parses free-form text or unstructured document dumps (e.g. extracted from PDF or text notes).
 * Scans each line for dates and holiday / exam / deadline keywords.
 */
export function parseTextCalendar(text: string, fileName = 'calendar.txt'): CalendarParseResult {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  const events: CalendarEvent[] = [];

  // Date regex patterns
  const isoDateRegex = /\b(\d{4}[-/.]\d{1,2}[-/.]\d{1,2})\b/;
  const dmyDateRegex = /\b(\d{1,2}[-/.]\d{1,2}[-/.]\d{4})\b/;
  const textDateRegex = /\b(\d{1,2}(?:st|nd|rd|th)?\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*(?:\s+\d{4})?)\b/i;
  const monthFirstDateRegex = /\b((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s+\d{4})?)\b/i;

  let eventIndex = 0;

  for (const line of lines) {
    let matchedDateStr = '';
    let match = line.match(isoDateRegex);
    if (match) {
      matchedDateStr = match[1];
    } else {
      match = line.match(dmyDateRegex);
      if (match) {
        matchedDateStr = match[1];
      } else {
        match = line.match(textDateRegex);
        if (match) {
          matchedDateStr = match[1];
        } else {
          match = line.match(monthFirstDateRegex);
          if (match) {
            matchedDateStr = match[1];
          }
        }
      }
    }

    if (matchedDateStr) {
      // Remove the matched date from the line to isolate the title / description
      let title = line
        .replace(matchedDateStr, '')
        .replace(/^[:\-–—|,]+/, '')
        .replace(/[:\-–—|,]+$/, '')
        .trim();

      if (!title) {
        title = matchesHolidayKeyword(line) ? 'College Holiday' : 'Academic Event';
      }

      // Automatically classify event type based on holiday/exam/deadline keyword scanning
      const type = classifyEventType('', title, line);

      events.push({
        id: `cal-txt-${Date.now()}-${eventIndex++}`,
        title,
        date: normalizeDate(matchedDateStr),
        type,
        startTime: undefined,
        endTime: undefined,
        description: line,
      });
    } else if (matchesHolidayKeyword(line) && line.length > 5 && line.length < 100) {
      // Line mentions a holiday keyword without an explicit date (e.g. "Diwali Break")
      // Assign default semester date
      events.push({
        id: `cal-txt-hol-${Date.now()}-${eventIndex++}`,
        title: line,
        date: '2026-10-20',
        type: 'holiday',
        description: 'Extracted holiday entry from uploaded document.',
      });
    }
  }

  if (events.length > 0) {
    return createCalendarResult(events, fileName);
  }

  return {
    success: false,
    sourceFileName: fileName,
    events: [],
    summary: { totalEvents: 0, exams: 0, holidays: 0, deadlines: 0, events: 0, instructionalDays: 0 },
    warnings: ['No distinct dates found in text file.'],
  };
}

/**
 * Converts a browser File object to a base64 encoded string (without data URL prefix)
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

/**
 * Sends uploaded academic calendar document (PDF, PNG, JPG, CSV, text) to server-side Gemini parser
 */
async function parseCalendarWithAI(
  file: File,
  fileBase64?: string,
  fileText?: string
): Promise<CalendarParseResult | null> {
  try {
    const payload: {
      fileName: string;
      mimeType: string;
      fileBase64?: string;
      fileText?: string;
    } = {
      fileName: file.name,
      mimeType: file.type || 'application/octet-stream',
    };

    if (fileBase64) {
      payload.fileBase64 = fileBase64;
    }
    if (fileText) {
      payload.fileText = fileText;
    }

    const res = await fetch('/api/parse-calendar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.warn('Server AI calendar parse returned non-OK status:', res.status);
      return null;
    }

    const data = await res.json();
    if (data.success && Array.isArray(data.events) && data.events.length > 0) {
      return data as CalendarParseResult;
    }
  } catch (err) {
    console.warn('AI calendar parsing request failed, falling back to local parser:', err);
  }
  return null;
}

/**
 * Parses uploaded calendar file (PDF, image, spreadsheet, CSV, JSON, plain text)
 */
export async function parseUploadedCalendarFile(file: File): Promise<CalendarParseResult> {
  const fileName = file.name;
  const lowerName = fileName.toLowerCase();

  let fileBase64: string | undefined;
  let fileText: string | undefined;

  // Read base64 representation
  try {
    fileBase64 = await fileToBase64(file);
  } catch (e) {
    console.warn('Could not read file as base64:', e);
  }

  // Read text content for text-based formats
  if (
    lowerName.endsWith('.json') ||
    lowerName.endsWith('.csv') ||
    lowerName.endsWith('.tsv') ||
    lowerName.endsWith('.txt') ||
    file.type.includes('text') ||
    file.type.includes('json') ||
    file.type.includes('csv')
  ) {
    try {
      fileText = await file.text();
    } catch (e) {
      console.warn('Could not read file as text:', e);
    }
  }

  // 1. First priority: Server-side Gemini AI parsing for high accuracy document extraction
  const aiResult = await parseCalendarWithAI(file, fileBase64, fileText);
  if (aiResult && aiResult.success && aiResult.events.length > 0) {
    return aiResult;
  }

  // 2. Client-side parsing fallback for text/CSV/JSON formats
  if (fileText) {
    const trimmed = fileText.trim();

    // 2a. JSON Calendar
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        const jsonResult = parseJSONCalendar(trimmed, fileName);
        if (jsonResult.success && jsonResult.events.length > 0) {
          return jsonResult;
        }
      } catch (err) {
        console.warn('JSON calendar fallback failed:', err);
      }
    }

    // 2b. CSV or TSV Calendar
    if (trimmed.includes(',') || trimmed.includes('\t') || trimmed.includes(';')) {
      try {
        const csvResult = parseCSVCalendar(trimmed, fileName);
        if (csvResult.success && csvResult.events.length > 0) {
          return csvResult;
        }
      } catch (err) {
        console.warn('CSV calendar fallback failed:', err);
      }
    }

    // 2c. Plain text
    try {
      const textResult = parseTextCalendar(trimmed, fileName);
      if (textResult.success && textResult.events.length > 0) {
        return textResult;
      }
    } catch (err) {
      console.warn('Text calendar fallback failed:', err);
    }
  }

  // If no events could be extracted
  return {
    success: false,
    sourceFileName: fileName,
    events: [],
    summary: { totalEvents: 0, exams: 0, holidays: 0, deadlines: 0, events: 0, instructionalDays: 0 },
    warnings: [
      `Could not extract dated events from "${fileName}". Please ensure the file contains event dates, holidays, or exam schedules.`,
    ],
  };
}

/**
 * Creates standardized calendar result object
 */
function createCalendarResult(events: CalendarEvent[], fileName: string): CalendarParseResult {
  let exams = 0;
  let holidays = 0;
  let deadlines = 0;
  let evCount = 0;
  let instructionalDays = 0;

  events.forEach((e) => {
    if (e.type === 'holiday') holidays++;
    else if (e.type === 'exam') exams++;
    else if (e.type === 'deadline') deadlines++;
    else if (e.type === 'event') evCount++;
    else instructionalDays++;
  });

  return {
    success: true,
    sourceFileName: fileName,
    events,
    summary: {
      totalEvents: events.length,
      exams,
      holidays,
      deadlines,
      events: evCount,
      instructionalDays,
    },
  };
}

/**
 * Exports calendar events to downloadable CSV
 */
export function exportCalendarEventsToCSV(events: CalendarEvent[]): string {
  const headers = ['Date', 'Title', 'Type', 'Start Time', 'End Time', 'Location', 'Notes'];
  const rows = events.map((e) => [
    e.date,
    `"${(e.title || '').replace(/"/g, '""')}"`,
    e.type,
    e.startTime || '',
    e.endTime || '',
    `"${(e.location || '').replace(/"/g, '""')}"`,
    `"${(e.description || '').replace(/"/g, '""')}"`,
  ]);
  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}
