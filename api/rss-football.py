from fastapi import FastAPI, HTTPException
import feedparser
import requests
from bs4 import BeautifulSoup
import logging

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
        elif "description" in entry:
            raw_html = entry["description"]
        else:
            return None

        # Parse the HTML content using BeautifulSoup
        soup = BeautifulSoup(raw_html, "html.parser")

        # Extract text from HTML
        full_text = soup.get_text(separator=" ").strip()
        return full_text

    except Exception as e:
        logging.error(f"Error extracting content: {e}")
        return None

def summarize_text(text):
    """Summarizes the article into 3 sentences."""
    try:
        sentences = text.split(". ")
        summary = ". ".join(sentences[:3])  # Take first 3 sentences
        return summary if summary else "Summary not available."
    
    except Exception as e:
        logging.error(f"Error summarizing text: {e}")
        return "Summary not available."

@app.get("/api/articles")
async def get_articles():
    """API endpoint to fetch summarized RSS articles."""
    articles = fetch_rss_articles()

    if not articles:
        raise HTTPException(status_code=404, detail="No articles found or failed to fetch RSS feed")

    return articles