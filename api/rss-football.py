from fastapi import FastAPI, HTTPException
import feedparser
import requests
from bs4 import BeautifulSoup
import html
import logging
import re

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
            full_text = extract_content(entry)

            if not full_text:
                summary = "Summary not available."
            else:
                summary = summarize_text(full_text, 300)  # Summarize to 300 characters

            articles.append({"headline": article_title, "summary": summary, "url": article_url})

        return articles

    except requests.exceptions.RequestException as e:
        logging.error(f"Error fetching RSS feed: {e}")
        return []

def extract_content(entry):
    """Extracts full article content from `content:encoded`, removing HTML and unwanted characters."""
    try:
        if "content:encoded" in entry:
            raw_html = entry["content:encoded"]
            logging.info(f"Extracting `content:encoded` for article: {entry.get('link')}")
        else:
            logging.error(f"No `content:encoded` found for article: {entry.get('link')}")
            return None

        # Decode HTML entities (fixes encoding issues)
        raw_html = html.unescape(raw_html)

        # Parse HTML using BeautifulSoup
        soup = BeautifulSoup(raw_html, "html.parser")

        # Extract text and remove unnecessary whitespace
        full_text = soup.get_text(separator=" ").strip()

        # Clean the text (remove emojis, fix encoding issues)
        full_text = clean_text(full_text)

        logging.info(f"Extracted text length: {len(full_text)} for article: {entry.get('link')}")
        return full_text if len(full_text) > 100 else None  # Ensure minimum content

    except Exception as e:
        logging.error(f"Error extracting content: {e}")
        return None

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
    """Removes emojis, extra spaces, and fixes text encoding issues."""
    # Remove emojis using regex
    emoji_pattern = re.compile("["
        u"\U0001F600-\U0001F64F"  # Emoticons
        u"\U0001F300-\U0001F5FF"  # Symbols & pictographs
        u"\U0001F680-\U0001F6FF"  # Transport & map symbols
        u"\U0001F700-\U0001F77F"  # Alchemical symbols
        u"\U0001FA00-\U0001FA6F"  # Miscellaneous symbols
        u"\U0001FA70-\U0001FAFF"  # More symbols
        "]+", flags=re.UNICODE)
    text = emoji_pattern.sub(r'', text)

    # Remove extra spaces
    text = re.sub(r'\s+', ' ', text)

    # Fix encoding issues
    text = text.encode('utf-8', 'ignore').decode('utf-8')

    return text

@app.get("/api/articles")
async def get_articles():
    """API endpoint to fetch summarized RSS articles."""
    articles = fetch_rss_articles()

    if not articles:
        raise HTTPException(status_code=404, detail="No articles found or failed to fetch RSS feed")

    return articles