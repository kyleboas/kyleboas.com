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
                summary = summarize_text(full_text)

            articles.append({"headline": article_title, "summary": summary, "url": article_url})

        return articles

    except requests.exceptions.RequestException as e:
        logging.error(f"Error fetching RSS feed: {e}")
        return []

def extract_content(entry):
    """Extracts full article content from the RSS feed."""
    try:
        if "content:encoded" in entry:
            raw_html = entry["content:encoded"]
        elif "summary" in entry:
            raw_html = entry["summary"]
        elif "description" in entry:
            raw_html = entry["description"]
        else:
            return None

        # Decode HTML entities (fixes encoding issues)
        raw_html = html.unescape(raw_html)

        # Parse HTML using BeautifulSoup
        soup = BeautifulSoup(raw_html, "html.parser")

        # Extract text from HTML
        full_text = soup.get_text(separator=" ").strip()

        # Remove emojis
        full_text = remove_emojis(full_text)

        return full_text if len(full_text) > 50 else None  # Avoid very short summaries

    except Exception as e:
        logging.error(f"Error extracting content: {e}")
        return None

def summarize_text(text):
    """Summarizes the article into 3 sentences using basic text splitting."""
    try:
        sentences = text.split(". ")
        summary = ". ".join(sentences[:3])  # Take first 3 sentences

        # Remove emojis from summary
        summary = remove_emojis(summary)

        return summary if len(summary) > 10 else "Summary not available."  # Ensure summary isn't too short

    except Exception as e:
        logging.error(f"Error summarizing text: {e}")
        return "Summary not available."

def remove_emojis(text):
    """Removes all emojis from a given text."""
    emoji_pattern = re.compile(
        "["
        u"\U0001F600-\U0001F64F"  # Emoticons
        u"\U0001F300-\U0001F5FF"  # Symbols & pictographs
        u"\U0001F680-\U0001F6FF"  # Transport & map symbols
        u"\U0001F700-\U0001F77F"  # Alchemical symbols
        u"\U0001F780-\U0001F7FF"  # Geometric shapes
        u"\U0001F800-\U0001F8FF"  # Supplemental symbols
        u"\U0001F900-\U0001F9FF"  # Faces, hands, etc.
        u"\U0001FA00-\U0001FA6F"  # Miscellaneous symbols
        u"\U0001FA70-\U0001FAFF"  # More symbols
        "]+", flags=re.UNICODE
    )
    return emoji_pattern.sub(r'', text)

@app.get("/api/articles")
async def get_articles():
    """API endpoint to fetch summarized RSS articles."""
    articles = fetch_rss_articles()

    if not articles:
        raise HTTPException(status_code=404, detail="No articles found or failed to fetch RSS feed")

    return articles