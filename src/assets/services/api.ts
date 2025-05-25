const mainUrl = "http://localhost:3000";
type methodType = "GET" | "POST";

const fetchAPI = async (
  endpoint: string,
  method: methodType,
  body?: object | FormData,
  contentType = "json",
) => {
  const token = sessionStorage.getItem("token");

  const options: RequestInit = {
    method,
    credentials: "include",
    headers: {},
  };

  if (method === "POST") {
    if (contentType === "json") {
      options.headers = {
        "Content-Type": "application/json",
      };
      options.body = JSON.stringify({ ...body, token });
    } else if (contentType === "formData") {
      if (body instanceof FormData) {
        body.append("token", token || "");
        options.body = body;
      } else {
        throw new Error("Body must be FormData when contentType is 'formData'");
      }
    }
  }

  return fetch(`${mainUrl}/${endpoint}`, options);
};

class FetchError extends Error {
  constructor(
    public res: Response,
    message?: string,
  ) {
    super(message);
  }
}

export async function login(username: string, password: string) {
  return fetchAPI("login", "POST", { username, password })
    .then((response) => {
      if (!response.ok) {
        throw new FetchError(response);
      }
      return response.json();
    })
    .then((data) => {
      return data;
    })
    .catch((err) => {
      throw err;
    });
}

export function getMessages(username: string) {
  return fetchAPI("getMessages", "POST", { currentUser: username });
}

export function getUserMessages(friendName: string) {
  return fetchAPI("getUserMessages", "POST", { friendName });
}

export function getFriends() {
  return fetchAPI("getFriends", "POST", {});
}

export function getYourPfp(username: string) {
  return fetchAPI("getYourProfilePicture", "POST", { username });
}

export function getGroup(groupId: number) {
  return fetchAPI("getGroup", "POST", { groupId }).then((data) => data.json());
}

export function getAllPeople(searchParam: string) {
  return fetchAPI("getAllUsers", "POST", { searchParam }).then((data) =>
    data.json(),
  );
}

export function deleteFriend(friendname: string) {
  return fetchAPI("deleteFriend", "POST", { friendname });
}

export function addFriend(friendname: string) {
  return fetchAPI("addFriend", "POST", { friendname });
}

export function getGroups() {
  return fetchAPI("getGroups", "POST", {});
}

export function createAGroup(groupName: string, friendList: string[]) {
  return fetchAPI("createAGroup", "POST", { groupName, friendList });
}

export function getImage(username: string) {
  return fetchAPI("getImage", "POST", { username });
}

export function loginAsGuest() {
  return fetchAPI("loginAsGuest", "GET", {}).then((data) => data.json());
}

export function deleteAGroup(groupId: string) {
  return fetchAPI("deleteAGroup", "POST", { groupId });
}

export function removeMemberFromGroup(groupId: string, friendName: string) {
  return fetchAPI("removeMemberFromGroup", "POST", { groupId, friendName });
}

export function upload(formData: FormData) {
  return fetchAPI("upload", "POST", formData, "formData");
}
