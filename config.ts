export const APP_CONFIG = {
  // Server Configuration
  serverUrl: "https://api.ohio.edu:8080", // Address and port of the remote server
  
  // Event Details
  eventName: "GameJam I/O 2026", // Title of the form/event
  eventSubtitle: "SECURE PROJECT SUBMISSION",
  deadline: "Saturday, 1-:00 AM EST", // Deadline displayed in header
  
  // Feature Flags
  enableCapstone: true, // Set to false for events like High School I/O
  requireEduEmail: true, // Set to false for non-college events
  
  // Dropdown Data
  sponsorChallenges: [
    "General Track",
    "Honda Mobility Challenge",
    "JPMC Social Good",
    "Microsoft AI Challenge",
    "Battelle Security Challenge"
  ]
};