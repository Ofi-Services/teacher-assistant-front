import { baseApi } from "@/core/api/baseApi"

const wait = (ms = 220) => new Promise((resolve) => setTimeout(resolve, ms))
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T

// Types
export interface TeamMember {
  id: number
  name: string
  email: string
  role: string
  region: string
  title: string
  completion_percentage: number
  completed_courses: number
  overdue_courses: number
  active_courses: number
  status: "excellent" | "on_track" | "at_risk"
  lastActivity: string
}

export interface TeamReport {
  id: string
  title: string
  type: "weekly" | "monthly" | "quarterly"
  generatedAt: string
  summary: string
  metrics: {
    totalProgress: number
    coursesCompleted: number
    averageScore: number
  }
}

export interface Certificate {
  id: string
  userId: string
  userName: string
  courseId: string
  courseName: string
  issuedAt: string
  certificateUrl: string
}

export interface TrainingTrackCourse {
  id: number
  title: string
  has_submission?: boolean
  completed?: boolean
  submission_link?: string
}

export interface TrainingTrack {
  id: number
  title: string
  platform: string
  due_date: string
  category: string | null
  total_courses: number
  courses?: TrainingTrackCourse[]
  progress_percentage: number
  completed_courses: number
  is_completed: boolean
  completion_date: string | null
  is_overdue: boolean
}

export interface TrainingTrackDetail {
  training_track: {
    id: number
    title: string
    platform: string
    due_date: string
    category: string | null
    total_courses: number
  }
  courses: TrainingTrackCourse[]
  assignment: {
    progress_percentage: number
    completed_courses: number
    is_completed: boolean
    completion_date: string | null
  }
}

const mockTeamMembers: TeamMember[] = [
  {
    id: 101,
    name: "Ana García",
    email: "ana.garcia@ofi.mock",
    role: "Consultant",
    region: "LATAM",
    title: "Senior Consultant",
    completion_percentage: 88,
    completed_courses: 7,
    overdue_courses: 0,
    active_courses: 2,
    status: "excellent",
    lastActivity: "2026-02-16",
  },
  {
    id: 102,
    name: "Pedro Sánchez",
    email: "pedro.sanchez@ofi.mock",
    role: "Consultant",
    region: "EU",
    title: "Consultant",
    completion_percentage: 63,
    completed_courses: 4,
    overdue_courses: 1,
    active_courses: 3,
    status: "on_track",
    lastActivity: "2026-02-14",
  },
  {
    id: 103,
    name: "Lucía Torres",
    email: "lucia.torres@ofi.mock",
    role: "Analyst",
    region: "US",
    title: "Business Analyst",
    completion_percentage: 42,
    completed_courses: 2,
    overdue_courses: 2,
    active_courses: 3,
    status: "at_risk",
    lastActivity: "2026-02-11",
  },
]

const mockTracksByUser: Record<number, TrainingTrack[]> = {
  101: [
    {
      id: 1001,
      title: "Strategic Consulting Foundations",
      platform: "Udemy",
      due_date: "2026-03-10",
      category: "Consulting",
      total_courses: 4,
      progress_percentage: 75,
      completed_courses: 3,
      is_completed: false,
      completion_date: null,
      is_overdue: false,
    },
    {
      id: 1002,
      title: "Agile Project Delivery",
      platform: "LinkedIn Learning",
      due_date: "2026-02-28",
      category: "Project Management",
      total_courses: 3,
      progress_percentage: 100,
      completed_courses: 3,
      is_completed: true,
      completion_date: "2026-02-08",
      is_overdue: false,
    },
  ],
  102: [
    {
      id: 2001,
      title: "Data Analysis with Python",
      platform: "Coursera",
      due_date: "2026-02-20",
      category: "Data",
      total_courses: 5,
      progress_percentage: 40,
      completed_courses: 2,
      is_completed: false,
      completion_date: null,
      is_overdue: true,
    },
  ],
  103: [
    {
      id: 3001,
      title: "Client Communication Mastery",
      platform: "Udemy",
      due_date: "2026-03-05",
      category: "Communication",
      total_courses: 4,
      progress_percentage: 25,
      completed_courses: 1,
      is_completed: false,
      completion_date: null,
      is_overdue: false,
    },
  ],
}

