import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import PlanDetail from "./index";
import { getItineraryById, getItineraryRecommendations, getSavedPlan, updateInterest, planItinerary } from "../../api";

let mockTripId;
let mockSearchParams;
const mockSetSearchParams = jest.fn();

jest.mock("react-router-dom", () => ({
  useParams: () => ({ id: mockTripId }),
  useSearchParams: () => [mockSearchParams, mockSetSearchParams],
}), { virtual: true });
jest.mock("@mui/material", () => ({
  Box: ({ children }) => <div>{children}</div>,
  Typography: ({ children }) => <span>{children}</span>,
  Button: ({ children, disabled, onClick }) => <button disabled={disabled} onClick={onClick}>{children}</button>,
}));
jest.mock("../../layouts/PageContainer", () => ({ __esModule: true, default: ({ children }) => <main>{children}</main> }));
jest.mock("../../components/attraction/AttractionsList", () => ({
  __esModule: true,
  default: ({ attractions, selected, loading, onSelected }) => loading ? <p>Loading places</p> : <div>
    {attractions.map((place) => <button key={place.place_id} onClick={() => onSelected(place)}>
      {place.name}: {selected.includes(place.place_id) ? "selected" : "unselected"}
    </button>)}
  </div>,
}));
jest.mock("../../components/maps", () => ({
  MapCanvas: ({ children }) => <aside>{children}</aside>,
  MapPlacePopup: () => null,
  PlaceMarker: () => null,
}));
jest.mock("../../hooks/useMapMarkers", () => {
  const stableMarkers = {
    markers: [], selected: null, setSelected() {}, addFromPlace() {}, clearMarkers() {}, fitToPlaces() {}, zoomMapToPlace() {},
  };
  return { __esModule: true, default: () => stableMarkers };
});
jest.mock("../../components/ItineraryTimeline", () => ({
  __esModule: true, default: ({ response }) => <div>Generated plan {response.itineraryId}</div>,
}));
jest.mock("../../api", () => ({
  getItineraryById: jest.fn(),
  getItineraryRecommendations: jest.fn(),
  getSavedPlan: jest.fn(),
  updateInterest: jest.fn(),
  planItinerary: jest.fn(),
}));

const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
const places = (id) => ({ items: [
  { id: `${id}-a`, name: `${id} A`, location: { lat: 0, lng: 1 }, pinned: false },
  { id: `${id}-b`, name: `${id} B`, location: { lat: 2, lng: 3 }, pinned: false },
] });

beforeEach(() => {
  mockTripId = "first";
  mockSearchParams = new URLSearchParams();
  getItineraryById.mockImplementation(async (id) => ({ destinationCity: id }));
  getItineraryRecommendations.mockImplementation(async (id) => places(id));
  getSavedPlan.mockResolvedValue(null);
  updateInterest.mockResolvedValue({});
  planItinerary.mockResolvedValue({ itineraryId: "first" });
  jest.spyOn(window, "alert").mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

test("a saved plan can be viewed without generating it again", async () => {
  getSavedPlan.mockResolvedValue({ itineraryId: "first" });
  render(<PlanDetail />);
  fireEvent.click(await screen.findByText("View Plan"));
  expect(screen.getByText("Generated plan first")).toBeInTheDocument();
  expect(planItinerary).not.toHaveBeenCalled();
});

test("planning without selected places explains what to do without calling the backend", async () => {
  render(<PlanDetail />);
  await screen.findByText("first A: unselected");
  fireEvent.click(screen.getByText("Generate Plan"));
  expect(screen.getByText(/Select at least one place to visit/)).toBeInTheDocument();
  expect(planItinerary).not.toHaveBeenCalled();
});

test("one failed pin update preserves another successful selection and locks duplicate writes", async () => {
  const firstPin = deferred();
  updateInterest.mockImplementation((id, placeId) => placeId.endsWith("-a") ? firstPin.promise : Promise.resolve({}));
  render(<PlanDetail />);
  fireEvent.click(await screen.findByText("first A: unselected"));
  fireEvent.click(screen.getByText("first A: selected"));
  fireEvent.click(screen.getByText("first B: unselected"));
  await waitFor(() => expect(screen.getByText("first B: selected")).toBeInTheDocument());
  expect(updateInterest).toHaveBeenCalledTimes(2);
  expect(screen.getByText("Generate Plan")).toBeDisabled();
  await act(async () => firstPin.reject(new Error("save failed")));
  expect(screen.getByText("first A: unselected")).toBeInTheDocument();
  expect(screen.getByText("first B: selected")).toBeInTheDocument();
  expect(screen.getByText("Generate Plan")).toBeEnabled();
});

test("obsolete itinerary responses do not overwrite the newly opened itinerary", async () => {
  const oldDetails = deferred();
  const oldPlaces = deferred();
  getItineraryById.mockImplementation((id) => id === "first" ? oldDetails.promise : Promise.resolve({ destinationCity: id }));
  getItineraryRecommendations.mockImplementation((id) => id === "first" ? oldPlaces.promise : Promise.resolve(places(id)));
  const { rerender } = render(<PlanDetail />);
  mockTripId = "second";
  rerender(<PlanDetail />);
  await screen.findByText("second A: unselected");
  await act(async () => {
    oldDetails.resolve({ destinationCity: "first" });
    oldPlaces.resolve(places("first"));
  });
  expect(screen.getByText("second A: unselected")).toBeInTheDocument();
  expect(screen.queryByText("first A: unselected")).not.toBeInTheDocument();
});

test("opening a different itinerary clears old selections and ignores a late generated plan", async () => {
  const oldPlan = deferred();
  planItinerary.mockReturnValue(oldPlan.promise);
  const { rerender } = render(<PlanDetail />);
  fireEvent.click(await screen.findByText("first A: unselected"));
  await waitFor(() => expect(screen.getByText("Generate Plan")).toBeEnabled());
  fireEvent.click(screen.getByText("Generate Plan"));
  mockTripId = "second";
  rerender(<PlanDetail />);
  await screen.findByText("second A: unselected");
  await act(async () => oldPlan.resolve({ itineraryId: "first" }));
  expect(screen.queryByText("Generated plan first")).not.toBeInTheDocument();
  expect(screen.getByText("second A: unselected")).toBeInTheDocument();
  expect(screen.getByText("Generate Plan")).toBeEnabled();
});
