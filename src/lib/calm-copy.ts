/**
 * Calm Copy Library - Encouraging, neutral, no-shame language
 */

export const calmCopy = {
  taskCapture: {
    placeholder: 'What would you like to start?',
    emptyState: 'No tasks yet. What would you like to tackle?',
    addButton: 'Add Task',
    taskOfTheMoment: 'Task of the Moment',
  },
  breakdown: {
    generating: 'Breaking this down into small steps...',
    fallback: 'Here are some starter steps you can customize:',
    editHint: 'Feel free to edit, reorder, or add steps',
    saveSteps: 'Save Steps',
    stepsReady: 'Steps ready. Ready to start?',
  },
  focusSession: {
    ready: 'Ready to focus?',
    chooseDuration: 'Choose a duration',
    currentStep: 'Current Step',
    timerRunning: 'Focusing...',
    timerPaused: 'Paused',
    timerComplete: 'Step complete! 🎉',
    continuePrompt: 'Continue with next step?',
    takeBreak: 'Take a break',
    celebrate: {
      stepComplete: 'Step complete!',
      greatJob: 'Great job!',
      smallWin: 'Every step counts.',
    },
  },
  stuck: {
    title: "I'm Stuck",
    tooBig: 'This step feels too big',
    lowEnergy: "I'm low on energy",
    splitting: 'Breaking this into smaller steps...',
    rescue: 'Starting a 2-minute rescue step...',
    backToSession: 'Back to session',
  },
  steps: {
    empty: 'No steps yet',
    addStep: 'Add Step',
    deleteStep: 'Delete',
    reorder: 'Drag to reorder',
    edit: 'Edit',
    save: 'Save',
    cancel: 'Cancel',
  },
  stats: {
    activationDifficulty: 'Activation Difficulty',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    suggestion: 'Try starting with a 2-minute step',
  },
  privacy: {
    exportData: 'Export Data',
    deleteAll: 'Delete All Data',
    deleteConfirm: 'Are you sure? This cannot be undone.',
    exportSuccess: 'Data exported successfully',
    deleteSuccess: 'All data deleted',
  },
  errors: {
    networkError: 'Connection issue. Using fallback steps.',
    breakdownError: 'Could not generate steps. Using template instead.',
    saveError: 'Could not save. Please try again.',
    generic: 'Something went wrong. Please try again.',
  },
  empty: {
    noTasks: 'No tasks yet',
    noSteps: 'No steps yet',
    noSessions: 'No sessions yet',
  },
} as const;

export type CalmCopy = typeof calmCopy;

