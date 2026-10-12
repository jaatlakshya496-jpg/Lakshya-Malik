import { GameSaveData } from '../types/game';

export interface DailyRewardItem {
  day: number;
  coins: number;
  title: string;
  icon: string;
}

export const DAILY_REWARDS: DailyRewardItem[] = [
  { day: 1, coins: 150, title: 'Starter Bonus', icon: '🪙' },
  { day: 2, coins: 300, title: 'Turbo Boost', icon: '🚀' },
  { day: 3, coins: 500, title: 'Stunt Master', icon: '⭐' },
  { day: 4, coins: 800, title: 'Pro Rider', icon: '🏆' },
  { day: 5, coins: 1200, title: 'Champion Gear', icon: '💎' },
  { day: 6, coins: 1800, title: 'Legendary Torque', icon: '🔥' },
  { day: 7, coins: 3500, title: 'Grandmaster Apex', icon: '👑' },
];

export function checkDailyLogin(saveData: GameSaveData): { saveData: GameSaveData; shouldShowModal: boolean } {
  const todayStr = new Date().toISOString().slice(0, 10);

  if (!saveData.lastLoginDate) {
    return {
      saveData: {
        ...saveData,
        lastLoginDate: todayStr,
        loginStreak: 1,
        loginRewardClaimedToday: false,
      },
      shouldShowModal: true,
    };
  }

  if (saveData.lastLoginDate === todayStr) {
    return {
      saveData,
      shouldShowModal: !saveData.loginRewardClaimedToday,
    };
  }

  const lastDate = new Date(saveData.lastLoginDate);
  const currentDate = new Date(todayStr);
  const diffTime = currentDate.getTime() - lastDate.getTime();
  const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

  let newStreak = saveData.loginStreak || 1;
  if (diffDays === 1) {
    newStreak = newStreak >= 7 ? 7 : newStreak + 1;
  } else if (diffDays > 1) {
    newStreak = 1;
  }

  return {
    saveData: {
      ...saveData,
      lastLoginDate: todayStr,
      loginStreak: newStreak,
      loginRewardClaimedToday: false,
    },
    shouldShowModal: true,
  };
}
