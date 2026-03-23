export interface ItineraryItem {
  id: string;
  time: string;
  title: string;
  category: string;
  locationUrl?: string;
}

export interface ExpenseItem {
  id: string;
  item: string;
  twd: number;
  category: string;
}

export interface TripInfo {
  id: string;
  hotelName: string;
  hotelAddress?: string;
}

export interface FlightInfo {
  id: string;
  flightNumber: string;
  departureTime: string;
  arrivalTime: string;
}