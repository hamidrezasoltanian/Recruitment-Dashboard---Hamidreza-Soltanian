import React, { useState, useMemo } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useCandidates } from './contexts/CandidatesContext';
import { Candidate, StageId, View, StageChangeInfo, KanbanViewMode } from './types';

import Header from './components/layout/Header';
import Tabs from './components/layout/Tabs';
import KanbanBoard from './components/kanban/KanbanBoard';
import CalendarView from './components/calendar/CalendarView';
import ArchiveView from './components/archive/ArchiveView';
import TestView from './components/views/TestView';
import ReportsView from './components/views/ReportsView';
import AddEditCandidateModal from './components/modals/AddEditCandidateModal';
import CandidateDetailsModal from './components/modals/CandidateDetailsModal';
import SettingsModal from './components/modals/SettingsModal';
import StageChangeCommunicationModal from './components/modals/StageChangeCommunicationModal';
import DashboardSummary from './components/dashboard/DashboardSummary';
import LoginScreen from './components/auth/LoginScreen';
import KanbanControls from './components/kanban/KanbanControls';
import CommunicationModal from './components/modals/CommunicationModal';
import ResumeViewerModal from './components/modals/ResumeViewerModal';
import BulkCommunicationModal from './components/modals/BulkCommunicationModal';


