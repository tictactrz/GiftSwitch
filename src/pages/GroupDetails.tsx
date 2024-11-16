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

interface Couple {
  id: string;
  member1_id: string;
  member2_id: string;
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
  const [assignments, setAssignments] = useState<{giver_id: string, receiver_id: string}[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [couples, setCouples] = useState<Couple[]>([]);
  const [showAllAssignments, setShowAllAssignments] = useState(false);

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

      // Load couples
      const { data: couplesData, error: couplesError } = await supabase
        .from('couples')
        .select('*')
        .eq('group_id', id);

      if (couplesError) throw couplesError;
      setCouples(couplesData || []);

      // Load assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('gift_assignments')
        .select('*')
        .eq('group_id', id);

      if (assignmentsError) throw assignmentsError;
      setAssignments(assignmentsData || []);

      // Load invites
      const { data: invitesData, error: invitesError } = await supabase
        .from('group_invites')
        .select('*')
        .eq('group_id', id);

      if (invitesError) throw invitesError;
      setInvites(invitesData || []);

    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const generateAssignments = () => {
    console.log('Starting assignment generation with members:', members);
    console.log('Current couples:', couples);

    // Convert members to array of IDs
    const availableGivers = members.map(m => m.user_id);
    let availableReceivers = [...availableGivers];
    const newAssignments: {giver_id: string, receiver_id: string}[] = [];

    console.log('Available givers:', availableGivers);
    console.log('Available receivers:', availableReceivers);

    // Shuffle arrays
    availableGivers.sort(() => Math.random() - 0.5);
    availableReceivers.sort(() => Math.random() - 0.5);

    for (const giver of availableGivers) {
      // Find valid receivers (not self and not partner)
      const validReceivers = availableReceivers.filter(receiver => {
        // Can't be self
        if (receiver === giver) return false;
        
        // Can't be partner
        const isPartner = couples.some(couple => 
          (couple.member1_id === giver && couple.member2_id === receiver) ||
          (couple.member2_id === giver && couple.member1_id === receiver)
        );
        if (isPartner) return false;

        return true;
      });

      console.log(`Valid receivers for giver ${giver}:`, validReceivers);

      // If no valid receivers, start over
      if (validReceivers.length === 0) {
        console.log('No valid receivers found, restarting...');
        return generateAssignments(); // Recursive retry
      }

      // Pick random receiver from valid options
      const receiverIndex = Math.floor(Math.random() * validReceivers.length);
      const receiver = validReceivers[receiverIndex];

      // Add assignment
      newAssignments.push({ giver_id: giver, receiver_id: receiver });
      console.log(`Assigned ${giver} to give to ${receiver}`);

      // Remove used receiver
      availableReceivers = availableReceivers.filter(r => r !== receiver);
    }

    console.log('Final assignments:', newAssignments);
    return newAssignments;
  };

  const handleGenerateAssignments = async () => {
    try {
      if (members.length < 2) {
        setError('Need at least 2 members to generate assignments');
        return;
      }

      console.log('Generating assignments...');
      const newAssignments = generateAssignments();
      console.log('Generated assignments:', newAssignments);
      
      // First, delete any existing assignments
      const { error: deleteError } = await supabase
        .from('gift_assignments')
        .delete()
        .eq('group_id', id);

      if (deleteError) {
        console.error('Error deleting old assignments:', deleteError);
        throw deleteError;
      }

      // Then insert new assignments
      const { data, error: insertError } = await supabase
        .from('gift_assignments')
        .insert(newAssignments.map(a => ({
          group_id: id,
          giver_id: a.giver_id,
          receiver_id: a.receiver_id
        })))
        .select();

      if (insertError) {
        console.error('Error saving assignments:', insertError);
        throw insertError;
      }

      // Update local state
      setAssignments(newAssignments);
      console.log('Assignments saved successfully:', data);
    } catch (error) {
      console.error('Error in handleGenerateAssignments:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate assignments');
    }
  };

  const updateCouples = async (newCouples: Couple[]) => {
    try {
      // Delete existing couples for this group
      const { error: deleteError } = await supabase
        .from('couples')
        .delete()
        .eq('group_id', id);

      if (deleteError) throw deleteError;

      // Insert new couples if there are any
      if (newCouples.length > 0) {
        const { error: insertError } = await supabase
          .from('couples')
          .insert(
            newCouples.map(couple => ({
              id: couple.id,
              group_id: id,
              member1_id: couple.member1_id,
              member2_id: couple.member2_id
            }))
          );

        if (insertError) throw insertError;
      }

      setCouples(newCouples);
    } catch (error) {
      console.error('Error updating couples:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
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

      {/* Couples and Assignment Section */}
      {isAdmin && (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Couples</h3>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700">Current Couples</h4>
                {couples.map((couple, index) => (
                  <div key={index} className="mt-2 flex items-center space-x-2">
                    <select 
                      value={couple.member1_id}
                      onChange={(e) => {
                        const newCouples = [...couples];
                        newCouples[index].member1_id = e.target.value;
                        updateCouples(newCouples);
                      }}
                      className="rounded-md border-gray-300"
                    >
                      {members.map(member => (
                        <option key={member.user_id} value={member.user_id}>
                          {member.profiles?.full_name || member.profiles?.email}
                        </option>
                      ))}
                    </select>
                    <span>and</span>
                    <select
                      value={couple.member2_id}
                      onChange={(e) => {
                        const newCouples = [...couples];
                        newCouples[index].member2_id = e.target.value;
                        updateCouples(newCouples);
                      }}
                      className="rounded-md border-gray-300"
                    >
                      {members.map(member => (
                        <option key={member.user_id} value={member.user_id}>
                          {member.profiles?.full_name || member.profiles?.email}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => updateCouples(couples.filter((_, i) => i !== index))}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => updateCouples([...couples, { 
                    id: crypto.randomUUID(),
                    member1_id: members[0]?.user_id || '',
                    member2_id: members[1]?.user_id || ''
                  }])}
                  className="mt-2 text-sm text-primary hover:text-primary-dark"
                >
                  + Add Couple
                </button>
              </div>
              
              {!assignments.length && (
                <button
                  onClick={handleGenerateAssignments}
                  className="mt-4 w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark"
                >
                  Generate Assignments
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Assignments Display */}
      {assignments.length > 0 && (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              {isAdmin && showAllAssignments ? "All Assignments" : "Your Assignment"}
            </h3>
            <div className="flex space-x-3">
              {isAdmin && (
                <>
                  <button
                    onClick={handleGenerateAssignments}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Regenerate
                  </button>
                  <button
                    onClick={() => setShowAllAssignments(!showAllAssignments)}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    {showAllAssignments ? "Show My Assignment" : "Show All Assignments"}
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            {isAdmin && showAllAssignments ? (
              <div className="space-y-4">
                {assignments.map(assignment => {
                  const giver = members.find(m => m.user_id === assignment.giver_id);
                  const receiver = members.find(m => m.user_id === assignment.receiver_id);
                  return (
                    <div key={assignment.giver_id} className="flex justify-between items-center py-2 border-b border-gray-100">
                      <div className="font-medium text-gray-900">
                        {giver?.profiles?.full_name || giver?.profiles?.email}
                      </div>
                      <div className="flex items-center">
                        <svg className="h-5 w-5 text-gray-400 mx-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                        <div className="font-medium text-primary">
                          {receiver?.profiles?.full_name || receiver?.profiles?.email}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // Original single assignment view
              assignments
                .filter(a => a.giver_id === user?.id)
                .map(assignment => {
                  const receiver = members.find(m => m.user_id === assignment.receiver_id);
                  return (
                    <div key={assignment.receiver_id} className="text-center">
                      <p className="text-lg text-gray-900">You are buying a gift for:</p>
                      <p className="text-xl font-bold text-primary mt-2">
                        {receiver?.profiles?.full_name || receiver?.profiles?.email}
                      </p>
                    </div>
                  );
                })
            )}
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