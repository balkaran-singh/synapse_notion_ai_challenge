import express from 'express';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

dotenv.config();

const app = express();
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const transport = new StdioClientTransport({
  command: "npx",
  args: [
    "-y",
    "@ramidecodes/mcp-server-notion@latest",
    "--api-key=" + process.env.NOTION_API_KEY
  ]
});

const mcpClient = new Client(
  { name: "synapse", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

await mcpClient.connect(transport);

const availableTools = await mcpClient.listTools();
console.log("Synapse Online. Loaded MCP Tools:", availableTools.tools.map(t => t.name));

app.post('/webhook/slack', (req, res) => {
  if (req.body.challenge) {
    return res.status(200).send(req.body.challenge);
  }

  const { event } = req.body;
  
  if (event && event.type === 'message' && !event.bot_id) {
    res.status(200).send('OK');

    const userMessage = event.text;
    const channelId = event.channel;

    if (!userMessage || typeof userMessage !== 'string') {
        return;
    }

    (async () => {
      try {
        const completion = await openai.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            { 
              role: "system", 
              content: "You are a helpful assistant. Use the provided tools to either create bug tickets or search documentation based on what the user needs." 
            },
            { role: "user", content: userMessage }
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "search_notion",
                description: "Search Notion docs",
                parameters: {
                  type: "object",
                  properties: { query: { type: "string" } },
                  required: ["query"]
                }
              }
            },
            {
              type: "function",
              function: {
                name: "create_ticket",
                description: "Create a sprint ticket for a bug",
                parameters: {
                  type: "object",
                  properties: { title: { type: "string" }, description: { type: "string" } },
                  required: ["title", "description"]
                }
              }
            }
          ],
          tool_choice: "auto"
        });

        const responseMessage = completion.choices[0].message;

        if (responseMessage.tool_calls) {
          const toolCall = responseMessage.tool_calls[0];
          const functionName = toolCall.function.name;
          const functionArgs = JSON.parse(toolCall.function.arguments);

          let resultMessage = "";
          let logTitle = "";

          if (functionName === "search_notion") {
            console.log("Searching Notion for:", functionArgs.query);
            
            const searchResult = await mcpClient.callTool({
              name: "search",
              arguments: { query: functionArgs.query }
            });

            const summaryCompletion = await openai.chat.completions.create({
              model: "llama-3.3-70b-versatile",
              messages: [
                { 
                  role: "system", 
                  content: "You are Synapse. Summarize the answer to the user's question using ONLY the provided Notion search results. Keep it brief and friendly." 
                },
                { 
                  role: "user", 
                  content: `User Question: ${userMessage}\n\nNotion Search Results: ${JSON.stringify(searchResult.content)}` 
                }
              ]
            });

            resultMessage = summaryCompletion.choices[0].message.content;
            logTitle = "Responded to Doc Search";

          } else if (functionName === "create_ticket") {
            console.log("Creating ticket:", functionArgs.title);
            await mcpClient.callTool({
              name: "create-page",
              arguments: {
                parent_type: "database_id",
                parent_id: process.env.NOTION_SPRINT_DB_ID,
                properties: JSON.stringify({
                  Name: { title: [{ text: { content: functionArgs.title } }] },
                  Description: { rich_text: [{ text: { content: functionArgs.description } }] }
                })
              }
            });
            resultMessage = `Ticket Created: *${functionArgs.title}* has been added to the Sprint Tracker.`;
            logTitle = "Created Sprint Ticket";
          }

          await fetch('https://slack.com/api/chat.postMessage', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.SLACK_BOT_TOKEN}`
            },
            body: JSON.stringify({
              channel: channelId,
              text: resultMessage
            })
          });

          await mcpClient.callTool({
            name: "create-page",
            arguments: {
              parent_type: "database_id",
              parent_id: process.env.NOTION_LOGS_DB_ID,
              properties: JSON.stringify({
                Name: { title: [{ text: { content: logTitle } }] },
                Details: { rich_text: [{ text: { content: `Slack Trigger: "${userMessage}"\nBot Action: ${resultMessage}` } }] }
              })
            }
          });
        }
      } catch (error) {
        console.error("AI or MCP Error:", error);
      }
    })();
  } else {
    if (!res.headersSent) res.status(200).send('Ignored');
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Server listening on port ${process.env.PORT}`);
});