const mockTrackDetails: Record<string, TrainingTrackDetail> = {
  "101-1001": {
    training_track: {
      id: 1001,
      title: "Strategic Consulting Foundations",
      platform: "Udemy",
      due_date: "2026-03-10",
      category: "Consulting",
      total_courses: 4,
    },
    courses: [
      { id: 1, title: "Consulting Mindset", has_submission: true, completed: true, submission_link: "mock://submission/1" },
      { id: 2, title: "Problem Structuring", has_submission: true, completed: true, submission_link: "mock://submission/2" },
      { id: 3, title: "Client Interviews", has_submission: true, completed: true, submission_link: "mock://submission/3" },
      { id: 4, title: "Recommendation Deck", has_submission: false, completed: false },
    ],
    assignment: {
      progress_percentage: 75,
      completed_courses: 3,
      is_completed: false,
      completion_date: null,
    },
  },
  "101-1002": {
    training_track: {
      id: 1002,
      title: "Agile Project Delivery",
      platform: "LinkedIn Learning",
      due_date: "2026-02-28",
      category: "Project Management",
      total_courses: 3,
    },
    courses: [
      { id: 1, title: "Agile Principles", has_submission: true, completed: true, submission_link: "mock://submission/11" },
      { id: 2, title: "Sprint Planning", has_submission: true, completed: true, submission_link: "mock://submission/12" },
      { id: 3, title: "Retrospectives", has_submission: true, completed: true, submission_link: "mock://submission/13" },
    ],
    assignment: {
      progress_percentage: 100,
      completed_courses: 3,
      is_completed: true,
      completion_date: "2026-02-08",
    },
  },
  "102-2001": {
    training_track: {
      id: 2001,
      title: "Data Analysis with Python",
      platform: "Coursera",
      due_date: "2026-02-20",
      category: "Data",
      total_courses: 5,
    },
    courses: [
      { id: 1, title: "Pandas Basics", has_submission: true, completed: true, submission_link: "mock://submission/21" },
      { id: 2, title: "Data Cleaning", has_submission: true, completed: true, submission_link: "mock://submission/22" },
      { id: 3, title: "Visualization", has_submission: false, completed: false },
      { id: 4, title: "Statistics", has_submission: false, completed: false },
      { id: 5, title: "Business Insights", has_submission: false, completed: false },
    ],
    assignment: {
      progress_percentage: 40,
      completed_courses: 2,
      is_completed: false,
      completion_date: null,
    },
  },
  "103-3001": {
    training_track: {
      id: 3001,
      title: "Client Communication Mastery",
      platform: "Udemy",
      due_date: "2026-03-05",
      category: "Communication",
      total_courses: 4,
    },
    courses: [
      { id: 1, title: "Stakeholder Mapping", has_submission: true, completed: true, submission_link: "mock://submission/31" },
      { id: 2, title: "Presentation Storyline", has_submission: false, completed: false },
      { id: 3, title: "Difficult Conversations", has_submission: false, completed: false },
      { id: 4, title: "Executive Updates", has_submission: false, completed: false },
    ],
    assignment: {
      progress_percentage: 25,
      completed_courses: 1,
      is_completed: false,
      completion_date: null,
    },
  },
}

// Leader API endpoints
export const leaderApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all team members with comprehensive training statistics
    getTeamMembers: builder.query<TeamMember[], void>({
      queryFn: async () => {
        await wait()
        return { data: clone(mockTeamMembers) }
      },
      providesTags: ["TeamMembers"],
    }),
    
    // Get specific team member details
    getTeamMemberDetails: builder.query<TeamMember, number>({
      queryFn: async (memberId) => {
        await wait(140)
        const member = mockTeamMembers.find((item) => item.id === memberId)
        if (!member) {
          return { error: { status: 404, data: "Member not found" } }
        }
        return { data: clone(member) }
      },
      providesTags: ["TeamMembers"],
    }),
    
    // Get team reports
    getTeamReports: builder.query<TeamReport[], void>({
      queryFn: async () => {
        await wait(180)
        return {
          data: [
            {
              id: "report-weekly-1",
              title: "Weekly Team Learning Overview",
              type: "weekly",
              generatedAt: new Date().toISOString(),
              summary: "Most team members are progressing as expected in assigned tracks.",
              metrics: {
                totalProgress: 64,
                coursesCompleted: 13,
                averageScore: 84,
              },
            },
          ],
        }
      },
    }),
    
    // Get team certificates
    getTeamCertificates: builder.query<Certificate[], void>({
      queryFn: async () => {
        await wait(180)
        return {
          data: [
            {
              id: "cert-1",
              userId: "101",
              userName: "Ana García",
              courseId: "1002",
              courseName: "Agile Project Delivery",
              issuedAt: "2026-02-08",
              certificateUrl: "mock://certificates/cert-1",
            },
          ],
        }
      },
      providesTags: ["Certificates"],
    }),
    
    // Get user training tracks
    getUserTrainingTracks: builder.query<TrainingTrack[], number>({
      queryFn: async (userId) => {
        await wait(180)
        return { data: clone(mockTracksByUser[userId] || []) }
      },
    }),
    
    // Get specific training track detail
    getTrainingTrackDetail: builder.query<
      TrainingTrackDetail,
      { userId: number; trackId: number }
    >({
      queryFn: async ({ userId, trackId }) => {
        await wait(160)
        const detail = mockTrackDetails[`${userId}-${trackId}`]
        if (!detail) {
          return { error: { status: 404, data: "Training track detail not found" } }
        }
        return { data: clone(detail) }
      },
    }),
    
    // Assign course to team member
    assignCourse: builder.mutation<
      void,
      { memberId: number; courseId: string }
    >({
      queryFn: async ({ memberId, courseId }) => {
        await wait(200)
        const member = mockTeamMembers.find((item) => item.id === memberId)

        if (!member) {
          return { error: { status: 404, data: "Member not found" } }
        }

        member.active_courses += 1
        member.lastActivity = new Date().toISOString().split("T")[0]

        const userTracks = mockTracksByUser[memberId] || []
        userTracks.push({
          id: Date.now(),
          title: `Assigned Track ${courseId}`,
          platform: "Internal LMS",
          due_date: "2026-04-15",
          category: "Assigned",
          total_courses: 1,
          courses: [{ id: 1, title: "Assigned Module", completed: false, has_submission: false }],
          progress_percentage: 0,
          completed_courses: 0,
          is_completed: false,
          completion_date: null,
          is_overdue: false,
        })
        mockTracksByUser[memberId] = userTracks

        return { data: undefined }
      },
      invalidatesTags: ["TeamMembers"],
    }),
    
    // Send message to team
    sendTeamMessage: builder.mutation<
      void,
      { subject: string; message: string; recipients: string[] }
    >({
      queryFn: async () => {
        await wait(180)
        return { data: undefined }
      },
    }),
  }),
})

// Export hooks
export const {
  useGetTeamMembersQuery,
  useGetTeamMemberDetailsQuery,
  useGetTeamReportsQuery,
  useGetTeamCertificatesQuery,
  useGetUserTrainingTracksQuery,
  useGetTrainingTrackDetailQuery,
  useAssignCourseMutation,
  useSendTeamMessageMutation,
} = leaderApi