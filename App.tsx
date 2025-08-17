import React, { useState } from 'react';
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


const App: React.FC = () => {
  const { user } = useAuth();
  const { candidates, addCandidate, updateCandidate, updateCandidateStage } = useCandidates();
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