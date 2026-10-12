import skinIcon1 from '../assets/images/bike_skin_1_1791776192467.jpg';
import charIcon1 from '../assets/images/character_1_1791776210504.jpg';
import vehicleIcon1 from '../assets/images/vehicle_1_1791776227993.jpg';

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'skin' | 'character' | 'vehicle';
  icon: string;
}

const icons = {
  skin: [skinIcon1],
  character: [charIcon1],
  vehicle: [vehicleIcon1]
};

const generateItems = (prefix: string, count: number, category: 'skin' | 'character' | 'vehicle'): ShopItem[] => {
  const categoryIcons = icons[category];
  return Array.from({ length: count }, (_, i) => ({
    id: `${category}_${prefix}_${i + 1}`,
    name: `${category.charAt(0).toUpperCase() + category.slice(1)} ${i + 1}`,
    description: `A cool ${category} description`,
    price: (i + 1) * 100,
    category,
    icon: categoryIcons[i % categoryIcons.length]
  }));
};

export const allSkins: ShopItem[] = generateItems('skin', 70, 'skin');
export const allCharacters: ShopItem[] = generateItems('man', 70, 'character');
export const allVehicles: ShopItem[] = generateItems('vehicle', 70, 'vehicle');
