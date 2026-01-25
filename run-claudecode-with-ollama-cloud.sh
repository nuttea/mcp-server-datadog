#!/bin/bash

if [ -f .env ]; then
    source .env
else
    echo "Error: .env file not found."
    exit 1
fi

# Now you can use the variables in your script
#echo "API Key: $OLLAMA_CLOUD_API_KEY"

ollama signin
ollama pull gemini-3-flash-preview:cloud

ANTHROPIC_AUTH_TOKEN=ollama ANTHROPIC_API_KEY="" ANTHROPIC_BASE_URL=http://localhost:11434 \
claude --model gemini-3-flash-preview:cloud
#ANTHROPIC_API_KEY="$OLLAMA_CLOUD_API_KEY" ANTHROPIC_BASE_URL="https://ollama.com" claude --model gemini-3-flash-preview:cloud