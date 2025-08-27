import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useCandidates } from './contexts/CandidatesContext';
import { Candidate, StageId, View, StageChangeInfo, HistoryEntry } from './types';
import { useToast } from './contexts/ToastContext';
import { useSettings } from './contexts/SettingsContext';

import Header from './components/layout/Header';
import Tabs from './components/layout/Tabs';
import KanbanBoard from './components/kanban/KanbanBoard';
import CalendarView from './components/calendar/CalendarView';
import ArchiveView from './components/archive/ArchiveView';
import TestView from './components/views/TestView';
import AddEditCandidateModal from './components/modals/AddEditCandidateModal';
import CandidateDetailsModal from './components/modals/CandidateDetailsModal';
import SettingsModal from './components/modals/SettingsModal';
import StageChangeCommunicationModal from './components/modals/StageChangeCommunicationModal';
import SelectCandidateModal from './components/modals/SelectCandidateModal';
import TestSelectionModal from './components/modals/TestSelectionModal';
import DashboardSummary from './components/dashboard/DashboardSummary';
import LoginScreen from './components/auth/LoginScreen';
import CandidatePortal from './components/portal/CandidatePortal';
import BackgroundSelector from './components/kanban/BackgroundSelector';
import ScheduleInterviewModal from './components/modals/ScheduleInterviewModal';


