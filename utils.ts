
import { Person, FamilyTreeData } from './types';
import { read, utils, writeFile } from 'xlsx';
import { Logger } from './logger';

// --- Date Helper ---

export const normalizeDate = (d: string | number | Date | undefined): string => {
  if (d === undefined || d === null || d === '') return '';
  
  // Handle Excel serial date if passed as number
  if (typeof d === 'number') {
    // Excel base date is Dec 30 1899 usually, simplified logic:
    const date = new Date(Math.round((d - 25569) * 86400 * 1000));
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  let dateStr = d.toString().trim();
  // Replace slashes with dashes (1990/6/25 -> 1990-6-25)
  dateStr = dateStr.replace(/\//g, '-');
  // Replace dots with dashes (1990.6.25 -> 1990-6-25)
  dateStr = dateStr.replace(/\./g, '-');
  
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr; // Return original if parsing fails
  
  // Format to YYYY-MM-DD
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const calculateAge = (birthDate: string, deathDate?: string): number => {
  if (!birthDate) return 0;
  const birth = new Date(normalizeDate(birthDate));
  const end = deathDate ? new Date(normalizeDate(deathDate)) : new Date();
  
  if (isNaN(birth.getTime())) return 0;

  let age = end.getFullYear() - birth.getFullYear();
  const m = end.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && end.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

export const getChineseZodiac = (birthDate: string): string => {
  if (!birthDate) return '';
  const year = new Date(normalizeDate(birthDate)).getFullYear();
  if (isNaN(year)) return '';
  const zodiacs = ['猴', '鸡', '狗', '猪', '鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊'];
  return zodiacs[year % 12];
};

export const getYearPillar = (birthDate: string): string => {
  if (!birthDate) return '';
  const year = new Date(normalizeDate(birthDate)).getFullYear();
  if (isNaN(year)) return '';
  const heavenlyStems = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  const earthlyBranches = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  
  const stemIndex = (year - 4) % 10;
  const branchIndex = (year - 4) % 12;
  
  return `${heavenlyStems[stemIndex < 0 ? stemIndex + 10 : stemIndex]}${earthlyBranches[branchIndex < 0 ? branchIndex + 12 : branchIndex]}`;
};

export const countChildrenGender = (children: Person[]) => {
  const boys = children.filter(c => c.gender === 'male').length;
  const girls = children.filter(c => c.gender === 'female').length;
  return { boys, girls };
};

// --- Tree Manipulation Helpers (Immutable) ---

export const flattenTree = (root: Person): Person[] => {
  let list: Person[] = [root];
  if (root.children) {
    for (const child of root.children) {
      list = [...list, ...flattenTree(child)];
    }
  }
  return list;
};

export const findNode = (root: Person, id: string): Person | null => {
  if (root.id === id) return root;
  if (root.children) {
    for (const child of root.children) {
      const found = findNode(child, id);
      if (found) return found;
    }
  }
  return null;
};

export const findNodeByNameAndYear = (root: Person, name: string, year: string): Person | null => {
  if (!root) return null;
  
  // Extract year from root birthDate
  const rootYear = normalizeDate(root.birthDate).split('-')[0];
  if (root.name === name && rootYear === year) {
    return root;
  }
  
  if (root.children) {
    for (const child of root.children) {
      const found = findNodeByNameAndYear(child, name, year);
      if (found) return found;
    }
  }
  return null;
};

// Helper to check if node B is a descendant of node A
export const isDescendant = (root: Person, potentialAncestorId: string, targetId: string): boolean => {
  const ancestor = findNode(root, potentialAncestorId);
  if (!ancestor) return false;
  // Check if targetId exists in ancestor's subtree
  return !!findNode(ancestor, targetId);
};

// Returns a deep copy of the tree with the specific node updated
export const updateNodeInTree = (root: Person, id: string, updates: Partial<Person>): Person => {
  if (root.id === id) {
    return { ...root, ...updates };
  }
  if (!root.children) return root;
  return {
    ...root,
    children: root.children.map(child => updateNodeInTree(child, id, updates))
  };
};

// Returns a deep copy of the tree with a new child added to the specified parent
export const addNodeToTree = (root: Person, parentId: string, newMember: Person): Person => {
  if (root.id === parentId) {
    return {
      ...root,
      children: [...(root.children || []), newMember]
    };
  }
  if (!root.children) return root;
  return {
    ...root,
    children: root.children.map(child => addNodeToTree(child, parentId, newMember))
  };
};

// Returns a deep copy of the tree with the node removed
export const deleteNodeFromTree = (root: Person, id: string): Person => {
  if (!root.children) return root;
  return {
    ...root,
    children: root.children
      .filter(child => child.id !== id)
      .map(child => deleteNodeFromTree(child, id))
  };
};

// Moves a node from one parent to another
export const moveNodeInTree = (root: Person, nodeId: string, newParentId: string): Person | null => {
  // 1. Find the node to move
  const nodeToMove = findNode(root, nodeId);
  if (!nodeToMove) return null;

  // 2. Remove it from old location
  const treeWithoutNode = deleteNodeFromTree(root, nodeId);

  // 3. Add it to new location
  return addNodeToTree(treeWithoutNode, newParentId, nodeToMove);
};

// Merges a branch tree into the main tree
// Logic: Find the root of branchTree in mainTree (by Name + BirthYear).
// If found, add branchTree's children to the mainTree node.
export const mergeTrees = (mainTree: Person, branchTree: Person): Person => {
  const year = normalizeDate(branchTree.birthDate).split('-')[0];
  const targetNode = findNodeByNameAndYear(mainTree, branchTree.name, year);

  if (targetNode) {
    Logger.info(`Merging branch starting at ${branchTree.name} (${year}) into main tree.`);
    
    // We need to add branchTree's children to targetNode's children
    // But we need to be careful not to duplicate if they already exist?
    // For simplicity in this feature, we assume the branch brings NEW unique data or overrides.
    // To keep it clean, we'll append branch children.
    
    const updatedChildren = [...(targetNode.children || [])];
    
    // Add children from branch that don't exist in target
    branchTree.children.forEach(branchChild => {
      const exists = updatedChildren.some(c => c.name === branchChild.name && c.birthDate === branchChild.birthDate);
      if (!exists) {
        updatedChildren.push(branchChild);
      }
    });

    return updateNodeInTree(mainTree, targetNode.id, { children: updatedChildren });
  } else {
    Logger.warn(`Could not merge branch. Node ${branchTree.name} (${year}) not found in main tree.`);
    return mainTree;
  }
};


// --- Advanced Relationship Logic ---

export const findPath = (root: Person, id: string): Person[] | null => {
  if (root.id === id) return [root];
  if (!root.children) return null;
  for (const child of root.children) {
    const path = findPath(child, id);
    if (path) {
      return [root, ...path];
    }
  }
  return null;
};

const isOlder = (a: Person, b: Person) => {
  // Returns true if A is older than B
  const dateA = new Date(normalizeDate(a.birthDate)).getTime();
  const dateB = new Date(normalizeDate(b.birthDate)).getTime();
  return dateA < dateB;
};

export const getSpouseRelationship = (relationshipToPartner: string, partnerGender: string, isOlderThanMe: boolean): string => {
  // Map blood relationships to spouse titles
  // relationshipToPartner is what the "Person" is to "Me". 
  // We want to know what their SPOUSE is to "Me".
  
  if (relationshipToPartner === "父亲") return "母亲"; // Typically handled by direct parents logic, but for step-parents: 继母
  if (relationshipToPartner === "母亲") return "父亲"; 

  if (relationshipToPartner === "哥哥") return "嫂子";
  if (relationshipToPartner === "弟弟") return "弟妹";
  if (relationshipToPartner === "姐姐") return "姐夫";
  if (relationshipToPartner === "妹妹") return "妹夫";

  if (relationshipToPartner === "伯父") return "伯母";
  if (relationshipToPartner === "叔叔") return "婶婶";
  if (relationshipToPartner === "舅舅") return "舅妈";
  if (relationshipToPartner === "姑姑") return "姑父";
  if (relationshipToPartner === "姨妈") return "姨父";
  
  if (relationshipToPartner === "儿子") return "儿媳";
  if (relationshipToPartner === "女儿") return "女婿";
  
  if (relationshipToPartner === "孙子") return "孙媳";
  if (relationshipToPartner === "孙女") return "孙婿";

  if (relationshipToPartner.includes("堂兄") || relationshipToPartner.includes("表兄")) return "嫂子"; // Simplified
  if (relationshipToPartner.includes("堂弟") || relationshipToPartner.includes("表弟")) return "弟妹";
  
  return "配偶"; // Fallback
};

export const getRelationship = (root: Person, meId: string, targetId: string): string => {
  if (meId === targetId) return "我";

  // 1. Check if target is a spouse of someone in the tree
  // We need to traverse to find if targetId matches any spouse logic? 
  // Since Spouse doesn't have an ID in our simplified model (they are attributes of Person), 
  // we assume targetId passed here refers to a Node ID. 
  // However, if the UI selects a "Spouse Card", we might need to handle that. 
  // Current Architecture: Spouse is just display data, not a node with ID in the tree traversal.
  // So standard logic applies to the NODE.
  
  const pathMe = findPath(root, meId);
  const pathTarget = findPath(root, targetId);

  if (!pathMe || !pathTarget) return "";

  // Find Lowest Common Ancestor (LCA)
  let lcaIndex = 0;
  while (
    lcaIndex < pathMe.length && 
    lcaIndex < pathTarget.length && 
    pathMe[lcaIndex].id === pathTarget[lcaIndex].id
  ) {
    lcaIndex++;
  }
  // The last matching index is lcaIndex - 1
  
  const depthMe = pathMe.length - lcaIndex;     // Steps from LCA down to Me
  const depthTarget = pathTarget.length - lcaIndex; // Steps from LCA down to Target

  // Case 0: Direct Lineage
  if (depthMe === 0) {
    // Me is ancestor of Target
    if (depthTarget === 1) return pathTarget[pathTarget.length-1].gender === 'male' ? "儿子" : "女儿";
    if (depthTarget === 2) {
      const child = pathTarget[lcaIndex]; // My child
      const grandChild = pathTarget[pathTarget.length-1];
      if (child.gender === 'male') return grandChild.gender === 'male' ? "孙子" : "孙女";
      return grandChild.gender === 'male' ? "外孙" : "外孙女";
    }
    if (depthTarget >= 3) return "晚辈";
  }

  if (depthTarget === 0) {
    // Target is ancestor of Me
    if (depthMe === 1) return pathTarget[pathTarget.length-1].gender === 'male' ? "父亲" : "母亲";
    if (depthMe === 2) {
      const parent = pathMe[lcaIndex]; // My parent (Child of LCA/Target)
      const grandParent = pathTarget[pathTarget.length-1];
      if (parent.gender === 'male') return grandParent.gender === 'male' ? "祖父" : "祖母";
      return grandParent.gender === 'male' ? "外祖父" : "外祖母";
    }
    if (depthMe === 3) return "曾祖辈";
  }

  // Case 1: Same Generation (Siblings / Cousins)
  if (depthMe === 1 && depthTarget === 1) {
    // Siblings
    const me = pathMe[pathMe.length-1];
    const target = pathTarget[pathTarget.length-1];
    if (target.gender === 'male') return isOlder(target, me) ? "哥哥" : "弟弟";
    return isOlder(target, me) ? "姐姐" : "妹妹";
  }

  if (depthMe === 2 && depthTarget === 2) {
    // First Cousins
    const myParent = pathMe[lcaIndex];
    const targetParent = pathTarget[lcaIndex];
    const me = pathMe[pathMe.length-1];
    const target = pathTarget[pathTarget.length-1];
    
    // Tang: Father's Brother's kids
    const isTang = myParent.gender === 'male' && targetParent.gender === 'male';
    const prefix = isTang ? "堂" : "表";
    
    if (target.gender === 'male') return prefix + (isOlder(target, me) ? "兄" : "弟");
    return prefix + (isOlder(target, me) ? "姐" : "妹");
  }

  // Case 2: Uncles / Aunts (Target is sibling of my Parent)
  // Me is grandchild of LCA (depth 2), Target is child of LCA (depth 1)
  if (depthMe === 2 && depthTarget === 1) {
    const myParent = pathMe[lcaIndex];
    const target = pathTarget[pathTarget.length-1]; // My parent's sibling
    
    if (myParent.gender === 'male') {
      // Father's side
      if (target.gender === 'male') return isOlder(target, myParent) ? "伯父" : "叔叔";
      return "姑姑";
    } else {
      // Mother's side
      if (target.gender === 'male') return "舅舅";
      return "姨妈";
    }
  }

  // Case 3: Nephews / Nieces (Target is child of my Sibling)
  // Me is child of LCA (depth 1), Target is grandchild of LCA (depth 2)
  if (depthMe === 1 && depthTarget === 2) {
    const sibling = pathTarget[lcaIndex];
    const target = pathTarget[pathTarget.length-1];
    
    // Standard rule: Brother's kids -> Zhi, Sister's kids -> WaiSheng
    if (sibling.gender === 'male') return target.gender === 'male' ? "侄子" : "侄女";
    return target.gender === 'male' ? "外甥" : "外甥女";
  }

  // Case 4: Grand Uncles / Aunts (Siblings of Grandparents)
  // Me is GreatGrandchild of LCA (depth 3), Target is Child of LCA (depth 1)
  if (depthMe === 3 && depthTarget === 1) {
    const myGrandParent = pathMe[lcaIndex]; // Child of LCA
    const myParent = pathMe[lcaIndex+1];    // Child of GP
    const target = pathTarget[pathTarget.length-1]; // GP's Sibling

    // We need to know if Grandparent is Paternal Grandfather (Father's Father)
    if (myParent.gender === 'male' && myGrandParent.gender === 'male') {
       // Paternal Grandfather's siblings
       if (target.gender === 'male') return isOlder(target, myGrandParent) ? "伯公" : "叔公";
       return "姑婆";
    } else if (myParent.gender === 'male' && myGrandParent.gender === 'female') {
       // Paternal Grandmother's siblings
       if (target.gender === 'male') return "舅公";
       return "姨婆";
    } else {
       // Mother's side (Maternal Grandparents)
       // Usually simplified to Wai... or just JiuGong/YiPo
       if (target.gender === 'male') return "外舅公"; // or 舅公
       return "外姨婆"; // or 姨婆
    }
  }

  return "亲戚";
};

// --- Birthday & Anniversary Logic ---

export interface BirthdayInfo {
  name: string;
  date: string; // YYYY-MM-DD (Birth Date)
  nextDate: string; // YYYY-MM-DD (Upcoming Birthday)
  turningAge: number;
  daysUntil: number;
}

export interface DeathAnniversaryInfo {
  name: string;
  deathDate: string; // YYYY-MM-DD
  anniversaryDate: string; // YYYY-MM-DD (Upcoming Anniversary)
  years: number; // Years since death
  daysUntil: number;
}

export const getUpcomingBirthdays = (root: Person): BirthdayInfo[] => {
  const allMembers = flattenTree(root);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const results: BirthdayInfo[] = [];

  const checkBirthday = (name: string, birthDateStr?: string, deathDateStr?: string) => {
    // Only calculate for living members
    if (deathDateStr) return;
    if (!birthDateStr) return;
    
    const date = new Date(normalizeDate(birthDateStr));
    if (isNaN(date.getTime())) return;

    const currentYear = today.getFullYear();
    let nextBirthday = new Date(currentYear, date.getMonth(), date.getDate());

    if (nextBirthday < today) {
      nextBirthday.setFullYear(currentYear + 1);
    }

    const diffTime = nextBirthday.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 7 && diffDays >= 0) {
      const y = nextBirthday.getFullYear();
      const m = (nextBirthday.getMonth() + 1).toString().padStart(2, '0');
      const d = nextBirthday.getDate().toString().padStart(2, '0');
      
      let turningAge = nextBirthday.getFullYear() - date.getFullYear();

      results.push({
        name,
        date: normalizeDate(birthDateStr),
        nextDate: `${y}-${m}-${d}`,
        turningAge,
        daysUntil: diffDays
      });
    }
  };

  allMembers.forEach(member => {
    checkBirthday(member.name, member.birthDate, member.deathDate);
    if (member.spouse) {
       checkBirthday(member.spouse + " (配偶)", member.spouseBirthDate, member.spouseDeathDate);
    }
  });

  return results.sort((a, b) => a.daysUntil - b.daysUntil);
};

export const getUpcomingDeathAnniversaries = (root: Person): DeathAnniversaryInfo[] => {
  const allMembers = flattenTree(root);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const results: DeathAnniversaryInfo[] = [];

  const checkAnniversary = (name: string, deathDateStr?: string) => {
    if (!deathDateStr) return;
    
    const date = new Date(normalizeDate(deathDateStr));
    if (isNaN(date.getTime())) return;

    const currentYear = today.getFullYear();
    let nextAnniversary = new Date(currentYear, date.getMonth(), date.getDate());

    // If anniversary passed this year, look at next year? 
    // Usually for 'upcoming' we look ahead.
    if (nextAnniversary < today) {
      nextAnniversary.setFullYear(currentYear + 1);
    }

    const diffTime = nextAnniversary.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 30 && diffDays >= 0) {
      const y = nextAnniversary.getFullYear();
      const m = (nextAnniversary.getMonth() + 1).toString().padStart(2, '0');
      const d = nextAnniversary.getDate().toString().padStart(2, '0');
      
      let years = nextAnniversary.getFullYear() - date.getFullYear();

      results.push({
        name,
        deathDate: normalizeDate(deathDateStr),
        anniversaryDate: `${y}-${m}-${d}`,
        years,
        daysUntil: diffDays
      });
    }
  };

  allMembers.forEach(member => {
    checkAnniversary(member.name, member.deathDate);
    if (member.spouse) {
      checkAnniversary(member.spouse + " (配偶)", member.spouseDeathDate);
    }
  });

  return results.sort((a, b) => a.daysUntil - b.daysUntil);
};

// --- Excel Logic ---

export interface ExcelRow {
  // Common Keys in Chinese Excel
  '名称': string;
  '姓名': string;
  '性别': string;
  '出生日期': string;
  '生日': string;
  '离世日期': string;
  '父亲': string;
  '母亲': string;
  '配偶': string;
  '配偶姓名': string;
  '配偶出生日期': string;
  '配偶生日': string;
  '配偶离世日期': string;
  [key: string]: any; // Allow loose keys
}

export const downloadTemplate = () => {
  const templateData = [
    {
      '名称': '张伟 (示例)',
      '性别': '男',
      '出生日期': '1980-05-20',
      '离世日期': '',
      '配偶': '王芳',
      '配偶出生日期': '1982-08-15',
      '配偶离世日期': '',
      '父亲': '张父',
      '母亲': '张母'
    },
    {
      '名称': '格式说明',
      '性别': '日期格式',
      '出生日期': '推荐 YYYY-MM-DD 或 YYYY/MM/DD',
      '离世日期': '',
      '配偶': '',
      '配偶出生日期': '',
      '配偶离世日期': '',
      '父亲': '',
      '母亲': ''
    }
  ];

  const ws = utils.json_to_sheet(templateData);
  // Auto-width for columns
  ws['!cols'] = [
    { wch: 15 }, // 名称
    { wch: 8 },  // 性别
    { wch: 20 }, // 出生
    { wch: 20 }, // 离世
    { wch: 15 }, // 配偶
    { wch: 20 }, // 配偶出生
    { wch: 20 }, // 配偶离世
    { wch: 15 }, // 父亲
    { wch: 15 }, // 母亲
  ];
  
  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, "导入模板");
  writeFile(wb, `家族树导入模板.xlsx`);
};

export const parseExcel = async (file: File): Promise<FamilyTreeData | null> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Use generic array of objects first
        let rawJson = utils.sheet_to_json(worksheet) as any[];

        Logger.info(`Excel parsed. Raw rows found: ${rawJson.length}`);

        if (rawJson.length === 0) {
          resolve(null);
          return;
        }

        // Normalize Keys: Trim whitespace from keys
        const jsonData = rawJson.map(row => {
          const newRow: any = {};
          Object.keys(row).forEach(key => {
            newRow[key.trim()] = row[key];
          });
          return newRow;
        });

        const peopleMap = new Map<string, Person>();
        const parentMap = new Map<string, { father?: string, mother?: string }>();
        let rootNode: Person | null = null;

        // 1. First pass: Create all Persons
        jsonData.forEach((row, index) => {
          // Robust column finding helper
          const getVal = (candidates: string[]): string | undefined => {
             for (const key of Object.keys(row)) {
                // Remove all spaces and check
                const cleanKey = key.trim().replace(/\s+/g, '');
                if (candidates.includes(cleanKey)) return row[key];
             }
             return undefined;
          };

          const name = String(getVal(['名称', '姓名', '名字']) || '').trim();
          if (!name || name === '格式说明') return; // Skip example/empty rows

          const genderRaw = String(getVal(['性别']) || '男').trim();
          const gender = (genderRaw === '女' || genderRaw.toLowerCase() === 'female') ? 'female' : 'male';
          
          const birthDateRaw = getVal(['出生日期', '生日', '生辰', '出生']);
          const deathDateRaw = getVal(['离世日期', '离世', '忌日', '死亡日期']);

          // Spouse Data
          const spouseName = String(getVal(['配偶', '配偶姓名', '妻子', '丈夫']) || '').trim();
          
          const spouseBirthRaw = getVal(['配偶出生日期', '配偶生日', '配偶出生', '配偶生辰', '妻出生', '夫出生']);
          const spouseDeathRaw = getVal(['配偶离世日期', '配偶离世', '配偶死亡', '配偶忌日', '配偶卒于']);

          // Logging for Debugging Spouse Data
          if (spouseName) {
            Logger.info(`Row ${index + 1}: Found Spouse "${spouseName}" for "${name}"`, {
                rawBirth: spouseBirthRaw,
                normBirth: normalizeDate(spouseBirthRaw),
                rawDeath: spouseDeathRaw
            });
          }

          const person: Person = {
            id: `p_${index}_${Math.random().toString(36).substr(2,5)}`,
            name: name,
            gender: gender,
            birthDate: normalizeDate(birthDateRaw),
            deathDate: normalizeDate(deathDateRaw),
            spouse: spouseName || undefined,
            spouseBirthDate: normalizeDate(spouseBirthRaw),
            spouseDeathDate: normalizeDate(spouseDeathRaw),
            children: []
          };
          
          peopleMap.set(name, person);

          const father = String(getVal(['父亲', '爸爸', '父']) || '').trim();
          const mother = String(getVal(['母亲', '妈妈', '母']) || '').trim();
          if (father || mother) {
            parentMap.set(name, { father, mother });
          } else {
             // Potential Root
             if (!rootNode) rootNode = person; // First one without parents is likely root
          }
        });

        // If no explicit root found (e.g. everyone has parents listed but some parents missing from file), pick the first one
        if (!rootNode && peopleMap.size > 0) {
           rootNode = peopleMap.values().next().value;
           Logger.warn("未找到明确的根节点（无父母），默认使用第一行数据作为根节点。");
        }

        // 2. Second pass: Link Parents
        parentMap.forEach((parents, childName) => {
          const childNode = peopleMap.get(childName);
          if (!childNode) return;

          const fatherNode = parents.father ? peopleMap.get(parents.father) : undefined;
          const motherNode = parents.mother ? peopleMap.get(parents.mother) : undefined;

          // Prefer linking to Father, then Mother
          const parentNode = fatherNode || motherNode;

          if (parentNode) {
            // Check if already added to avoid duplicates
            if (!parentNode.children.find(c => c.id === childNode.id)) {
                parentNode.children.push(childNode);
            }
            // If child was tentative root, but we found a parent, unset root
            if (rootNode === childNode) {
               rootNode = parentNode; // Move root up? 
               // This logic is tricky. Better to find true root: one who has no parent in the map.
            }
          } else {
             Logger.warn(`Child ${childName} has parents listed (${parents.father}, ${parents.mother}) but they are not in the file.`);
          }
        });

        // 3. Find true root (node not in values of children arrays? No, simpler: node with no parent in parentMap OR parent not in file)
        // Actually, just find the top-most node we can reach.
        const hasParent = new Set<string>();
        parentMap.forEach((parents, childName) => {
           if (peopleMap.has(parents.father || '') || peopleMap.has(parents.mother || '')) {
             hasParent.add(childName);
           }
        });

        const roots = Array.from(peopleMap.values()).filter(p => !hasParent.has(p.name));
        if (roots.length > 0) {
           rootNode = roots[0];
           if (roots.length > 1) {
             Logger.warn(`Found multiple potential roots: ${roots.map(r => r.name).join(', ')}. Using ${rootNode.name}.`);
           }
        }

        if (rootNode) {
          resolve({
            root: rootNode,
            name: `${rootNode.name.substring(0, 1)}氏家族`
          });
        } else {
          reject("无法构建家族树：未能找到根节点。");
        }
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};

export const exportExcel = (data: FamilyTreeData) => {
  const rows: any[] = [];
  
  const traverse = (node: Person, fatherName: string = '', motherName: string = '') => {
    rows.push({
      '名称': node.name,
      '性别': node.gender === 'male' ? '男' : '女',
      '出生日期': node.birthDate,
      '离世日期': node.deathDate || '',
      '配偶': node.spouse || '',
      '配偶出生日期': node.spouseBirthDate || '',
      '配偶离世日期': node.spouseDeathDate || '',
      '父亲': fatherName,
      '母亲': motherName
    });

    node.children.forEach(child => {
      // Assuming node is father if male, mother if female
      const f = node.gender === 'male' ? node.name : (node.spouse || '');
      const m = node.gender === 'female' ? node.name : (node.spouse || '');
      traverse(child, f, m);
    });
  };

  traverse(data.root);

  const ws = utils.json_to_sheet(rows);
  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, "家族成员");
  writeFile(wb, `${data.name}_Data.xlsx`);
};
