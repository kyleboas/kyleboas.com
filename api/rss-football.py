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
    """Fetch articles from the RSS feed and extract quotes only."""
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
            quotes = extract_content(entry)

            # Ensure that quotes is always a list
            quotes_output = quotes if quotes else ["No quotes found."]

            articles.append({
                "headline": article_title,
                "quotes": quotes_output,
                "url": article_url
            })

        return articles

    except requests.exceptions.RequestException as e:
        logging.error(f"Error fetching RSS feed: {e}")
        return []

def extract_content(entry):
    """Extracts full article content strictly from `content:encoded` stored in `entry.content[0].value`."""
    try:
        # Ensure we get only `content:encoded`, do not use summary/description
        raw_html = entry.get("content")[0].get("value") if entry.get("content") else None

        if not raw_html:
            logging.warning(f"Missing `content:encoded` for article: {entry.get('link')}, skipping...")
            return []  # Skip article if no valid content

        logging.info(f"Extracting content from article: {entry.get('link')}")

        # Decode HTML entities
        raw_html = html.unescape(raw_html)

        # Parse HTML using BeautifulSoup
        soup = BeautifulSoup(raw_html, "html.parser")

        # Extract and return quotes
        return extract_quotes(soup)

    except Exception as e:
        logging.error(f"Error extracting content: {e}")
        return []

def extract_quotes(soup):
    """Extracts full <p> tag text if it contains at least one properly enclosed double quote."""

    # List of valid double quote variations
    double_quote_chars = ['"', """, """, "&quot;", "&#8220;", "&#8221;"]

    quotes = []

    # Find all paragraphs
    paragraphs = soup.find_all("p")

    for paragraph in paragraphs:
        text = paragraph.get_text().strip()

        # Decode any remaining HTML entities
        text = html.unescape(text)

        # Ensure text contains at least one double quote variation
        if any(q in text for q in double_quote_chars):
            if re.search(r'[""]([^"""]+)[""]', text):
                quotes.append(text)

    if not quotes:
        logging.warning("No valid double-quoted text found in article content.")

    return quotes if quotes else []

@app.get("/api/articles")
async def get_articles():
    """API endpoint to fetch articles and extract only quotes."""
    articles = fetch_rss_articles()

    if not articles:
        raise HTTPException(status_code=404, detail="No articles found or failed to fetch RSS feed")

    return articles