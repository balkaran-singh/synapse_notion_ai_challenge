# Synapse: The Autonomous Developer Focus Shield

## Overview
Context switching is a developer's worst enemy. When an engineer is in deep focus, constantly switching to Slack to answer documentation questions or manually log bug reports into a sprint tracker shatters productivity. 

Synapse is an autonomous, AI-powered agent designed to act as a shield between a developer's deep work and their team's Slack channel. Activated via a custom CLI, Synapse intercepts incoming Slack messages, determines the user's intent using Groq's Llama 3 model, and takes direct action in Notion using the Model Context Protocol (MCP).

## Features
* **Automated Bug Tracking:** If a teammate reports a bug in Slack, Synapse autonomously structures the data and writes a new ticket directly into the engineering team's Notion Sprint Tracker.
* **RAG Documentation Search:** If a teammate asks a technical question, the AI queries the Notion API to search the company docs, synthesizes a human-friendly answer from the results, and posts it back to Slack.
* **Silent Background Auditing:** Every action Synapse takes is logged into a secure Notion database, giving the developer a complete paper trail of what the AI handled while they were in the zone.
* **CLI Focus Mode:** A custom terminal script that initiates the server and provides visual confirmation that focus time is protected.

## Technology Stack
* **Backend:** Node.js, Express.js
* **AI/LLM:** Groq API (llama-3.3-70b-versatile)
* **Integration:** Model Context Protocol (MCP) SDK
* **Databases/Tools:** Notion API, Slack Webhooks API
* **Networking:** Ngrok (for local webhook tunneling)

## Prerequisites
To run this project locally, you will need:
* Node.js installed
* A Groq API Key
* A Slack Workspace with permission to create Apps
* A Notion Workspace with an Internal Integration Secret

## Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/balkaran-singh/synapse_notion_ai_challenge
   cd synapse
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   * Copy the `.env.example` file to create a new `.env` file.
   * Fill in your respective API keys and Notion Database IDs. 
   ```bash
   cp .env.example .env
   ```
   *Note: Ensure your `.env` file is included in your `.gitignore` before pushing any code.*

4. **Start the local tunnel:**
   In a separate terminal window, start ngrok to expose your local server to Slack.
   ```bash
   npx ngrok http 3000
   ```
   Copy the forwarding URL and paste it into your Slack App's Event Subscriptions (append `/webhook/slack` to the URL).

5. **Activate Focus Mode:**
   Start the server using the custom CLI script.
   ```bash
   npm run focus
   ```

## Usage Architecture
1. The developer runs `npm run focus`.
2. A teammate messages the Slack channel: "The checkout button is returning a 500 error."
3. Slack sends the event payload to the Express server via the Ngrok tunnel.
4. The Groq LLM analyzes the text, determines a ticket needs to be created, and formats the function call arguments.
5. The MCP client executes the tool, pushing the structured data to the Notion Sprint Tracker.
6. A success confirmation is posted back to Slack, and the interaction is silently logged in the Notion Logs database.
