import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react'

// Types
export interface Course {
  id: string
  title: string
  description?: string
  duration?: string
  completed: boolean
  order: number
  link?: string
  due_date: string | null
}

export interface TrainingTrack {
  id: string
  title: string
  description?: string
  enrolled: boolean
  due_date: string | null
  progress_percentage: number
  completed_courses: number
  total_courses: number
  platform?: string
  category?: string
  duration?: string
  thumbnail?: string
  courses?: Course[]
}

export interface UserProgress {
  userId: string
  totalCourses: number
  activeCourses: number
  completedCourses: number
  averageProgress: number
  completedModules: number
  hoursSpent: number
}

export interface Schedule {
  id: string
  title: string
  date: string
  time: string
  duration: string
  type: string
  instructor?: string
  location?: string
}

const wait = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms))
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const mockTracks: TrainingTrack[] = [
  {
    id: 'track-1',
    title: 'Strategic Consulting Foundations',
    description: 'Core consulting toolkit and client communication best practices.',
    enrolled: true,
    due_date: '2026-03-10',
    progress_percentage: 50,
    completed_courses: 2,
    total_courses: 4,
    platform: 'Udemy',
    category: 'Consulting',
    duration: '12 hours',
    thumbnail: '/business-strategy-consulting.png',
    courses: [
      {
        id: '1',
        title: 'Consulting Mindset',
        completed: true,
        order: 1,
        due_date: '2026-02-20',
      },
      {
        id: '2',
        title: 'Problem Structuring',
        completed: true,
        order: 2,
        due_date: '2026-02-24',
      },
      {
        id: '3',
        title: 'Client Interviews',
        completed: false,
        order: 3,
        due_date: '2026-03-01',
      },
      {
        id: '4',
        title: 'Final Recommendation Deck',
        completed: false,
        order: 4,
        due_date: '2026-03-08',
      },
    ],
  },
  {
    id: 'track-2',
    title: 'Data Analysis with Python',
    description: 'Use Python to clean, analyze, and present business data.',
    enrolled: true,
    due_date: '2026-04-02',
    progress_percentage: 33,
    completed_courses: 1,
    total_courses: 3,
    platform: 'Coursera',
    category: 'Data',
    duration: '10 hours',
    thumbnail: '/python-data-analysis-code.jpg',
    courses: [
      {
        id: '1',
        title: 'Pandas Essentials',
        completed: true,
        order: 1,
        due_date: '2026-03-12',
      },
      {
        id: '2',
        title: 'Exploratory Data Analysis',
        completed: false,
        order: 2,
        due_date: '2026-03-20',
      },
      {
        id: '3',
        title: 'Dashboard Storytelling',
        completed: false,
        order: 3,
        due_date: '2026-03-28',
      },
    ],
  },
  {
    id: 'track-3',
    title: 'Agile Project Delivery',
    description: 'Deliver training and consulting projects using Agile workflows.',
    enrolled: true,
    due_date: '2026-03-25',
    progress_percentage: 100,
    completed_courses: 2,
    total_courses: 2,
    platform: 'LinkedIn Learning',
    category: 'Project Management',
    duration: '6 hours',
    thumbnail: '/agile-project-management-scrum.jpg',
    courses: [
      {
        id: '1',
        title: 'Agile Ceremonies',
        completed: true,
        order: 1,
        due_date: '2026-03-05',
      },
      {
        id: '2',
        title: 'Sprint Execution',
        completed: true,
        order: 2,
        due_date: '2026-03-15',
      },
    ],
  },
]

const mockSchedule: Schedule[] = [
  {
    id: 'event-1',
    title: 'Weekly Coaching Session',
    date: '2026-02-25',
    time: '10:00',
    duration: '60 min',
    type: 'coaching',
    instructor: 'Maria Lopez',
    location: 'Online',
  },
  {
    id: 'event-2',
    title: 'Project Review',
    date: '2026-02-28',
    time: '14:00',
    duration: '45 min',
    type: 'review',
    instructor: 'Carlos Mendoza',
    location: 'Room 4B',
  },
]

