/** Sample data loaded into a brand-new database. Login password for every sample teacher is "teacher123". */

export type SeedTeacher = {
  id: string;
  name: string;
  photo: string;
  qualification: string;
  experience_years: number;
  subjects: string[];
  class_min: number;
  class_max: number;
  area: string;
  city: string;
  teaching_modes: string[];
  fee_min: number;
  fee_max: number;
  languages: string[];
  bio: string;
  achievements: string[];
  slots: [string, string, string][];
  phone: string;
  whatsapp: string;
  email: string;
  status: "approved" | "pending";
  response_time_hours: number;
};

const wk = (days: string[], start: string, end: string): [string, string, string][] =>
  days.map((d) => [d, start, end]);

export const seedTeachers: SeedTeacher[] = [
  {
    id: "priya-sharma", name: "Priya Sharma",
    photo: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=400&auto=format&fit=crop",
    qualification: "M.Sc Mathematics, B.Ed", experience_years: 8,
    subjects: ["Mathematics", "Physics"], class_min: 9, class_max: 12,
    area: "Koramangala", city: "Bengaluru", teaching_modes: ["Home Tuition", "Online"],
    fee_min: 800, fee_max: 1200, languages: ["English", "Hindi"],
    bio: "Board-exam focused maths and physics tutor. I break problems into small steps, give weekly practice tests and track every student's weak topics until they are fixed. Strong in calculus, mechanics and JEE foundation.",
    achievements: ["40+ students scored 95%+ in CBSE boards", "JEE Mains foundation batches since 2019"],
    slots: [...wk(["Mon", "Wed", "Fri"], "17:00", "18:00"), ...wk(["Mon", "Wed", "Fri"], "18:00", "19:00"), ["Sat", "10:00", "11:00"]],
    phone: "+919800000001", whatsapp: "919800000001", email: "priya.sharma@tutorconnect.in",
    status: "approved", response_time_hours: 2,
  },
  {
    id: "rahul-verma", name: "Rahul Verma", photo: "",
    qualification: "B.Tech Computer Science (IIT)", experience_years: 5,
    subjects: ["Computer Science", "Mathematics"], class_min: 8, class_max: 12,
    area: "HSR Layout", city: "Bengaluru", teaching_modes: ["Online"],
    fee_min: 700, fee_max: 1000, languages: ["English", "Hindi"],
    bio: "Software engineer who teaches Python, Java and CS fundamentals with hands-on projects. Good for students who want to understand programming, not memorise it. Also coaches for olympiad-style logic problems.",
    achievements: ["Taught 150+ students programming", "Students placed in national coding olympiads"],
    slots: [...wk(["Tue", "Thu"], "19:00", "20:00"), ...wk(["Sat", "Sun"], "11:00", "12:00")],
    phone: "+919800000002", whatsapp: "919800000002", email: "rahul.verma@tutorconnect.in",
    status: "approved", response_time_hours: 4,
  },
  {
    id: "anjali-nair", name: "Anjali Nair", photo: "",
    qualification: "M.A English Literature, CELTA", experience_years: 10,
    subjects: ["English", "Social Studies"], class_min: 5, class_max: 10,
    area: "Indiranagar", city: "Bengaluru", teaching_modes: ["Home Tuition", "At Tutor's Place"],
    fee_min: 600, fee_max: 900, languages: ["English", "Malayalam", "Hindi"],
    bio: "Patient English teacher focused on grammar, creative writing and spoken confidence. Friendly with shy students and those who struggle with reading comprehension. Regular parent updates every month.",
    achievements: ["Certified CELTA trainer", "Debate club mentor for 6 years"],
    slots: [...wk(["Mon", "Tue", "Thu"], "16:00", "17:00"), ["Sat", "09:00", "10:00"]],
    phone: "+919800000003", whatsapp: "919800000003", email: "anjali.nair@tutorconnect.in",
    status: "approved", response_time_hours: 3,
  },
  {
    id: "vikram-singh", name: "Vikram Singh", photo: "",
    qualification: "M.Sc Chemistry, NET qualified", experience_years: 12,
    subjects: ["Chemistry", "Biology"], class_min: 11, class_max: 12,
    area: "Jayanagar", city: "Bengaluru", teaching_modes: ["At Tutor's Place", "Online"],
    fee_min: 1200, fee_max: 1800, languages: ["English", "Hindi", "Punjabi"],
    bio: "NEET and board chemistry specialist. Organic chemistry reaction mechanisms made simple with charts and regular mock tests. Small batches so every student gets attention.",
    achievements: ["120+ NEET qualifiers", "Author of an organic chemistry workbook"],
    slots: [...wk(["Mon", "Wed", "Fri"], "18:00", "19:30"), ...wk(["Sun"], "09:00", "10:30")],
    phone: "+919800000004", whatsapp: "919800000004", email: "vikram.singh@tutorconnect.in",
    status: "approved", response_time_hours: 6,
  },
  {
    id: "meera-iyer", name: "Meera Iyer", photo: "",
    qualification: "B.Sc Mathematics, B.Ed", experience_years: 6,
    subjects: ["Mathematics", "Science"], class_min: 1, class_max: 8,
    area: "Whitefield", city: "Bengaluru", teaching_modes: ["Home Tuition", "Online"],
    fee_min: 400, fee_max: 700, languages: ["English", "Tamil", "Kannada"],
    bio: "Primary and middle school maths and science through games, worksheets and real-life examples. Builds strong basics and confidence in young learners who find maths scary.",
    achievements: ["Abacus and Vedic maths certified", "School science fair mentor"],
    slots: [...wk(["Mon", "Tue", "Wed", "Thu"], "16:00", "17:00"), ["Sat", "15:00", "16:00"]],
    phone: "+919800000005", whatsapp: "919800000005", email: "meera.iyer@tutorconnect.in",
    status: "approved", response_time_hours: 2,
  },
  {
    id: "arjun-reddy", name: "Arjun Reddy", photo: "",
    qualification: "M.Sc Physics", experience_years: 4,
    subjects: ["Physics", "Mathematics"], class_min: 9, class_max: 12,
    area: "Marathahalli", city: "Bengaluru", teaching_modes: ["Online", "At Tutor's Place"],
    fee_min: 600, fee_max: 900, languages: ["English", "Telugu"],
    bio: "Concept-first physics with simulations and numericals practice. Helps students who understand theory but lose marks in numericals. JEE and KCET preparation.",
    achievements: ["KCET top-1000 rankers mentored"],
    slots: [...wk(["Tue", "Thu", "Sat"], "18:00", "19:00")],
    phone: "+919800000006", whatsapp: "919800000006", email: "arjun.reddy@tutorconnect.in",
    status: "approved", response_time_hours: 5,
  },
  {
    id: "fatima-khan", name: "Fatima Khan", photo: "",
    qualification: "M.A Hindi, B.Ed", experience_years: 9,
    subjects: ["Hindi", "Social Studies"], class_min: 3, class_max: 10,
    area: "BTM Layout", city: "Bengaluru", teaching_modes: ["Home Tuition", "At Tutor's Place"],
    fee_min: 400, fee_max: 650, languages: ["Hindi", "Urdu", "English"],
    bio: "Hindi grammar, essay writing and history/civics made easy with stories and timelines. Great for students new to Hindi as a second language.",
    achievements: ["Hindi second-language specialist", "100% pass record in board Hindi"],
    slots: [...wk(["Mon", "Wed"], "17:00", "18:00"), ...wk(["Sat", "Sun"], "10:00", "11:00")],
    phone: "+919800000007", whatsapp: "919800000007", email: "fatima.khan@tutorconnect.in",
    status: "approved", response_time_hours: 8,
  },
  {
    id: "karthik-rao", name: "Karthik Rao", photo: "",
    qualification: "MBA Finance, B.Com", experience_years: 7,
    subjects: ["Accountancy", "Economics", "Business Studies"], class_min: 11, class_max: 12,
    area: "Malleshwaram", city: "Bengaluru", teaching_modes: ["Online", "Home Tuition"],
    fee_min: 900, fee_max: 1300, languages: ["English", "Kannada"],
    bio: "Commerce stream tutor for accountancy, economics and business studies. Practical examples from real companies, plus full board exam answer-writing practice.",
    achievements: ["CA foundation coaching experience", "Commerce toppers in 2023 and 2024"],
    slots: [...wk(["Tue", "Thu"], "17:00", "18:30"), ["Sun", "16:00", "17:30"]],
    phone: "+919800000008", whatsapp: "919800000008", email: "karthik.rao@tutorconnect.in",
    status: "approved", response_time_hours: 3,
  },
  {
    id: "sneha-patel", name: "Sneha Patel", photo: "",
    qualification: "M.Sc Biology, B.Ed", experience_years: 3,
    subjects: ["Biology", "Science"], class_min: 6, class_max: 12,
    area: "Electronic City", city: "Bengaluru", teaching_modes: ["Online"],
    fee_min: 500, fee_max: 800, languages: ["English", "Gujarati", "Hindi"],
    bio: "Biology with diagrams, flashcards and memory techniques. Good for NEET beginners and students who find biology heavy on memorisation.",
    achievements: ["Created a 500-card NEET biology flashcard deck"],
    slots: [...wk(["Mon", "Fri"], "19:00", "20:00"), ["Sat", "17:00", "18:00"]],
    phone: "+919800000009", whatsapp: "919800000009", email: "sneha.patel@tutorconnect.in",
    status: "approved", response_time_hours: 4,
  },
  {
    id: "deepak-joshi", name: "Deepak Joshi", photo: "",
    qualification: "Ph.D Mathematics", experience_years: 15,
    subjects: ["Mathematics"], class_min: 11, class_max: 12,
    area: "Koramangala", city: "Bengaluru", teaching_modes: ["At Tutor's Place", "Online"],
    fee_min: 1500, fee_max: 2200, languages: ["English", "Hindi", "Marathi"],
    bio: "Advanced mathematics for JEE Advanced and olympiads. Rigorous problem solving, proofs and speed techniques for top performers aiming for IITs.",
    achievements: ["Former IIT entrance faculty", "Mentored 30+ JEE Advanced top-500 rankers"],
    slots: [...wk(["Sat", "Sun"], "08:00", "10:00")],
    phone: "+919800000010", whatsapp: "919800000010", email: "deepak.joshi@tutorconnect.in",
    status: "approved", response_time_hours: 12,
  },
  {
    id: "arjun-verma", name: "Arjun Verma",
    photo: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=400&auto=format&fit=crop",
    qualification: "B.Tech CSE, IIT Delhi", experience_years: 5,
    subjects: ["Computer Science", "Coding"], class_min: 6, class_max: 12,
    area: "Andheri West", city: "Mumbai", teaching_modes: ["Online", "At Tutor's Place"],
    fee_min: 1000, fee_max: 1500, languages: ["English", "Hindi"],
    bio: "IIT graduate specializing in programming fundamentals, competitive coding, and computer science concepts for school and early college students.",
    achievements: ["Ex-Software Engineer at a Fortune 500 company", "Mentored 50+ coding olympiad students"],
    slots: [...wk(["Mon", "Wed", "Fri"], "19:00", "20:00"), ["Sat", "10:00", "11:00"]],
    phone: "+919812345678", whatsapp: "919812345678", email: "arjun.verma@tutorconnect.in",
    status: "approved", response_time_hours: 1,
  },
  {
    id: "sneha-iyer", name: "Sneha Iyer",
    photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400&auto=format&fit=crop",
    qualification: "M.A English Literature", experience_years: 10,
    subjects: ["English", "Communication"], class_min: 1, class_max: 10,
    area: "Anna Nagar", city: "Chennai", teaching_modes: ["Home Tuition"],
    fee_min: 600, fee_max: 900, languages: ["English", "Tamil"],
    bio: "Dedicated English language teacher focused on building strong reading, writing and communication skills in young learners.",
    achievements: ["10+ years teaching experience", "Published children's story author"],
    slots: [...wk(["Tue", "Thu"], "16:00", "17:00"), ...wk(["Sat", "Sun"], "10:00", "11:00")],
    phone: "+919845098450", whatsapp: "919845098450", email: "sneha.iyer@tutorconnect.in",
    status: "approved", response_time_hours: 4,
  },
  {
    id: "rahul-mehta", name: "Rahul Mehta",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop",
    qualification: "B.Com, CA (Inter)", experience_years: 6,
    subjects: ["Accountancy", "Commerce", "Economics"], class_min: 11, class_max: 12,
    area: "Sector 15", city: "Gurugram", teaching_modes: ["Home Tuition", "Online", "At Tutor's Place"],
    fee_min: 900, fee_max: 1300, languages: ["English", "Hindi"],
    bio: "Commerce specialist helping students master accounts, economics and business studies with practical, exam-oriented teaching methods.",
    achievements: ["CA Inter qualified", "98% students scored above 90% in Accounts"],
    slots: [...wk(["Mon", "Tue", "Thu", "Fri"], "18:00", "19:00"), ["Sat", "17:00", "18:00"]],
    phone: "+919900112233", whatsapp: "919900112233", email: "rahul.mehta@tutorconnect.in",
    status: "approved", response_time_hours: 3,
  },
  // Pending — shown to the admin for verification
  {
    id: "rohan-mehta", name: "Rohan Mehta", photo: "",
    qualification: "B.Sc Physics", experience_years: 1,
    subjects: ["Physics", "Science"], class_min: 6, class_max: 10,
    area: "Hebbal", city: "Bengaluru", teaching_modes: ["Online"],
    fee_min: 300, fee_max: 500, languages: ["English", "Hindi"],
    bio: "Recent graduate teaching science with experiments you can do at home.",
    achievements: [],
    slots: [...wk(["Tue", "Thu"], "18:00", "19:00")],
    phone: "+919800000011", whatsapp: "919800000011", email: "rohan.mehta@tutorconnect.in",
    status: "pending", response_time_hours: 6,
  },
  {
    id: "lakshmi-menon", name: "Lakshmi Menon", photo: "",
    qualification: "M.A Economics", experience_years: 4,
    subjects: ["Economics", "Social Studies"], class_min: 9, class_max: 12,
    area: "Indiranagar", city: "Bengaluru", teaching_modes: ["Home Tuition"],
    fee_min: 700, fee_max: 1000, languages: ["English", "Malayalam"],
    bio: "Economics and social studies with current-affairs examples and mind maps.",
    achievements: [],
    slots: [...wk(["Mon", "Wed"], "18:00", "19:00")],
    phone: "+919800000012", whatsapp: "919800000012", email: "lakshmi.menon@tutorconnect.in",
    status: "pending", response_time_hours: 10,
  },
];

