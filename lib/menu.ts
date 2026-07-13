import menuData from '@/data/menu-full-app-format.json';
import type { MenuData, MenuItem, Category } from './types';

const data = menuData as unknown as MenuData;

export function getRestaurantInfo() {
  return data.restaurant;
}

export function getCategories(): Category[] {
  return [...data.categories].sort((a, b) => a.displayOrder - b.displayOrder);
}

export function getMenu(): MenuItem[] {
  return data.menu;
}

export function getMenuByCategory(category: string): MenuItem[] {
  return data.menu.filter((m) => m.category === category);
}

export function getMenuGroupedByCategory(): { category: Category; items: MenuItem[] }[] {
  return getCategories().map((category) => ({
    category,
    items: getMenuByCategory(category.name),
  }));
}

export function getMenuItem(id: string): MenuItem | undefined {
  return data.menu.find((m) => m.id === id);
}

export function getMinPrice(item: MenuItem): number {
  let min = item.price;
  for (const group of item.groups) {
    const adjustments = group.options.map((o) => o.priceAdjustment);
    if (adjustments.length > 0) {
      min += Math.min(...adjustments);
    }
  }
  return min;
}

export function hasVariants(item: MenuItem): boolean {
  return item.groups.length > 0;
}
