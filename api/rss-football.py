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
                summary = summarize_text(full_text)  # Summarize to ~300 characters naturally

            articles.append({"headline": article_title, "summary": summary, "url": article_url})

        return articles

    except requests.exceptions.RequestException as e:
        logging.error(f"Error fetching RSS feed: {e}")
        return []

def extract_content(entry):
    """Extracts full article content from the RSS feed, preferring `content:encoded`."""
    try:
        if "content:encoded" in entry:
            raw_html = entry["content:encoded"]
            logging.info(f"Extracting `content:encoded` for article: {entry.get('link')}")
        elif "summary" in entry:
            raw_html = entry["summary"]
            logging.warning(f"Falling back to `summary` for article: {entry.get('link')}")
        elif "description" in entry:
            raw_html = entry["description"]
            logging.warning(f"Falling back to `description` for article: {entry.get('link')}")
        else:
            logging.error(f"No content found for article: {entry.get('link')}")
            return None

        raw_html = html.unescape(raw_html)

        soup = BeautifulSoup(raw_html, "html.parser")
        full_text = soup.get_text(separator=" ").strip()

        full_text = clean_text(full_text)

        logging.info(f"Extracted text length: {len(full_text)} for article: {entry.get('link')}")
        return full_text if len(full_text) > 100 else None

    except Exception as e:
        logging.error(f"Error extracting content: {e}")
        return None

def summarize_text(text, limit=300):
    """Summarizes the article into a natural length of ~300 characters."""
    try:
        text = text.strip()
        logging.info(f"Summarizing text of length {len(text)}")

        if len(text) <= limit:
            return text

        sentences = text.split(". ")
        summary = ""
        for sentence in sentences:
            if len(summary) + len(sentence) + 2 > limit:
                break
            summary += sentence + ". "

        if len(summary) < 100:
            summary = text[:limit] + "..."

        logging.info(f"Final summary length: {len(summary)}")
        return summary.strip()

    except Exception as e:
        logging.error(f"Error summarizing text: {e}")
        return "Summary not available."

def clean_text(text):
    """Removes emojis and fixes text encoding issues."""
    emoji_pattern = re.compile("["
        u"\U0001F600-\U0001F64F"
        u"\U0001F300-\U0001F5FF"
        u"\U0001F680-\U0001F6FF"
        u"\U0001F700-\U0001F77F"
        "]+", flags=re.UNICODE)
    text = emoji_pattern.sub(r'', text)

    text = text.encode('utf-8', 'ignore').decode('utf-8')

    return text

@app.get("/api/articles")
async def get_articles():
    """API endpoint to fetch summarized RSS articles."""
    articles = fetch_rss_articles()

    if not articles:
        raise HTTPException(status_code=404, detail="No articles found or failed to fetch RSS feed")

    return articles