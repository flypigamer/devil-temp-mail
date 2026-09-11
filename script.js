const homePage = document.getElementById("homePage");
const inboxPage = document.getElementById("inboxPage");

const email = document.getElementById("email");
const accessKey = document.getElementById("accessKey");

const copyBtn = document.getElementById("copyBtn");
const copyKeyBtn = document.getElementById("copyKeyBtn");

const refreshBtn = document.getElementById("refreshBtn");
const clearBtn = document.getElementById("clearBtn");
const testMailBtn = document.getElementById("testMailBtn");

const newEmailBtn = document.getElementById("newEmailBtn");
const backBtn = document.getElementById("backBtn");

const inbox = document.querySelector(".inbox");
const mailCount = document.getElementById("mailCount");


// =========================
// LOGIN ELEMENTS
// =========================

const loginBtn = document.getElementById("loginBtn");
const loginBox = document.getElementById("loginBox");
const doLoginBtn = document.getElementById("doLoginBtn");


// =========================
// ACCOUNT ELEMENTS
// =========================

const accountBtn = document.getElementById("accountBtn");
const accountMenu = document.getElementById("accountMenu");
const logoutBtn = document.getElementById("logoutBtn");
const menuCreateBtn = document.getElementById("menuCreateBtn");
const menuEmail = document.getElementById("menuEmail");


// =========================
// SHOW HOME
// =========================

function showHomePage() {

    homePage.style.display = "flex";
    inboxPage.style.display = "none";

}


// =========================
// SHOW INBOX
// =========================

function showInboxPage() {

    homePage.style.display = "none";
    inboxPage.style.display = "block";

}


