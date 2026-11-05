const mockPost = jest.fn();
jest.mock("axios", () => ({ post: (...args) => mockPost(...args) }));

const originalBase = process.env.REACT_APP_API_BASE;
const jwt = (claims) => `eyJhbGciOiJIUzI1NiJ9.${btoa(JSON.stringify(claims))}.test-signature`;
const loadAuth = () => {
  jest.resetModules();
  return require("./auth");
};

beforeEach(() => {
  localStorage.clear();
  mockPost.mockReset();
  process.env.REACT_APP_API_BASE = "/api";
});

afterAll(() => {
  if (originalBase === undefined) delete process.env.REACT_APP_API_BASE;
  else process.env.REACT_APP_API_BASE = originalBase;
});

test("valid unexpired login token is saved and returned as the current user", async () => {
  const auth = loadAuth();
  const claims = { sub: "user-id", email: "user@example.com", exp: Math.floor(Date.now() / 1000) + 3600 };
  const token = jwt(claims);
  mockPost.mockResolvedValue({ data: { token } });

  await expect(auth.login("user@example.com", "test-password")).resolves.toEqual({ success: true, user: claims });
  expect(localStorage.getItem("authToken")).toBe(token);
});

test.each([
  ["malformed", "not-a-jwt"],
  ["expired", jwt({ sub: "user-id", exp: 1 })],
  ["missing expiry", jwt({ sub: "user-id" })],
  ["invalid expiry", jwt({ sub: "user-id", exp: "not-a-number" })],
])("%s login token cannot create a successful login", async (_label, token) => {
  const auth = loadAuth();
  localStorage.setItem("authToken", "stale-token");
  mockPost.mockResolvedValue({ data: { token } });

  await expect(auth.login("user@example.com", "test-password")).resolves.toMatchObject({ success: false });
  expect(localStorage.getItem("authToken")).toBeNull();
});

test("auth API base with trailing slash produces one slash before auth paths", async () => {
  process.env.REACT_APP_API_BASE = "https://backend.example.test/api/";
  const auth = loadAuth();
  mockPost.mockResolvedValue({ data: { token: jwt({ exp: Math.floor(Date.now() / 1000) + 3600 }) } });

  await auth.login("user@example.com", "test-password");
  expect(mockPost.mock.calls[0][0]).toBe("https://backend.example.test/api/auth/login");
});

test("structured server errors produce text feedback without logging raw axios errors", async () => {
  const auth = loadAuth();
  const failure = {
    response: { data: { error: { message: "Invalid email or password" } } },
    config: { headers: { Authorization: "Bearer test-token" } },
  };
  mockPost.mockRejectedValue(failure);
  const errorLog = jest.spyOn(console, "error").mockImplementation(() => {});
  try {
    await expect(auth.login("user@example.com", "test-password")).resolves.toEqual({
      success: false,
      message: "Invalid email or password",
    });
    expect(errorLog).not.toHaveBeenCalled();
  } finally {
    errorLog.mockRestore();
  }
});
