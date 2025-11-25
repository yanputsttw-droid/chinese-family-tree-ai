import { FamilyTreeData } from './types';

export const INITIAL_DATA: FamilyTreeData = {
  name: "陈氏家族 (Chen Family)",
  root: {
    id: 'root',
    name: '陈大爷 (Grandpa Chen)',
    gender: 'male',
    birthDate: '1940-02-15',
    deathDate: '2020-01-15',
    spouse: '李奶奶',
    spouseBirthDate: '1942-05-20',
    spouseDeathDate: '2022-03-10',
    children: [
      {
        id: 'c1',
        name: '陈建国',
        gender: 'male',
        birthDate: '1965-05-20',
        spouse: '王秀英',
        spouseBirthDate: '1967-08-15',
        children: [
          {
            id: 'g1',
            name: '陈小明',
            gender: 'male',
            birthDate: '1992-08-15',
            spouse: '赵薇',
            spouseBirthDate: '1994-02-10',
            children: [
                {
                    id: 'gg1',
                    name: '陈小小',
                    gender: 'female',
                    birthDate: '2020-01-01',
                    children: []
                }
            ]
          },
          {
             id: 'g2',
             name: '陈小红',
             gender: 'female',
             birthDate: '1995-11-03',
             children: []
          }
        ]
      },
      {
        id: 'c2',
        name: '陈美兰 (姑姑)',
        gender: 'female',
        birthDate: '1968-12-10',
        spouse: '张伟',
        spouseBirthDate: '1965-01-30',
        children: [
          {
            id: 'g3',
            name: '张强 (表弟)',
            gender: 'male',
            birthDate: '1998-03-22',
            children: []
          }
        ]
      }
    ]
  }
};