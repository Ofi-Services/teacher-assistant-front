/**
 * Training Calendar RTK Query Implementation
 * Adapted for Training Tracks API
 */

import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import {
  MonthTrainingSummary,
  DayTrainingSummary,
  GetCalendarRequest,
  TrainingTrack,
  CategoryBreakdown,
  PlatformBreakdown,
} from '../types';

interface MockTrainingTrack extends TrainingTrack {
  userId?: string;
}

const filterTracksByUser = (
  tracks: MockTrainingTrack[],
  userId?: string
): MockTrainingTrack[] => {
  if (!userId) {
    return tracks;
  }

  const normalizedUserId = String(userId);
  const exactMatches = tracks.filter((track) => String(track.userId) === normalizedUserId);

  return exactMatches.length > 0 ? exactMatches : tracks;
};

const wait = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms));
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const toISODate = (date: Date): string => date.toISOString().split('T')[0];

const createTeamsMeetingMockEvents = (count = 20): MockTrainingTrack[] => {
  const year = 2026;
  const month = 2; // March (0-indexed)
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const meetingTimes = [
    '08:30',
    '09:00',
    '09:30',
    '10:00',
    '10:30',
    '11:00',
    '11:30',
    '14:00',
    '14:30',
    '15:00',
  ];

  const meetingTopics = [
    'Weekly Planning',
    'Sprint Sync',
    'Department Update',
    'Project Kickoff',
    'Stakeholder Review',
    'Progress Check-in',
    'Roadmap Alignment',
    'Curriculum Coordination',
    'Teacher Follow-up',
    'Academic Committee',
  ];

  return Array.from({ length: count }, (_, index) => {
    const day = ((index * 2) % daysInMonth) + 1;
    const meetingDate = new Date(year, month, day);
    const due_time = meetingTimes[index % meetingTimes.length];
    const topic = meetingTopics[index % meetingTopics.length];

    return {
      id: 600 + index,
      userId: 'mock-user-1',
      title: `Teams Meeting - ${topic} ${index + 1}`,
      platform: 'Microsoft Teams',
      category: 'Teams Meeting',
      due_date: toISODate(meetingDate),
      due_time,
      completion_date: null,
      total_courses: 1,
      completed_courses: 0,
      link: `https://mock.local/meetings/${600 + index}`,
    };
  });
};

let mockCalendarTracks: MockTrainingTrack[] = [
  {
    id: 501,
    userId: 'mock-user-1',
    title: 'Strategic Consulting Foundations',
    platform: 'Udemy',
    category: 'Consulting',
    due_date: '2026-02-20',
    completion_date: null,
    total_courses: 4,
    completed_courses: 3,
    link: 'https://mock.local/tracks/501',
  },
  {
    id: 502,
    userId: 'mock-user-1',
    title: 'Data Analysis with Python',
    platform: 'Coursera',
    category: 'Data',
    due_date: '2026-02-26',
    completion_date: null,
    total_courses: 5,
    completed_courses: 2,
    link: 'https://mock.local/tracks/502',
  },
  {
    id: 503,
    userId: 'mock-user-2',
    title: 'Agile Project Delivery',
    platform: 'LinkedIn Learning',
    category: 'Project Management',
    due_date: '2026-03-03',
    completion_date: null,
    total_courses: 3,
    completed_courses: 1,
    link: 'https://mock.local/tracks/503',
  },
  {
    id: 504,
    userId: 'mock-user-1',
    title: 'Client Communication Mastery',
    platform: 'Udemy',
    category: 'Communication',
    due_date: '2026-03-12',
    completion_date: null,
    total_courses: 4,
    completed_courses: 1,
    link: 'https://mock.local/tracks/504',
  },
  ...createTeamsMeetingMockEvents(20),
];

/**
 * Transform training tracks array into MonthTrainingSummary
 * 
 * @param tracks - Array of training tracks from API
 * @param year - Year (e.g., 2025)
 * @param month - Month in JavaScript format (0-11, where 0 = January)
 */