// =========================
// CREATE NEW MAILBOX
// =========================

   async function createNewMailbox() {

    newEmailBtn.disabled = true;
    newEmailBtn.textContent = "Creating...";

    try {

        const response = await fetch("/api/new-mailbox", {
            method: "GET",
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error("API_ERROR");
        }

        const data = await response.json();

        console.log("New mailbox created:", data);

        // Save account
        localStorage.setItem(
            "devilEmail",
            data.email
        );

        localStorage.setItem(
            "devilAccessKey",
            data.accessKey
        );

        // Put credentials
        email.value = data.email;
        accessKey.value = data.accessKey;

        // Account email
        const accountEmail =
            document.getElementById("accountEmail");

        if (accountEmail) {
            accountEmail.textContent = data.email;
        }

        // Menu email
        if (menuEmail) {
            menuEmail.textContent = data.email;
        }

        // Open Inbox FIRST
        showInboxPage();

        // Then empty inbox
        showMessages([]);

    } catch (error) {

        console.error("Create mailbox failed:", error);

        if (error.message === "API_ERROR") {

            alert(
                "Server connection error! Please try again."
            );

        } else {

            alert(
                "Something went wrong: " +
                error.message
            );

        }

    } finally {

        newEmailBtn.disabled = false;
        newEmailBtn.textContent =
            "Create Temporary Inbox";

    }

   }



// =========================
// CREATE BUTTON
// =========================

newEmailBtn.addEventListener(
    "click",
    createNewMailbox
);


// =========================
// COPY EMAIL
// =========================

copyBtn.addEventListener(
    "click",
    async () => {

        try {

            await navigator.clipboard.writeText(
                email.value
            );

            copyBtn.textContent = "Copied!";

            setTimeout(() => {

                copyBtn.textContent = "Copy";

            }, 1500);

        } catch (error) {

            console.error(error);

        }

    }
);


// =========================
// COPY ACCESS KEY
// =========================

copyKeyBtn.addEventListener(
    "click",
    async () => {

        try {

            await navigator.clipboard.writeText(
                accessKey.value
            );

            copyKeyBtn.textContent = "Copied!";

            setTimeout(() => {

                copyKeyBtn.textContent = "Copy";

            }, 1500);

        } catch (error) {

            console.error(error);

        }

    }
);


// =========================
// EXTRA COPY EMAIL
// =========================

function copyEmail() {

    navigator.clipboard.writeText(
        email.value
    );

}


// =========================
// SHOW MESSAGES
// =========================

  function showMessages(messages) {

    // Update mail count only if element exists
    if (mailCount) {
        mailCount.textContent = `Inbox (${messages.length})`;
    }

    // Inbox element check
    if (!inbox) {
        console.error("Inbox element not found in index.html");
        return;
    }

    if (messages.length === 0) {

        inbox.innerHTML = `

            <div class="empty-inbox">

                <div class="empty-icon">
                    ✉
                </div>

                <h3>
                    Inbox is empty
                </h3>

                <p>
                    You haven't received any emails yet.
                    When you do, they'll appear here.
                </p>

            </div>

        `;

        return;
    }

    inbox.innerHTML = "";

    messages.forEach(message => {

        const item = document.createElement("div");

        item.className = "mail";

        const from = document.createElement("p");

        from.innerHTML =
            "<strong>From:</strong> ";

        from.appendChild(
            document.createTextNode(
                message.from || ""
            )
        );

        const subject = document.createElement("p");

        subject.innerHTML =
            "<strong>Subject:</strong> ";

        subject.appendChild(
            document.createTextNode(
                message.subject || ""
            )
        );

        const time = document.createElement("small");

        time.textContent =
            message.time || "";

        item.appendChild(from);
        item.appendChild(subject);
        item.appendChild(time);

        item.addEventListener("click", () => {

            inbox.innerHTML = "";

            const mailBox =
                document.createElement("div");

            mailBox.className = "mail";

            const back =
                document.createElement("button");

            back.textContent =
                "← Back to Inbox";

            back.className =
                "small-btn";

            const hr =
                document.createElement("hr");

            const fromText =
                document.createElement("p");

            fromText.innerHTML =
                "<strong>From:</strong> ";

            fromText.appendChild(
                document.createTextNode(
                    message.from || ""
                )
            );

            const subjectText =
                document.createElement("p");

            subjectText.innerHTML =
                "<strong>Subject:</strong> ";

            subjectText.appendChild(
                document.createTextNode(
                    message.subject || ""
                )
            );

            const bodyText =
                document.createElement("p");

            bodyText.textContent =
                message.text || "";

            const timeText =
                document.createElement("small");

            timeText.textContent =
                message.time || "";

            mailBox.appendChild(back);
            mailBox.appendChild(hr);
            mailBox.appendChild(fromText);
            mailBox.appendChild(subjectText);
            mailBox.appendChild(bodyText);
            mailBox.appendChild(timeText);

            inbox.appendChild(mailBox);

            back.addEventListener("click", event => {

                event.stopPropagation();

                refreshInbox();

            });

        });

        inbox.appendChild(item);

    });

}
        




        


// =========================
// REFRESH INBOX
// =========================

async function refreshInbox() {

    const savedEmail =
        localStorage.getItem(
            "devilEmail"
        );

    const savedKey =
        localStorage.getItem(
            "devilAccessKey"
        );


    // No login
    if (!savedEmail || !savedKey) {

        showHomePage();

        return;

    }


    email.value = savedEmail;
    accessKey.value = savedKey;


    // Account email
    const accountEmail =
        document.getElementById("accountEmail");

    if (accountEmail) {
        accountEmail.textContent =
            savedEmail;
    }


    // Menu email
    if (menuEmail) {
        menuEmail.textContent =
            savedEmail;
    }


    try {

        const response = await fetch(
            "/api/messages?email=" +
            encodeURIComponent(savedEmail) +
            "&accessKey=" +
            encodeURIComponent(savedKey),
            {
                cache: "no-store"
            }
        );


        if (!response.ok) {

            throw new Error(
                "Invalid mailbox access"
            );

        }


        const data =
            await response.json();


        showMessages(
            data.messages || []
        );


    } catch (error) {

        console.error(
            "Refresh error:",
            error
        );

    }

}


// =========================
// REFRESH BUTTON
// =========================

refreshBtn.addEventListener(
    "click",
    refreshInbox
);


// =========================
// CLEAR INBOX
// =========================

clearBtn.addEventListener(
    "click",
    async () => {

        const savedEmail =
            localStorage.getItem(
                "devilEmail"
            );

        const savedKey =
            localStorage.getItem(
                "devilAccessKey"
            );


        if (!savedEmail || !savedKey) {

            showHomePage();

            return;

        }


        try {

            const response =
                await fetch(
                    "/api/clear-inbox",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({

                            email: savedEmail,

                            accessKey: savedKey

                        })

                    }
                );


            const data =
                await response.json();


            if (data.success) {

                showMessages([]);

            } else {

                alert(
                    "Unable to clear inbox!"
                );

            }


        } catch (error) {

            console.error(error);

            alert(
                "Server connection error!"
            );

        }

    }
);


// =========================
// TEST MAIL
// =========================

testMailBtn.addEventListener(
    "click",
    async () => {

        const savedEmail =
            localStorage.getItem(
                "devilEmail"
            );

        const savedKey =
            localStorage.getItem(
                "devilAccessKey"
            );


        if (!savedEmail || !savedKey) {

            showHomePage();

            return;

        }


        try {

            const response =
                await fetch(
                    "/api/test-message",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({

                            email: savedEmail,

                            accessKey: savedKey

                        })

                    }
                );


            const data =
                await response.json();


            if (data.success) {

                refreshInbox();

            } else {

                alert(
                    "Test mail failed!"
                );

            }


        } catch (error) {

            console.error(error);

            alert(
                "Server connection error!"
            );

        }

    }
);


