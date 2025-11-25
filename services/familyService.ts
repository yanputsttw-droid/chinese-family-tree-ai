import { FamilyAccount, FamilyTreeData, LinkRequest, Person } from '../types';
import { mergeTrees } from '../utils';

// Relative path works because Docker server hosts both API and Frontend on same port
const API_BASE = '/api';

class FamilyService {
  
  private async fetchJson(url: string, options?: RequestInit) {
    const res = await fetch(`${API_BASE}${url}`, {
       headers: { 'Content-Type': 'application/json' },
       ...options
    });
    if (!res.ok) {
       // Try to parse error message
       const err = await res.json().catch(() => ({}));
       throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  }

  // --- Auth ---

  async register(code: string, name: string, password?: string, initialRoot?: Person): Promise<FamilyAccount> {
    const root = initialRoot || {
        id: `root_${code}`,
        name: 'Root Ancestor',
        gender: 'male',
        birthDate: '1900-01-01',
        originFamilyCode: code,
        children: []
    } as Person;

    return this.fetchJson('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ code, name, password, root })
    });
  }

  async login(code: string, password?: string): Promise<FamilyAccount> {
    return this.fetchJson('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ code, password })
    });
  }

  // --- Data ---

  async getFamilyRoot(code: string): Promise<Person | null> {
    try {
        const data = await this.fetchJson(`/family/${code}`);
        return data.root;
    } catch (e) {
        console.error("Get Root Failed", e);
        return null;
    }
  }

  async updateFamilyTree(code: string, newRoot: Person) {
    await this.fetchJson('/family/update', {
        method: 'POST',
        body: JSON.stringify({ code, root: newRoot })
    });
  }

  // --- Linking ---

  async requestLink(fromCode: string, toCode: string, targetName: string, targetBirthYear: string): Promise<boolean> {
     try {
         await this.fetchJson('/link/request', {
             method: 'POST',
             body: JSON.stringify({ fromCode, toCode, targetName, targetBirthYear })
         });
         return true;
     } catch (e) {
         console.error(e);
         return false;
     }
  }

  async getIncomingRequests(myCode: string): Promise<LinkRequest[]> {
     return this.fetchJson(`/link/incoming/${myCode}`);
  }

  async getOutgoingRequests(myCode: string): Promise<LinkRequest[]> {
     return this.fetchJson(`/link/outgoing/${myCode}`);
  }

  async approveRequest(requestId: string) {
     await this.fetchJson('/link/respond', {
         method: 'POST',
         body: JSON.stringify({ id: requestId, status: 'approved' })
     });
  }

  async rejectRequest(requestId: string) {
     await this.fetchJson('/link/respond', {
         method: 'POST',
         body: JSON.stringify({ id: requestId, status: 'rejected' })
     });
  }

  async toggleLinkVisibility(requestId: string, isHidden: boolean) {
     await this.fetchJson('/link/toggle', {
         method: 'POST',
         body: JSON.stringify({ id: requestId, isHidden })
     });
  }

  async getFamilyNetworkLinks(myCode: string): Promise<LinkRequest[]> {
     return this.fetchJson(`/link/network/${myCode}`);
  }

  // Recursive Merging (Async Version)
  async getMergedTreeData(familyCode: string): Promise<FamilyTreeData | null> {
    try {
        // 1. Get Network Links
        const allLinks = await this.getFamilyNetworkLinks(familyCode);
        
        // 2. Find Master
        let masterCode = familyCode;
        let currentCode = familyCode;
        const visited = new Set<string>();

        while (true) {
            if (visited.has(currentCode)) break;
            visited.add(currentCode);
            // Find outgoing link from current
            const outgoing = allLinks.find(r => r.fromFamilyCode === currentCode && r.status === 'approved');
            if (!outgoing) {
                masterCode = currentCode;
                break;
            }
            currentCode = outgoing.toFamilyCode;
        }

        // 3. Recursive Build
        
        const buildRecursive = async (code: string, buildVisited: Set<string>): Promise<Person> => {
            const root = await this.getFamilyRoot(code);
            if (!root) throw new Error(`Family ${code} missing`);

            const incoming = allLinks.filter(r => r.toFamilyCode === code && r.status === 'approved' && !r.isHidden);
            
            for (const link of incoming) {
                if (buildVisited.has(link.fromFamilyCode)) continue;
                
                const newVisited = new Set(buildVisited);
                newVisited.add(link.fromFamilyCode);
                
                const childTree = await buildRecursive(link.fromFamilyCode, newVisited);
                mergeTrees(root, childTree);
            }
            return root;
        };

        const finalRoot = await buildRecursive(masterCode, new Set([masterCode]));
        
        // Fetch Master Family Name
        const masterFamData = await this.fetchJson(`/family/${masterCode}`);

        const name = (masterCode === familyCode) 
            ? masterFamData.name 
            : `${masterFamData.name} (已关联)`;

        return { root: finalRoot, name };

    } catch (e) {
        console.error("Async Merge Failed", e);
        return null;
    }
  }
}

export const familyService = new FamilyService();
