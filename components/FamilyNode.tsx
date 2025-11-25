
import React from 'react';
import { Person } from '../types';
import { calculateAge, getChineseZodiac, countChildrenGender, getRelationship, getSpouseRelationship } from '../utils';
import { User, Baby, CheckCircle2, HeartHandshake, Cloud, Cake, Link as LinkIcon } from 'lucide-react';

interface FamilyNodeProps {
  member: Person;
  generation: number;
  root: Person;
  selectedId: string | null;
  onSelect: (id: string) => void;
  currentFamilyCode?: string; // To distinguish branches
}

const FamilyNode: React.FC<FamilyNodeProps> = ({ member, generation, root, selectedId, onSelect, currentFamilyCode }) => {
  const age = calculateAge(member.birthDate, member.deathDate);
  const zodiac = getChineseZodiac(member.birthDate);
  const { boys, girls } = countChildrenGender(member.children);

  const isMale = member.gender === 'male';
  const isSelected = selectedId === member.id;
  const isDeceased = !!member.deathDate;
  const isBranch = currentFamilyCode && member.originFamilyCode && member.originFamilyCode !== currentFamilyCode;
  
  const relationship = selectedId ? getRelationship(root, selectedId, member.id) : null;
  
  // Spouse Logic
  const spouseRelationship = (relationship && member.spouse) 
     ? getSpouseRelationship(relationship, member.gender === 'male' ? 'female' : 'male', false) 
     : null;

  // Spouse calculations
  const spouseGender = member.gender === 'male' ? 'female' : 'male';
  const spouseBirth = member.spouseBirthDate || ''; 
  const spouseDeath = member.spouseDeathDate;
  const spouseAge = spouseBirth ? calculateAge(spouseBirth, spouseDeath) : '?';
  const spouseZodiac = spouseBirth ? getChineseZodiac(spouseBirth) : '';
  const spouseIsDeceased = !!spouseDeath;

  // --- Style Helpers ---
  const getCardStyles = (gender: 'male' | 'female', deceased: boolean, selected: boolean, isBranchNode: boolean) => {
    let borderColor = 'border-gray-300';
    let bgColor = 'bg-white';
    let textColor = 'text-gray-800';
    let headerBg = 'bg-gray-100';
    let headerText = 'text-gray-600';
    let iconBg = gender === 'male' ? 'bg-blue-500' : 'bg-pink-500'; // Default gender color
    let borderStyle = 'border-solid';

    if (isBranchNode) {
       borderStyle = 'border-dashed';
       bgColor = 'bg-gray-50/80'; // Slightly transparent/different for branches
    }

    if (deceased) {
      // Deceased Overrides
      borderColor = 'border-gray-600'; // Black/Gray Frame
      bgColor = 'bg-gray-50';          // Pale Gray Body
      textColor = 'text-gray-500';     // Muted Text
      headerBg = 'bg-gray-800';        // Dark Header
      headerText = 'text-gray-300';
      
      // Retain gender distinction but darken it for deceased
      iconBg = gender === 'male' ? 'bg-blue-900' : 'bg-pink-900'; 
    } else if (gender === 'male') {
      borderColor = isBranchNode ? 'border-blue-300' : 'border-blue-500';
      headerBg = isBranchNode ? 'bg-blue-50/50' : 'bg-blue-50';
      headerText = 'text-blue-800';
      textColor = 'text-gray-900';
    } else {
      borderColor = isBranchNode ? 'border-pink-300' : 'border-pink-500';
      headerBg = isBranchNode ? 'bg-pink-50/50' : 'bg-pink-50';
      headerText = 'text-pink-800';
      textColor = 'text-gray-900';
    }

    if (selected) {
      borderColor = 'border-gold-accent ring-2 ring-gold-accent ring-offset-2';
      borderStyle = 'border-solid'; // Selected always solid
    }

    return { borderColor, bgColor, textColor, headerBg, headerText, iconBg, borderStyle };
  };

  const mainStyles = getCardStyles(member.gender, isDeceased, isSelected, !!isBranch);
  const spouseStyles = getCardStyles(spouseGender, spouseIsDeceased, false, !!isBranch);

  // Card Components
  const PersonCard = ({ 
    name, 
    styles, 
    isSpouse = false,
    data = {} as any,
    displayAge,
    displayZodiac,
    isDead,
    birthDateStr,
    relBadge
  }: { 
    name: string, 
    styles: any, 
    isSpouse?: boolean, 
    data?: any, 
    displayAge: string | number,
    displayZodiac: string,
    isDead: boolean,
    birthDateStr?: string,
    relBadge?: string | null
  }) => (
    <div 
      className={`w-52 rounded-lg shadow-md border-t-4 overflow-hidden relative transition-all duration-300 ${styles.borderColor} ${styles.bgColor} ${styles.borderStyle} ${!isSpouse && 'cursor-pointer hover:-translate-y-1'}`}
      onClick={(e) => {
        if (!isSpouse) {
          e.stopPropagation();
          onSelect(member.id);
        }
      }}
      id={!isSpouse ? `node-${member.id}` : undefined}
    >
       {/* Branch Indicator */}
       {isBranch && !isSpouse && (
         <div className="absolute top-1 right-1 text-gray-400 opacity-50" title="挂靠家族成员">
            <LinkIcon className="w-3 h-3" />
         </div>
       )}

       {/* Relationship Badge */}
       {!isSpouse && relBadge && (
          <div className={`absolute -right-2 -top-2 z-20 px-2 py-0.5 rounded-full text-xs font-bold shadow-md transform rotate-6 flex items-center gap-1 ${
            relBadge === '我' 
              ? 'bg-china-red text-white border border-white' 
              : 'bg-gold-accent text-gray-900 border border-white'
          }`}>
             {relBadge === '我' && <CheckCircle2 className="w-3 h-3"/>}
             {relBadge}
          </div>
        )}
        {isSpouse && relBadge && (
           <div className="absolute -right-2 -top-2 z-20 px-2 py-0.5 rounded-full text-xs font-bold shadow-md transform rotate-6 bg-purple-100 text-purple-800 border border-white">
              {relBadge}
           </div>
        )}

        {/* Header */}
        <div className={`px-3 py-1.5 flex justify-between items-center ${styles.headerBg} ${styles.headerText}`}>
          <span className="text-[10px] uppercase tracking-wider opacity-90 font-medium">
            {isSpouse ? '配偶' : `第 ${generation} 代`}
          </span>
          <span className="text-[10px] font-bold border border-current rounded px-1">{displayZodiac || '?'}</span>
        </div>

        {/* Body */}
        <div className="p-3">
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 shadow-sm overflow-hidden ${styles.iconBg}`}>
               {data.photoUrl ? (
                 <img 
                   src={data.photoUrl} 
                   alt={name} 
                   className={`w-full h-full object-cover ${isDead ? 'grayscale' : ''}`} // Black and white photo if deceased
                 />
               ) : (
                 isDead ? <Cloud className="w-4 h-4" /> : <User className="w-4 h-4" />
               )}
            </div>
            <div className="overflow-hidden">
               <h3 className={`font-bold font-calligraphy text-lg truncate ${styles.textColor} ${isDead && 'line-through decoration-gray-400/50'}`}>{name}</h3>
               <div className="text-[10px] text-gray-500 flex flex-col">
                  <span className="flex items-center gap-1">
                    {displayAge} {isDead ? '享年' : '岁'}
                    {isDead && <span className="bg-gray-800 text-white px-1 py-0 text-[8px] rounded ml-1">故</span>}
                  </span>
               </div>
            </div>
          </div>
          
          <div className="text-[10px] text-gray-400 flex items-center gap-1 mb-2 pl-0.5">
             <Cake className="w-3 h-3 text-pink-400" />
             <span>{birthDateStr || '未知日期'}</span>
          </div>
          
          {!isSpouse && (
             <div className="space-y-1 mt-2 pt-2 border-t border-dashed border-gray-200">
               <div className="flex items-center justify-between text-xs">
                 <span className="text-gray-400 flex items-center gap-1"><Baby className="w-3 h-3"/> 子嗣</span>
                 <div className="flex gap-1 font-medium">
                    {boys > 0 && <span className="text-blue-600 bg-blue-50 px-1 rounded border border-blue-100">{boys}男</span>}
                    {girls > 0 && <span className="text-pink-600 bg-pink-50 px-1 rounded border border-pink-100">{girls}女</span>}
                    {boys === 0 && girls === 0 && <span className="text-gray-300">-</span>}
                 </div>
               </div>
             </div>
          )}
        </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center mx-6">
      <div className="flex items-center gap-6 relative group z-10">
         {member.spouse && (
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 border-t-4 border-double border-red-200 flex justify-center">
              <HeartHandshake className="w-5 h-5 text-red-300 -mt-2.5 bg-parchment rounded-full p-0.5" />
           </div>
         )}

         <PersonCard 
           name={member.name} 
           styles={mainStyles} 
           data={member} 
           displayAge={age}
           displayZodiac={zodiac}
           isDead={isDeceased}
           birthDateStr={member.birthDate}
           relBadge={relationship}
         />

         {member.spouse && (
           <PersonCard 
             name={member.spouse} 
             styles={spouseStyles} 
             isSpouse={true} 
             displayAge={spouseAge}
             displayZodiac={spouseZodiac}
             isDead={spouseIsDeceased}
             birthDateStr={spouseBirth}
             data={{ photoUrl: member.spousePhotoUrl }}
             relBadge={spouseRelationship}
           />
         )}
      </div>

      {member.children.length > 0 && (
        <>
          <div className="relative w-full h-8">
             <div className="absolute top-0 h-full w-px bg-gray-400" style={{ left: '50%' }}></div>
          </div>
          
          <div className="flex relative pt-4">
            {member.children.length > 1 && (
               <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[calc(100%-14rem)] h-px bg-gray-400 border-t border-gray-400"></div>
            )}
            
            {member.children.map((child) => (
              <div key={child.id} className="flex flex-col items-center relative">
                 <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-px h-4 bg-gray-400"></div>
                 
                <FamilyNode 
                  member={child} 
                  generation={generation + 1} 
                  root={root}
                  selectedId={selectedId}
                  onSelect={onSelect}
                  currentFamilyCode={currentFamilyCode}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default FamilyNode;
