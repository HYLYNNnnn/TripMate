import axios from "axios";
import { getAuthToken, removeAuthToken, isTokenExpired } from "../lib/auth";

const base = (process.env.REACT_APP_API_BASE || "/api").replace(/\/+$/, "");
const useMockData = process.env.REACT_APP_USE_MOCK_DATA === "true";

const canUseMockFallback = (error) => useMockData
  && error?.response?.status !== 401
  && error?.response?.status !== 403;

const api = axios.create({
  baseURL: base,
});

// Request interceptor to add JWT token to headers
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token && !isTokenExpired(token)) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      // Token is invalid or expired
      removeAuthToken();
      // Redirect to home page for re-authentication
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export async function getAttractions(payload) {
  const res = await api.post("/attractions_mock", payload);
  return res;
}

// Legacy demo helper; live planning uses planItinerary below.
export async function getTripPlan(payload) {
  if (!useMockData) {
    throw new Error("The sample trip plan is available only in explicit mock-data mode.");
  }
  const response = await fetch("/mock/itinerary.json");
  if (!response.ok) throw new Error("Unable to load the sample trip plan.");
  return response.json();
}

export async function createTrip(payload) {
  // Real backend call - JWT automatically added by interceptor
  const res = await api.post('/trips/setup', payload);
  return res.data;

  // Mock implementation for development
  // return new Promise((resolve) => {
  //   setTimeout(() => {
  //     resolve({
  //       success: true,
  //       data: {
  //         id: "1021",
  //         destination: payload?.destination || "San Francisco",
  //         createdAt: new Date().toISOString(),
  //       },
  //     });
  //   }, 10000);
  // });
}

export async function getTrip({ id }) {
  // Real backend call - JWT automatically added by interceptor
  const res = await api.get(`/trips/${id}`);
  return res.data;

  // Mock implementation for development
  // return Promise.resolve({
  //   success: true,
  //   data: {
  //     destination: "San Francisco",
  //     duration: 8,
  //     interests: ["ChIJmRyMs_mAhYARpViaf6JEWNE"],
  //   },
  // });
}

export async function getTripAttractions({ id }) {
  // Real backend call - JWT automatically added by interceptor
  const res = await api.get(`/trips/${id}/attractions`);
  return res.data;

  // Mock implementation for development
  // const res = await fetch("/mock/attractions.json").then((r) => r.json());
  // return res;
}

export async function getTripProcess({ id }) {
  // Real backend call - JWT automatically added by interceptor
  const res = await api.get(`/trips/${id}/progress`);
  return res.data;

  // Mock implementation for development
  // const trip = {
  //   id,
  //   status: Math.random() > 0.7 ? "ready" : "processing",
  // };
  // const progress = trip.status === "ready" ? 100 : Math.floor(Math.random() * 100);
  // return Promise.resolve({
  //   success: true,
  //   data: {
  //     status: trip.status,
  //     progress,
  //   },
  // });
}

export async function getUserItineraries(page = 0, size = 20) {
  // Real backend call - JWT automatically added by interceptor
  const res = await api.get('/itineraries', {
    params: { page, size }
  });
  return res.data;

  // Fallback to mock data for development
  // return Promise.resolve({
  //   items: [
  //     {
  //       id: "123",
  //       destinationCity: "San Francisco",
  //       startDate: "2024-12-15T10:00:00Z",
  //       endDate: "2024-12-20T18:00:00Z",
  //       travelMode: "DRIVING",
  //       travelPace: "MODERATE",
  //     },
  //     {
  //       id: "456",
  //       destinationCity: "Tokyo",
  //       startDate: "2025-01-10T08:00:00Z",
  //       endDate: "2025-01-17T20:00:00Z",
  //       travelMode: "TRANSIT",
  //       travelPace: "PACKED",
  //     },
  //     {
  //       id: "789",
  //       destinationCity: "Paris",
  //       startDate: "2025-03-05T12:00:00Z",
  //       endDate: "2025-03-12T16:00:00Z",
  //       travelMode: "WALKING",
  //       travelPace: "RELAXED",
  //     },
  //   ],
  //   page: {
  //     page: 0,
  //     size: 20,
  //     totalElements: 3,
  //     totalPages: 1,
  //   },
  // });
}