const transformTracksToMonthSummary = (
  tracks: TrainingTrack[],
  year: number,
  month: number
): MonthTrainingSummary => {
  const dailySummaries: Record<string, DayTrainingSummary> = {};
  const categoryStats: Record<string, CategoryBreakdown> = {};
  const platformStats: Record<string, PlatformBreakdown> = {};

  let totalTracks = 0;
  let completedTracks = 0;
  let inProgressTracks = 0;
  let totalCourses = 0;
  let completedCourses = 0;

  // Filter tracks for the specific month
  // Note: month parameter is 0-11 (JavaScript format)
  // but track.due_date is ISO format (YYYY-MM-DD) which JavaScript parses correctly
  const monthTracks = tracks.filter((track) => {
    if (!track.due_date) return false;
    const trackDate = new Date(track.due_date);
    return trackDate.getFullYear() === year && trackDate.getMonth() === month;
  });

  // Process each track
  monthTracks.forEach((track) => {
    const date = track.due_date as string;
    const categoryKey = track.category ?? 'Uncategorized';
    const platformKey = track.platform ?? 'Unknown';
    const isCompleted = track.completed_courses === track.total_courses;
    const isInProgress = track.completed_courses > 0 && track.completed_courses < track.total_courses;

    // Update totals
    totalTracks++;
    if (isCompleted) completedTracks++;
    if (isInProgress) inProgressTracks++;
    totalCourses += track.total_courses;
    completedCourses += track.completed_courses;

    // Initialize daily summary if not exists
    if (!dailySummaries[date]) {
      dailySummaries[date] = {
        date,
        totalTracks: 0,
        completedTracks: 0,
        inProgressTracks: 0,
        totalCourses: 0,
        completedCourses: 0,
        tracksByCategory: {},
        tracksByPlatform: {},
        tracks: [],
      };
    }

    // Update daily summary
    const daySummary = dailySummaries[date];
    daySummary.totalTracks++;
    if (isCompleted) daySummary.completedTracks++;
    if (isInProgress) daySummary.inProgressTracks++;
    daySummary.totalCourses += track.total_courses;
    daySummary.completedCourses += track.completed_courses;
    daySummary.tracksByCategory[categoryKey] = (daySummary.tracksByCategory[categoryKey] || 0) + 1;
    daySummary.tracksByPlatform[platformKey] = (daySummary.tracksByPlatform[platformKey] || 0) + 1;
    daySummary.tracks.push(track);

    // Update category stats
    if (!categoryStats[categoryKey]) {
      categoryStats[categoryKey] = {
        category: categoryKey,
        totalTracks: 0,
        completedTracks: 0,
        totalCourses: 0,
        completedCourses: 0,
      };
    }
    categoryStats[categoryKey].totalTracks++;
    if (isCompleted) categoryStats[categoryKey].completedTracks++;
    categoryStats[categoryKey].totalCourses += track.total_courses;
    categoryStats[categoryKey].completedCourses += track.completed_courses;

    // Update platform stats
    if (!platformStats[platformKey]) {
      platformStats[platformKey] = {
        platform: platformKey,
        totalTracks: 0,
        completedTracks: 0,
        totalCourses: 0,
        completedCourses: 0,
      };
    }
    platformStats[platformKey].totalTracks++;
    if (isCompleted) platformStats[platformKey].completedTracks++;
    platformStats[platformKey].totalCourses += track.total_courses;
    platformStats[platformKey].completedCourses += track.completed_courses;
  });

  // Get upcoming deadlines (sorted by due date)
  const upcomingDeadlines = monthTracks
    .filter((track) => track.completed_courses < track.total_courses)
    .sort((a, b) => {
      const dateA = a.due_date ? new Date(a.due_date).getTime() : 0;
      const dateB = b.due_date ? new Date(b.due_date).getTime() : 0;
      return dateA - dateB;
    })
    .slice(0, 10);

  return {
    year,
    month,
    totalTracks,
    completedTracks,
    inProgressTracks,
    totalCourses,
    completedCourses,
    dailySummaries,
    categoriesBreakdown: Object.values(categoryStats),
    platformsBreakdown: Object.values(platformStats),
    upcomingDeadlines,
  };
};

