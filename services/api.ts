import { TeamMember, ProjectData, VerificationResponse, SubmissionResponse } from '../types';
import { APP_CONFIG } from '../config';

// In production, use the config URL
// const API_ENDPOINT = APP_CONFIG.serverUrl;

/**
 * Simulates checking the OHI/O database for a registered user.
 */
export const verifyMemberAgainstDatabase = async (email: string): Promise<VerificationResponse> => {
  // SIMULATION: Real network call would go here using APP_CONFIG.serverUrl
  await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate latency

  if (!email.includes('@')) {
    return { valid: false, message: "Invalid email format." };
  }

  // Check against banned list (Mock logic)
  if (email.toLowerCase().includes('banned')) {
    return { valid: false, message: "User is flagged in OHI/O database." };
  }
  
  // Configurable .edu Requirement
  if (APP_CONFIG.requireEduEmail && !email.endsWith('.edu')) {
    return { valid: false, message: `Email not found in registration database (Must be .edu for ${APP_CONFIG.eventName}).` };
  }
  
  // Mock Success for valid inputs
  return { valid: true, message: "Verified OHI/O Registrant", participantName: "Mock Student Name" };
};

/**
 * Simulates checking if a team number is valid/available.
 */
export const verifyTeamNumber = async (number: string): Promise<boolean> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return number.length > 0;
};

/**
 * Submits the final packet to the server
 */
export const submitProjectForm = async (
  teamData: Partial<ProjectData>,
  members: TeamMember[]


  
): Promise<SubmissionResponse> => {
  await new Promise((resolve) => setTimeout(resolve, 1500));
  
  // In production:
  // const response = await fetch(`${APP_CONFIG.serverUrl}/submit`, {
  //   method: 'POST',
  //   body: JSON.stringify({ ...teamData, members })
  // });
  
  return { success: true, message: "Project successfully submitted to judges." };
};