const computeTrackProgress = (track: TrainingTrack) => {
  const completed = track.courses?.filter((module) => module.completed).length || 0
  const total = track.courses?.length || track.total_courses || 0

  track.completed_courses = completed
  track.total_courses = total
  track.progress_percentage = total > 0 ? Math.round((completed / total) * 100) : 0
  track.enrolled = true
}

// Create API
export const coursesApi = createApi({
  reducerPath: 'consultantApi',
  baseQuery: fakeBaseQuery(),
  tagTypes: ['Courses', 'Progress', 'Schedule'],
  endpoints: (builder) => ({
    // Get all courses
    getAllCourses: builder.query<TrainingTrack[], void>({
      queryFn: async () => {
        await wait()
        return { data: clone(mockTracks) }
      },
      providesTags: ['Courses'],
    }),

    // Get enrolled courses only
    getEnrolledCourses: builder.query<TrainingTrack[], void>({
      queryFn: async () => {
        await wait()
        return { data: clone(mockTracks.filter((track) => track.enrolled)) }
      },
      providesTags: ['Courses'],
    }),

    // Get course details with modules
    getCourseDetails: builder.query<TrainingTrack, string>({
      queryFn: async (courseId) => {
        await wait(150)
        const track = mockTracks.find((item) => item.id === courseId)

        if (!track) {
          return { error: { status: 404, data: 'Course not found' } }
        }

        return { data: clone(track) }
      },
      providesTags: (_result, _error, courseId) => [{ type: 'Courses', id: courseId }],
    }),

    // Get user progress
    getUserProgress: builder.query<UserProgress, string>({
      queryFn: async (userId) => {
        await wait(150)
        const enrolledTracks = mockTracks.filter((track) => track.enrolled)
        const totalCourses = enrolledTracks.reduce((sum, track) => sum + track.total_courses, 0)
        const completedCourses = enrolledTracks.reduce((sum, track) => sum + track.completed_courses, 0)
        const activeCourses = enrolledTracks.filter(
          (track) => track.progress_percentage > 0 && track.progress_percentage < 100,
        ).length

        return {
          data: {
            userId,
            totalCourses,
            activeCourses,
            completedCourses,
            averageProgress: totalCourses > 0 ? Math.round((completedCourses / totalCourses) * 100) : 0,
            completedModules: completedCourses,
            hoursSpent: Math.max(6, completedCourses * 2),
          },
        }
      },
      providesTags: ['Progress'],
    }),

    // Get schedule
    getSchedule: builder.query<Schedule[], void>({
      queryFn: async () => {
        await wait(120)
        return { data: clone(mockSchedule) }
      },
      providesTags: ['Schedule'],
    }),

    // Enroll in course
    enrollInCourse: builder.mutation<TrainingTrack, string>({
      queryFn: async (courseId) => {
        await wait(200)
        const track = mockTracks.find((item) => item.id === courseId)

        if (!track) {
          return { error: { status: 404, data: 'Course not found' } }
        }

        track.enrolled = true
        return { data: clone(track) }
      },
      invalidatesTags: ['Courses', 'Progress'],
    }),

    // Update course progress with file upload support
    updateCourseProgress: builder.mutation<TrainingTrack, FormData>({
      queryFn: async (formData) => {
        await wait(200)
        const trackId = formData.get('trackId') as string
        const track = mockTracks.find((item) => item.id === trackId)

        if (!track || !track.courses) {
          return { error: { status: 404, data: 'Track not found' } }
        }

        for (const key of formData.keys()) {
          if (key.startsWith('course_')) {
            const moduleId = key.replace('course_', '')
            const module = track.courses.find((item) => item.id === moduleId)
            if (module) {
              module.completed = true
            }
          }
        }

        computeTrackProgress(track)

        return { data: clone(track) }
      },
      invalidatesTags: (_result, _arg, formData) => {
        const trackId = formData.get('trackId') as string
        return [
          { type: 'Courses', id: trackId },
          'Courses',
          'Progress',
        ]
      },
    }),
  }),
})

// Export hooks
export const {
  useGetAllCoursesQuery,
  useGetEnrolledCoursesQuery,
  useGetCourseDetailsQuery,
  useGetUserProgressQuery,
  useGetScheduleQuery,
  useEnrollInCourseMutation,
  useUpdateCourseProgressMutation,
} = coursesApi