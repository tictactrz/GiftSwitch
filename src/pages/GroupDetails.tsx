import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

interface Group {
  id: string;
  name: string;
  budget: number;
  code: string;
  created_at: string;
  created_by: string;
}

interface Member {
  id: string;
  user_id: string;
  role: string;
  profiles: {
    email: string;
    full_name?: string;
  };
}

export default function GroupDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);

  const isAdmin = members.some(
    member => member.user_id === user?.id && member.role === 'admin'
  );

  useEffect(() => {
    loadGroupDetails();
  }, [id]);

  const loadGroupDetails = async () => {
    try {
      // Load group details
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('id', id)
        .single();

      if (groupError) throw groupError;
      setGroup(groupData);

      // First get group members
      const { data: membersData, error: membersError } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', id);

      if (membersError) throw membersError;

      // Then get profiles for each member
      if (membersData) {
        const memberIds = membersData.map(member => member.user_id);
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .in('id', memberIds);

        if (profilesError) throw profilesError;

        // Combine the data
        const membersWithProfiles = membersData.map(member => ({
          ...member,
          profiles: profilesData?.find(profile => profile.id === member.user_id)
        }));

        setMembers(membersWithProfiles);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error || !group) {
    return (
      <div>
        <h3>Error loading group</h3>
        <p>{error || 'Group not found'}</p>
        <button onClick={() => navigate('/')}>Return to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{group.name}</h1>
          <p className="mt-1 text-sm text-gray-500">
            Created on {new Date(group.created_at).toLocaleDateString()}
          </p>
        </div>
        {isAdmin && (
          <div className="mt-4 sm:mt-0 space-x-3">
            <button
              onClick={() => setShowInviteModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path d="M11 5a3 3 0 11-6 0 3 3 0 016 0zM8 7a2 2 0 100-4 2 2 0 000 4z" />
                <path d="M10 10a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1H8a1 1 0 110-2h1v-1a1 1 0 011-1z" />
              </svg>
              Invite Members
            </button>
            <button
              onClick={() => setShowSettingsModal(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
              Settings
            </button>
          </div>
        )}
      </div>

      {/* Group Info Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500">Budget per Person</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">${group.budget}</dd>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500">Invite Code</dt>
            <dd className="mt-1 flex items-center">
              <span className="text-3xl font-mono font-semibold text-gray-900">{group.code}</span>
              <button
                onClick={() => navigator.clipboard.writeText(group.code)}
                className="ml-2 p-1 rounded-md hover:bg-gray-100"
                title="Copy code"
              >
                <svg className="h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                  <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                </svg>
              </button>
            </dd>
          </div>
        </div>
      </div>

      {/* Members List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Members</h3>
          <span className="px-3 py-1 text-sm text-gray-600 bg-gray-100 rounded-full">
            {members.length} {members.length === 1 ? 'member' : 'members'}
          </span>
        </div>
        <div className="border-t border-gray-200">
          <ul role="list" className="divide-y divide-gray-200">
            {members.map((member) => (
              <li key={member.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center min-w-0">
                    <div className="flex-shrink-0">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary">
                        <span className="text-lg font-medium leading-none text-white">
                          {member.profiles?.full_name?.[0] || member.profiles?.email[0].toUpperCase()}
                        </span>
                      </span>
                    </div>
                    <div className="ml-4 truncate">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {member.profiles?.full_name || 'Anonymous'}
                      </p>
                      <p className="text-sm text-gray-500 truncate">{member.profiles?.email}</p>
                    </div>
                  </div>
                  <div className="ml-2 flex-shrink-0">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize bg-primary bg-opacity-10 text-primary">
                      {member.role}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Pending Invites Section */}
      {isAdmin && invites.filter(i => i.status === 'pending').length > 0 && (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Pending Invites</h3>
          </div>
          <div className="border-t border-gray-200">
            <ul role="list" className="divide-y divide-gray-200">
              {invites.filter(i => i.status === 'pending').map(invite => (
                <li key={invite.id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-600">{invite.email}</p>
                      <p className="text-xs text-gray-400">Waiting to join</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Welcome Message */}
      {!assignments.length && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-blue-900">Welcome to {group?.name}!</h3>
          <div className="mt-2 text-sm text-blue-700">
            <p>Once everyone has joined, the admin will:</p>
            <ol className="list-decimal ml-5 mt-2 space-y-1">
              <li>Set up any couples (so partners don't get assigned to each other)</li>
              <li>Generate the Secret Santa assignments</li>
              <li>You'll then see who you need to buy a gift for!</li>
            </ol>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl transform transition-all w-full max-w-md">
            <div className="px-6 py-5 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Invite Members</h3>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="px-6 py-4">
              <div className="text-sm text-gray-500 mb-4">
                Share this invite code with your friends:
              </div>
              <div className="flex items-center space-x-2 bg-gray-50 p-4 rounded-lg">
                <span className="text-lg font-mono font-medium text-gray-900">{group.code}</span>
                <button
                  onClick={() => navigator.clipboard.writeText(group.code)}
                  className="ml-2 inline-flex items-center px-3 py-1 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl transform transition-all w-full max-w-md">
            <div className="px-6 py-5 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Group Settings</h3>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="px-6 py-4">
              <div className="space-y-4">
                <div>
                  <label htmlFor="groupName" className="block text-sm font-medium text-gray-700">
                    Group Name
                  </label>
                  <input
                    type="text"
                    id="groupName"
                    defaultValue={group.name}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="budget" className="block text-sm font-medium text-gray-700">
                    Budget per Person
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      id="budget"
                      defaultValue={group.budget}
                      className="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    />
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      // Add delete group functionality
                      if (confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
                        // Delete group
                      }
                    }}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-secondary hover:bg-secondary-dark"
                  >
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete Group
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 