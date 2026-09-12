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

const MAILTM_API = "https://api.mail.tm";

app.use(express.json());
app.use(express.static("."));

// Create mailbox table
await pool.query(`
    CREATE TABLE IF NOT EXISTS mailboxes (
        email TEXT PRIMARY KEY,
        access_key TEXT NOT NULL,
        messages JSONB NOT NULL DEFAULT '[]'::jsonb,
        mailtm_token TEXT
    )
`);

console.log("PostgreSQL connected");

// Get Mail.tm domain
async function getMailDomain() {
    const response = await fetch(`${MAILTM_API}/domains`);

    if (!response.ok) {
        throw new Error("Could not get Mail.tm domain");
    }

    const data = await response.json();

    if (!data["hydra:member"]?.length) {
        throw new Error("No Mail.tm domain available");
    }

    return data["hydra:member"][0].domain;
}

// Create New Mailbox
app.get("/api/new-mailbox", async (req, res) => {
    try {
        const domain = await getMailDomain();

        const username =
            Math.random()
                .toString(36)
                .substring(2, 10);

        const email = `${username}@${domain}`;

        const password =
            crypto.randomBytes(12).toString("hex");

        const accessKey =
            crypto.randomBytes(16).toString("hex");

        // Create account on Mail.tm
        const accountResponse = await fetch(
            `${MAILTM_API}/accounts`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    address: email,
                    password: password
                })
            }
        );

        if (!accountResponse.ok) {
            const errorText = await accountResponse.text();
            console.error("Mail.tm account error:", errorText);

            return res.status(500).json({
                error: "Could not create Mail.tm mailbox"
            });
        }

        // Login to get token
        const loginResponse = await fetch(
            `${MAILTM_API}/token`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    address: email,
                    password: password
                })
            }
        );

        if (!loginResponse.ok) {
            return res.status(500).json({
                error: "Could not login to Mail.tm"
            });
        }

        const loginData = await loginResponse.json();

        const token = loginData.token;

        // Save mailbox in PostgreSQL
        await pool.query(
            `
            INSERT INTO mailboxes
            (email, access_key, messages, mailtm_token)
            VALUES ($1, $2, $3, $4)
            `,
            [
                email,
                accessKey,
                JSON.stringify([]),
                token
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
            SELECT messages, mailtm_token
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

        const token = result.rows[0].mailtm_token;

        // Get messages from Mail.tm
        const response = await fetch(
            `${MAILTM_API}/messages`,
            {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        if (response.ok) {
            const data = await response.json();

            const mailMessages =
                (data["hydra:member"] || []).map(message => ({
                    from:
                        message.from?.address ||
                        "Unknown",
                    subject:
                        message.subject ||
                        "(No subject)",
                    text:
                        message.intro ||
                        "",
                    time:
                        message.createdAt ||
                        new Date().toISOString()
                }));

            // Save latest messages
            await pool.query(
                `
                UPDATE mailboxes
                SET messages = $1
                WHERE email = $2
                AND access_key = $3
                `,
                [
                    JSON.stringify(mailMessages),
                    email,
                    accessKey
                ]
            );

            return res.json({
                messages: mailMessages
            });
        }

        // Fallback to saved messages
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
