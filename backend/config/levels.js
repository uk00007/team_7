const LEVELS = [
  { level: 1, title: 'Novice',       minXP: 0,     maxXP: 99,       icon: '🌱', badge: 'novice'       },
  { level: 2, title: 'Explorer',     minXP: 100,   maxXP: 249,      icon: '🔍', badge: 'explorer'     },
  { level: 3, title: 'Apprentice',   minXP: 250,   maxXP: 499,      icon: '⚡', badge: 'apprentice'   },
  { level: 4, title: 'Practitioner', minXP: 500,   maxXP: 999,      icon: '🏅', badge: 'practitioner' },
  { level: 5, title: 'Expert',       minXP: 1000,  maxXP: 1999,     icon: '🥇', badge: 'expert'       },
  { level: 6, title: 'Champion',     minXP: 2000,  maxXP: 3499,     icon: '🏆', badge: 'champion'     },
  { level: 7, title: 'Master',       minXP: 3500,  maxXP: 5999,     icon: '⭐', badge: 'master'       },
  { level: 8, title: 'Grandmaster',  minXP: 6000,  maxXP: 9999,     icon: '💎', badge: 'grandmaster'  },
  { level: 9, title: 'Legend',       minXP: 10000, maxXP: Infinity, icon: '🌟', badge: 'legend'       },
];

const STREAK_BONUSES = [
  { streakDays: 3,  bonusXP: 10,  reason: '3-day streak bonus'  },
  { streakDays: 7,  bonusXP: 25,  reason: '7-day streak bonus'  },
  { streakDays: 14, bonusXP: 50,  reason: '14-day streak bonus' },
  { streakDays: 30, bonusXP: 100, reason: '30-day streak bonus' },
  { streakDays: 60, bonusXP: 200, reason: '60-day streak bonus' },
  { streakDays: 90, bonusXP: 350, reason: '90-day streak bonus' },
];

module.exports = { LEVELS, STREAK_BONUSES };
