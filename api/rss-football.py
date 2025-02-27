from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
import feedparser
import requests
from bs4 import BeautifulSoup
import re
import logging
import traceback  # Helps with detailed error tracking

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

app = FastAPI()

def fetch_articles():
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }

    try:
        logging.info("Fetching RSS feed...")
        response = requests.get("https://www.molineux.news/news/feed/", headers=headers)
        response.encoding = response.apparent_encoding  

        if response.status_code != 200:
            logging.error(f"Failed to fetch RSS feed: {response.status_code}")
            return []

        feed = feedparser.parse(response.text)
        articles = []

        for entry in feed.entries[:5]:  
            try:
                title = entry.get("title", "No Title")
                url = entry.get("link", "No URL")

                logging.info(f"Processing article: {title}")

                # Fetch full article content
                page_response = requests.get(url, headers=headers)
                if page_response.status_code != 200:
                    logging.warning(f"Failed to fetch article: {url}")
                    continue

                soup = BeautifulSoup(page_response.text, 'html.parser')

                # Extract full paragraphs that contain at least one quote
                paragraphs_with_quotes = []
                for p in soup.find_all("p"):
                    text = p.get_text().strip()

                    # Extract ALL quotes in the paragraph
                    quotes_found = re.findall(r'[""‘](.*?)[""’]', text)

                    # If any quote is found, store the full paragraph
                    if quotes_found:
                        paragraphs_with_quotes.append(text)

                # Log what is being extracted
                if paragraphs_with_quotes:
                    logging.info(f"Extracted {len(paragraphs_with_quotes)} quoted paragraphs from: {title}")

                # Only include articles with at least one quoted paragraph
                if paragraphs_with_quotes:
                    articles.append({
                        "headline": title,
                        "quotes": paragraphs_with_quotes,
                        "url": url
                    })

            except Exception as e:
                logging.error(f"Error processing article '{title}': {e}")
                logging.error(traceback.format_exc())  # Logs full error details

        return articles

    except Exception as e:
        logging.error(f"Critical failure in fetching articles: {e}")
        logging.error(traceback.format_exc())  # Logs full traceback for debugging
        return []

@app.get("/api/articles")
def get_articles():
    articles = fetch_articles()
    json_compatible_data = jsonable_encoder(articles)
    return JSONResponse(content=json_compatible_data, ensure_ascii=False)