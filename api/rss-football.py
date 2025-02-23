from fastapi import FastAPI, HTTPException
import feedparser
import requests
from newspaper import Article
from sumy.parsers.plaintext import PlaintextParser
from sumy.nlp.tokenizers import Tokenizer
from sumy.summarizers.lsa import LsaSummarizer
import logging

import nltk
import os

# Tell NLTK to use the downloaded models from `/tmp`
nltk.data.path.append('/tmp')

# Setup logging
logging.basicConfig(level=logging.INFO)

app = FastAPI()

RSS_FEED_URL = "https://cityxtra.co.uk/feed/"

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
        for entry in feed.entries[:5]:  # Limit to latest 5 articles
            article_url = entry.link
            logging.info(f"Fetching article: {article_url}")
            article_data = extract_article_data(article_url)
            if article_data:
                articles.append(article_data)

        return articles

    except requests.exceptions.RequestException as e:
        logging.error(f"Error fetching RSS feed: {e}")
        return []

def extract_article_data(url):
    """Extracts the headline and summary from an article URL."""
    try:
        logging.info(f"Downloading article: {url}")
        article = Article(url)
        article.download()

        if not article.html:  # Check if article actually downloaded
            logging.warning(f"Failed to download article: {url}")
            return None

        article.parse()

        headline = article.title
        full_text = article.text
        logging.info(f"Extracted article text: {len(full_text)} characters")

        summary = summarize_text(full_text)

        return {"headline": headline, "summary": summary, "url": url}

    except Exception as e:
        logging.error(f"Error processing article {url}: {e}")
        return None

def summarize_text(text):
    """Summarizes the article into 3 sentences."""
    try:
        # Ensure `punkt` tokenizer is available
        nltk.download('punkt', quiet=True)

        parser = PlaintextParser.from_string(text, Tokenizer("english"))
        summarizer = LsaSummarizer()
        summary = summarizer(parser.document, 3)

        return " ".join(str(sentence) for sentence in summary)

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