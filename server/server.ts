import express from "express";
import cors from "cors";
import {
  getMessages,
  getFriends,
  getPicture,
  getYourProfilePicture,
  insertPicture,
  getAllUsers,
  addFriend,
  deleteFriend,
  getGroups,
  createAGroup,
  checkCredentials,
  addUser,
  getFriend,
  getSingleGroup,
  deleteAGroup,
  removeMemberFromGroup,
  areFriends,
  getGroupMembers,
} from "./sqlCommands.js";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
const app = express();
const port = process.env.PORT || 3000;
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { initializeWs } from "./weboscket.js";
import multer from "multer";
const ws = initializeWs();

const upload = multer({ dest: "userImages/" });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import dotenv from "dotenv";
dotenv.config({ path: "../.env" });
const JWT_KEY = process.env.JWT_KEY;

function extractJWTUsername(jwtToken: string) {
  const payload = jwt.verify(jwtToken, JWT_KEY);
  const { username } = payload;
  return username;
}

const corsOptions = {
  origin: "http://localhost:5173",
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/userImages", express.static(path.join(__dirname, "userImages")));

async function authenticate(req, res, next) {
  let token = req.body.token;

  if (token) {
    try {
      jwt.verify(token, JWT_KEY);
      next();
      return;
    } catch (err) {
      res.status(401).json({ message: "Invalid authorization credentials!" });
      return;
    }
  }

  next();
}

app.post("/login", async (req, res) => {
  try {
    const username = req.body.username;
    const password = req.body.password;

    if ((await checkCredentials(username, password)).length == 0) {
      res
        .status(401)
        .json({ message: "Username or password are not correct!" });
      return;
    }
    const token = jwt.sign({ username, password }, JWT_KEY, {
      expiresIn: "4h",
    });
    res.json({
      token,
    });
  } catch (error) {
    console.error(error);
  }
});

app.get("/logout", (req, res) => {
  res
    .cookie("token", "", { expires: new Date(0) })
    .json({ message: "Removed a cookie!" });
});

app.post("/deleteFriend", (req, res) => {
  const username = extractJWTUsername(req.body.token);
  const { friendname } = req.body;
  try {
    deleteFriend(username, friendname);
    let message = "3: " + username + " " + friendname + "\n";
    console.log(message);
    ws.send(message);
    res.json({ message: "Succesfully deleted a friend!" });
  } catch (e) {
    console.error(e);
    res.json({ message: "Deleting a friend was not successful!" });
  }
});

app.post("/createAGroup", authenticate, async (req, res) => {
  const username = extractJWTUsername(req.body.token);
  const groupName = req.body.groupName;
  const friendList = req.body.friendList;
  try {
    let { groupId } = await createAGroup(username, groupName, friendList);
    let group = await getSingleGroup(groupId);
    let wsMessage = `5: ${groupId} 2 ` + group.users.join(" ") + "\n";
    ws.send(wsMessage);
    res.status(201).json(group);
  } catch (err) {
    console.error(err);
    res.status(409).json({ message: "Error while adding a group!" });
  }
});

app.post("/getGroups", authenticate, async (req, res) => {
  const username = extractJWTUsername(req.body.token);
  let result = await getGroups(username);
  res.json(result);
});

app.post("/getMessages", authenticate, async (req, res) => {
  const currentUser = req.body.currentUser;
  const friends = await getFriends(currentUser);
  let result = {};
  for (const friend of friends) {
    let messages = await getMessages(currentUser, friend.friendName);
    friend.fileName = friend.fileName || "default.png";
    result[`${friend.friendName}`] = { ...friend, messages };
  }
  let groups = await getGroups(currentUser);
  result = { ...result, ...groups };

  res.json(result);
});

app.post("/getUserMessages", authenticate, async (req, res) => {
  const username = extractJWTUsername(req.body.token);
  const friendName = req.body.friendName;
  if (!(await areFriends(username, friendName))) {
    res.status(403).json({ message: "You are not friends with this person!" });
    return;
  }
  let friend = await getFriend(username, friendName);
  let messages = await getMessages(username, friendName);
  let result = { ...friend["0"], messages };
  res.json(result);
});

app.post("/getGroup", authenticate, async (req, res) => {
  const groupId = req.body.groupId;
  const group = await getSingleGroup(groupId);
  res.json(group);
});

app.post("/getFriends", async (req, res) => {
  const username = extractJWTUsername(req.body.token);
  const friends = await getFriends(username);
  const reply = friends.map((friend) => {
    return {
      ...friend,
      fileName: friend.fileName != null ? friend.fileName : "default.png",
    };
  });
  const groups = await getGroups(username);
  res.json([...reply, ...groups]);
});

app.post("/getAllUsers", async (req, res) => {
  const username = extractJWTUsername(req.body.token);
  const people = await getAllUsers(username, req.body.searchParam);
  res.json(people);
});

app.post("/getYourProfilePicture", async (req, res) => {
  try {
    let response = { imgSrc: "default.png" };
    let yourProfilePic = await getYourProfilePicture(req.body.username);
    if (yourProfilePic.length != 0)
      response.imgSrc = yourProfilePic[0].fileName;
    res.json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/upload", authenticate, upload.single("file"), async (req, res) => {
  try {
    const token = req.body.token;
    if (!token) {
      res.status(400).json({ message: "No token provided" });
      return;
    }

    const username = extractJWTUsername(token);

    if (!username) {
      res.status(400).json({ message: "Invalid token" });
      return;
    }

    const uploadPath = path.join(__dirname, "userImages");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    const filePath = path.join(uploadPath, `${username}Image.png`);

    fs.rename(req.file.path, filePath, (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to save image" });
      }

      insertPicture(username);

      res.json({ message: "File uploaded successfully!" });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/getImage", async (req, res) => {
  try {
    let username = req.body.username;
    const result = await getPicture(username);
    res.json({ image: result.fileName });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/deleteAGroup", async (req, res) => {
  const groupId = req.body.groupId;
  const username = extractJWTUsername(req.body.token);
  try {
    let members = await getGroupMembers(groupId);
    members = members.filter((name) => name != username);
    await deleteAGroup(groupId);
    if (ws.readyState === WebSocket.OPEN) {
      let wsMessage = `5: ${groupId} 1 ` + members.join(" ") + "\n";
      ws.send(wsMessage);
      console.log("message sent!");
    } else {
      console.error("WebSocket is not open. Cannot send message.");
    }
    res.json({ message: "Successufully deleted a group!" });
  } catch (err) {
    res.json({ error: err });
  }
});

app.post("/removeMemberFromGroup", async (req, res) => {
  const { groupId, friendName } = req.body;
  const username = extractJWTUsername(req.body.token);
  try {
    let members = await getGroupMembers(groupId);
    members = members.filter((name) => name != username);
    await removeMemberFromGroup(username, groupId, friendName);
    let wsMessage = `4: ${groupId} ${friendName} ` + members.join(" ") + "\n";
    ws.send(wsMessage);
    res.json({ message: "Successufully removed a friend from a group!" });
  } catch (err) {
    res.json({ error: err });
  }
});

app.post("/addFriend", async (req, res) => {
  const { friendname } = req.body;
  const username = extractJWTUsername(req.body.token);
  try {
    await addFriend(username, friendname);
    let friend = await getFriend(username, friendname);
    let messages = await getMessages(username, friendname);
    let result = { ...friend["0"], messages };
    let message = "3: " + username + " " + friendname + "\n";
    // ws.send(message);
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
      console.log("message sent!");
    } else {
      console.error("WebSocket is not open. Cannot send message.");
    }
    res.json(result);
  } catch (err) {
    res.json({ error: err });
  }
});

app.get("/loginAsGuest", async (req, res) => {
  try {
    const username = `User${Math.floor(Math.random() * 1000)}`;
    const password = Math.floor(Math.random() * 1000);
    await addUser(username, password);
    const token = jwt.sign({ username, password }, JWT_KEY, {
      expiresIn: "4h",
    });
    res.json({
      token,
    });
  } catch (error) {
    console.error(error);
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
