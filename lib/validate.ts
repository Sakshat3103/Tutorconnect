import { bad, str, int, strArr } from "./api";
import { TEACHING_MODES, DAYS } from "./teachers";

export type TeacherInput = ReturnType<typeof parseTeacherInput>;

export function parseTeacherInput(body: Record<string, unknown>) {
  const v = {
    name: str(body.name, 80),
    phone: str(body.phone, 20),
    whatsapp: str(body.whatsapp, 20).replace(/\D/g, ""),
    qualification: str(body.qualification, 150),
    experienceYears: int(body.experienceYears),
    subjects: strArr(body.subjects),
    classMin: int(body.classMin),
    classMax: int(body.classMax),
    area: str(body.area, 60),
    city: str(body.city, 60),
    teachingModes: strArr(body.teachingModes).filter((m) => (TEACHING_MODES as string[]).includes(m)),
    feeMin: int(body.feeMin),
    feeMax: int(body.feeMax),
    languages: strArr(body.languages),
    bio: str(body.bio, 1500),
    achievements: strArr(body.achievements),
    photo: str(body.photo, 400),
    slots: (Array.isArray(body.slots) ? body.slots : [])
      .map((s: Record<string, unknown>) => ({ day: str(s?.day, 3), start: str(s?.start, 5), end: str(s?.end, 5) }))
      .filter((s) => DAYS.includes(s.day) && /^\d\d:\d\d$/.test(s.start) && /^\d\d:\d\d$/.test(s.end) && s.start < s.end)
      .slice(0, 40),
  };
  if (!v.name) bad("Name is required");
  if (!v.qualification) bad("Qualification is required");
  if (!v.subjects.length) bad("Add at least one subject");
  if (!(v.experienceYears >= 0 && v.experienceYears <= 60)) bad("Experience must be between 0 and 60 years");
  if (!(v.classMin >= 1 && v.classMax <= 12 && v.classMin <= v.classMax)) bad("Choose a valid class range (1-12)");
  if (!v.area || !v.city) bad("Area and city are required");
  if (!v.teachingModes.length) bad("Choose at least one teaching mode");
  if (!(v.feeMin > 0 && v.feeMax >= v.feeMin)) bad("Enter a valid fee range");
  return v;
}

