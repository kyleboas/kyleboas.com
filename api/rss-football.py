import re
from fastapi import FastAPI, HTTPException
import feedparser
import requests
from bs4 import BeautifulSoup
import html
import logging
from collections import defaultdict

app = FastAPI()

# Setup logging
logging.basicConfig(level=logging.INFO)

RSS_FEED_URL = "https://www.molineux.news/news/feed/"

def fetch_rss_articles():
    """Fetch articles from the RSS feed and summarize them."""
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

            if not full_text:
                summary = "Summary not available."
            else:
                summary = summarize_text(full_text, 300)  # Summarize to 300 characters
                if quotes:
                    summary += f' Quotes: {"; ".join(quotes)}'  # Append grouped quotes if available

            articles.append({"headline": article_title, "summary": summary, "url": article_url})

        return articles

    except requests.exceptions.RequestException as e:
        logging.error(f"Error fetching RSS feed: {e}")
        return []

def extract_content(entry):
    """Extracts full article content from `content:encoded` and finds all quotes grouped by speaker."""
    try:
        # Try different ways to get `content:encoded`
        raw_html = None
        if "content:encoded" in entry:
            raw_html = entry["content:encoded"]
        elif "content" in entry and isinstance(entry["content"], list):
            raw_html = entry["content"][0]["value"]

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

        # Find all quotes with speaker names
        quotes = extract_quotes_with_speakers(full_text)

        # Ensure minimum content length
        full_text = clean_text(full_text)
        logging.info(f"Extracted text length: {len(full_text)} for article: {entry.get('link')}")
        
        return (full_text if len(full_text) > 100 else None, quotes)

    except Exception as e:
        logging.error(f"Error extracting content: {e}")
        return None, []

def extract_quotes_with_speakers(text):
    """Finds and groups quotes by the same speaker in the article."""
    quote_pattern = re.compile(r'(?:"([^"]+)"|\"([^\"]+)\")')  # Matches both curly and straight quotes
    speaker_pattern = re.compile(r'([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\s*(?:said|stated|confirmed|added|remarked|noted)', re.IGNORECASE)

    quotes_with_speakers = defaultdict(list)
    sentences = text.split(". ")

    last_speaker = None
    for i, sentence in enumerate(sentences):
        quotes = quote_pattern.findall(sentence)
        speaker_match = speaker_pattern.search(sentence)

        # Extract the actual quote text from the regex match
        extracted_quotes = [q[0] if q[0] else q[1] for q in quotes]

        if extracted_quotes:
            # If a speaker is found, use it; otherwise, use the last detected speaker
            speaker = speaker_match.group(1) if speaker_match else last_speaker

            if speaker:
                quotes_with_speakers[speaker].extend(extracted_quotes)
                last_speaker = speaker  # Keep track of the last known speaker

    # Format the quotes properly
    formatted_quotes = [f"{speaker}: " + "; ".join(quotes) for speaker, quotes in quotes_with_speakers.items()]
    return formatted_quotes

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