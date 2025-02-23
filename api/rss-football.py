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
            _, quotes = extract_content(entry)

            summary = "\n".join(quotes) if quotes else "No quotes found."

            articles.append({"headline": article_title, "quotes": summary, "url": article_url})

        return articles

    except requests.exceptions.RequestException as e:
        logging.error(f"Error fetching RSS feed: {e}")
        return []

def extract_content(entry):
    """Extracts full article content from `content:encoded` and finds all quotes."""
    try:
        # Extract `content:encoded` from multiple locations in RSS feed
        raw_html = (
            entry.get("content:encoded") or 
            entry.get("content", [{}])[0].get("value") or 
            entry.get("summary") or 
            entry.get("description")
        )

        if not raw_html:
            logging.error(f"No `content:encoded` found for article: {entry.get('link')} - Falling back to `summary` or `description`.")
            return None, []

        logging.info(f"Extracting content for article: {entry.get('link')}")

        # Decode HTML entities
        raw_html = html.unescape(raw_html)

        # Parse HTML using BeautifulSoup
        soup = BeautifulSoup(raw_html, "html.parser")

        # Find all quotes
        quotes = extract_quotes(soup)

        return None, quotes  # No need for full text, just quotes

    except Exception as e:
        logging.error(f"Error extracting content: {e}")
        return None, []

def extract_quotes(soup):
    """Finds all quotes in the article without assigning speakers."""
    quote_pattern = re.compile(r'[""]([^""]+)[""]')  # Matches both "curly" and "straight" quotes

    quotes = []
    paragraphs = soup.find_all("p")  # Get all paragraphs

    for paragraph in paragraphs:
        text = paragraph.get_text().strip()

        # Find quotes in the paragraph
        found_quotes = quote_pattern.findall(text)

        # Store all extracted quotes
        for quote in found_quotes:
            quotes.append(f'"{quote}"')  # Store only the quote itself

    return quotes

@app.get("/api/articles")
async def get_articles():
    """API endpoint to fetch articles and extract only quotes."""
    articles = fetch_rss_articles()

    if not articles:
        raise HTTPException(status_code=404, detail="No articles found or failed to fetch RSS feed")

    return articles