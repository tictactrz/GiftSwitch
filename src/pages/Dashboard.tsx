import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../contexts/AuthContext";

interface Group {
  id: string;
  name: string;
  created_at: string;
  created_by: string;
}

interface Invite {
  id: string;
  group: Group;
  email: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export default function Dashboard() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [budget, setBudget] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showJoinGroup, setShowJoinGroup] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadGroups();
      loadInvites();
    }
  }, [user]);

  const loadGroups = async () => {
    try {
      const { data: memberGroups, error: memberError } = await supabase
        .from('group_members')
        .select('group:groups(*)')
        .eq('user_id', user?.id);

      if (memberError) throw memberError;

      const groups = memberGroups?.map(mg => mg.group as unknown as Group) || [];
      setGroups(groups);
    } catch (error) {
      console.error('Error loading groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadInvites = async () => {
    try {
      const { data: invites, error } = await supabase
        .from('group_invites')
        .select(`
          id,
          group:groups(*),
          email,
          status
        `)
        .eq('email', user?.email)
        .eq('status', 'pending');

      if (error) throw error;
      setInvites((invites || []).map(invite => ({
        ...invite,
        group: invite.group as unknown as Group
      })) as Invite[]);
    } catch (error) {
      console.error('Error loading invites:', error);
    }
  };

  const generateInviteCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const inviteCode = generateInviteCode();

      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .insert([
          { 
            name: newGroupName, 
            created_by: user?.id,
            budget: parseFloat(budget),
            code: inviteCode
          }
        ])
        .select()
        .single();

      if (groupError) throw groupError;

      const { error: memberError } = await supabase
        .from('group_members')
        .insert([
          { group_id: groupData.id, user_id: user?.id, role: 'admin' }
        ]);

      if (memberError) throw memberError;

      setNewGroupName('');
      setBudget('');
      setShowCreateGroup(false);
      loadGroups();
      navigate(`/groups/${groupData.id}`);
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    }
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      // Find the group with this code
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('code', joinCode.trim().toUpperCase())
        .single();

      if (groupError || !group) {
        throw new Error('Invalid invite code');
      }

      // Check if already a member
      const { data: existingMember } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', group.id)
        .eq('user_id', user?.id)
        .single();

      if (existingMember) {
        throw new Error('You are already a member of this group');
      }

      // Join the group
      const { error: joinError } = await supabase
        .from('group_members')
        .insert([
          { group_id: group.id, user_id: user?.id, role: 'member' }
        ]);

      if (joinError) throw joinError;

      setJoinCode('');
      setShowJoinGroup(false);
      loadGroups();
      navigate(`/groups/${group.id}`);
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    }
  };

  console.log('Dashboard State:', {
    groups,
    invites,
    loading,
    showCreateGroup,
    showJoinGroup,
    user
  });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow-sm rounded-lg p-6">
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Welcome to GiftSwitch</h1>
        <p className="mt-2 text-gray-600">Organize your Secret Santa gift exchange with friends and family.</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      {!showCreateGroup && !showJoinGroup && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
          <div 
            onClick={() => setShowCreateGroup(true)}
            className="bg-white shadow-sm rounded-lg p-4 md:p-6 hover:shadow-md transition-all cursor-pointer border border-gray-200 hover:border-primary"
          >
            <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white mb-4">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Create a New Group</h2>
            <p className="text-gray-600 mb-4">
              Start a new Secret Santa group for your family, friends, or colleagues. 
            </p>
            <ul className="text-gray-600 space-y-2 mb-4">
              <li className="flex items-center">
                <svg className="h-5 w-5 text-primary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Invite participants
              </li>
              <li className="flex items-center">
                <svg className="h-5 w-5 text-primary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Set up couples
              </li>
              <li className="flex items-center">
                <svg className="h-5 w-5 text-primary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Generate assignments
              </li>
            </ul>
          </div>

          <div 
            onClick={() => setShowJoinGroup(true)}
            className="bg-white shadow-sm rounded-lg p-4 md:p-6 hover:shadow-md transition-all cursor-pointer border border-gray-200 hover:border-secondary"
          >
            <div className="flex items-center justify-center h-12 w-12 rounded-md bg-secondary text-white mb-4">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Join a Group</h2>
            <p className="text-gray-600 mb-4">
              Been invited to a Secret Santa group? Join using your invite code.
            </p>
            <ul className="text-gray-600 space-y-2 mb-4">
              <li className="flex items-center">
                <svg className="h-5 w-5 text-secondary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                See your gift recipient
              </li>
              <li className="flex items-center">
                <svg className="h-5 w-5 text-secondary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Keep assignments secret
              </li>
              <li className="flex items-center">
                <svg className="h-5 w-5 text-secondary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Join the fun!
              </li>
            </ul>
          </div>
        </div>
      )}

      {showCreateGroup && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl transform transition-all w-full max-w-md">
            <div className="relative">
              <div className="bg-primary rounded-t-2xl p-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-white">Create New Group</h2>
                  <button
                    onClick={() => {
                      setShowCreateGroup(false);
                      setNewGroupName('');
                      setBudget('');
                    }}
                    className="text-white hover:text-gray-200 transition-colors"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="text-primary-light mt-2 text-sm">Set up your Secret Santa group in seconds</p>
              </div>

              <form onSubmit={handleCreateGroup} className="p-6">
                <div className="space-y-6">
                  <div>
                    <label htmlFor="groupName" className="block text-sm font-medium text-gray-700 mb-2">
                      Group Name
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        id="groupName"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        className="pl-10 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                        placeholder="Family Secret Santa 2024"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-2">
                      Budget per Person
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">$</span>
                      </div>
                      <input
                        type="number"
                        id="budget"
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                        className="pl-7 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                        placeholder="50"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                    <p className="mt-2 text-sm text-gray-500">Set a budget for each participant's gift</p>
                  </div>
                </div>

                <div className="mt-8">
                  <button
                    type="submit"
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                  >
                    Create Group
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showJoinGroup && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl transform transition-all w-full max-w-md">
            <div className="relative">
              <div className="bg-secondary rounded-t-2xl p-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-white">Join a Group</h2>
                  <button
                    onClick={() => {
                      setShowJoinGroup(false);
                      setJoinCode('');
                    }}
                    className="text-white hover:text-gray-200 transition-colors"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="text-secondary-light mt-2 text-sm">Enter your invite code to join the group</p>
              </div>

              <form onSubmit={handleJoinGroup} className="p-6">
                <div className="space-y-6">
                  <div>
                    <label htmlFor="joinCode" className="block text-sm font-medium text-gray-700 mb-2">
                      Invite Code
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        id="joinCode"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value)}
                        className="pl-10 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-secondary focus:border-secondary sm:text-sm"
                        placeholder="Enter your invite code"
                        required
                      />
                    </div>
                    <p className="mt-2 text-sm text-gray-500">The invite code was shared with you by the group creator</p>
                  </div>
                </div>

                <div className="mt-8">
                  <button
                    type="submit"
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-secondary hover:bg-secondary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary transition-colors"
                  >
                    Join Group
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {groups.length > 0 && (
        <div className="bg-white shadow-sm rounded-lg p-4 md:p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">My Groups</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((group) => (
              <div
                key={group.id}
                onClick={() => navigate(`/groups/${group.id}`)}
                className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm hover:border-gray-400 cursor-pointer"
              >
                <div className="flex flex-col">
                  <h3 className="text-lg font-medium text-gray-900">{group.name}</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Created {new Date(group.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
