import { act, renderHook } from "@testing-library/react";
import usePlacesClient from "./usePlacesClient";
import usePlacesPredictions from "./usePlacesPredictions";

jest.mock("./usePlacesClient", () => ({ __esModule: true, default: jest.fn() }));

let service;
const options = {
  minLength: 2,
  debounceMs: 20,
  includedPrimaryTypes: ["locality"],
  excludedPrimaryTypes: ["administrative_area_level_2"],
  includedRegionCodes: ["US"],
};

beforeEach(() => {
  jest.useFakeTimers();
  service = { getPlacePredictions: jest.fn() };
  usePlacesClient.mockReturnValue({ service, ready: true });
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

test("does not let an earlier prediction response overwrite newer input results", () => {
  const { result } = renderHook(() => usePlacesPredictions(options));
  act(() => result.current.setInput("Pa"));
  act(() => jest.advanceTimersByTime(20));
  const firstResponse = service.getPlacePredictions.mock.calls[0][1];
  act(() => result.current.setInput("Paris"));
  act(() => jest.advanceTimersByTime(20));
  const secondResponse = service.getPlacePredictions.mock.calls[1][1];
  const currentCity = { place_id: "new", types: ["locality"] };
  act(() => secondResponse([currentCity]));
  act(() => firstResponse([{ place_id: "old", types: ["locality"] }]));
  expect(result.current.options).toEqual([currentCity]);
  expect(service.getPlacePredictions).toHaveBeenCalledTimes(2);
});

test("clearing input prevents a delayed response from repopulating the dropdown", () => {
  const { result } = renderHook(() => usePlacesPredictions(options));
  act(() => result.current.setInput("Paris"));
  act(() => jest.advanceTimersByTime(20));
  const response = service.getPlacePredictions.mock.calls[0][1];
  act(() => result.current.setInput(""));
  act(() => response([{ place_id: "old", types: ["locality"] }]));
  expect(result.current.options).toEqual([]);
});

test("waits for the service and applies supported request options and local filtering", () => {
  usePlacesClient.mockReturnValue({ service: null, ready: false });
  const { result, rerender } = renderHook(() => usePlacesPredictions(options));
  act(() => result.current.setInput("San"));
  act(() => jest.advanceTimersByTime(20));
  expect(service.getPlacePredictions).not.toHaveBeenCalled();
  usePlacesClient.mockReturnValue({ service, ready: true });
  rerender();
  act(() => jest.advanceTimersByTime(20));
  const [request, respond] = service.getPlacePredictions.mock.calls[0];
  expect(request.componentRestrictions).toEqual({ country: ["us"] });
  expect(request.types).toEqual(["locality"]);
  const city = { place_id: "city", types: ["locality"] };
  act(() => respond([city, { place_id: "county", types: ["administrative_area_level_2"] }]));
  expect(result.current.options).toEqual([city]);
});
