import { CollegeClass, ClassType } from '../types';

export interface TimetableParseResult {
  success: boolean;
  sourceFileName: string;
  classes: CollegeClass[];
  summary: {
    totalClasses: number;
    lectures: number;
    labs: number;
    tutorials: number;
    daysCovered: string[];
    detectedBranch?: string;
  };
  warnings?: string[];
}

const DAY_MAP: Record<string, number> = {
  sunday: 0,
  sun: 0,
  '0': 0,
  monday: 1,
  mon: 1,
  '1': 1,
  tuesday: 2,
  tue: 2,
  tues: 2,
  '2': 2,
  wednesday: 3,
  wed: 3,
  wednes: 3,
  '3': 3,
  thursday: 4,
  thu: 4,
  thur: 4,
  thurs: 4,
  '4': 4,
  friday: 5,
  fri: 5,
  '5': 5,
  saturday: 6,
  sat: 6,
  '6': 6,
  '7': 0, // In some systems 7 is Sunday
};

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Normalizes time string into HH:MM (24-hour format)
 */
export function normalizeTime(timeStr: string, defaultTime = '09:00'): string {
  if (!timeStr) return defaultTime;
  const clean = timeStr.trim().replace(/^["']|["']$/g, '');
  if (!clean) return defaultTime;

  const lower = clean.toLowerCase();
  const isPM = lower.includes('pm') || lower.includes('p.m');
  const isAM = lower.includes('am') || lower.includes('a.m');

  // Extract numbers
  const match = clean.match(/(\d{1,2})[:.]?(\d{0,2})/);
  if (!match) return defaultTime;

  let hours = parseInt(match[1], 10);
  let minutes = match[2] ? parseInt(match[2], 10) : 0;

  if (isNaN(hours)) hours = 9;
  if (isNaN(minutes)) minutes = 0;

  if (isPM && hours < 12) hours += 12;
  if (isAM && hours === 12) hours = 0;

  hours = Math.min(23, Math.max(0, hours));
  minutes = Math.min(59, Math.max(0, minutes));

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Parses time range like "09:00 - 10:00", "9:00 AM to 10:30 AM", "09:00-10:00", "14:00 to 16:30"
 */
export function parseTimeRange(timeRangeStr: string): { startTime: string; endTime: string } {
  const clean = timeRangeStr.trim().replace(/^["']|["']$/g, '');
  const parts = clean.split(/[-–—]|(?:\s+to\s+)|(?:\s+till\s+)|(?:\s+until\s+)/i);

  if (parts.length >= 2) {
    const startTime = normalizeTime(parts[0], '09:00');
    let endTime = normalizeTime(parts[1], '10:00');

    // If start >= end (e.g. 09:00 to 10:00 was parsed as 09:00 to 01:00 PM without PM tag), adjust
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    if (eh < sh || (eh === sh && em <= sm)) {
      if (eh < 12) {
        endTime = `${String(eh + 12).padStart(2, '0')}:${String(em).padStart(2, '0')}`;
      } else {
        // Add 1 hour default
        const endHour = Math.min(23, sh + 1);
        endTime = `${String(endHour).padStart(2, '0')}:${String(sm).padStart(2, '0')}`;
      }
    }

    return { startTime, endTime };
  }

  const singleTime = normalizeTime(clean, '09:00');
  const [sh, sm] = singleTime.split(':').map(Number);
  const endHour = Math.min(23, sh + 1);
  return {
    startTime: singleTime,
    endTime: `${String(endHour).padStart(2, '0')}:${String(sm).padStart(2, '0')}`,
  };
}

/**
 * Helper to split CSV line safely taking quotes into account (RFC-4180 compliant)
 */
function splitCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' || char === "'") {
      if (inQuotes && line[i + 1] === char) {
        current += char;
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim().replace(/^["']|["']$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim().replace(/^["']|["']$/g, ''));
  return result;
}

/**
 * Classifies class format (lecture, lab, or tutorial) from keywords
 */
export function detectClassType(str: string): ClassType {
  const lower = str.toLowerCase();
  if (lower.includes('lab') || lower.includes('practic') || lower.includes('workshop') || lower.includes('hands-on')) {
    return 'lab';
  }
  if (lower.includes('tut') || lower.includes('discuss') || lower.includes('problem') || lower.includes('doubt')) {
    return 'tutorial';
  }
  return 'lecture';
}

/**
 * Extracts course code from subject or string (e.g. "CS201", "EC305", "ME301", "MA205")
 */
function extractCourseCode(text: string): { code: string; subject: string } {
  if (!text) return { code: 'CS-GEN', subject: 'Untitled Course' };

  // Match codes like CS201, CS-201, CS 201, CSE301, EC305, etc.
  const codeMatch = text.match(/\b([A-Z]{2,4}\s*[-]?\s*\d{3}[A-Z]?)\b/i);
  if (codeMatch) {
    const code = codeMatch[1].replace(/\s+/g, '').toUpperCase();
    const subject = text
      .replace(codeMatch[0], '')
      .replace(/[\(\)\[\]\-–—:]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return { code, subject: subject || code };
  }

  return { code: 'CS-GEN', subject: text.trim() };
}

/**
 * Parses raw JSON timetable string into CollegeClass objects
 */
export function parseJSONTimetable(jsonText: string, fileName = 'timetable.json'): TimetableParseResult {
  try {
    const parsed = JSON.parse(jsonText);
    
    // Support direct array, or wrapped objects: { classes: [] }, { timetable: [] }, { schedule: [] }, { slots: [] }
    let rawList: any[] = [];
    if (Array.isArray(parsed)) {
      rawList = parsed;
    } else if (parsed && typeof parsed === 'object') {
      if (Array.isArray(parsed.classes)) rawList = parsed.classes;
      else if (Array.isArray(parsed.timetable)) rawList = parsed.timetable;
      else if (Array.isArray(parsed.schedule)) rawList = parsed.schedule;
      else if (Array.isArray(parsed.slots)) rawList = parsed.slots;
      else if (Array.isArray(parsed.data)) rawList = parsed.data;
    }

    if (rawList.length === 0) {
      return {
        success: false,
        sourceFileName: fileName,
        classes: [],
        summary: { totalClasses: 0, lectures: 0, labs: 0, tutorials: 0, daysCovered: [] },
        warnings: ['No class objects found in JSON structure.'],
      };
    }

    const classes: CollegeClass[] = rawList.map((item: any, idx: number) => {
      // Map day of week
      let dayOfWeek = 1;
      if (typeof item.dayOfWeek === 'number' && item.dayOfWeek >= 0 && item.dayOfWeek <= 6) {
        dayOfWeek = item.dayOfWeek;
      } else if (typeof item.day === 'number' && item.day >= 0 && item.day <= 6) {
        dayOfWeek = item.day;
      } else {
        const rawDayStr = String(item.day || item.weekday || item.day_of_week || item.dayName || '').toLowerCase().trim();
        if (DAY_MAP[rawDayStr] !== undefined) {
          dayOfWeek = DAY_MAP[rawDayStr];
        }
      }

      // Time parsing
      let startTime = '09:00';
      let endTime = '10:00';

      if (item.startTime && item.endTime) {
        startTime = normalizeTime(item.startTime, '09:00');
        endTime = normalizeTime(item.endTime, '10:00');
      } else if (item.time || item.timing || item.slot) {
        const parsedTimes = parseTimeRange(item.time || item.timing || item.slot);
        startTime = parsedTimes.startTime;
        endTime = parsedTimes.endTime;
      }

      // Subject and code
      let rawSubject = item.subject || item.courseName || item.course || item.title || item.name || `Class ${idx + 1}`;
      let rawCode = item.code || item.courseCode || item.subjectCode || '';
      
      if (!rawCode) {
        const extracted = extractCourseCode(rawSubject);
        rawCode = extracted.code;
        if (extracted.subject && extracted.subject !== extracted.code) {
          rawSubject = extracted.subject;
        }
      }

      const rawRoom = item.room || item.classroom || item.venue || item.hall || item.location || 'Hall CS-204';
      const rawFaculty = item.faculty || item.instructor || item.professor || item.prof || item.teacher || 'Faculty Staff';

      const type = detectClassType(item.type || item.classType || item.format || rawSubject);

      return {
        id: item.id || `cls-json-${Date.now()}-${idx}`,
        subject: String(rawSubject).trim(),
        code: String(rawCode).trim() || 'CS-GEN',
        dayOfWeek,
        startTime,
        endTime,
        room: String(rawRoom).trim(),
        faculty: String(rawFaculty).trim(),
        type,
        color: item.color || '#ea580c',
      };
    });

    return createParseResult(classes, fileName, 'Custom JSON Upload');
  } catch (err: any) {
    return {
      success: false,
      sourceFileName: fileName,
      classes: [],
      summary: { totalClasses: 0, lectures: 0, labs: 0, tutorials: 0, daysCovered: [] },
      warnings: [`JSON parsing error: ${err.message}`],
    };
  }
}

/**
 * Checks if a CSV is a 2D Grid / Matrix Timetable
 * (e.g. Header has days: Time, Mon, Tue, Wed, Thu, Fri, Sat)
 */
function parseGridMatrixCSV(lines: string[], delimiter: string, fileName: string): CollegeClass[] {
  const headerCols = splitCSVLine(lines[0], delimiter).map((h) => h.toLowerCase());
  
  // Find which columns correspond to days
  const dayColMap: Array<{ colIdx: number; dayNum: number; dayName: string }> = [];
  
  headerCols.forEach((col, idx) => {
    const cleanCol = col.replace(/[^a-z0-9]/g, '');
    if (DAY_MAP[cleanCol] !== undefined) {
      dayColMap.push({ colIdx: idx, dayNum: DAY_MAP[cleanCol], dayName: DAY_NAMES[DAY_MAP[cleanCol]] });
    }
  });

  if (dayColMap.length < 2) return [];

  const timeColIdx = headerCols.findIndex(
    (h) => h.includes('time') || h.includes('slot') || h.includes('hour') || h.includes('period')
  );

  const classes: CollegeClass[] = [];

  for (let r = 1; r < lines.length; r++) {
    const row = splitCSVLine(lines[r], delimiter);
    if (row.length < 2) continue;

    const timeRaw = timeColIdx !== -1 && row[timeColIdx] ? row[timeColIdx] : row[0];
    const { startTime, endTime } = parseTimeRange(timeRaw);

    dayColMap.forEach(({ colIdx, dayNum }) => {
      const cell = row[colIdx];
      if (!cell || cell === '-' || cell === '—' || cell === 'N/A' || cell.toLowerCase() === 'free' || cell.toLowerCase() === 'recess' || cell.toLowerCase() === 'lunch') {
        return;
      }

      // Cell contains class info, e.g. "CS201 Data Structures (Hall 204) Prof Venkatesh [Lecture]"
      const extracted = extractCourseCode(cell);
      let subject = extracted.subject || cell;
      let room = 'Hall CS-204';
      let faculty = 'Faculty Dept';

      // Look for room patterns like (Hall 101), Room 204, Lab 1
      const roomMatch = cell.match(/(?:room|hall|lab|center|venue)\s*[-:]?\s*([A-Z0-9\-]+)/i) ||
                         cell.match(/\(([^)]*(?:hall|room|lab|center)[^)]*)\)/i);
      if (roomMatch) {
        room = roomMatch[1] || roomMatch[0];
        subject = subject.replace(roomMatch[0], '').trim();
      }

      // Look for faculty patterns like Prof. X, Dr. Y
      const facultyMatch = cell.match(/(?:dr\.|prof\.|mr\.|ms\.|mrs\.)\s+[A-Za-z\s\.]+/i);
      if (facultyMatch) {
        faculty = facultyMatch[0].trim();
        subject = subject.replace(facultyMatch[0], '').trim();
      }

      const type = detectClassType(cell);

      classes.push({
        id: `cls-grid-${Date.now()}-${classes.length + 1}`,
        subject: subject.replace(/[\(\)\[\]]/g, ' ').replace(/\s+/g, ' ').trim() || 'Course Session',
        code: extracted.code || 'CS-GEN',
        dayOfWeek: dayNum,
        startTime,
        endTime,
        room,
        faculty,
        type,
        color: '#ea580c',
      });
    });
  }

  return classes;
}

/**
 * Parses CSV/TSV timetable text (standard rows or matrix format)
 */
export function parseCSVTimetable(csvText: string, fileName = 'timetable.csv'): TimetableParseResult {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    return {
      success: false,
      sourceFileName: fileName,
      classes: [],
      summary: { totalClasses: 0, lectures: 0, labs: 0, tutorials: 0, daysCovered: [] },
      warnings: ['CSV file is empty or missing headers.'],
    };
  }

  const delimiter = lines[0].includes('\t') ? '\t' : lines[0].includes(';') ? ';' : ',';
  
  // First try grid / matrix parse
  const gridClasses = parseGridMatrixCSV(lines, delimiter, fileName);
  if (gridClasses.length > 0) {
    return createParseResult(gridClasses, fileName, 'Grid Timetable CSV');
  }

  // Standard Linear CSV format
  const rawHeaders = splitCSVLine(lines[0], delimiter);
  const headers = rawHeaders.map((h) => h.trim().toLowerCase());

  const dayIdx = headers.findIndex((h) => h.includes('day') || h.includes('weekday'));
  const startIdx = headers.findIndex((h) => h.includes('start') || h.includes('from') || h.includes('begin'));
  const endIdx = headers.findIndex((h) => h.includes('end') || h.includes('stop') || h.includes('to') || h.includes('until'));
  const timeCombinedIdx = headers.findIndex(
    (h) => h === 'time' || h === 'timing' || h === 'timings' || h === 'slot' || h === 'hours' || h === 'period'
  );
  const subjectIdx = headers.findIndex(
    (h) => h.includes('subject') || h.includes('course') || h.includes('title') || h.includes('name') || h.includes('module') || h.includes('paper')
  );
  const codeIdx = headers.findIndex((h) => h.includes('code') || h.includes('crn') || h.includes('id'));
  const roomIdx = headers.findIndex((h) => h.includes('room') || h.includes('hall') || h.includes('venue') || h.includes('location') || h.includes('building'));
  const facultyIdx = headers.findIndex(
    (h) => h.includes('faculty') || h.includes('prof') || h.includes('teacher') || h.includes('instructor') || h.includes('staff') || h.includes('lecturer')
  );
  const typeIdx = headers.findIndex((h) => h.includes('type') || h.includes('kind') || h.includes('category') || h.includes('format') || h.includes('mode'));

  const classes: CollegeClass[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = splitCSVLine(lines[i], delimiter);
    if (cols.length < 2 || cols.every((c) => !c.trim())) continue;

    // Day resolution
    let dayOfWeek = 1; // Default Monday
    if (dayIdx !== -1 && cols[dayIdx]) {
      const cleanDay = cols[dayIdx].toLowerCase().replace(/[^a-z0-9]/g, '');
      if (DAY_MAP[cleanDay] !== undefined) {
        dayOfWeek = DAY_MAP[cleanDay];
      }
    }

    // Time resolution
    let startTime = '09:00';
    let endTime = '10:00';

    if (startIdx !== -1 && endIdx !== -1 && cols[startIdx] && cols[endIdx]) {
      startTime = normalizeTime(cols[startIdx], '09:00');
      endTime = normalizeTime(cols[endIdx], '10:00');
    } else if (timeCombinedIdx !== -1 && cols[timeCombinedIdx]) {
      const parsedRange = parseTimeRange(cols[timeCombinedIdx]);
      startTime = parsedRange.startTime;
      endTime = parsedRange.endTime;
    } else if (startIdx !== -1 && cols[startIdx]) {
      const parsedRange = parseTimeRange(cols[startIdx]);
      startTime = parsedRange.startTime;
      endTime = parsedRange.endTime;
    }

    // Subject & Code resolution
    let subject = subjectIdx !== -1 && cols[subjectIdx] ? cols[subjectIdx].trim() : `Course ${i}`;
    let code = codeIdx !== -1 && cols[codeIdx] ? cols[codeIdx].trim() : '';

    if (!code) {
      const extracted = extractCourseCode(subject);
      code = extracted.code;
      if (extracted.subject && extracted.subject !== extracted.code) {
        subject = extracted.subject;
      }
    }

    // Room resolution
    const room = roomIdx !== -1 && cols[roomIdx] ? cols[roomIdx].trim() : 'Hall CS-204';

    // Faculty resolution
    const faculty = facultyIdx !== -1 && cols[facultyIdx] ? cols[facultyIdx].trim() : 'Faculty Dept';

    // Type resolution
    const rawType = typeIdx !== -1 && cols[typeIdx] ? cols[typeIdx] : subject;
    const type = detectClassType(rawType);

    classes.push({
      id: `cls-csv-${Date.now()}-${i}`,
      subject,
      code: code || 'CS-GEN',
      dayOfWeek,
      startTime,
      endTime,
      room: room || 'Hall CS-204',
      faculty: faculty || 'Faculty Dept',
      type,
      color: '#ea580c',
    });
  }

  return createParseResult(classes, fileName, 'CSV Upload');
}

/**
 * Smart unstructured line-by-line parser for text files or freeform schedule pastes
 */
export function parseUnstructuredTextTimetable(text: string, fileName = 'timetable.txt'): TimetableParseResult {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const classes: CollegeClass[] = [];
  let currentDay = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Check if line is just a day header like "Monday:" or "=== TUESDAY ==="
    const cleanDayHeader = line.toLowerCase().replace(/[^a-z]/g, '');
    if (DAY_MAP[cleanDayHeader] !== undefined && line.length < 20) {
      currentDay = DAY_MAP[cleanDayHeader];
      continue;
    }

    // Look for day inside line
    const dayMatch = line.match(/\b(monday|mon|tuesday|tue|tues|wednesday|wed|thursday|thu|thur|thurs|friday|fri|saturday|sat|sunday|sun)\b/i);
    let rowDay = currentDay;
    if (dayMatch) {
      const dKey = dayMatch[1].toLowerCase();
      if (DAY_MAP[dKey] !== undefined) {
        rowDay = DAY_MAP[dKey];
      }
    }

    // Look for time pattern
    const timeMatch = line.match(/(\d{1,2}[:.]?\d{0,2}\s*(?:am|pm)?\s*(?:-|–|—|to)\s*\d{1,2}[:.]?\d{0,2}\s*(?:am|pm)?)/i);
    if (!timeMatch) continue;

    const { startTime, endTime } = parseTimeRange(timeMatch[1]);
    let remaining = line
      .replace(timeMatch[0], '')
      .replace(dayMatch ? dayMatch[0] : '', '')
      .replace(/[\:\-\|\—]/g, ' ')
      .trim();

    const extracted = extractCourseCode(remaining);
    const type = detectClassType(line);

    // Extract room
    let room = 'Hall CS-204';
    const roomMatch = remaining.match(/(?:room|hall|lab|center|venue)\s*[-:]?\s*([A-Z0-9\-]+)/i);
    if (roomMatch) {
      room = roomMatch[0];
      remaining = remaining.replace(roomMatch[0], '').trim();
    }

    // Extract faculty
    let faculty = 'Faculty Dept';
    const facultyMatch = remaining.match(/(?:dr\.|prof\.|mr\.|ms\.)\s+[A-Za-z\s\.]+/i);
    if (facultyMatch) {
      faculty = facultyMatch[0].trim();
      remaining = remaining.replace(facultyMatch[0], '').trim();
    }

    classes.push({
      id: `cls-txt-${Date.now()}-${classes.length + 1}`,
      subject: extracted.subject || remaining || `Class ${classes.length + 1}`,
      code: extracted.code || 'CS-GEN',
      dayOfWeek: rowDay,
      startTime,
      endTime,
      room,
      faculty,
      type,
      color: '#ea580c',
    });
  }

  if (classes.length > 0) {
    return createParseResult(classes, fileName, 'Unstructured Text Schedule');
  }

  return {
    success: false,
    sourceFileName: fileName,
    classes: [],
    summary: { totalClasses: 0, lectures: 0, labs: 0, tutorials: 0, daysCovered: [] },
    warnings: ['Could not extract structured schedule from text.'],
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
 * Sends uploaded timetable document (PDF, PNG, JPG, CSV, text) to server-side Gemini parser
 */
async function parseTimetableWithAI(
  file: File,
  fileBase64?: string,
  fileText?: string,
  branchHint?: string
): Promise<TimetableParseResult | null> {
  try {
    const payload: {
      fileName: string;
      mimeType: string;
      fileBase64?: string;
      fileText?: string;
      branchHint?: string;
    } = {
      fileName: file.name,
      mimeType: file.type || 'application/octet-stream',
      branchHint,
    };

    if (fileBase64) {
      payload.fileBase64 = fileBase64;
    }
    if (fileText) {
      payload.fileText = fileText;
    }

    const res = await fetch('/api/parse-timetable', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.warn('Server AI timetable parse returned non-OK status:', res.status);
      return null;
    }

    const data = await res.json();
    if (data.success && Array.isArray(data.classes) && data.classes.length > 0) {
      return data as TimetableParseResult;
    }
  } catch (err) {
    console.warn('AI timetable parsing request failed, falling back to local parser:', err);
  }
  return null;
}

/**
 * Reads any uploaded File (PDF, image, spreadsheet, JSON, CSV, text) and dynamically parses it
 */
export async function parseUploadedTimetableFile(
  file: File,
  branchHint?: string
): Promise<TimetableParseResult> {
  const fileName = file.name;
  const lowerName = fileName.toLowerCase();

  let fileBase64: string | undefined;
  let fileText: string | undefined;

  // Read base64 for binary files (PDFs, images) or all files
  try {
    fileBase64 = await fileToBase64(file);
  } catch (e) {
    console.warn('Could not read file as base64:', e);
  }

  // If it's a text-like format, also read string
  if (
    lowerName.endsWith('.json') ||
    lowerName.endsWith('.csv') ||
    lowerName.endsWith('.tsv') ||
    lowerName.endsWith('.txt') ||
    lowerName.endsWith('.dat') ||
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
  const aiResult = await parseTimetableWithAI(file, fileBase64, fileText, branchHint);
  if (aiResult && aiResult.success && aiResult.classes.length > 0) {
    return aiResult;
  }

  // 2. Client-side parsing fallback for text/CSV/JSON formats
  if (fileText) {
    const trimmed = fileText.trim();

    // 2a. JSON check
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      const jsonRes = parseJSONTimetable(trimmed, fileName);
      if (jsonRes.success && jsonRes.classes.length > 0) {
        return jsonRes;
      }
    }

    // 2b. CSV / TSV check
    if (trimmed.includes(',') || trimmed.includes('\t') || trimmed.includes(';')) {
      const csvRes = parseCSVTimetable(trimmed, fileName);
      if (csvRes.success && csvRes.classes.length > 0) {
        return csvRes;
      }
    }

    // 2c. Unstructured text lines
    const textRes = parseUnstructuredTextTimetable(trimmed, fileName);
    if (textRes.success && textRes.classes.length > 0) {
      return textRes;
    }
  }

  // If the file could not be parsed
  return {
    success: false,
    sourceFileName: fileName,
    classes: [],
    summary: { totalClasses: 0, lectures: 0, labs: 0, tutorials: 0, daysCovered: [] },
    warnings: [
      `Could not extract timetable classes from "${fileName}". Please ensure the file contains scheduled subjects, days, and time slots.`,
    ],
  };
}

function createParseResult(
  classes: CollegeClass[],
  fileName: string,
  detectedBranch?: string
): TimetableParseResult {
  const daysSet = new Set<string>();
  let lectures = 0;
  let labs = 0;
  let tutorials = 0;

  classes.forEach((c) => {
    daysSet.add(DAY_NAMES[c.dayOfWeek] || `Day ${c.dayOfWeek}`);
    if (c.type === 'lab') labs++;
    else if (c.type === 'tutorial') tutorials++;
    else lectures++;
  });

  return {
    success: true,
    sourceFileName: fileName,
    classes,
    summary: {
      totalClasses: classes.length,
      lectures,
      labs,
      tutorials,
      daysCovered: Array.from(daysSet),
      detectedBranch,
    },
  };
}

/**
 * Export active classes to standard CSV format
 */
export function exportClassesToCSV(classes: CollegeClass[]): string {
  const headers = ['Day', 'Start Time', 'End Time', 'Subject', 'Code', 'Room', 'Faculty', 'Type'];
  const rows = classes.map((c) => [
    DAY_NAMES[c.dayOfWeek] || `Day ${c.dayOfWeek}`,
    c.startTime,
    c.endTime,
    `"${(c.subject || '').replace(/"/g, '""')}"`,
    c.code || '',
    `"${(c.room || '').replace(/"/g, '""')}"`,
    `"${(c.faculty || '').replace(/"/g, '""')}"`,
    c.type || 'lecture',
  ]);
  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}
