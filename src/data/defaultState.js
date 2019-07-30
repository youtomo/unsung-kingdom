import battlers from './battlers'
export default () => {
  return {
    map: 'room1',
    x: 500,
    y: 600,
    field: {},
    chapter: 1,
    event: {
      m0_1: { started: false, completed: false },
      m1_1: { started: false, completed: false, talked: false, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0},
      m1_2: { started: false, completed: false, talked: false, solved: false  },
      m1_3: { started: false, completed: false },
      m1_4: { started: false, completed: false, solved: false },
      m2_1: { started: false, completed: false },
      m2_2: { started: false, completed: false },
      m2_3: { started: false, completed: false },
      m2_4: { started: false, completed: false },
      m3_1: { started: false, completed: false },
      m3_2: { started: false, completed: false },
      m3_3: { started: false, completed: false },
      m3_4: { started: false, completed: false },
      m4_1: { started: false, completed: false },
      m4_2: { started: false, completed: false },
      m4_3: { started: false, completed: false },
      m4_4: { started: false, completed: false },
      m5_1: { started: false, completed: false },
      town: { talked_sick: false }
    },
    battlers: battlers.filter((_, i) => i < 3).map(v => Object.assign(v, { exp: 0, maxHp: v.hp })),
    items: [{ item_id: 1, count: 5 }],
    weapons: [{ id: 1, weapon_id: 1 }, { id: 2, weapon_id: 1 }],
    saved: null
  }
}
