import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Support large document/image uploads (up to 50MB)
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Shared lazy-initialized Gemini AI client
  const getAI = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not configured.');
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  };

  // Helper for resilient Gemini calls with model fallbacks and retry on 503 / high demand spikes
  async function generateWithFallback(
    ai: GoogleGenAI,
    contents: { parts: any[] },
    config?: any
  ) {
    const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite'];
    let lastError: any = null;

    for (const model of models) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents,
            config,
          });
          return response;
        } catch (err: any) {
          lastError = err;
          const errMsg = String(err?.message || err || '');
          const isTransient =
            errMsg.includes('503') ||
            errMsg.includes('UNAVAILABLE') ||
            errMsg.includes('high demand') ||
            errMsg.includes('429') ||
            errMsg.includes('RESOURCE_EXHAUSTED') ||
            errMsg.includes('rate limit');

          if (isTransient && attempt === 0) {
            // Short backoff before retry
            await new Promise((resolve) => setTimeout(resolve, 800));
            continue;
          }
          // On non-transient error (e.g. 404, invalid model, etc.) or second attempt, try the next model candidate
          break;
        }
      }
    }

    throw lastError;
  }

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  /**
   * POST /api/parse-timetable
   * Dynamically parses any uploaded timetable document (PDF, PNG, JPG, CSV, text)
   * Extracts days, time slots, course names, codes, rooms, faculty, and class types.
   */
  app.post('/api/parse-timetable', async (req, res) => {
    try {
      const { fileBase64, mimeType, fileName, fileText, branchHint } = req.body;

      if (!fileBase64 && !fileText) {
        res.status(400).json({
          success: false,
          error: 'No document data provided. Please provide fileBase64 or fileText.',
        });
        return;
      }

      const ai = getAI();

      const parts: any[] = [];

      if (fileBase64 && mimeType) {
        parts.push({
          inlineData: {
            data: fileBase64,
            mimeType: mimeType,
          },
        });
      }

      if (fileText) {
        parts.push({
          text: `Document text content:\n${fileText}`,
        });
      }

      const prompt = `You are a high-precision academic timetable parser. Analyze the uploaded college timetable document (file name: "${fileName || 'timetable'}").
${branchHint ? `Branch/Specialization hint: ${branchHint}` : ''}

CRITICAL PARSING RULES:
1. Examine every table cell, grid box, day row, or time-slot column in the document.
2. Extract all scheduled weekly classes across all active college days.
3. Map days properly:
   - Sunday = 0
   - Monday = 1
   - Tuesday = 2
   - Wednesday = 3
   - Thursday = 4
   - Friday = 5
   - Saturday = 6
4. Normalize start and end times to standard 24-hour HH:mm strings (e.g., "09:00", "10:15", "11:30", "14:00", "16:30").
5. Extract the subject name, course code (e.g. CS201, MA205, EC301), classroom/hall/lab venue, and instructor/faculty name if present.
6. Categorize the class type strictly as: "lecture", "lab", or "tutorial".
7. Extract ONLY genuine classes found in the provided document without fabricating or using hardcoded placeholder data.`;

      parts.push({ text: prompt });

      const response = await generateWithFallback(
        ai,
        { parts },
        {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            description: 'Extracted list of weekly classes',
            items: {
              type: Type.OBJECT,
              properties: {
                subject: {
                  type: Type.STRING,
                  description: 'Course or subject name (e.g. Operating Systems, Data Structures)',
                },
                code: {
                  type: Type.STRING,
                  description: 'Course code (e.g. CS205, CS201, MA205)',
                },
                dayOfWeek: {
                  type: Type.INTEGER,
                  description: 'Day of week: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat',
                },
                startTime: {
                  type: Type.STRING,
                  description: 'Start time in 24-hour HH:mm format (e.g. 09:00)',
                },
                endTime: {
                  type: Type.STRING,
                  description: 'End time in 24-hour HH:mm format (e.g. 10:00)',
                },
                room: {
                  type: Type.STRING,
                  description: 'Room, Hall, Lab, or Workshop venue',
                },
                faculty: {
                  type: Type.STRING,
                  description: 'Faculty or instructor name',
                },
                type: {
                  type: Type.STRING,
                  description: 'lecture, lab, or tutorial',
                },
              },
              required: ['subject', 'dayOfWeek', 'startTime', 'endTime', 'type'],
            },
          },
        }
      );

      const rawJson = response.text?.trim() || '[]';
      const parsedClasses: any[] = JSON.parse(rawJson);

      const colorPalette = [
        '#ea580c', // Orange
        '#2563eb', // Blue
        '#7c3aed', // Purple
        '#059669', // Emerald
        '#d97706', // Amber
        '#db2777', // Pink
        '#0284c7', // Sky
        '#4f46e5', // Indigo
      ];

      const classes = parsedClasses.map((item, idx) => ({
        id: `ai-cls-${Date.now()}-${idx + 1}`,
        subject: item.subject || `Course ${idx + 1}`,
        code: item.code || 'SUBJ',
        dayOfWeek: typeof item.dayOfWeek === 'number' ? Math.max(0, Math.min(6, item.dayOfWeek)) : 1,
        startTime: item.startTime || '09:00',
        endTime: item.endTime || '10:00',
        room: item.room || 'Room TBD',
        faculty: item.faculty || '',
        type: ['lecture', 'lab', 'tutorial'].includes(item.type) ? item.type : 'lecture',
        color: colorPalette[idx % colorPalette.length],
      }));

      const daysSet = new Set<string>();
      const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      let lectures = 0;
      let labs = 0;
      let tutorials = 0;

      classes.forEach((c) => {
        daysSet.add(DAY_NAMES[c.dayOfWeek] || `Day ${c.dayOfWeek}`);
        if (c.type === 'lab') labs++;
        else if (c.type === 'tutorial') tutorials++;
        else lectures++;
      });

      res.json({
        success: true,
        sourceFileName: fileName || 'Uploaded Document',
        classes,
        summary: {
          totalClasses: classes.length,
          lectures,
          labs,
          tutorials,
          daysCovered: Array.from(daysSet),
        },
      });
    } catch (err: any) {
      console.warn('AI timetable parsing encountered an error, falling back:', err.message || err);
      res.json({
        success: false,
        error: err.message || 'Failed to parse timetable document',
        fallback: true,
      });
    }
  });

  /**
   * POST /api/parse-calendar
   * Dynamically parses academic calendar documents (PDF, PNG, JPG, CSV, text)
   * Extracts dates, holidays, internal assessment tests (IATs), end-semester exams,
   * project submission deadlines, fests, and academic milestones.
   */
  app.post('/api/parse-calendar', async (req, res) => {
    try {
      const { fileBase64, mimeType, fileName, fileText } = req.body;

      if (!fileBase64 && !fileText) {
        res.status(400).json({
          success: false,
          error: 'No calendar document provided. Please provide fileBase64 or fileText.',
        });
        return;
      }

      const ai = getAI();

      const parts: any[] = [];

      if (fileBase64 && mimeType) {
        parts.push({
          inlineData: {
            data: fileBase64,
            mimeType: mimeType,
          },
        });
      }

      if (fileText) {
        parts.push({
          text: `Document text content:\n${fileText}`,
        });
      }

      const prompt = `You are a high-precision university academic calendar parser. Analyze the uploaded academic calendar document (file name: "${fileName || 'calendar'}").

CRITICAL EXTRACTION GUIDELINES:
1. Extract all dated academic schedule entries:
   - Official holidays (national holidays, state holidays, religious festivals, semester breaks, vacation periods, reading days).
   - Exams & Assessments: Internal Assessment Tests (IAT 1, IAT 2, IAT 3), Continuous Internal Evaluations (CIE), Mid-Semester examinations, Lab/Practical exams, and End-Semester final theory examinations.
   - Deadlines: Assignment submissions, project proposals, phase reviews, fee payments, course registrations.
   - College Days / Term milestones: Semester commencement, last working day, academic audit, sports fest, technical symposiums.
2. Normalize all dates to standard "YYYY-MM-DD" format. If only day/month is provided, assume year 2026.
3. Categorize the event type strictly as one of:
   - "holiday" (Official holidays, vacations, breaks)
   - "exam" (IATs, Mid-Sem, End-Sem, practicals, quizzes)
   - "deadline" (Assignments, project submissions, registrations)
   - "event" (Fests, hackathons, seminars, workshops)
   - "college_day" (Semester start, last working day, orientation)
4. Extract exact start/end times in 24-hour HH:mm format if specified, or leave empty if full-day.
5. Provide a helpful description or syllabus context if detailed in the document.
6. Extract ONLY real entries from the uploaded document without fabricating.`;

      parts.push({ text: prompt });

      const response = await generateWithFallback(
        ai,
        { parts },
        {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            description: 'Extracted list of academic calendar events and milestones',
            items: {
              type: Type.OBJECT,
              properties: {
                title: {
                  type: Type.STRING,
                  description: 'Event or exam title (e.g. IAT-1: Data Structures, Diwali Holiday)',
                },
                date: {
                  type: Type.STRING,
                  description: 'Date in YYYY-MM-DD format (e.g. 2026-09-28)',
                },
                startTime: {
                  type: Type.STRING,
                  description: 'Optional start time in 24-hour HH:mm format (e.g. 09:30)',
                },
                endTime: {
                  type: Type.STRING,
                  description: 'Optional end time in 24-hour HH:mm format (e.g. 11:30)',
                },
                type: {
                  type: Type.STRING,
                  description: 'holiday, exam, deadline, event, or college_day',
                },
                description: {
                  type: Type.STRING,
                  description: 'Detailed description, syllabus coverage, or notes',
                },
                location: {
                  type: Type.STRING,
                  description: 'Venue, exam hall, or submission portal',
                },
              },
              required: ['title', 'date', 'type'],
            },
          },
        }
      );

      const rawJson = response.text?.trim() || '[]';
      const parsedEvents: any[] = JSON.parse(rawJson);

      const events = parsedEvents.map((item, idx) => ({
        id: `ai-cal-${Date.now()}-${idx + 1}`,
        title: item.title || `Academic Event ${idx + 1}`,
        date: item.date || '2026-09-19',
        startTime: item.startTime || undefined,
        endTime: item.endTime || undefined,
        type: ['holiday', 'exam', 'deadline', 'event', 'college_day'].includes(item.type)
          ? item.type
          : 'event',
        description: item.description || undefined,
        location: item.location || undefined,
      }));

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

      res.json({
        success: true,
        sourceFileName: fileName || 'Uploaded Academic Calendar',
        events,
        summary: {
          totalEvents: events.length,
          exams,
          holidays,
          deadlines,
          events: evCount,
          instructionalDays,
        },
      });
    } catch (err: any) {
      console.warn('AI calendar parsing encountered an error, falling back:', err.message || err);
      res.json({
        success: false,
        error: err.message || 'Failed to parse calendar document',
        fallback: true,
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SemesterFlow server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
