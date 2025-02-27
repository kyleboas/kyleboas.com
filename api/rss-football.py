from fastapi import FastAPI
import feedparser
import requests
from bs4 import BeautifulSoup
import re
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

app = FastAPI()  # FastAPI instance

def fetch_articles():
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
    response = requests.get("https://www.molineux.news/news/feed/", headers=headers)

    # Ensure proper encoding detection
    response.encoding = response.apparent_encoding  

    feed = feedparser.parse(response.text)
    
    articles = []

    for entry in feed.entries[:5]:
        try:
            title = entry.title
            url = entry.link

            # Ensure content exists
            if "content" not in entry or not entry.content:
                logging.warning(f"Missing content for article: {title}")
                continue

            content = entry.content[0].value
            soup = BeautifulSoup(content, 'html.parser')

            # Fix encoding in title
            title = BeautifulSoup(title, 'html.parser').text  

            # Extract full paragraphs that contain at least one quote
            paragraphs_with_quotes = []
            for p in soup.find_all('p'):
                text = p.get_text().strip()

                # Avoid unnecessary encoding conversions
                # Directly use text without forcing a different encoding
                if re.search(r'[""‘](.*?)[""’]', text):  
                    paragraphs_with_quotes.append(text)

            # Only include articles with at least one quoted paragraph
            if paragraphs_with_quotes:
                articles.append({
                    "headline": title,
                    "quotes": paragraphs_with_quotes,
                    "url": url
                })

        except Exception as e:
            logging.error(f"Error processing article '{entry.title}': {e}")

    return articles

@app.get("/api/articles")  # API endpoint
def get_articles():
    return fetch_articles()