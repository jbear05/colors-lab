// Integration tests for the PHP API. They call LAMPAPI served by PHP against the test MySQL
// database from schema.sql (see .github/workflows/ci.yml). Set API_URL to run them.
const API_URL = process.env.API_URL;
const describeApi = API_URL ? describe : describe.skip;

async function post(endpoint, body) {
  const res = await fetch(`${API_URL}/${endpoint}.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=UTF-8" },
    body: JSON.stringify(body),
  });
  expect(res.status).toBe(200);
  expect(res.headers.get("content-type")).toMatch(/application\/json/);
  return res.json();
}

const noRecords = { id: 0, firstName: "", lastName: "", error: "No Records Found" };

describeApi("LAMPAPI", () => {
  let testUser;
  let otherUser;

  beforeAll(async () => {
    testUser = await post("Login", { login: "testuser", password: "testpass" });
    otherUser = await post("Login", { login: "otheruser", password: "otherpass" });
  });

  test("Login returns the user's id and name for valid credentials", () => {
    expect(testUser).toEqual({ id: expect.any(Number), firstName: "Test", lastName: "User", error: "" });
    expect(testUser.id).toBeGreaterThan(0);
  });

  test("Login rejects a wrong password", async () => {
    expect(await post("Login", { login: "testuser", password: "wrong" })).toEqual(noRecords);
  });

  test("AddColor saves a color that SearchColors finds by partial name", async () => {
    expect(await post("AddColor", { color: "Seafoam", userId: testUser.id })).toEqual({ error: "" });
    expect(await post("SearchColors", { search: "foam", userId: testUser.id })).toEqual({
      results: expect.arrayContaining(["Seafoam"]),
      error: "",
    });
  });

  test("SearchColors only returns the requesting user's colors", async () => {
    await post("AddColor", { color: "Mauve", userId: testUser.id });
    expect(await post("SearchColors", { search: "Mauve", userId: otherUser.id })).toEqual(noRecords);
  });
});