const App: React.FC = () => {
  const { user, isLoading: isAuthLoading, isAuthenticated, updateUserSettings } = useAuth();
  const { candidates, addCandidate, updateCandidate, updateCandidateStage, updateTestResult } = useCandidates();
  const { addToast } = useToast();
  const { stages } = useSettings();
  const [activeView, setActiveView] = useState<View>('dashboard');
  
  // Modal States
  const [isAddEditModalOpen, setAddEditModalOpen] = useState(false);
  const [candidateToEdit, setCandidateToEdit] = useState<Candidate | null>(null);
  const [initialStage, setInitialStage] = useState<StageId>('inbox');
  
  const [isDetailsModalOpen, setDetailsModalOpen] = useState(false);
  const [candidateToView, setCandidateToView] = useState<Candidate | null>(null);

  const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);
  
  const [stageChangeInfo, setStageChangeInfo] = useState<StageChangeInfo | null>(null);
  const [isCommunicationModalOpen, setCommunicationModalOpen] = useState(false);
  const [isScheduleModalOpen, setScheduleModalOpen] = useState(false);


  // Test View States
  const [testCandidateId, setTestCandidateId] = useState<string | null>(null);
  const [isSelectCandidateModalOpen, setSelectCandidateModalOpen] = useState(false);
  const [isTestSelectionModalOpen, setTestSelectionModalOpen] = useState(false);

  // Portal Logic
  const [portalCandidateInfo, setPortalCandidateInfo] = useState<{ id: string; token: string } | null>(null);
  const [isCheckingPortal, setIsCheckingPortal] = useState(true);
  
  // Kanban Background
  const kanbanBackground = user?.settings?.kanbanBackground || '';

  const handleBackgroundChange = (bgUrl: string) => {
    updateUserSettings({ kanbanBackground: bgUrl });
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const candidateId = urlParams.get('candidateId');
    const token = urlParams.get('token');
    if (candidateId && token) {
      setPortalCandidateInfo({ id: candidateId, token });
    } else {
      setIsCheckingPortal(false);
    }
  }, []);

  const portalCandidate = useMemo(() => {
    if (!portalCandidateInfo || candidates.length === 0) {
      if (!portalCandidateInfo) setIsCheckingPortal(false);
      return null;
    }
    const found = candidates.find(c => c.id === portalCandidateInfo.id && c.portalToken === portalCandidateInfo.token);
    setIsCheckingPortal(false);
    if (!found && portalCandidateInfo) {
        console.error("Invalid portal link provided.");
        const url = new URL(window.location.href);
        url.searchParams.delete('candidateId');
        url.searchParams.delete('token');
        window.history.replaceState({}, document.title, url.toString());
    }
    return found;
  }, [portalCandidateInfo, candidates]);

  if (isAuthLoading || (isCheckingPortal && portalCandidateInfo)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-700">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (portalCandidate) {
    return <CandidatePortal candidate={portalCandidate} onUpdateTestResult={updateTestResult} />;
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }


  const handleOpenAddModal = (stage: StageId) => {
    setCandidateToEdit(null);
    setInitialStage(stage);
    setAddEditModalOpen(true);
  };

  const handleOpenEditModal = (candidate: Candidate) => {
    setCandidateToView(null);
    setDetailsModalOpen(false);
    setCandidateToEdit(candidate);
    setAddEditModalOpen(true);
  };
  
  const handleOpenDetailsModal = (candidate: Candidate) => {
    setCandidateToView(candidate);
    setDetailsModalOpen(true);
  };

  const handleSaveCandidate = (candidate: Candidate, resumeFile?: File) => {
    if (candidateToEdit) {
      updateCandidate(candidate, resumeFile);
    } else {
      addCandidate(candidate, resumeFile);
    }
  };

  const handleStageChangeRequest = (info: StageChangeInfo) => {
    setStageChangeInfo(info);
    const { newStage } = info;
    if (newStage.id === 'interview-1' || newStage.id === 'interview-2') {
        setScheduleModalOpen(true);
    } else {
        setCommunicationModalOpen(true);
    }
  };

  const handleConfirmStageChange = () => {
    if (stageChangeInfo) {
      updateCandidateStage(stageChangeInfo.candidate.id, stageChangeInfo.newStage.id);
    }
    setCommunicationModalOpen(false);
    setStageChangeInfo(null);
  };

  const handleSaveInterviewSchedule = (updatedCandidate: Candidate, sendEmail: boolean, emailBody: string) => {
      const originalCandidate = candidates.find(c => c.id === updatedCandidate.id);
      const newStageDetails = stages.find(s => s.id === updatedCandidate.stage);

      if (!originalCandidate || !newStageDetails) return;

      let finalCandidate = { ...updatedCandidate };

      if (originalCandidate.stage !== newStageDetails.id) {
          const userForHistory = user ? user.name : 'System';
          const historyEntry: HistoryEntry = {
              user: userForHistory,
              action: `مرحله به "${newStageDetails.title}" تغییر کرد`,
              timestamp: new Date().toISOString(),
          };
          finalCandidate.history = [historyEntry, ...originalCandidate.history];
      }

      updateCandidate(finalCandidate).then(() => {
          if (sendEmail && emailBody) {
              const subject = `دعوت به مصاحبه برای موقعیت شغلی: ${finalCandidate.position}`;
              const mailtoLink = `mailto:${finalCandidate.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
              window.location.href = mailtoLink;
              addToast(`ایمیل اطلاع‌رسانی به ${finalCandidate.name} آماده ارسال است.`, 'success');
          }
          addToast(`مصاحبه برای ${finalCandidate.name} با موفقیت زمان‌بندی و متقاضی منتقل شد.`, 'success');
      });

      setScheduleModalOpen(false);
      setStageChangeInfo(null);
  };
  
  const handleNavigateToTests = (candidateId: string) => {
    setTestCandidateId(candidateId);
    setActiveView('tests');
    setDetailsModalOpen(false); // Close details modal if open
  };

  const renderView = () => {
    switch (activeView) {
      case 'tests':
        return <TestView 
                  selectedCandidateId={testCandidateId} 
                  onSelectCandidateClick={() => setSelectCandidateModalOpen(true)}
                  onSendTestClick={() => setTestSelectionModalOpen(true)}
               />;
      case 'calendar':
        return <CalendarView onViewDetails={handleOpenDetailsModal} />;
      case 'archive':
        return <ArchiveView onViewDetails={handleOpenDetailsModal} />;
      case 'dashboard':
      default:
        return <KanbanBoard 
          onAddCandidate={handleOpenAddModal} 
          onEdit={handleOpenEditModal} 
          onViewDetails={handleOpenDetailsModal} 
          onStageChangeRequest={handleStageChangeRequest}
        />;
    }
  };

  return (
    <>
      <div 
        className="min-h-screen bg-gray-100"
        style={activeView === 'dashboard' && kanbanBackground ? {
          backgroundImage: `url(${kanbanBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        } : {}}
      >
        <div className={activeView === 'dashboard' && kanbanBackground ? 'bg-black/10 min-h-screen' : ''}>
          <Header onSettingsClick={() => setSettingsModalOpen(true)} />
          <Tabs activeView={activeView} setActiveView={setActiveView} />
          <main className="p-4 md:p-6 lg:p-8">
              {activeView === 'dashboard' && (
                <>
                  <BackgroundSelector onSelect={handleBackgroundChange} />
                  <DashboardSummary candidates={candidates} />
                </>
              )}
              {renderView()}
          </main>
        </div>
      </div>

      {/* Modals */}
      <AddEditCandidateModal
        isOpen={isAddEditModalOpen}
        onClose={() => setAddEditModalOpen(false)}
        onSave={handleSaveCandidate}
        candidateToEdit={candidateToEdit}
        initialStage={initialStage}
      />
      <CandidateDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        candidate={candidateToView}
        onEdit={handleOpenEditModal}
        onStageChangeRequest={handleStageChangeRequest}
        onNavigateToTests={handleNavigateToTests}
      />
      {user?.isAdmin && (
        <SettingsModal 
            isOpen={isSettingsModalOpen}
            onClose={() => setSettingsModalOpen(false)}
        />
      )}
      {stageChangeInfo && (
        <StageChangeCommunicationModal
          isOpen={isCommunicationModalOpen}
          onClose={() => {
            setCommunicationModalOpen(false);
            setStageChangeInfo(null);
          }}
          stageChangeInfo={stageChangeInfo}
          onConfirm={handleConfirmStageChange}
        />
      )}
      {stageChangeInfo && (
        <ScheduleInterviewModal
            isOpen={isScheduleModalOpen}
            onClose={() => {
                setScheduleModalOpen(false);
                setStageChangeInfo(null);
            }}
            stageChangeInfo={stageChangeInfo}
            onConfirm={handleSaveInterviewSchedule}
        />
      )}
      {/* Test Modals */}
      <SelectCandidateModal
        isOpen={isSelectCandidateModalOpen}
        onClose={() => setSelectCandidateModalOpen(false)}
        onSelect={(id) => {
          setTestCandidateId(id);
          setSelectCandidateModalOpen(false);
        }}
      />
      {testCandidateId && (
          <TestSelectionModal
            isOpen={isTestSelectionModalOpen}
            onClose={() => setTestSelectionModalOpen(false)}
            candidateId={testCandidateId}
          />
      )}
    </>
  );
};

export default App;