/** Login password for every sample student/parent is "student123". */
export const seedStudents = [
  { name: "Aarav Gupta", email: "aarav@example.com", role: "student", student_name: "Aarav Gupta", grade: 11,
    subjects: ["Physics", "Mathematics"], area: "Koramangala", city: "Bengaluru", mode: "Home Tuition",
    budget_max: 1200, preferred_days: ["Mon", "Wed", "Fri"], goals: "Preparing for JEE Mains, weak in mechanics numericals" },
  { name: "Sunita Rao", email: "sunita@example.com", role: "parent", student_name: "Ishaan Rao", grade: 4,
    subjects: ["Mathematics"], area: "Whitefield", city: "Bengaluru", mode: "Home Tuition",
    budget_max: 700, preferred_days: ["Tue", "Thu"], goals: "My son is scared of maths and needs patient basics" },
  { name: "Neha Kapoor", email: "neha@example.com", role: "student", student_name: "Neha Kapoor", grade: 12,
    subjects: ["Chemistry", "Biology"], area: "Jayanagar", city: "Bengaluru", mode: "Online",
    budget_max: 1800, preferred_days: ["Sun"], goals: "NEET preparation, organic chemistry is my weak area" },
  { name: "Rohit Das", email: "rohit@example.com", role: "student", student_name: "Rohit Das", grade: 9,
    subjects: ["English"], area: "Indiranagar", city: "Bengaluru", mode: "Home Tuition",
    budget_max: 900, preferred_days: ["Mon", "Tue"], goals: "Improve essay writing and spoken English confidence" },
];

