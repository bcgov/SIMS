export const questionsPI = {
  sections: {
    residency: {
      title: "Citizen and Residency",
      subTitle:
        "You must meet B.C. residency requirements to receive funding through StudentAid BC",
      questions: {
        residencyQuestion: "On my first day of class, I'll be a:",
        options: [
          { text: "Canadian citizen", value: "canadian" },
          { text: "Protected person", value: "protected" },
          { text: "Permanent resident", value: "pr" },
        ],
        bcResidencyQuestion:
          "I have lived in B.C. for at least 12 consecutive months without being a full-time post-secondary student",
      },
    },
    bankruptcy: {
      title: "Bankruptcy",
      subTitle:
        "StudentAid BC requires that applicants have not previously declared bankruptcy.",
      question:
        "Have you ever declared bankruptcy that included financial assistance?",
    },
    highschoolAttendance: {
      title: "Date of Highschool Attendance",
      subTitle:
        "Please enter the date when you graduated or when you orginally left highschool before coming back to graduate.",
      question: " I graduated or left highschool on:",
    },
    relationship: {
      title: "Relationship Status",
      subTitle: "We use your relationship status to ensure you will receive.",
      question: "On my first day of class, I'll be:",
      options: [
        { text: "Single", value: "single" },
        { text: "Married", value: "married" },
        { text: "Common law", value: "commonlaw" },
        { text: "Separated/divorced/widowed", value: "separated" },
      ],
    },
    employment: {
      title: "Employment Information",
      subTitle:
        "StudentAid BC requires applicants not work a full-time of more than 32 hours per week for at least half of their study period.",
      question:
        "Will you be working a full-time job of 32 hours per week for more than half of your study period?",
    },
    aboriginalStatus: {
      title: "Aboriginal Status",
      subTitle: "Description of Indigenous heritage...",
      question: "Do you identify as an Aboriginal person?",
    },
    youthInCare: {
      title: "Youth In Care",
      subTitle:
        "If may be eligible to the following programs as a current/former youth in care (part of a foster family).",
      question:
        "I am a current/former youth in care and I want to apply for the Provincial Tuition Waiver Program and the Youth Educational Assistance Fund grants",
    },
    permanentDisability: {
      title: "Permanent Disability",
      subTitle:
        "Do you have a permanent disability that affects your studies on a daily basis?",
      question:
        "I have a permanent disability and want to apply for permanent disability grants:",
    },
    dependentStatus: {
      title: "Dependent",
      subTitle: "Please specify your dependent status",
      question: "Do you have any dependents?",
    },
  },
};
