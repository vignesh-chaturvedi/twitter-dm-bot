import axios from "axios";
import * as fs from "fs";
import * as dotenv from "dotenv";

dotenv.config();

const BEARER_TOKEN = process.env.BEARER_TOKEN;

const TWITTER_DM_URL =
  "https://api.twitter.com/2/direct_messages/events/new.json";

const accounts: string[] = JSON.parse(
  fs.readFileSync("twitter_accounts.json", "utf-8")
);

const extractUsername = (url: string): string => url.split("/").pop() || "";

const getUserId = async (username: string): Promise<string | null> => {
  try {
    const response = await axios.get(
      `https://api.twitter.com/2/users/by/username/${username}`,
      {
        headers: { Authorization: `Bearer ${BEARER_TOKEN}` },
      }
    );
    return response.data.data.id;
  } catch (error: any) {
    console.error(
      `Failed to get user ID for ${username}:`,
      error.response?.data || error.message
    );
    return null;
  }
};

const sendDirectMessage = async (
  recipientId: string,
  message: string
): Promise<void> => {
  try {
    const payload = {
      event: {
        type: "message_create",
        message_create: {
          target: { recipient_id: recipientId },
          message_data: { text: message },
        },
      },
    };

    await axios.post(TWITTER_DM_URL, payload, {
      headers: {
        Authorization: `Bearer ${BEARER_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    console.log(`DM sent to user ID ${recipientId}`);
  } catch (error: any) {
    console.error(
      `Failed to send DM to user ID ${recipientId}:`,
      error.response?.data || error.message
    );
  }
};

const main = async () => {
  const message = "Hello, we have something exciting to share with you!";

  for (const url of accounts) {
    const username = extractUsername(url);

    if (!username) {
      console.error(`Invalid URL: ${url}`);
      continue;
    }

    const userId = await getUserId(username);

    if (!userId) {
      console.error(`Could not find user ID for ${username}`);
      continue;
    }

    await sendDirectMessage(userId, message);
  }
};

main().catch((error) => console.error("Error in main function:", error));
