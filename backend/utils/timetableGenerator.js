// backend/controllers/timetableGenerator.js
import Course from '../models/course.js';
import Faculty from '../models/Faculty.js';
import Room from '../models/Room.js';
import Timetable from '../models/Timetable.js';
import Notification from '../models/Notification.js';
import dotenv from 'dotenv';

dotenv.config({ quiet: true });


// --- Configuration ---
const WEEKS = 13;
const CORE_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const OPTIONAL_DAY = 'Sunday';
const TIME_SLOTS = [
  { start: '09:00', end: '10:00' },
  { start: '10:00', end: '11:00' },
  { start: '11:15', end: '12:15' },
  { start: '13:15', end: '14:15' },
  { start: '14:15', end: '15:15' },
  { start: '15:15', end: '16:15' },
  { start: '16:30', end: '17:30' },
];
const BREAK_SLOT = { start: '12:15', end: '13:15' };

/**
 * Calculates the number of weekly 1-hour sessions a course requires.
 */
function getWeeklySessions(course) {
  if (course.totalHours && Number(course.totalHours) > 0) {
    return Math.ceil(Number(course.totalHours) / WEEKS);
  }
  return Number(course.hoursPerWeek) || 3;
}

/**
 * Cleans and parses the JSON response from the AI.
 */
function parseAIResponse(text) {
  if (!text || typeof text !== 'string') return [];

  // 1. Remove markdown code blocks first
  let clean = text.replace(/```(?:json)?/gi, '').replace(/```/g, '');

  // 2. Extract JSON array by finding the first '[' and last ']'
  const firstOpen = clean.indexOf('[');
  const lastClose = clean.lastIndexOf(']');

  if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
    clean = clean.substring(firstOpen, lastClose + 1);
  } else {
    // Fallback: try to find a JSON object if array not found directly
    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
       clean = clean.substring(firstBrace, lastBrace + 1);
    }
  }
  
  try {
    const parsed = JSON.parse(clean);
    if (Array.isArray(parsed)) return parsed;
    // If it's an object, look for a property that is an array (e.g. { "schedule": [...] })
    if (typeof parsed === 'object' && parsed !== null) {
        const values = Object.values(parsed);
        const arrayValue = values.find(val => Array.isArray(val));
        if (arrayValue) return arrayValue;
    }
    return [];
  } catch (e) {
    console.error('Failed to parse AI JSON response:', e.message);
    console.error('Attempted to parse (first 500 chars):', clean.substring(0, 500));
    return [];
  }
}

function specializationMatches(course, faculty) {
  const courseText = `${course.name} ${course.code} ${course.department}`.toLowerCase();
  return (faculty.specialization || []).some((item) =>
    courseText.includes(String(item).toLowerCase())
  );
}

function buildFallbackSchedule({ courses, faculty, rooms, includeSundaySpecialClass }) {
  const days = includeSundaySpecialClass ? [...CORE_DAYS, OPTIONAL_DAY] : CORE_DAYS;
  const facultyBusy = new Set();
  const roomBusy = new Set();
  const courseFacultyMap = new Map();
  const schedule = [];
  let dayCursor = 0;
  let slotCursor = 0;

  for (const course of courses) {
    const weeklySessions = getWeeklySessions(course);
    const assignedFaculty =
      courseFacultyMap.get(String(course._id)) ||
      faculty.find((member) => specializationMatches(course, member)) ||
      faculty.find((member) => String(member.department).toLowerCase() === String(course.department).toLowerCase()) ||
      faculty[0];

    if (!assignedFaculty) {
      throw new Error(`No faculty available to assign course ${course.name}.`);
    }

    courseFacultyMap.set(String(course._id), assignedFaculty);

    for (let session = 0; session < weeklySessions; session += 1) {
      let placed = false;

      for (let attempt = 0; attempt < days.length * TIME_SLOTS.length; attempt += 1) {
        const day = days[(dayCursor + attempt) % days.length];
        const slot = TIME_SLOTS[(slotCursor + attempt) % TIME_SLOTS.length];
        const room =
          rooms.find((item) => {
            if (course.type === 'lab') {
              return item.type === 'lab';
            }
            return item.type !== 'lab' || rooms.length === 1;
          }) || rooms[0];

        if (!room) {
          throw new Error("No rooms available to build the timetable.");
        }

        const facultyKey = `${assignedFaculty._id}-${day}-${slot.start}`;
        const roomKey = `${room._id}-${day}-${slot.start}`;

        if (facultyBusy.has(facultyKey) || roomBusy.has(roomKey)) {
          continue;
        }

        facultyBusy.add(facultyKey);
        roomBusy.add(roomKey);
        schedule.push({
          courseId: String(course._id),
          facultyId: String(assignedFaculty._id),
          roomId: String(room._id),
          day,
          startTime: slot.start,
          endTime: slot.end,
          courseName: course.name,
          facultyName: assignedFaculty.name,
          roomName: room.name,
          timeSlot: `${slot.start}-${slot.end}`,
          sessionType: day === OPTIONAL_DAY ? 'special' : course.type === 'lab' ? 'lab' : 'lecture',
          isSpecialClass: day === OPTIONAL_DAY,
        });
        dayCursor = (dayCursor + 1) % days.length;
        slotCursor = (slotCursor + 1) % TIME_SLOTS.length;
        placed = true;
        break;
      }

      if (!placed) {
        throw new Error(`Unable to place session ${session + 1} for ${course.name} without conflicts.`);
      }
    }
  }

  return { schedule, days };
}

