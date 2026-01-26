#!/bin/bash

if [ -f .env ]; then
    source .env
else
    echo "Error: .env file not found."
    exit 1
fi

# Now you can use the variables in your script
#echo "API Key: $OLLAMA_CLOUD_API_KEY"

# npm install -g @musistudio/claude-code-router
ccr code