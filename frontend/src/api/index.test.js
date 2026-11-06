const mockApi = {
  get: jest.fn(),
  post: jest.fn(),
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() },
  },
};
const mockCreate = jest.fn(() => mockApi);

jest.mock("axios", () => ({ create: (...args) => mockCreate(...args) }));
jest.mock("../lib/auth", () => ({
  getAuthToken: jest.fn(() => null),
  removeAuthToken: jest.fn(),
  isTokenExpired: jest.fn(() => false),
}));

const originalBase = process.env.REACT_APP_API_BASE;
const originalMock = process.env.REACT_APP_USE_MOCK_DATA;
const loadApi = () => {
  jest.resetModules();
  // CRA resets mock implementations before each test, including this factory.
  mockCreate.mockReturnValue(mockApi);
  return require("./index");
};

beforeEach(() => {
  jest.clearAllMocks();
  mockApi.get.mockReset();
  mockApi.post.mockReset();
  process.env.REACT_APP_API_BASE = "/api";
  delete process.env.REACT_APP_USE_MOCK_DATA;
});

afterAll(() => {
  if (originalBase === undefined) delete process.env.REACT_APP_API_BASE;
  else process.env.REACT_APP_API_BASE = originalBase;
  if (originalMock === undefined) delete process.env.REACT_APP_USE_MOCK_DATA;
  else process.env.REACT_APP_USE_MOCK_DATA = originalMock;
});

test("normal API mode rejects failed itinerary and recommendation requests", async () => {
  const api = loadApi();
  const failure = Object.assign(new Error("Not found"), { response: { status: 404 } });
  mockApi.get.mockRejectedValue(failure);

  await expect(api.getItineraryById("missing-id")).rejects.toBe(failure);
  await expect(api.getItineraryRecommendations("missing-id")).rejects.toBe(failure);
});

test("mock fallback requires an explicit opt-in", async () => {
  process.env.REACT_APP_USE_MOCK_DATA = "true";
  const api = loadApi();
  mockApi.get.mockRejectedValue(new Error("Development backend unavailable"));

  await expect(api.getItineraryById("demo-id")).resolves.toMatchObject({ id: "demo-id" });
  await expect(api.getItineraryRecommendations("demo-id")).resolves.toMatchObject({
    itineraryId: "demo-id",
    items: expect.any(Array),
  });
});

test.each([401, 403])("mock mode still rejects authentication/permission failure %s", async (status) => {
  process.env.REACT_APP_USE_MOCK_DATA = "true";
  const api = loadApi();
  const failure = { response: { status } };
  mockApi.get.mockRejectedValue(failure);

  await expect(api.getItineraryById("demo-id")).rejects.toBe(failure);
  await expect(api.getItineraryRecommendations("demo-id")).rejects.toBe(failure);
});

test("attractions endpoint does not repeat the configured API base", async () => {
  process.env.REACT_APP_API_BASE = "https://backend.example.test/api/";
  const api = loadApi();
  mockApi.post.mockResolvedValue({ data: { items: [] } });
  const payload = { destination: "Tokyo" };

  await api.getAttractions(payload);

  expect(mockCreate).toHaveBeenCalledWith({ baseURL: "https://backend.example.test/api" });
  expect(mockApi.post).toHaveBeenCalledWith("/attractions_mock", payload);
});

test("itinerary creation maps the form to the supplied backend and normalizes its accepted response", async () => {
  const api = loadApi();
  const payload = { destination: "Tokyo", startDate: "2027-03-10", endDate: "2027-03-12", travelers: { adults: 2 }, budget: 2 };
  mockApi.post.mockResolvedValue({ data: { itineraryId: "trip-id" } });

  await expect(api.createTrip(payload)).resolves.toMatchObject({ success: true, data: { id: "trip-id" } });
  expect(mockApi.post).toHaveBeenCalledWith("/itineraries", expect.objectContaining({
    destinationCity: "Tokyo", startDate: "2027-03-10T00:00:00Z", endDate: "2027-03-12T00:00:00Z", numberOfTravelers: 2,
  }));
  expect(mockApi.post.mock.calls[0][1]).not.toHaveProperty("budgetLimitCents");
});

test("saved plans return null only for an absent plan", async () => {
  const api = loadApi();
  mockApi.get.mockRejectedValueOnce({ response: { status: 404 } });
  await expect(api.getSavedPlan("trip-id")).resolves.toBeNull();
  const error = { response: { status: 403 } };
  mockApi.get.mockRejectedValueOnce(error);
  await expect(api.getSavedPlan("trip-id")).rejects.toBe(error);
});

test("legacy sample plan helper is disabled in normal API mode", async () => {
  const api = loadApi();
  await expect(api.getTripPlan({})).rejects.toThrow("explicit mock-data mode");
});

test("interest failures are propagated without logging authorization headers", async () => {
  const api = loadApi();
  const failure = Object.assign(new Error("Request failed"), {
    config: { headers: { Authorization: "Bearer test-token" } },
  });
  mockApi.post.mockRejectedValue(failure);
  const errorLog = jest.spyOn(console, "error").mockImplementation(() => {});
  const debugLog = jest.spyOn(console, "log").mockImplementation(() => {});

  try {
    await expect(api.updateInterest("trip-id", "place-id", true)).rejects.toBe(failure);
    expect(errorLog).not.toHaveBeenCalled();
    expect(debugLog).not.toHaveBeenCalled();
  } finally {
    errorLog.mockRestore();
    debugLog.mockRestore();
  }
});