export async function getItineraryById(itineraryId) {
  try {
    // Real backend call - JWT automatically added by interceptor
    const res = await api.get(`/itineraries/${itineraryId}`);
    return res.data;
  } catch (error) {
    if (!canUseMockFallback(error)) throw error;
    // Fixture fallback is opt-in; normal API errors must reach the page.

    return {
      id: itineraryId,
      destinationCity: "San Francisco",
      startDate: "2024-12-15T10:00:00Z",
      endDate: "2024-12-20T18:00:00Z",
      travelMode: "DRIVING",
      travelPace: "MODERATE",
      budgetLimitCents: 200000,
      activityIntensity: "MODERATE",
      numberOfTravelers: 2,
      createdAt: "2024-12-01T00:00:00Z",
      updatedAt: "2024-12-01T00:00:00Z"
    };
  }
}

export async function getItineraryRecommendations(itineraryId, page = 0, size = 20) {
  try {
    // Real backend call - JWT automatically added by interceptor
    const res = await api.get(`/itineraries/${itineraryId}/recommendations`, {
      params: { page, size }
    });
    return res.data;
  } catch (error) {
    if (!canUseMockFallback(error)) throw error;
    // Fixture fallback is opt-in; normal API errors must reach the page.

    return {
      itineraryId,
      items: [
        {
          id: "place-1",
          name: "Golden Gate Bridge",
          address: "Golden Gate Bridge, San Francisco, CA, USA",
          categories: ["LANDMARK", "NATURE"],
          latitude: 37.8199,
          longitude: -122.4783
        },
        {
          id: "place-2", 
          name: "Fisherman's Wharf",
          address: "Pier 39, San Francisco, CA, USA",
          categories: ["FOOD", "SHOPPING"],
          latitude: 37.8080,
          longitude: -122.4177
        },
        {
          id: "place-3",
          name: "Alcatraz Island",
          address: "Alcatraz Island, San Francisco, CA, USA", 
          categories: ["CULTURE", "HISTORY"],
          latitude: 37.8267,
          longitude: -122.4230
        },
        {
          id: "place-4",
          name: "Lombard Street",
          address: "Lombard St, San Francisco, CA, USA",
          categories: ["LANDMARK"],
          latitude: 37.8021,
          longitude: -122.4187
        }
      ],
      page: {
        currentPage: page,
        pageSize: size,
        totalElements: 4,
        totalPages: 1
      }
    };
  }
}

export async function getItineraryImage(itineraryId) {
  try {
    const attractions = await getTripAttractions({ id: itineraryId });
    return attractions?.data?.[0]?.imageUrl || null;
  } catch (error) {
    console.warn("Unable to load this itinerary image.");
    return null;
  }
}

export async function getItineraryFirstPlaceImage(itineraryId) {
  try {
    // Get the first recommendation from the itinerary
    const recommendations = await getItineraryRecommendations(itineraryId, 0, 1);
    const firstPlace = recommendations?.items?.[0];
    
    if (!firstPlace) {
      return null;
    }

    // Return the place data for Google Places photo fetching
    return {
      name: firstPlace.name,
      address: firstPlace.address,
      location: firstPlace.location
    };
  } catch (error) {
    console.warn("Unable to load the first itinerary place.");
    return null;
  }
}

export async function addInterest(itineraryId, placeId, pinned = false) {
  const res = await api.post(`/itineraries/${itineraryId}/interests`, {
    placeId,
    pinned
  });
  return res.data;
}

export async function planItinerary(itineraryId, planRequest = {}) {
  const res = await api.post(`/itineraries/${itineraryId}/plan`, planRequest);
  return res.data;
}

export async function updateInterest(itineraryId, placeId, pinned) {
  const res = await api.post(`/itineraries/${itineraryId}/interests`, {
    placeId,
    pinned
  });
  return res.data;
}
