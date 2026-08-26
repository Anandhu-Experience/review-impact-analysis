// 13 problem categories (business rule)
export enum ProblemCategory {
  Price = 'Price',
  Quality = 'Quality',
  Quantity = 'Quantity',
  Taste = 'Taste',
  Service = 'Service',
  WaitingTime = 'WaitingTime',
  Availability = 'Availability',
  Staff = 'Staff',
  Cleanliness = 'Cleanliness',
  Menu = 'Menu',
  Ambience = 'Ambience',
  Delivery = 'Delivery',
  Packaging = 'Packaging',
}

export enum Sentiment {
  Positive = 'Positive',
  Neutral = 'Neutral',
  Negative = 'Negative',
}

export enum ReviewPhase {
  Baseline = 'baseline',
  PostAction = 'post-action',
}

export enum Priority {
  High = 'High',
  Medium = 'Medium',
  Low = 'Low',
}

// The 6 required action statuses
export enum ActionStatus {
  NotStarted = 'Not Started',
  InProgress = 'In Progress',
  Monitoring = 'Monitoring',
  Completed = 'Completed',
  ImprovementConfirmed = 'Improvement Confirmed',
  NoSignificantChange = 'No Significant Change',
}

export type Rating = 1 | 2 | 3 | 4 | 5;