const App: React.FC = () => {
  const { user } = useAuth();
  const { candidates, addCandidate, updateCandidate, updateCandidateStage, lastDeleted, undoDelete } = useCandidates();
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [kanbanViewMode, setKanbanViewMode] = useState<KanbanViewMode>('kanban');

  // Modal States
  const [isAddEditModalOpen, setAddEditModalOpen] = useState(false);
  const [candidateToEdit, setCandidateToEdit] = useState<Candidate | null>(null);
  const [initialStage, setInitialStage] = useState<StageId>('inbox');

  const [isDetailsModalOpen, setDetailsModalOpen] = useState(false);
  const [candidateToViewId, setCandidateToViewId] = useState<string | null>(null);

  const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);

  const [stageChangeInfo, setStageChangeInfo] = useState<StageChangeInfo | null>(null);

  const [communicationConfig, setCommunicationConfig] = useState<{
    isOpen: boolean;
    candidate: Candidate | null;
  }>({ isOpen: false, candidate: null });

  const [resumeViewerState, setResumeViewerState] = useState<{ isOpen: boolean, file: File | null }>({ isOpen: false, file: null });

  const [bulkCommConfig, setBulkCommConfig] = useState<{ isOpen: boolean; candidates: Candidate[] }>({ isOpen: false, candidates: [] });

  const [initialExpandedInTests, setInitialExpandedInTests] = useState<string | null>(null);

  // Filter and Sort States
  const [filters, setFilters] = useState({ search: '', position: '', source: '' });
  const [sortBy, setSortBy] = useState('createdAt');

  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const filteredAndSortedCandidates = useMemo(() => {
    let processed = [...candidates];

    // Extended search: name, email, phone
    if (filters.search) {
      const q = filters.search.toLowerCase();
      processed = processed.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.phone || '').includes(filters.search)
      );
    }
    if (filters.position) {
      processed = processed.filter(c => c.position === filters.position);
    }
    if (filters.source) {
      processed = processed.filter(c => c.source === filters.source);
    }

    processed.sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name, 'fa');
        case 'rating': return b.rating - a.rating;
        default: return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return processed;
  }, [candidates, filters, sortBy]);

  const candidateToView = useMemo((): Candidate | null => {
    return candidateToViewId ? (candidates.find(c => c.id === candidateToViewId) ?? null) : null;
  }, [candidates, candidateToViewId]);

  const handleOpenAddModal = (stage?: StageId) => {
    setCandidateToEdit(null);
    setInitialStage(stage || 'inbox');
    setAddEditModalOpen(true);
  };

  const handleOpenEditModal = (candidate: Candidate) => {
    setCandidateToViewId(null);
    setDetailsModalOpen(false);
    setCandidateToEdit(candidate);
    setAddEditModalOpen(true);
  };

  const handleOpenDetailsModal = (candidate: Candidate) => {
    setCandidateToViewId(candidate.id);
    setDetailsModalOpen(true);
  };

  const handleCloseDetailsModal = () => {
    setDetailsModalOpen(false);
    setCandidateToViewId(null);
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

  // Now passes stage title to updateCandidateStage (fixes history bug)
  const handleConfirmStageChange = () => {
    if (stageChangeInfo) {
      updateCandidateStage(
        stageChangeInfo.candidate.id,
        stageChangeInfo.newStage.id,
        stageChangeInfo.newStage.title
      );
    }
    setStageChangeInfo(null);
  };

  const handleNavigateToTests = (candidateId: string) => {
    setInitialExpandedInTests(candidateId);
    setActiveView('tests');
    setDetailsModalOpen(false);
  };

  const handleOpenCommunicationModal = (candidate: Candidate) => {
    setCommunicationConfig({ isOpen: true, candidate });
    setDetailsModalOpen(false);
  };

  const handleOpenResumeViewer = (file: File) => {
    setDetailsModalOpen(false);
    setResumeViewerState({ isOpen: true, file: file });
  };

  const handleViewChange = (view: View) => {
    if (activeView === 'tests' && view !== 'tests') {
      setInitialExpandedInTests(null);
    }
    setActiveView(view);
  };

  const handleOpenBulkCommModal = (candidates: Candidate[]) => {
    setBulkCommConfig({ isOpen: true, candidates });
  };

  const renderView = () => {
    switch (activeView) {
      case 'tests':
        return <TestView initialExpandedCandidateId={initialExpandedInTests} />;
      case 'calendar':
        return <CalendarView onViewDetails={handleOpenDetailsModal} />;
      case 'archive':
        return <ArchiveView onViewDetails={handleOpenDetailsModal} />;
      case 'reports':
        return <ReportsView candidates={candidates} />;
      case 'dashboard':
      default:
        return (
          <>
            <KanbanControls
              filters={filters}
              onFilterChange={handleFilterChange}
              sortBy={sortBy}
              onSortChange={setSortBy}
              viewMode={kanbanViewMode}
              onViewModeChange={setKanbanViewMode}
            />
            <KanbanBoard
              candidates={filteredAndSortedCandidates}
              viewMode={kanbanViewMode}
              onEdit={handleOpenEditModal}
              onViewDetails={handleOpenDetailsModal}
              onStageChangeRequest={handleStageChangeRequest}
            />
          </>
        );
    }
  };

  if (!user) {
    return <LoginScreen />;
  }

  const appVersion = process.env.APP_VERSION || '1.0.0';

  return (
    <>
      <div className="min-h-screen flex flex-col">
        <Header
          onSettingsClick={() => setSettingsModalOpen(true)}
          onAddCandidateClick={() => handleOpenAddModal()}
          onOpenBulkCommModal={handleOpenBulkCommModal}
        />
        <Tabs activeView={activeView} setActiveView={handleViewChange} />
        <main className="p-4 md:p-6 lg:p-8 flex-grow">
          {activeView === 'dashboard' && <DashboardSummary candidates={candidates} />}
          {renderView()}
        </main>
      </div>

      {/* Version */}
      <div className="fixed bottom-2 left-2 text-xs text-gray-400 font-mono z-50">v{appVersion}</div>

      {/* Undo Delete Toast */}
      {lastDeleted && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-gray-800 text-white px-6 py-3 rounded-xl shadow-xl flex items-center gap-4">
          <span className="text-sm">«{lastDeleted.name}» حذف شد</span>
          <button onClick={undoDelete} className="text-[var(--color-primary-400)] font-bold text-sm hover:text-[var(--color-primary-300)]">
            ↩ بازگردانی
          </button>
        </div>
      )}

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
        onClose={handleCloseDetailsModal}
        candidate={candidateToView}
        onEdit={handleOpenEditModal}
        onStageChangeRequest={handleStageChangeRequest}
        onNavigateToTests={handleNavigateToTests}
        onOpenCommunicationModal={handleOpenCommunicationModal}
        onViewResume={handleOpenResumeViewer}
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
      {communicationConfig.candidate && (
        <CommunicationModal
          isOpen={communicationConfig.isOpen}
          onClose={() => setCommunicationConfig({ isOpen: false, candidate: null })}
          candidate={communicationConfig.candidate}
        />
      )}
      <ResumeViewerModal
        isOpen={resumeViewerState.isOpen}
        onClose={() => setResumeViewerState({ isOpen: false, file: null })}
        file={resumeViewerState.file}
      />
      <BulkCommunicationModal
        isOpen={bulkCommConfig.isOpen}
        onClose={() => setBulkCommConfig({ isOpen: false, candidates: [] })}
        candidates={bulkCommConfig.candidates}
      />
    </>
  );
};

export default App;
