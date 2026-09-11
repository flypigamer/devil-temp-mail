import express from "express";
import crypto from "crypto";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";

const app = express();

const adapter = new JSONFile("data.json");

const db = new Low(adapter, {
    mailboxes: {}
});

await db.read();

if (!db.data) {
    db.data = {
        mailboxes: {}
    };

    await db.write();
}

app.use(express.json());

app.use(
    express.static(".")
);


// Create New Mailbox
app.get("/api/new-mailbox", async (req, res) => {

    const random =
        Math.random()
            .toString(36)
            .substring(2, 10);

    const email =
        random + "@devilmail.local";
  
const accessKey = crypto.randomBytes(16).toString("hex");
    db.data.mailboxes[email] = {
    accessKey: accessKey,
    messages: []
};

    await db.write();

    res.json({
    email: email,
    accessKey: accessKey,
    messages: []
});

});


// Get Messages
app.get("/api/messages", (req, res) => {

    const email = req.query.email;
const accessKey = req.query.accessKey;

const mailbox = db.data.mailboxes[email];

if (!mailbox || mailbox.accessKey !== accessKey) {
    return res.status(403).json({
        error: "Invalid access key"
    });
}
    res.json({
    messages: mailbox.messages
});

});


// Clear Inbox
app.post("/api/clear-inbox", async (req, res) => {

    const email = req.body.email;
  const accessKey = req.body.accessKey;

const mailbox = db.data.mailboxes[email];

if (!mailbox || mailbox.accessKey !== accessKey) {
    return res.status(403).json({
        error: "Invalid access key"
    });
}

    

    db.data.mailboxes[email].messages = [];

    await db.write();

    res.json({
        success: true
    });

});


// Test Mail
app.post("/api/test-message", async (req, res) => {

    const email = req.body.email;
const accessKey = req.body.accessKey;

const mailbox = db.data.mailboxes[email];

if (!mailbox || mailbox.accessKey !== accessKey) {
    return res.status(403).json({
        error: "Invalid access key"
    });
}
  
    db.data.mailboxes[email].messages.push({

        from: "test@example.com",

        subject:
            "Welcome to Devil Temp Mail",

        text:
            "This is a test message.",

        time:
            new Date().toLocaleString()

    });

    await db.write();

    res.json({
        success: true
    });

});


// Start Server
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Devil Temp Mail server started on port ${PORT}`);
});