// =========================
// CREATE NEW INBOX
// =========================

backBtn.addEventListener(
    "click",
    () => {

        localStorage.removeItem(
            "devilEmail"
        );

        localStorage.removeItem(
            "devilAccessKey"
        );


        if (accountMenu) {
            accountMenu.style.display = "none";
        }


        if (loginBox) {
            loginBox.style.display = "none";
        }


        showHomePage();

    }
);


// =========================
// LOGIN BUTTON
// =========================

loginBtn.addEventListener(
    "click",
    () => {

        if (loginBox.style.display === "block") {

            loginBox.style.display = "none";

        } else {

            loginBox.style.display = "block";

        }

    }
);


// =========================
// LOGIN EXISTING ACCOUNT
// =========================

doLoginBtn.addEventListener(
    "click",
    async () => {

        const loginEmail =
            document
                .getElementById("loginEmail")
                .value
                .trim();


        const loginKey =
            document
                .getElementById("loginKey")
                .value
                .trim();


        if (!loginEmail || !loginKey) {

            alert(
                "Please enter email and access key."
            );

            return;

        }


        try {

            const response =
                await fetch(
                    "/api/messages?email=" +
                    encodeURIComponent(loginEmail) +
                    "&accessKey=" +
                    encodeURIComponent(loginKey),
                    {
                        cache: "no-store"
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                alert(
                    "Invalid email or access key."
                );

                return;

            }


            // Save login
            localStorage.setItem(
                "devilEmail",
                loginEmail
            );

            localStorage.setItem(
                "devilAccessKey",
                loginKey
            );


            // Restore inbox fields
            email.value =
                loginEmail;

            accessKey.value =
                loginKey;


            // Account
            const accountEmail =
                document.getElementById(
                    "accountEmail"
                );

            if (accountEmail) {

                accountEmail.textContent =
                    loginEmail;

            }


            if (menuEmail) {

                menuEmail.textContent =
                    loginEmail;

            }


            // Close login box
            loginBox.style.display =
                "none";


            // Open inbox
            showInboxPage();


            // Show messages
            showMessages(
                data.messages || []
            );


        } catch (error) {

            console.error(
                "Login error:",
                error
            );

            alert(
                "Unable to connect to server."
            );

        }

    }
);


// =========================
// ACCOUNT MENU
// =========================

accountBtn.addEventListener(
    "click",
    () => {

        if (accountMenu.style.display === "block") {

            accountMenu.style.display =
                "none";

        } else {

            accountMenu.style.display =
                "block";


            const savedEmail =
                localStorage.getItem(
                    "devilEmail"
                );


            if (savedEmail) {

                menuEmail.textContent =
                    savedEmail;

            }

        }

    }
);


// =========================
// MENU → CREATE NEW
// =========================

menuCreateBtn.addEventListener(
    "click",
    () => {

        localStorage.removeItem(
            "devilEmail"
        );

        localStorage.removeItem(
            "devilAccessKey"
        );


        accountMenu.style.display =
            "none";


        loginBox.style.display =
            "none";


        showHomePage();

    }
);


// =========================
// LOGOUT
// =========================

logoutBtn.addEventListener(
    "click",
    () => {

        // Delete login
        localStorage.removeItem(
            "devilEmail"
        );

        localStorage.removeItem(
            "devilAccessKey"
        );


        // Close menu
        accountMenu.style.display =
            "none";


        // Close login box
        loginBox.style.display =
            "none";


        // Clear fields
        email.value = "";
        accessKey.value = "";


        // Go Home
        showHomePage();

    }
);


// ==================================================
// START WEBSITE
// ==================================================
//
// IMPORTANT:
//
// Website open normally
// → HOME
//
// Only if user is already logged in
// → INBOX
//
// ==================================================

const savedEmailOnStart =
    localStorage.getItem(
        "devilEmail"
    );

const savedKeyOnStart =
    localStorage.getItem(
        "devilAccessKey"
    );


// =========================
// LOGGED IN
// =========================

if (
    savedEmailOnStart &&
    savedKeyOnStart
) {

    email.value =
        savedEmailOnStart;

    accessKey.value =
        savedKeyOnStart;


    if (document.getElementById("accountEmail")) {

        document.getElementById(
            "accountEmail"
        ).textContent =
            savedEmailOnStart;

    }


    if (menuEmail) {

        menuEmail.textContent =
            savedEmailOnStart;

    }


    showInboxPage();

    refreshInbox();


// =========================
// NOT LOGGED IN
// =========================

} else {

    // ALWAYS HOME
    showHomePage();

}
