/**
 * Admin Page - Room and Session Management
 * 
 * Provides admin controls for:
 * - Viewing all active rooms
 * - Viewing all Hyperbeam sessions
 * - Deleting rooms and sessions
 * - Server statistics
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  adminGetAllRooms,
  adminDeleteRoom,
  adminDeleteAllRooms,
  adminGetAllSessions,
  adminTerminateAllSessions,
  getServerStats,
  AdminRoom,
  HyperbeamSessionInfo
} from '@/lib/api';
import {
  Trash2,
  RefreshCw,
  Users,
  Monitor,
  Activity,
  AlertTriangle,
  Check,
  X,
  Eye,
  Clock,
  Zap,
  Shield,
  LogOut
} from 'lucide-react';

export default function AdminPage() {
  const router = useRouter();
  
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminToken, setAdminToken] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  
  // Data state
  const [rooms, setRooms] = useState<AdminRoom[]>([]);
  const [sessions, setSessions] = useState<HyperbeamSessionInfo[]>([]);
  const [stats, setStats] = useState<{
    totalRooms: number;
    totalParticipants: number;
    hyperbeamAvailable: boolean;
  } | null>(null);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'rooms' | 'sessions'>('rooms');
  const [confirmAction, setConfirmAction] = useState<{
    type: 'deleteRoom' | 'deleteAllRooms' | 'terminateAllSessions';
    roomId?: string;
  } | null>(null);

  // Load saved token from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('adminToken');
    if (savedToken) {
      setAdminToken(savedToken);
      setIsAuthenticated(true);
    }
  }, []);

  // Fetch data when authenticated
  const fetchData = useCallback(async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const [roomsData, sessionsData, statsData] = await Promise.all([
        adminGetAllRooms(adminToken),
        adminGetAllSessions(),
        getServerStats()
      ]);
      
      setRooms(roomsData.rooms);
      setSessions(sessionsData.sessions);
      setStats(statsData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
      if (err.message === 'Unauthorized') {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, adminToken]);

  useEffect(() => {
    fetchData();
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Handle login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (tokenInput.trim()) {
      setAdminToken(tokenInput.trim());
      localStorage.setItem('adminToken', tokenInput.trim());
      setIsAuthenticated(true);
      setTokenInput('');
    }
  };

  // Handle logout
  const handleLogout = () => {
    setAdminToken('');
    localStorage.removeItem('adminToken');
    setIsAuthenticated(false);
    setRooms([]);
    setSessions([]);
    setStats(null);
  };

  // Delete a single room
  const handleDeleteRoom = async (roomId: string) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      await adminDeleteRoom(roomId, adminToken);
      setSuccess(`Room ${roomId} deleted successfully`);
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete room');
    } finally {
      setLoading(false);
      setConfirmAction(null);
    }
  };

  // Delete all rooms
  const handleDeleteAllRooms = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const result = await adminDeleteAllRooms(adminToken);
      setSuccess(`Deleted ${result.deletedCount} rooms${result.failedCount > 0 ? ` (${result.failedCount} failed)` : ''}`);
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete rooms');
    } finally {
      setLoading(false);
      setConfirmAction(null);
    }
  };

  // Terminate all sessions
  const handleTerminateAllSessions = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const result = await adminTerminateAllSessions();
      setSuccess(`Terminated ${result.terminatedCount} sessions${result.failedCount > 0 ? ` (${result.failedCount} failed)` : ''}`);
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to terminate sessions');
    } finally {
      setLoading(false);
      setConfirmAction(null);
    }
  };

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  // Format time ago
  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-background-secondary border border-white/10 rounded-2xl p-8">
            <div className="flex items-center justify-center gap-3 mb-8">
              <Shield className="w-8 h-8 text-accent-primary" />
              <h1 className="text-2xl font-bold text-white">Admin Access</h1>
            </div>
            
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Admin Token
                </label>
                <input
                  type="password"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="Enter admin token..."
                  className="w-full px-4 py-3 bg-background-tertiary border border-white/10 rounded-xl text-white placeholder-text-muted focus:outline-none focus:border-accent-primary/50"
                />
              </div>
              
              <button
                type="submit"
                disabled={!tokenInput.trim()}
                className="w-full py-3 bg-accent-primary hover:bg-accent-primary/80 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-medium transition-colors"
              >
                Login
              </button>
            </form>
            
            <p className="text-text-muted text-sm text-center mt-6">
              Leave empty if no ADMIN_TOKEN is set on backend
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-primary">
      {/* Header */}
      <header className="bg-background-secondary border-b border-white/10 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-accent-primary" />
            <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-background-tertiary hover:bg-white/10 rounded-lg text-text-secondary transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-background-secondary border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Monitor className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-text-muted text-sm">Active Rooms</p>
                  <p className="text-2xl font-bold text-white">{stats.totalRooms}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-background-secondary border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Users className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-text-muted text-sm">Total Participants</p>
                  <p className="text-2xl font-bold text-white">{stats.totalParticipants}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-background-secondary border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Zap className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-text-muted text-sm">Hyperbeam Sessions</p>
                  <p className="text-2xl font-bold text-white">{sessions.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-background-secondary border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${stats.hyperbeamAvailable ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                  <Activity className={`w-5 h-5 ${stats.hyperbeamAvailable ? 'text-green-400' : 'text-red-400'}`} />
                </div>
                <div>
                  <p className="text-text-muted text-sm">Hyperbeam Status</p>
                  <p className={`text-lg font-bold ${stats.hyperbeamAvailable ? 'text-green-400' : 'text-red-400'}`}>
                    {stats.hyperbeamAvailable ? 'Available' : 'Unavailable'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Alerts */}
        {error && (
          <div className="mb-4 p-4 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center gap-3">
            <X className="w-5 h-5 text-red-400" />
            <p className="text-red-400">{error}</p>
            <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-4 bg-green-500/20 border border-green-500/30 rounded-xl flex items-center gap-3">
            <Check className="w-5 h-5 text-green-400" />
            <p className="text-green-400">{success}</p>
            <button onClick={() => setSuccess(null)} className="ml-auto text-green-400 hover:text-green-300">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => setActiveTab('rooms')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'rooms'
                ? 'bg-accent-primary text-white'
                : 'bg-background-secondary text-text-secondary hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              Rooms ({rooms.length})
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('sessions')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'sessions'
                ? 'bg-accent-primary text-white'
                : 'bg-background-secondary text-text-secondary hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Hyperbeam Sessions ({sessions.length})
            </div>
          </button>
        </div>

        {/* Rooms Tab */}
        {activeTab === 'rooms' && (
          <div className="space-y-4">
            {/* Actions */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Active Rooms</h2>
              {rooms.length > 0 && (
                <button
                  onClick={() => setConfirmAction({ type: 'deleteAllRooms' })}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete All Rooms
                </button>
              )}
            </div>

            {/* Room List */}
            {rooms.length === 0 ? (
              <div className="bg-background-secondary border border-white/10 rounded-xl p-8 text-center">
                <Monitor className="w-12 h-12 text-text-muted mx-auto mb-4" />
                <p className="text-text-secondary">No active rooms</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {rooms.map((room) => (
                  <div
                    key={room.id}
                    className="bg-background-secondary border border-white/10 rounded-xl p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-white">{room.name}</h3>
                          {room.hasHyperbeam && (
                            <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full">
                              Hyperbeam
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-text-muted">Room ID</p>
                            <p className="text-white font-mono">{room.id}</p>
                          </div>
                          <div>
                            <p className="text-text-muted">Participants</p>
                            <p className="text-white">{room.participantCount}</p>
                          </div>
                          <div>
                            <p className="text-text-muted">Created</p>
                            <p className="text-white">{formatTimeAgo(room.createdAt)}</p>
                          </div>
                          <div>
                            <p className="text-text-muted">Last Activity</p>
                            <p className="text-white">{formatTimeAgo(room.lastActivity)}</p>
                          </div>
                        </div>
                        
                        {room.participants.length > 0 && (
                          <div className="mt-3 flex items-center gap-2 flex-wrap">
                            <span className="text-text-muted text-sm">Participants:</span>
                            {room.participants.map((p) => (
                              <span
                                key={p.id}
                                className={`px-2 py-0.5 rounded-full text-xs ${
                                  p.role === 'host'
                                    ? 'bg-amber-500/20 text-amber-400'
                                    : 'bg-white/10 text-text-secondary'
                                }`}
                              >
                                {p.name} {p.role === 'host' && '(Host)'}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => window.open(`/room/${room.id}`, '_blank')}
                          className="p-2 bg-background-tertiary hover:bg-white/10 rounded-lg text-text-secondary transition-colors"
                          title="View Room"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setConfirmAction({ type: 'deleteRoom', roomId: room.id })}
                          className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 transition-colors"
                          title="Delete Room"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Sessions Tab */}
        {activeTab === 'sessions' && (
          <div className="space-y-4">
            {/* Actions */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Hyperbeam Sessions</h2>
              {sessions.length > 0 && (
                <button
                  onClick={() => setConfirmAction({ type: 'terminateAllSessions' })}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Terminate All Sessions
                </button>
              )}
            </div>

            {/* Session List */}
            {sessions.length === 0 ? (
              <div className="bg-background-secondary border border-white/10 rounded-xl p-8 text-center">
                <Zap className="w-12 h-12 text-text-muted mx-auto mb-4" />
                <p className="text-text-secondary">No active Hyperbeam sessions</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {sessions.map((session) => (
                  <div
                    key={session.session_id}
                    className="bg-background-secondary border border-white/10 rounded-xl p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Zap className="w-5 h-5 text-purple-400" />
                          <h3 className="text-lg font-semibold text-white font-mono">
                            {session.session_id}
                          </h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-text-muted">Embed URL</p>
                            <p className="text-white font-mono text-xs truncate max-w-md">
                              {session.embed_url}
                            </p>
                          </div>
                          {session.created_at && (
                            <div>
                              <p className="text-text-muted">Created</p>
                              <p className="text-white">{formatDate(session.created_at)}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background-secondary border border-white/10 rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Confirm Action</h3>
            </div>
            
            <p className="text-text-secondary mb-6">
              {confirmAction.type === 'deleteRoom' && (
                <>Are you sure you want to delete room <span className="font-mono text-white">{confirmAction.roomId}</span>? This will kick all participants.</>
              )}
              {confirmAction.type === 'deleteAllRooms' && (
                <>Are you sure you want to delete <span className="text-white font-bold">all {rooms.length} rooms</span>? This will kick all participants from all rooms.</>
              )}
              {confirmAction.type === 'terminateAllSessions' && (
                <>Are you sure you want to terminate <span className="text-white font-bold">all {sessions.length} Hyperbeam sessions</span>? This cannot be undone.</>
              )}
            </p>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="flex-1 py-2 bg-background-tertiary hover:bg-white/10 rounded-lg text-text-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (confirmAction.type === 'deleteRoom' && confirmAction.roomId) {
                    handleDeleteRoom(confirmAction.roomId);
                  } else if (confirmAction.type === 'deleteAllRooms') {
                    handleDeleteAllRooms();
                  } else if (confirmAction.type === 'terminateAllSessions') {
                    handleTerminateAllSessions();
                  }
                }}
                disabled={loading}
                className="flex-1 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 rounded-lg text-white font-medium transition-colors"
              >
                {loading ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
