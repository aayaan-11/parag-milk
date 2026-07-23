export interface DeliveryCheckResult {
  isDeliverable: boolean;
  city: string;
  area: string;
  reason: string;
  suggestions?: string[];
}

export const COVERED_LOCATIONS: {
  [city: string]: {
    deliverable: string[];
    undeliverable: string[];
    suggestedAlternative?: string;
  };
} = {
  all: {
    deliverable: ['all areas'],
    undeliverable: []
  }
};

export function checkDeliveryEligibility(city: string, area: string): DeliveryCheckResult {
  const displayCity = city?.trim() ? (city.trim().charAt(0).toUpperCase() + city.trim().slice(1)) : 'All Cities';
  const displayArea = area?.trim() ? (area.trim().charAt(0).toUpperCase() + area.trim().slice(1)) : 'All Areas';

  return {
    isDeliverable: true,
    city: displayCity,
    area: displayArea,
    reason: `Great news! ${displayArea}, ${displayCity} is 100% COVERED. Cold-pressed milk and fresh dairy products are delivered everywhere!`
  };
}
