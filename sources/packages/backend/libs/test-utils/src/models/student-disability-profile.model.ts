/**
 * Disability categories for a student disability profile.
 * This represents a subset of the possible categories defined in the system.
 */
export enum DisabilityCategories {
  LearningDisability = "LEARNING_DISABILITY",
  SpeechImpairment = "SPEECH_IMPAIRMENT",
  Other = "OTHER",
  Invalid = "INVALID_CATEGORY",
}

export enum DisabilityCategoryDescriptions {
  LearningDisability = "Learning disability",
  SpeechImpairment = "Speech impairment",
  Other = "Other",
}

/**
 * Disability types for a student disability profile.
 * This represents a subset of the possible types defined in the system.
 */
export enum DisabilityTypes {
  Permanent = "PD",
  PersistentOrProlonged = "PPD",
  Invalid = "INVALID_TYPE",
}

/**
 * Disability impairment types for a student disability profile.
 * This represents a subset of the possible impairments defined in the system.
 */
export enum DisabilityImpairments {
  AscendDescendStairs = "ASC_DESC_STAIRS",
  FollowingInstructions = "FOLLOWING_INSTRUCT",
  Other = "OTHER",
  Invalid1 = "INVALID_IMPAIRMENT_1",
  Invalid2 = "INVALID_IMPAIRMENT_2",
}

export enum DiagnosisSamples {
  SampleA = "Attention Deficit Hyperactivity Disorder (ADHD), combined presentation.",
  SampleB = "Specific Learning Disorder with impairment in reading (dyslexia).",
  SampleC = "Generalized Anxiety Disorder impacting academic performance.",
}
