#!/bin/bash
# Run from project root so Python finds the bot package.
# Use this as START_BASH_FILE in your panel, or run: cd /home/container && python main.py

cd "$(dirname "$0")"
exec python main.py
