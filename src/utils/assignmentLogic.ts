interface Member {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
  };
}

interface Couple {
  id: string;
  member1_id: string;
  member2_id: string;
}

export function generateAssignments(members: Member[], couples: Couple[]): [string, string][] {
  // Convert members to array of IDs
  let availableGivers = members.map(m => m.id);
  let availableReceivers = [...availableGivers];
  let assignments: [string, string][] = [];

  // Shuffle arrays
  availableGivers = shuffleArray(availableGivers);
  availableReceivers = shuffleArray(availableReceivers);

  // Try to generate valid assignments
  let attempts = 0;
  const maxAttempts = 100;

  while (attempts < maxAttempts) {
    assignments = [];
    const usedGivers = new Set<string>();
    const usedReceivers = new Set<string>();
    let valid = true;

    for (const giver of availableGivers) {
      // Find valid receiver
      let validReceiver = availableReceivers.find(receiver => {
        // Can't give to self
        if (giver === receiver) return false;
        
        // Can't give to partner
        const isCouple = couples.some(couple => 
          (couple.member1_id === giver && couple.member2_id === receiver) ||
          (couple.member2_id === giver && couple.member1_id === receiver)
        );
        if (isCouple) return false;

        // Can't give to someone already receiving
        if (usedReceivers.has(receiver)) return false;

        return true;
      });

      if (!validReceiver) {
        valid = false;
        break;
      }

      assignments.push([giver, validReceiver]);
      usedGivers.add(giver);
      usedReceivers.add(validReceiver);
    }

    if (valid) return assignments;
    
    // If not valid, shuffle and try again
    availableGivers = shuffleArray(availableGivers);
    availableReceivers = shuffleArray(availableReceivers);
    attempts++;
  }

  throw new Error("Could not generate valid assignments after maximum attempts");
}

function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
} 