import React from 'react';
import { GameSaveData } from '../types/game';
import { ShopItem, allSkins, allCharacters, allVehicles } from '../data/shopData';

const ShopItemGrid: React.FC<{
  items: ShopItem[];
  unlockedIds: string[] | undefined;
  onPurchase: (item: ShopItem) => void;
}> = ({ items, unlockedIds, onPurchase }) => (
  <div className="grid grid-cols-4 gap-4 p-4 h-[400px] overflow-y-auto">
    {items.map((item) => {
      const isUnlocked = unlockedIds?.includes(item.id);
      return (
        <div key={item.id} className="bg-gray-800 p-2 rounded flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-gray-700 mb-2 flex items-center justify-center text-xs">Icon</div>
          <div className="text-sm font-bold text-white truncate w-full">{item.name}</div>
          <div className="text-xs text-gray-400">{isUnlocked ? 'Owned' : `${item.price} Coins`}</div>
          {!isUnlocked && (
            <button
              onClick={() => onPurchase(item)}
              className="mt-2 bg-blue-600 hover:bg-blue-500 text-white text-xs py-1 px-2 rounded"
            >
              Buy
            </button>
          )}
        </div>
      );
    })}
  </div>
);

export const SkinsView: React.FC<{ saveData: GameSaveData, onUpdateSave: (newSave: GameSaveData) => void }> = ({ saveData, onUpdateSave }) => (
  <ShopItemGrid
    items={allSkins}
    unlockedIds={saveData.unlockedSkins}
    onPurchase={(item) => onUpdateSave({ ...saveData, coins: saveData.coins - item.price, unlockedSkins: [...(saveData.unlockedSkins || []), item.id] })}
  />
);

export const CharacterCustomizationView: React.FC<{ saveData: GameSaveData, onUpdateSave: (newSave: GameSaveData) => void }> = ({ saveData, onUpdateSave }) => (
  <ShopItemGrid
    items={allCharacters}
    unlockedIds={saveData.unlockedCharacters}
    onPurchase={(item) => onUpdateSave({ ...saveData, coins: saveData.coins - item.price, unlockedCharacters: [...(saveData.unlockedCharacters || []), item.id] })}
  />
);

export const NewVehiclesView: React.FC<{ saveData: GameSaveData, onUpdateSave: (newSave: GameSaveData) => void }> = ({ saveData, onUpdateSave }) => (
  <ShopItemGrid
    items={allVehicles}
    unlockedIds={saveData.unlockedVehicles}
    onPurchase={(item) => onUpdateSave({ ...saveData, coins: saveData.coins - item.price, unlockedVehicles: [...(saveData.unlockedVehicles || []), item.id] })}
  />
);