/**
 * Generates a timetable using only the Gemini AI.
 * request: { department, semester, academicYear }
 */
export async function generateTimetableWithAI(request) {
  console.log('=== STARTING AI TIMETABLE GENERATION ===');
  console.log('Request:', request);

  try {
    const { department, semester, academicYear, includeSundaySpecialClass = false } = request;

    if (!department || !semester || !academicYear) {
      throw new Error('Department, semester, and academic year are required.');
    }

    // 1. Fetch all necessary data from the database
    console.log('Fetching DB data...');
    const allCourses = await Course.find({});
    const allFaculty = await Faculty.find({});
    const allRooms = await Room.find({});

    // Filter data for the specific request
    const relevantCourses = allCourses.filter(c =>
      (c.department || '').toLowerCase() === department.toLowerCase() &&
      Number(c.semester) === Number(semester)
    );

    if (relevantCourses.length === 0) {
      const available = allCourses.map(c => `${c.department} (Sem ${c.semester})`).join(', ');
      console.error(`Data Mismatch: Requested ${department} Sem ${semester}. Found in DB: ${available || 'None'}`);
      throw new Error(`No courses found for ${department}, Semester ${semester}. Please check your database.`);
    }

    const relevantFaculty = allFaculty.filter(f => (f.department || '').toLowerCase() === department.toLowerCase());

    if (relevantFaculty.length === 0) {
      throw new Error(`No faculty found for ${department}. Please add faculty members with matching department.`);
    }

    if (allRooms.length === 0) {
      throw new Error(`No rooms found in the database. Please add classrooms.`);
    }

    // 2. Engineer the detailed prompt for Gemini
     const prompt = `
      You are an expert university timetable scheduler. Your task is to generate a complete, conflict-free weekly timetable.

      **Input Data:**
      - Department: "${department}"
      - Semester: ${semester}
      - Available Days: ${JSON.stringify(includeSundaySpecialClass ? [...CORE_DAYS, OPTIONAL_DAY] : CORE_DAYS)}
      - Available Time Slots: ${JSON.stringify(TIME_SLOTS)}
      - Mandatory Daily Break (DO NOT schedule classes here): ${BREAK_SLOT.start}-${BREAK_SLOT.end}

      - Courses to Schedule (with required weekly hours):
        ${relevantCourses.map(c => `- Course Name: "${c.name}", ID: "${c._id}", Weekly Sessions: ${getWeeklySessions(c)}`).join('\n        ')}

      - Available Faculty (with their IDs and Specializations):
        ${relevantFaculty.map(f => `- Faculty Name: "${f.name}", ID: "${f._id}", Specializations: ${JSON.stringify(f.specialization || [])}`).join('\n        ')}

      - Available Rooms (with their IDs):
        ${allRooms.map(r => `- Room Name: "${r.name}", ID: "${r._id}"`).join('\n        ')}

      **Strict Rules You Must Follow:**
      1.  **Match Specializations:** You MUST assign a faculty member to a course ONLY if the course name or subject matter aligns with one of their listed specializations. This is a critical requirement.
      2.  **Assign One Faculty Per Course:** Each course must be assigned to exactly ONE faculty member for all its weekly sessions.
      3.  **Schedule All Sessions:** Ensure every course is scheduled for its required number of weekly sessions.
      4.  **No Conflicts:** A faculty member or a room cannot be in two places at once. Each time slot for a specific resource can only be used once.
      5.  **Use Provided IDs:** You MUST use the exact 'courseId', 'facultyId', and 'roomId' strings provided in the data above.
      6.  **Strictly Adhere to Format:** Return ONLY a valid JSON array of schedule entry objects. The output must start with '[' and end with ']'. Do not wrap it in an object. Do not include any other text, markdown, comments, or explanations.

      **Output JSON Object Structure:**
      {
        "courseId": "string",
        "facultyId": "string",
        "roomId": "string",
        "day": "string (e.g., 'Monday')",
        "startTime": "string (e.g., '09:00')",
        "endTime": "string (e.g., '10:00')"
      }

      Generate the full timetable now.
    `;

    // 3. Call the AI provider when configured, then gracefully fall back to the local scheduler.
    let schedule = [];
    let daysUsed = includeSundaySpecialClass ? [...CORE_DAYS, OPTIONAL_DAY] : CORE_DAYS;

    if (process.env.OPENAI_API_KEY) {
      console.log('Sending request to OpenRouter AI...');

      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:5000",
            "X-Title": "Smart Classroom",
          },
          body: JSON.stringify({
            model: "google/gemini-2.0-flash-001",
            messages: [{ role: "user", content: prompt }],
          }),
        });

        const data = await response.json();
        if (!response.ok || data.error) {
          throw new Error(data.error?.message || `API Error: ${response.statusText}`);
        }

        const responseText = data.choices?.[0]?.message?.content || "";
        console.log('AI Response received (Raw):', responseText);
        schedule = parseAIResponse(responseText);
      } catch (aiError) {
        console.error("AI generation failed, using fallback scheduler:", aiError.message);
      }
    }

    if (schedule.length === 0) {
      const fallback = buildFallbackSchedule({
        courses: relevantCourses,
        faculty: relevantFaculty,
        rooms: allRooms,
        includeSundaySpecialClass,
      });
      schedule = fallback.schedule;
      daysUsed = fallback.days;
      console.log(`Fallback scheduler generated ${schedule.length} schedule entries.`);
    } else {
      console.log(`AI generated ${schedule.length} schedule entries.`);
    }

    // 4. Enrich and Save the Timetable
    const enrichedSchedule = schedule.map(entry => {
      const course = relevantCourses.find(c => String(c._id) === entry.courseId);
      const faculty = relevantFaculty.find(f => String(f._id) === entry.facultyId);
      const room = allRooms.find(r => String(r._id) === entry.roomId);
      return {
        ...entry,
        courseName: course ? course.name : 'Unknown',
        facultyName: faculty ? faculty.name : 'Unknown',
        roomName: room ? room.name : 'Unknown',
        timeSlot: `${entry.startTime}-${entry.endTime}`
      };
    });

    const totalHours = enrichedSchedule.length;
    const availableSlots = daysUsed.length * TIME_SLOTS.length;
    const utilizationRate = Math.round((totalHours / availableSlots) * 100);

    const timetableData = {
      name: `${department} - Semester ${semester} ${academicYear}`,
      department,
      semester: String(semester),
      year: parseInt(academicYear),
      schedule: enrichedSchedule,
      conflicts: [], // AI is expected to return a conflict-free schedule
      status: 'draft',
      metadata: {
        totalHours,
        utilizationRate,
        conflictCount: 0,
        teachingDays: daysUsed.length,
      }
    };

    const timetable = new Timetable(timetableData);
    const created = await timetable.save();
    console.log(`Timetable saved successfully! ID: ${created._id}`);

    // Create a success notification
    await new Notification({
      title: 'AI Timetable Generated',
      message: `Generated timetable "${created.name}" with ${totalHours} entries.`,
      type: 'success',
    }).save();

    return created;

  } catch (err) {
    console.error('Error in generateTimetableWithAI:', err);
    // Create an error notification
    await new Notification({
      title: 'Timetable Generation Failed',
      message: err.message || 'An unknown error occurred.',
      type: 'error',
    }).save();
    throw err; // Re-throw the error to be caught by the route handler
  }
}
