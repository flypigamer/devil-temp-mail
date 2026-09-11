import express from "express";
import crypto from "crypto";
import pg from "pg";

const { Pool } = pg;

const app = express();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

app.use(express.json());

app.use(express.static("."));

// Create mailbox table
await pool.query(`
    CREATE TABLE IF NOT EXISTS mailboxes (
        email TEXT PRIMARY KEY,
        access_key TEXT NOT NULL,
        messages JSONB NOT NULL DEFAULT '[]'::jsonb
    )
`);

console.log("PostgreSQL connected");

// Create New Mailbox
app.get("/api/new-mailbox", async (req, res) => {
    try {
        const random =
            Math.random()
                .toString(36)
                .substring(2, 10);

        const email =
            random + "@devilmail.local";

        const accessKey =
            crypto.randomBytes(16).toString("hex");

        await pool.query(
            `
            INSERT INTO mailboxes
            (email, access_key, messages)
            VALUES ($1, $2, $3)
            `,
            [
                email,
                accessKey,
                JSON.stringify([])
            ]
        );

        res.json({
            email: email,
            accessKey: accessKey,
            messages: []
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Could not create mailbox"
        });
    }
});


// Get Messages
app.get("/api/messages", async (req, res) => {
    try {
        const email = req.query.email;
        const accessKey = req.query.accessKey;

        const result = await pool.query(
            `
            SELECT messages
            FROM mailboxes
            WHERE email = $1
            AND access_key = $2
            `,
            [email, accessKey]
        );

        if (result.rows.length === 0) {
            return res.status(403).json({
                error: "Invalid access key"
            });
        }

        res.json({
            messages: result.rows[0].messages || []
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Could not load messages"
        });
    }
});


// Clear Inbox
app.post("/api/clear-inbox", async (req, res) => {
    try {
        const email = req.body.email;
        const accessKey = req.body.accessKey;

        const result = await pool.query(
            `
            UPDATE mailboxes
            SET messages = '[]'::jsonb
            WHERE email = $1
            AND access_key = $2
            `,
            [email, accessKey]
        );

        if (result.rowCount === 0) {
            return res.status(403).json({
                error: "Invalid access key"
            });
        }

        res.json({
            success: true
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Could not clear inbox"
        });
    }
});


// Test Mail
app.post("/api/test-message", async (req, res) => {
    try {
        const email = req.body.email;
        const accessKey = req.body.accessKey;

        const result = await pool.query(
            `
            SELECT messages
            FROM mailboxes
            WHERE email = $1
            AND access_key = $2
            `,
            [email, accessKey]
        );

        if (result.rows.length === 0) {
            return res.status(403).json({
                error: "Invalid access key"
            });
        }

        const messages =
            result.rows[0].messages || [];

        messages.push({
            from: "test@example.com",
            subject: "Welcome to Devil Temp Mail",
            text: "This is a test message.",
            time: new Date().toLocaleString()
        });

        await pool.query(
            `
            UPDATE mailboxes
            SET messages = $1
            WHERE email = $2
            AND access_key = $3
            `,
            [
                JSON.stringify(messages),
                email,
                accessKey
            ]
        );

        res.json({
            success: true
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Could not send test message"
        });
    }
});


// Start Server
const PORT =
    process.env.PORT || 3000;

app.listen(
    PORT,
    "0.0.0.0",
    () => {
        console.log(
            `Devil Temp Mail server started on port ${PORT}`
        );
    }
);
