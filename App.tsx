import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useCandidates } from './contexts/CandidatesContext';
import { Candidate, StageId, View, StageChangeInfo } from './types';

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


const App: React.FC = () => {
  const { user } = useAuth();
  const { candidates, addCandidate, updateCandidate, updateCandidateStage, updateTestResult } = useCandidates();
  const [activeView, setActiveView] = useState<View>('dashboard');
  
  // Modal States
  const [isAddEditModalOpen, setAddEditModalOpen] = useState(false);
  const [candidateToEdit, setCandidateToEdit] = useState<Candidate | null>(null);
  const [initialStage, setInitialStage] = useState<StageId>('inbox');
  
  const [isDetailsModalOpen, setDetailsModalOpen] = useState(false);
  const [candidateToView, setCandidateToView] = useState<Candidate | null>(null);

  const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);
  
  const [stageChangeInfo, setStageChangeInfo] = useState<StageChangeInfo | null>(null);

  // Test View States
  const [testCandidateId, setTestCandidateId] = useState<string | null>(null);
  const [isSelectCandidateModalOpen, setSelectCandidateModalOpen] = useState(false);
  const [isTestSelectionModalOpen, setTestSelectionModalOpen] = useState(false);

  // Portal Logic
  const [portalCandidateInfo, setPortalCandidateInfo] = useState<{ id: string; token: string } | null>(null);
  const [isCheckingPortal, setIsCheckingPortal] = useState(true);

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

  if (isCheckingPortal && portalCandidateInfo) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-700">در حال اعتبارسنجی لینک...</p>
        </div>
      </div>
    );
  }

  if (portalCandidate) {
    return <CandidatePortal candidate={portalCandidate} onUpdateTestResult={updateTestResult} />;
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
  };

  const handleConfirmStageChange = () => {
    if (stageChangeInfo) {
      updateCandidateStage(stageChangeInfo.candidate.id, stageChangeInfo.newStage.id);
    }
    setStageChangeInfo(null); // Close modal
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

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <>
      <div className="min-h-screen">
        <Header onSettingsClick={() => setSettingsModalOpen(true)} />
        <Tabs activeView={activeView} setActiveView={setActiveView} />
        <main className="p-4 md:p-6 lg:p-8">
            {activeView === 'dashboard' && <DashboardSummary candidates={candidates} />}
            {renderView()}
        </main>
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
          isOpen={!!stageChangeInfo}
          onClose={() => setStageChangeInfo(null)}
          stageChangeInfo={stageChangeInfo}
          onConfirm={handleConfirmStageChange}
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