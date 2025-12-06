export interface TeamMember {
  id: string;
  name: string;
  email: string;
  isVerified: boolean; // Verified against remote database
  verificationMessage?: string;
}

export interface ProjectData {
  // Section 1: Team
  teamName: string;
  teamNumber: string;
  memberCount: number;
  returningMembersCount: number;
  isCapstone: boolean;

  // Section 2: Members handled by TeamMember[]

  // Section 3: Project
  projectName: string;
  projectDescription: string;
  videoFile: File | null;
  capstoneInstructor?: string;
  sponsorChallenge: string;
  repositoryLink: string;
  
  // Section 3: Self Assessment (New Criteria)
  innovation: number;
  curiosity: number;
  communication: number;
  complexity: number; // Project Breadth and Complexity
  impact: number;
  challenges: number; // Navigating Challenges
}

export enum FormStep {
  TEAM_INFO = 1,
  MEMBER_INFO = 2,
  PROJECT_DETAILS = 3,
  SUCCESS = 4
}

export interface VerificationResponse {
  valid: boolean;
  message: string;
  participantName?: string;
}

export interface SubmissionResponse {
  success: boolean;
  message: string;
}