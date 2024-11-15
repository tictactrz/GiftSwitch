import React, { useState } from 'react';

interface GroupMember {
  user_id: string;
  full_name: string;
}

interface SetCouplesModalProps {
  members: GroupMember[];
  onClose: () => void;
  onSetCouple: (partner1Id: string, partner2Id: string) => void;
  existingCouples: {partner1: string, partner2: string}[];
}

const SetCouplesModal: React.FC<SetCouplesModalProps> = ({ 
  members, 
  onClose, 
  onSetCouple,
  existingCouples 
}) => {
  const [partner1, setPartner1] = useState('');
  const [partner2, setPartner2] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSetCouple(partner1, partner2);
    setPartner1('');
    setPartner2('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-96 relative">
        <h2 className="text-xl font-bold mb-4">Set Couples</h2>
        
        {existingCouples.length > 0 && (
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Current Couples:</h3>
            {existingCouples.map((couple, index) => (
              <div key={index} className="text-sm text-gray-600">
                {members.find(m => m.user_id === couple.partner1)?.full_name} & {' '}
                {members.find(m => m.user_id === couple.partner2)?.full_name}
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <select
            value={partner1}
            onChange={(e) => setPartner1(e.target.value)}
            className="w-full p-2 border rounded mb-2"
            required
          >
            <option value="">Select Partner 1</option>
            {members.map(member => (
              <option key={member.user_id} value={member.user_id}>
                {member.full_name}
              </option>
            ))}
          </select>

          <select
            value={partner2}
            onChange={(e) => setPartner2(e.target.value)}
            className="w-full p-2 border rounded mb-4"
            required
          >
            <option value="">Select Partner 2</option>
            {members.map(member => (
              <option key={member.user_id} value={member.user_id}>
                {member.full_name}
              </option>
            ))}
          </select>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={!partner1 || !partner2 || partner1 === partner2}
              className="px-4 py-2 bg-[#6985c0] text-white rounded hover:bg-[#5874af] disabled:opacity-50 disabled:hover:bg-[#6985c0]"
            >
              Add Couple
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SetCouplesModal; 