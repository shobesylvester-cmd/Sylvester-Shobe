/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar, ActiveTab } from './components/Navbar.tsx';
import { ClassifierConsole } from './components/ClassifierConsole.tsx';
import { ArchitectureBlueprint } from './components/ArchitectureBlueprint.tsx';
import { CategoryCatalog } from './components/CategoryCatalog.tsx';
import { StoredRecordsTable } from './components/StoredRecordsTable.tsx';
import { AnalyticsOverview } from './components/AnalyticsOverview.tsx';
import { ResponseComposerModal } from './components/ResponseComposerModal.tsx';
import { TemplateGallery } from './components/TemplateGallery.tsx';
import { VisualAnalyticsDashboard } from './components/VisualAnalyticsDashboard.tsx';
import { ClassifiedRequest, ResponseTemplate } from './types/classifier.ts';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('classifier');
  const [requests, setRequests] = useState<ClassifiedRequest[]>([]);
  const [highlightId, setHighlightId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [composerRequest, setComposerRequest] = useState<ClassifiedRequest | null>(null);

  // Fetch all stored requests from backend persistence
  const fetchRequests = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/requests');
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } catch (err) {
      console.error('Failed to fetch requests:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Handle new incoming classified item
  const handleClassified = (newRecord: ClassifiedRequest) => {
    setRequests((prev) => [newRecord, ...prev.filter((r) => r.id !== newRecord.id)]);
    setHighlightId(newRecord.id);
  };

  // View specific ticket in the store
  const handleViewInStore = (id?: string) => {
    setHighlightId(id);
    setActiveTab('storage');
  };

  // Test prompt from category catalog
  const handleTestPrompt = (sampleText: string, requester: string) => {
    setActiveTab('classifier');
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Update request (status or manual category override)
  const handleUpdateRequest = async (id: string, updates: Partial<ClassifiedRequest>) => {
    try {
      const res = await fetch(`/api/requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        const updated = await res.json();
        setRequests((prev) => prev.map((r) => (r.id === id ? updated : r)));
      }
    } catch (err) {
      console.error('Failed to update request:', err);
    }
  };

  // Delete single request
  const handleDeleteRequest = async (id: string) => {
    try {
      const res = await fetch(`/api/requests/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setRequests((prev) => prev.filter((r) => r.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete request:', err);
    }
  };

  // Clear all stored records
  const handleClearAll = async () => {
    try {
      const res = await fetch('/api/requests', { method: 'DELETE' });
      if (res.ok) {
        setRequests([]);
      }
    } catch (err) {
      console.error('Failed to clear records:', err);
    }
  };

  // Reset demo benchmark seeds
  const handleResetSeed = async () => {
    try {
      setIsResetting(true);
      const res = await fetch('/api/requests/seed', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } catch (err) {
      console.error('Failed to seed requests:', err);
    } finally {
      setIsResetting(false);
    }
  };

  // Open AI Response Composer for a ticket
  const handleOpenComposer = (request: ClassifiedRequest) => {
    setComposerRequest(request);
  };

  // Open composer from template gallery
  const handleSelectTemplateToDraft = (template: ResponseTemplate) => {
    const matchingReq = requests.find((r) => r.category === template.category) || requests[0];
    if (matchingReq) {
      setComposerRequest(matchingReq);
    }
  };

  // Handle reply attached
  const handleReplyAttached = (updated: ClassifiedRequest) => {
    setRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    setHighlightId(updated.id);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-indigo-500 selection:text-white">
      {/* Top Header Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalStored={requests.length}
        onResetSeed={handleResetSeed}
        isResetting={isResetting}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Sub-header Analytics Summary Bar (Quick glance on non-analytics tabs) */}
        {activeTab !== 'analytics' && (
          <div className="mb-6">
            <AnalyticsOverview requests={requests} />
          </div>
        )}

        {/* Tab Switcher Body */}
        {activeTab === 'classifier' && (
          <ClassifierConsole
            onClassified={handleClassified}
            onViewInStore={handleViewInStore}
            onDraftResponse={handleOpenComposer}
          />
        )}

        {activeTab === 'storage' && (
          <StoredRecordsTable
            requests={requests}
            highlightId={highlightId}
            onUpdateRequest={handleUpdateRequest}
            onDeleteRequest={handleDeleteRequest}
            onClearAll={handleClearAll}
            onRefresh={fetchRequests}
            onOpenComposer={handleOpenComposer}
          />
        )}

        {activeTab === 'templates' && (
          <TemplateGallery
            onSelectTemplateToDraft={handleSelectTemplateToDraft}
          />
        )}

        {activeTab === 'architecture' && (
          <ArchitectureBlueprint />
        )}

        {activeTab === 'categories' && (
          <CategoryCatalog
            requests={requests}
            onTestPrompt={handleTestPrompt}
          />
        )}

        {activeTab === 'analytics' && (
          <VisualAnalyticsDashboard
            requests={requests}
            onOpenComposer={handleOpenComposer}
          />
        )}
      </main>

      {/* Response Composer Modal */}
      {composerRequest && (
        <ResponseComposerModal
          request={composerRequest}
          isOpen={!!composerRequest}
          onClose={() => setComposerRequest(null)}
          onReplyAttached={handleReplyAttached}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="font-semibold text-slate-300">AutoTriage AI Architecture</span>
            <span>&bull;</span>
            <span>Gemini 3.8 Flash Classifier</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Categories: HR &bull; IT &bull; Finance &bull; Operations</span>
            <span>&bull;</span>
            <span>Indexed Persistent Storage</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
