/**
 * @jest-environment jsdom
 */
// Front-end unit tests for js/code.js, run against the real index.html and color.html markup.
const fs = require("fs");
const path = require("path");

const read = (file) => fs.readFileSync(path.join(__dirname, "..", "..", file), "utf8");

// code.js is a plain browser script, so load it through a <script> tag like the real pages do.
const script = document.createElement("script");
script.textContent = read("js/code.js");
document.head.appendChild(script);

const state = () => (0, eval)("({ userId, firstName, lastName })");
const setState = (s) =>
  (0, eval)(`userId = ${s.userId}; firstName = ${JSON.stringify(s.firstName)}; lastName = ${JSON.stringify(s.lastName)};`);

function loadPage(file) {
  document.body.innerHTML = new DOMParser().parseFromString(read(file), "text/html").body.innerHTML;
}

// Stands in for XMLHttpRequest so tests can inspect requests and play back server responses.
class FakeXHR {
  constructor() {
    FakeXHR.last = this;
    this.headers = {};
  }
  open(method, url) {
    this.method = method;
    this.url = url;
  }
  setRequestHeader(name, value) {
    this.headers[name] = value;
  }
  send(body) {
    this.body = JSON.parse(body);
  }
  respond(status, json) {
    this.readyState = 4;
    this.status = status;
    this.responseText = JSON.stringify(json);
    this.onreadystatechange();
  }
}

beforeEach(() => {
  window.XMLHttpRequest = FakeXHR;
  FakeXHR.last = null;
  document.cookie = "firstName=; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  setState({ userId: 0, firstName: "", lastName: "" });
});

describe("session cookie", () => {
  test("saveCookie stores the user in one cookie that readCookie restores", () => {
    setState({ userId: 7, firstName: "Ada", lastName: "Lovelace" });
    saveCookie();
    expect(document.cookie).toBe("firstName=Ada,lastName=Lovelace,userId=7");

    setState({ userId: 0, firstName: "", lastName: "" });
    readCookie();
    expect(state()).toEqual({ userId: 7, firstName: "Ada", lastName: "Lovelace" });
  });
});

describe("login form", () => {
  beforeEach(() => loadPage("index.html"));

  test("doLogin posts the entered username and password as JSON to Login.php", () => {
    document.getElementById("loginName").value = "testuser";
    document.getElementById("loginPassword").value = "testpass";
    doLogin();

    const xhr = FakeXHR.last;
    expect(xhr.method).toBe("POST");
    expect(xhr.url).toMatch(/\/LAMPAPI\/Login\.php$/);
    expect(xhr.headers["Content-type"]).toMatch(/application\/json/);
    expect(xhr.body).toEqual({ login: "testuser", password: "testpass" });
  });

  test("a failed login shows an error and saves no cookie", () => {
    doLogin();
    FakeXHR.last.respond(200, { id: 0, firstName: "", lastName: "", error: "No Records Found" });

    expect(document.getElementById("loginResult").textContent).toBe("User/Password combination incorrect");
    expect(document.cookie).toBe("");
  });
});

describe("color page", () => {
  beforeEach(() => {
    loadPage("color.html");
    setState({ userId: 3, firstName: "Ada", lastName: "Lovelace" });
  });

  test("addColor sends the color with the logged-in userId and confirms it", () => {
    document.getElementById("colorText").value = "Teal";
    addColor();

    expect(FakeXHR.last.url).toMatch(/\/LAMPAPI\/AddColor\.php$/);
    expect(FakeXHR.last.body).toEqual({ color: "Teal", userId: 3 });

    FakeXHR.last.respond(200, { error: "" });
    expect(document.getElementById("colorAddResult").textContent).toBe("Color has been added");
  });

  test("searchColor lists each result on its own line", () => {
    document.getElementById("searchText").value = "bl";
    searchColor();

    expect(FakeXHR.last.url).toMatch(/\/LAMPAPI\/SearchColors\.php$/);
    expect(FakeXHR.last.body).toEqual({ search: "bl", userId: 3 });

    FakeXHR.last.respond(200, { results: ["Blue", "Black"], error: "" });
    const list = document.getElementById("colorList");
    expect(list.querySelectorAll("br")).toHaveLength(1);
    expect(list.textContent.split(/\r?\n/)).toEqual(["Blue", "Black"]);
    expect(document.getElementById("colorSearchResult").textContent).toBe("Color(s) has been retrieved");
  });
});