// Define the API slice
export const trainingCalendarApi = createApi({
  reducerPath: 'trainingCalendarApi',
  baseQuery: fakeBaseQuery(),
  tagTypes: ['Calendar', 'TrainingTrack'],
  endpoints: (builder) => ({
    // Get month training data
    getMonthTraining: builder.query<MonthTrainingSummary, GetCalendarRequest>({
      queryFn: async (arg) => {
        await wait();
        const currentDate = new Date();
        const year = arg.year ?? currentDate.getFullYear();
        const month = arg.month ?? currentDate.getMonth();
        const filteredTracks = filterTracksByUser(mockCalendarTracks, arg.userId)
          .map(({ userId: _userId, ...track }) => track);

        return { data: transformTracksToMonthSummary(clone(filteredTracks), year, month) };
      },
      providesTags: (_result, _error, { year, month }) => [
        { type: 'Calendar', id: `${year}-${month}` },
        'TrainingTrack',
      ],
      keepUnusedDataFor: 300, // 5 minutes
    }),

    // Get all training tracks (no date filter)
    getAllTracks: builder.query<TrainingTrack[], { userId?: string }>({
      queryFn: async ({ userId }) => {
        await wait(150);
        const tracks = filterTracksByUser(mockCalendarTracks, userId)
          .map(({ userId: _userId, ...track }) => track);

        return { data: clone(tracks) };
      },
      providesTags: ['TrainingTrack'],
      keepUnusedDataFor: 300,
    }),

    // Optional: Update training track
    updateTrainingTrack: builder.mutation<
      TrainingTrack,
      { trackId: number; updates: Partial<TrainingTrack> }
    >({
      queryFn: async ({ trackId, updates }) => {
        await wait(180);
        const index = mockCalendarTracks.findIndex((track) => track.id === trackId);

        if (index === -1) {
          return { error: { status: 404, data: 'Track not found' } };
        }

        mockCalendarTracks[index] = {
          ...mockCalendarTracks[index],
          ...updates,
        };

        const { userId: _userId, ...track } = mockCalendarTracks[index];
        return { data: clone(track) };
      },
      invalidatesTags: ['Calendar', 'TrainingTrack'],
    }),

    // Optional: Create new training track
    createTrainingTrack: builder.mutation<TrainingTrack, Omit<TrainingTrack, 'id'>>({
      queryFn: async (newTrack) => {
        await wait(180);
        const created: MockTrainingTrack = {
          ...newTrack,
          id: Date.now(),
          userId: 'mock-user-1',
        };

        mockCalendarTracks = [...mockCalendarTracks, created];
        const { userId: _userId, ...track } = created;
        return { data: clone(track) };
      },
      invalidatesTags: ['Calendar', 'TrainingTrack'],
    }),

    // Optional: Delete training track
    deleteTrainingTrack: builder.mutation<void, number>({
      queryFn: async (trackId) => {
        await wait(140);
        mockCalendarTracks = mockCalendarTracks.filter((track) => track.id !== trackId);
        return { data: undefined };
      },
      invalidatesTags: ['Calendar', 'TrainingTrack'],
    }),
  }),
});

// Export hooks for usage in functional components
export const {
  useGetMonthTrainingQuery,
  useGetAllTracksQuery,
  useUpdateTrainingTrackMutation,
  useCreateTrainingTrackMutation,
  useDeleteTrainingTrackMutation,
} = trainingCalendarApi;

// Export the reducer to be included in the store
export default trainingCalendarApi.reducer;