/** [teacherId, index into seedStudents, rating, comment] */
export const seedReviews: [string, number, number, string][] = [
  ["priya-sharma", 0, 5, "Explains every step clearly. My physics marks went from 62 to 88."],
  ["priya-sharma", 2, 5, "Very structured weekly tests, really helped before boards."],
  ["priya-sharma", 3, 4, "Good teacher, sometimes moves a bit fast."],
  ["rahul-verma", 0, 5, "Finally understood recursion. Project-based classes are fun."],
  ["rahul-verma", 3, 4, "Great online sessions, very practical."],
  ["anjali-nair", 3, 5, "My essays improved a lot and I speak more confidently in class."],
  ["anjali-nair", 1, 5, "Very patient and kind with children."],
  ["vikram-singh", 2, 5, "Organic chemistry finally makes sense. Mock tests are excellent."],
  ["vikram-singh", 0, 4, "Strict but very effective."],
  ["meera-iyer", 1, 5, "Ishaan now enjoys maths! Uses games and worksheets."],
  ["arjun-reddy", 0, 4, "Good with numericals, explains with simulations."],
  ["fatima-khan", 3, 4, "Made Hindi grammar easy to understand."],
  ["karthik-rao", 2, 5, "Accountancy concepts with real company examples. Loved it."],
  ["sneha-patel", 2, 4, "Flashcards really help for NEET biology."],
  ["arjun-verma", 3, 5, "Explains coding problems patiently, very practical sessions."],
  ["arjun-verma", 0, 5, "Helped me crack my first olympiad round."],
  ["sneha-iyer", 1, 5, "My child now loves reading. Very caring teacher."],
  ["sneha-iyer", 3, 4, "Good grammar and writing practice."],
  ["rahul-mehta", 2, 5, "Accounts became my strongest subject."],
  ["deepak-joshi", 0, 5, "Tough problems but you learn a lot. Best for JEE Advanced."],
];
