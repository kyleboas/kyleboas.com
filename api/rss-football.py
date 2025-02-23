import re
from fastapi import FastAPI, HTTPException
import feedparser
import requests
from bs4 import BeautifulSoup
import html
import logging

app = FastAPI()

# Setup logging
logging.basicConfig(level=logging.INFO)

RSS_FEED_URL = "https://www.molineux.news/news/feed/"

def fetch_rss_articles():
    """Fetch articles from the RSS feed and extract quotes with speakers."""
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }

    try:
        response = requests.get(RSS_FEED_URL, headers=headers, timeout=10)
        logging.info(f"RSS feed request status: {response.status_code}")

        if response.status_code != 200:
            logging.error(f"Failed to fetch RSS feed: {response.status_code}")
            return []

        feed = feedparser.parse(response.text)

        if not feed.entries:
            logging.error("No articles found in the RSS feed.")
            return []

        articles = []
        for entry in feed.entries[:5]:  # Get latest 5 articles
            article_url = entry.link
            article_title = entry.title
            full_text, quotes = extract_content(entry)

            # If no quotes found, fallback to summary
            if quotes:
                summary = "\n".join([f"{speaker}: {quote}" for speaker, quote in quotes])
            else:
                summary = summarize_text(full_text, 300) if full_text else "No quotes found."

            articles.append({"headline": article_title, "summary": summary, "url": article_url})

        return articles

    except requests.exceptions.RequestException as e:
        logging.error(f"Error fetching RSS feed: {e}")
        return []

def extract_content(entry):
    """Extracts full article content from `content:encoded` and finds all quotes with speakers."""
    try:
        # Extract `content:encoded` from RSS entry
        raw_html = entry.get("content:encoded")
        if not raw_html:
            logging.error(f"No `content:encoded` found for article: {entry.get('link')}")
            return None, []

        logging.info(f"Extracting `content:encoded` for article: {entry.get('link')}")

        # Decode HTML entities
        raw_html = html.unescape(raw_html)

        # Parse HTML using BeautifulSoup
        soup = BeautifulSoup(raw_html, "html.parser")

        # Extract text
        full_text = soup.get_text(separator=" ").strip()

        # Find all quotes with their speakers
        quotes = extract_quotes_with_speakers(soup)

        # Ensure minimum content length
        full_text = clean_text(full_text)
        logging.info(f"Extracted text length: {len(full_text)} for article: {entry.get('link')}")
        
        return (full_text if len(full_text) > 100 else None, quotes)

    except Exception as e:
        logging.error(f"Error extracting content: {e}")
        return None, []

def extract_quotes_with_speakers(soup):
    """Finds and assigns speakers to quotes."""
    quote_pattern = re.compile(r'[""]([^""]+)[""]')  # Matches both "curly" and "straight" quotes
    speaker_pattern = re.compile(r'([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\s*(?:said|stated|confirmed|added|remarked|noted|mentioned|explained|claimed|told)', re.IGNORECASE)

    quotes_with_speakers = []
    last_speaker = "Unknown"

    paragraphs = soup.find_all("p")  # Get all paragraphs

    for paragraph in paragraphs:
        text = paragraph.get_text().strip()

        # Find quotes in the paragraph
        quotes = quote_pattern.findall(text)
        
        # Look for a speaker in the same or previous paragraph
        speaker_match = speaker_pattern.search(text)
        if speaker_match:
            last_speaker = speaker_match.group(1)  # Update speaker

        for quote in quotes:
            quotes_with_speakers.append((last_speaker, f'"{quote}"'))  # Store speaker + quote

    return quotes_with_speakers

def summarize_text(text, limit=300):
    """Summarizes the article to a natural length, 300 characters or less."""
    try:
        text = text.strip()
        logging.info(f"Summarizing text of length {len(text)}")

        # If the text is already short, return it as is
        if len(text) <= limit:
            return text

        # Split into sentences
        sentences = text.split(". ")

        summary = ""
        for sentence in sentences:
            if len(summary) + len(sentence) + 2 > limit:  # +2 for ". "
                break
            summary += sentence + ". "

        # If the summary is too short, take the first 300 characters
        if len(summary) < 100:
            summary = text[:limit] + "..."

        logging.info(f"Final summary length: {len(summary)}")
        return summary.strip()

    except Exception as e:
        logging.error(f"Error summarizing text: {e}")
        return "Summary not available."

def clean_text(text):
    """Removes extra spaces, emojis, and fixes text encoding issues."""
    text = re.sub(r'\s+', ' ', text)  # Remove extra spaces
    return text.encode('utf-8', 'ignore').decode('utf-8')  # Fix encoding issues

@app.get("/api/articles")
async def get_articles():
    """API endpoint to fetch summarized RSS articles."""
    articles = fetch_rss_articles()

    if not articles:
        raise HTTPException(status_code=404, detail="No articles found or failed to fetch RSS feed")

    return articles