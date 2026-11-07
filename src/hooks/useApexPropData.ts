import { useState, useEffect, useCallback } from 'react';
import {
  fetchMetrics,
  fetchInspections,
  fetchWorkOrders,
  fetchActivity,
  fetchSettings,
  approveInspection,
  createWorkOrder,
  updateWorkOrder,
  updateSettings
} from '../services/api';
import { InspectionRecord, WorkOrder, ActivityItem, DashboardMetrics } from '../types';

export function useApexPropData() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [inspections, setInspections] = useState<InspectionRecord[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [settings, setSettings] = useState<any>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const reloadData = useCallback(async () => {
    try {
      setLoadError(null);
      const [m, insp, wo, act, sett] = await Promise.all([
        fetchMetrics().catch(() => null),
        fetchInspections().catch(() => []),
        fetchWorkOrders().catch(() => []),
        fetchActivity().catch(() => []),
        fetchSettings().catch(() => null),
      ]);

      if (m) setMetrics(m);
      if (insp) setInspections(insp);
      if (wo) setWorkOrders(wo);
      if (act) setActivities(act);
      if (sett) setSettings(sett);
    } catch (err: any) {
      console.error('[useApexPropData] Failed to load data:', err);
      setLoadError(err?.message || 'Failed to connect to backend server.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    reloadData();
  }, [reloadData]);

  const handleApproveInspection = async (id: string, notes: string): Promise<void> => {
    const updated = await approveInspection(id, notes, settings?.inspectorName);
    setInspections((prev) => prev.map((i) => (i.id === id ? updated : i)));
    await reloadData();
  };

  const handleCreateWorkOrder = async (payload: Partial<WorkOrder>): Promise<void> => {
    const newWo = await createWorkOrder(payload);
    setWorkOrders((prev) => [newWo, ...prev]);
    await reloadData();
  };

  const handleUpdateWorkOrder = async (id: string, updates: Partial<WorkOrder>): Promise<void> => {
    const updated = await updateWorkOrder(id, updates);
    setWorkOrders((prev) => prev.map((w) => (w.id === id ? updated : w)));
    await reloadData();
  };

  const handleSaveSettings = async (newSettings: any): Promise<void> => {
    const updated = await updateSettings(newSettings);
    setSettings(updated);
  };

  return {
    metrics,
    inspections,
    setInspections,
    workOrders,
    activities,
    settings,
    isLoading,
    loadError,
    reloadData,
    handleApproveInspection,
    handleCreateWorkOrder,
    handleUpdateWorkOrder,
    handleSaveSettings
  };
}
