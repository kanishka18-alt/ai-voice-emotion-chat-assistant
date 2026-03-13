# AI Voice Emotion Chat Assistant
An AI-powered voice assistant capable of real-time speech processing, emotion detection, and conversational response generation using the Google Gemini API.

## Features
- Real-time voice and text interaction
- Speech-to-text transcription
- Emotion detection (7 categories)
- AI-generated conversational responses
- Structured REST API for reliable data exchange
- Secure API key management using dotenv

## Tech Stack
- Node.js
- Express.js
- JavaScript
- Google Gemini API (Gemini 2.5 Flash)
- JSON Schema
- REST API
- dotenv

## Project Structure
server/ – Backend server and API routes  
src/ – Frontend application code  
public/ – Static assets  

## Environment Variables
Create a `.env` file in the root directory and add:
GEMINI_API_KEY=your_api_key_here

**Note:**  
This project uses the **Google Gemini API**. The API key used during development was from the **free tier**, which is valid for **3 months**.  
If the key expires, you will need to generate a new key. Depending on availability, generating a new key may require enabling billing on the Google Cloud account.

## Author
Kanishka Sharma  
B.E. Computer Science, B.M.S College of Engineering  
GitHub: https://github.com/kanishka18-alt
LinkedIn: https://linkedin.com/in/kanishka-sharma-3aab79279
