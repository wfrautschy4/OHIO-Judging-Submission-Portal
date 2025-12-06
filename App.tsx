import React, { useState, useEffect } from 'react';
import { 
  FormStep, 
  ProjectData, 
  TeamMember, 
  VerificationResponse 
} from './types';
import { 
  verifyMemberAgainstDatabase, 
  submitProjectForm
} from './services/api';
import { APP_CONFIG } from './config';
import { StepIndicator } from './components/StepIndicator';
import { FormField } from './components/FormField';
import { NotificationBanner } from './components/NotificationBanner';
import { 
  ShieldCheck, 
  ArrowRight, 
  ArrowLeft, 
  UploadCloud, 
  Loader2,
  Trophy,
  Users,
  Code2,
  Check
} from 'lucide-react';

const INITIAL_DATA: ProjectData = {
  teamName: '',
  teamNumber: '',
  memberCount: 2,
  returningMembersCount: 0,
  isCapstone: false,
  projectName: '',
  projectDescription: '',
  videoFile: null,
  sponsorChallenge: APP_CONFIG.sponsorChallenges[0] || 'General Track',
  repositoryLink: '',
  innovation: 5,
  curiosity: 5,
  communication: 5,
  complexity: 5,
  impact: 5,
  challenges: 5
};

function App() {
  const [currentStep, setCurrentStep] = useState<FormStep>(FormStep.TEAM_INFO);
  const [formData, setFormData] = useState<ProjectData>(INITIAL_DATA);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  // Initialize members when memberCount changes or component mounts
  useEffect(() => {
    setMembers(prev => {
      const needed = formData.memberCount;
      const current = prev.length;
      if (needed > current) {
        const newMembers: TeamMember[] = Array.from({ length: needed - current }).map(() => ({
          id: Math.random().toString(36).substr(2, 9),
          name: '',
          email: '',
          isVerified: false
        }));
        return [...prev, ...newMembers];
      } else if (needed < current) {
        return prev.slice(0, needed);
      }
      return prev;
    });
  }, [formData.memberCount]);

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
  };

  const updateFormData = (key: keyof ProjectData, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  };

  const updateMember = (index: number, field: keyof TeamMember, value: string) => {
    const updated = [...members];
    updated[index] = { ...updated[index], [field]: value };
    // If email changes, invalidate verification
    if (field === 'email') {
      updated[index].isVerified = false;
      updated[index].verificationMessage = undefined;
    }
    setMembers(updated);
  };

  const verifyMember = async (index: number) => {
    const member = members[index];
    if (!member.email) {
      showNotification("Please enter an email address first.", 'error');
      return;
    }

    setLoading(true);
    try {
      const result: VerificationResponse = await verifyMemberAgainstDatabase(member.email);
      const updated = [...members];
      updated[index].isVerified = result.valid;
      updated[index].verificationMessage = result.message;
      if (result.participantName) {
        updated[index].name = result.participantName; // Auto-fill name if found
      }
      setMembers(updated);
      
      if (!result.valid) {
        showNotification(result.message, 'error');
      } 
    } catch (err) {
      console.error(err);
      showNotification("Network error checking database.", 'error');
    } finally {
      setLoading(false);
    }
  };

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.teamName.trim()) newErrors.teamName = "Team name is required";
    if (!formData.teamNumber.trim()) newErrors.teamNumber = "Team number is required";
    if (formData.returningMembersCount > formData.memberCount) {
      newErrors.returningMembersCount = "Returning members cannot exceed total members";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = async () => {
    // 1. Check if fields are filled
    let allFilled = true;
    members.forEach(m => {
      if (!m.email || !m.name) allFilled = false;
    });

    if (!allFilled) {
      showNotification("Please fill in all member details.", 'error');
      return false;
    }

    // 2. Enforce Verification
    const unverified = members.filter(m => !m.isVerified);
    if (unverified.length > 0) {
      // Auto-verify loop for convenience
      setLoading(true);
      let allPassed = true;
      const updatedMembers = [...members];
      
      for (let i = 0; i < updatedMembers.length; i++) {
        if (!updatedMembers[i].isVerified) {
          try {
            const res = await verifyMemberAgainstDatabase(updatedMembers[i].email);
            updatedMembers[i].isVerified = res.valid;
            updatedMembers[i].verificationMessage = res.message;
            if (!res.valid) allPassed = false;
          } catch (e) {
            allPassed = false;
          }
        }
      }
      setMembers(updatedMembers);
      setLoading(false);

      if (!allPassed) {
        showNotification(`Some team members could not be verified in the ${APP_CONFIG.eventName} database.`, 'error');
        return false;
      }
    }
    return true;
  };

  const validateStep3 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.projectName.trim()) newErrors.projectName = "Project name is required";
    if (!formData.projectDescription.trim()) newErrors.projectDescription = "Description is required";
    if (!formData.repositoryLink.trim()) newErrors.repositoryLink = "Repository link is required";
    
    if (formData.isCapstone && !formData.capstoneInstructor) {
      newErrors.capstoneInstructor = "Instructor name is required for Capstone teams";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (currentStep === FormStep.TEAM_INFO) {
      if (validateStep1()) setCurrentStep(FormStep.MEMBER_INFO);
    } else if (currentStep === FormStep.MEMBER_INFO) {
      if (await validateStep2()) setCurrentStep(FormStep.PROJECT_DETAILS);
    } else if (currentStep === FormStep.PROJECT_DETAILS) {
      if (validateStep3()) {
        handleSubmit();
      }
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await submitProjectForm(formData, members);
      if (response.success) {
        setCurrentStep(FormStep.SUCCESS);
      } else {
        showNotification("Submission Failed: " + response.message, 'error');
      }
    } catch (e) {
      showNotification("Network Error during submission", 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 font-sans pb-20 relative">
      {/* Toast Notification */}
      {notification && (
        <NotificationBanner 
          message={notification.message} 
          type={notification.type} 
          onClose={() => setNotification(null)} 
        />
      )}

      {/* Header - Scarlet and Gray */}
      <header className="bg-gradient-to-r from-[#bb0000] to-[#990000] text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
               <Code2 size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">{APP_CONFIG.eventName}</h1>
              <p className="text-xs text-red-100 font-medium tracking-wide opacity-90">{APP_CONFIG.eventSubtitle}</p>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-gray-100">Hackathon Submission Portal</p>
            <p className="text-xs text-red-200">Deadline: {APP_CONFIG.deadline}</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 mt-8">
        
        <StepIndicator currentStep={currentStep} />

        {/* Form Container */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden relative min-h-[500px]">
          
          {loading && (
             <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
               <Loader2 className="animate-spin text-[#bb0000] h-10 w-10 mb-4" />
               <p className="text-gray-600 font-semibold animate-pulse">Communicating with {APP_CONFIG.eventName} Database...</p>
             </div>
          )}

          {/* Section 1: Team Information */}
          {currentStep === FormStep.TEAM_INFO && (
            <div className="p-8 space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="border-b pb-4 mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Users className="mr-2 text-[#bb0000]" /> Team Registration
                </h2>
                <p className="text-gray-500 mt-1">Identify your team to link with your hackathon registration.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  label="Team Name"
                  placeholder="e.g. The Buckeyes"
                  value={formData.teamName}
                  onChange={(e) => updateFormData('teamName', e.target.value)}
                  error={errors.teamName}
                />
                <FormField
                  label="Team Number"
                  placeholder="Assigned Table #"
                  type="text"
                  value={formData.teamNumber}
                  onChange={(e) => {
                     // Only allow digits
                     const val = e.target.value.replace(/\D/g, '');
                     updateFormData('teamNumber', val);
                  }}
                  error={errors.teamNumber}
                />
              </div>

              {/* Capstone Selection Block - Configurable */}
              {APP_CONFIG.enableCapstone && (
                <div 
                  onClick={() => {
                    const isCap = !formData.isCapstone;
                    // Capstone can have 5, regular max 4
                    let newMax = isCap ? 5 : 4;
                    let currentCount = formData.memberCount;
                    if (currentCount > newMax) currentCount = newMax;
                    
                    updateFormData('isCapstone', isCap);
                    updateFormData('memberCount', currentCount);
                  }}
                  className={`flex items-start p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                    formData.isCapstone 
                    ? 'border-[#bb0000] bg-red-50 ring-1 ring-[#bb0000]' 
                    : 'border-gray-200 hover:border-red-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-6 h-6 rounded border flex-shrink-0 flex items-center justify-center mr-4 mt-1 transition-colors ${
                      formData.isCapstone ? 'bg-[#bb0000] border-[#bb0000]' : 'border-gray-300 bg-white'
                  }`}>
                      {formData.isCapstone && <Check size={16} className="text-white" />}
                  </div>
                  <div>
                      <h3 className="font-bold text-gray-900">Capstone Design Challenge</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Select this option if your team is participating in the Capstone Design Challenge track. This allows for up to 5 team members.
                      </p>
                  </div>
                </div>
              )}

              <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Team Composition</h4>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    label="Team Size"
                    type="select"
                    options={formData.isCapstone ? ["2", "3", "4", "5"] : ["2", "3", "4"]}
                    value={formData.memberCount}
                    onChange={(e) => updateFormData('memberCount', parseInt(e.target.value))}
                    helperText="Total members including you."
                    className="mb-0"
                  />
                  <FormField
                    label="Returning Hackers"
                    type="select"
                    options={Array.from({length: formData.memberCount + 1}, (_, i) => i.toString())}
                    value={formData.returningMembersCount}
                    onChange={(e) => updateFormData('returningMembersCount', parseInt(e.target.value))}
                    className="mb-0"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section 2: Member Verification */}
          {currentStep === FormStep.MEMBER_INFO && (
            <div className="p-8 space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
               <div className="border-b pb-4 mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <ShieldCheck className="mr-2 text-[#bb0000]" /> Member Verification
                </h2>
                <p className="text-gray-500 mt-1">
                  We verify every member against our registration database.{APP_CONFIG.requireEduEmail && ' (.edu required)'}
                </p>
              </div>

              <div className="space-y-4">
                {members.map((member, idx) => (
                  <div key={member.id} className={`p-4 rounded-lg border-2 transition-all ${
                    member.isVerified ? 'border-green-100 bg-green-50' : 
                    member.verificationMessage && !member.isVerified ? 'border-red-100 bg-red-50' : 'border-gray-200 bg-gray-50'
                  }`}>
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-bold text-gray-700">Member {idx + 1}</h3>
                      <div className="flex items-center">
                        {member.isVerified ? (
                          <span className="flex items-center text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full uppercase tracking-wider">
                            <ShieldCheck size={14} className="mr-1" /> Verified
                          </span>
                        ) : (
                          <button 
                             onClick={() => verifyMember(idx)}
                             className="text-xs font-bold text-red-600 bg-red-100 hover:bg-red-200 px-3 py-1 rounded-full flex items-center transition-colors"
                          >
                            Check Status
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="relative">
                         <input 
                           type="email" 
                           placeholder={APP_CONFIG.requireEduEmail ? "name.#@osu.edu" : "email@example.com"}
                           value={member.email}
                           onChange={(e) => updateMember(idx, 'email', e.target.value)}
                           className={`w-full px-3 py-2 border rounded-md text-sm bg-white focus:ring-[#bb0000] focus:border-[#bb0000] ${member.isVerified ? 'text-green-700 border-green-300' : 'border-gray-300'}`}
                           readOnly={member.isVerified}
                         />
                         {/* Only show message if NOT verified (error state), prevents success text from expanding the box */}
                         {member.verificationMessage && !member.isVerified && (
                           <p className="text-xs mt-1 text-red-600 font-medium">
                             {member.verificationMessage}
                           </p>
                         )}
                      </div>
                      <input 
                        type="text" 
                        placeholder="Full Name"
                        value={member.name}
                        onChange={(e) => updateMember(idx, 'name', e.target.value)}
                        className="w-full px-3 py-2 border rounded-md text-sm border-gray-300 bg-white focus:ring-[#bb0000] focus:border-[#bb0000]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 3: Project Details */}
          {currentStep === FormStep.PROJECT_DETAILS && (
             <div className="p-8 space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
               <div className="border-b pb-4 mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Trophy className="mr-2 text-[#bb0000]" /> Project Submission
                </h2>
                <p className="text-gray-500 mt-1">Tell the judges about what you built.</p>
              </div>

              <div className="space-y-6">
                <FormField
                  label="Project Title"
                  value={formData.projectName}
                  onChange={(e) => updateFormData('projectName', e.target.value)}
                  error={errors.projectName}
                  placeholder="Enter a catchy title"
                />

                <div className="relative">
                  <div className="flex justify-between items-center mb-1">
                     <label className="block text-sm font-semibold text-gray-700">Description</label>
                  </div>
                  <textarea 
                    className="w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 min-h-[120px] focus:ring-[#bb0000] focus:border-[#bb0000] bg-white"
                    value={formData.projectDescription}
                    onChange={(e) => updateFormData('projectDescription', e.target.value)}
                    placeholder="Describe the problem, your solution, and the tech stack used..."
                  />
                  {errors.projectDescription && <p className="text-red-600 text-sm mt-1">{errors.projectDescription}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <FormField
                      label="Sponsor Challenge"
                      type="select"
                      options={APP_CONFIG.sponsorChallenges}
                      value={formData.sponsorChallenge}
                      onChange={(e) => updateFormData('sponsorChallenge', e.target.value)}
                   />
                   {APP_CONFIG.enableCapstone && formData.isCapstone && (
                     <FormField
                        label="Capstone Instructor"
                        value={formData.capstoneInstructor || ''}
                        onChange={(e) => updateFormData('capstoneInstructor', e.target.value)}
                        error={errors.capstoneInstructor}
                     />
                   )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    label="GitHub/GitLab Repository"
                    type="text"
                    value={formData.repositoryLink}
                    onChange={(e) => updateFormData('repositoryLink', e.target.value)}
                    error={errors.repositoryLink}
                    placeholder="https://github.com/..."
                  />
                  <FormField
                    label="Demo Video (Upload)"
                    type="file"
                    accept=".mp4,.wav"
                    helperText="Accepted formats: .mp4, .wav"
                    onChange={(e) => {
                      const files = (e.target as HTMLInputElement).files;
                      if (files && files[0]) updateFormData('videoFile', files[0]);
                    }}
                  />
                </div>

                {/* Self Assessment Sliders - Updated Rubric */}
                <div className="bg-gray-50 p-6 rounded-lg space-y-4 border border-gray-200">
                  <h4 className="font-semibold text-sm text-gray-700 uppercase tracking-wide border-b pb-2 mb-4">
                    Self Assessment (1-10)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                    {[
                      { key: 'innovation', label: 'Innovation' },
                      { key: 'curiosity', label: 'Curiosity' },
                      { key: 'communication', label: 'Communication' },
                      { key: 'complexity', label: 'Project Breadth & Complexity' },
                      { key: 'impact', label: 'Impact' },
                      { key: 'challenges', label: 'Navigating Challenges' }
                    ].map((metric) => (
                       <div key={metric.key} className="flex flex-col space-y-2">
                          <div className="flex justify-between items-center">
                             <label className="text-sm font-medium text-gray-700">{metric.label}</label>
                             <span className="text-sm font-bold text-[#bb0000]">{(formData as any)[metric.key]}</span>
                          </div>
                          <input 
                            type="range" min="1" max="10" 
                            value={(formData as any)[metric.key]} 
                            onChange={(e) => updateFormData(metric.key as any, parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#bb0000]"
                          />
                       </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Success State */}
          {currentStep === FormStep.SUCCESS && (
            <div className="p-12 flex flex-col items-center justify-center text-center animate-in zoom-in duration-500 min-h-[400px]">
               <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
                 <CheckCircle2 size={40} />
               </div>
               <h2 className="text-3xl font-bold text-gray-900 mb-2">Submission Received!</h2>
               <p className="text-gray-600 max-w-md mb-8">
                 Your project <strong>{formData.projectName}</strong> has been logged in the {APP_CONFIG.eventName} database. Good luck with the judging!
               </p>
               <div className="p-4 bg-gray-50 rounded-md border text-left w-full max-w-sm mb-6">
                 <p className="text-sm"><strong>Team:</strong> {formData.teamName}</p>
                 <p className="text-sm"><strong>Members:</strong> {members.length}</p>
                 <p className="text-sm"><strong>ID:</strong> #{Math.floor(Math.random() * 9999)}</p>
               </div>
               <button 
                 onClick={() => window.location.reload()}
                 className="text-[#bb0000] hover:text-[#990000] font-medium text-sm underline"
               >
                 Start New Submission
               </button>
            </div>
          )}

          {/* Footer Controls */}
          {currentStep !== FormStep.SUCCESS && (
            <div className="bg-gray-50 px-8 py-4 border-t border-gray-200 flex justify-between items-center">
               <button
                 onClick={() => setCurrentStep(prev => prev - 1)}
                 disabled={currentStep === 1}
                 className={`flex items-center px-4 py-2 rounded-md font-medium transition-colors ${
                   currentStep === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-200'
                 }`}
               >
                 <ArrowLeft size={18} className="mr-2" /> Back
               </button>

               <button
                 onClick={handleNext}
                 className="flex items-center bg-[#bb0000] hover:bg-[#990000] text-white px-6 py-2 rounded-md font-bold shadow-md hover:shadow-lg transition-all transform active:scale-95"
               >
                 {currentStep === FormStep.PROJECT_DETAILS ? (
                   <>Submit Project <UploadCloud size={18} className="ml-2" /></>
                 ) : (
                   <>Next Step <ArrowRight size={18} className="ml-2" /></>
                 )}
               </button>
            </div>
          )}
        </div>

        <div className="text-center mt-8 text-gray-400 text-sm">
          &copy; 2024 {APP_CONFIG.eventName}. Built securely with React.
        </div>
      </main>
    </div>
  );
}

// Helper icon
function CheckCircle2(props: any) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" height="24" viewBox="0 0 24 24" 
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export default App;