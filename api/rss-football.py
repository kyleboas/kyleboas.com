from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
import feedparser
import requests
from bs4 import BeautifulSoup
import re
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

app = FastAPI()

def fetch_articles():
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
    response = requests.get("https://www.molineux.news/news/feed/", headers=headers)
    response.encoding = response.apparent_encoding

    feed = feedparser.parse(response.text)
    articles = []

    for entry in feed.entries[:5]:
        try:
            title = entry.title
            url = entry.link

            page_response = requests.get(url, headers=headers)
            if page_response.status_code != 200:
                logging.warning(f"Failed to fetch article: {url}")
                continue

            soup = BeautifulSoup(page_response.text, 'html.parser')
            paragraphs_with_quotes = []
            for p in soup.find_all("p"):
                text = p.get_text().strip()
                if re.search(r'[""‘](.*?)[""’]', text):
                    paragraphs_with_quotes.append(text)

            if paragraphs_with_quotes:
                articles.append({
                    "headline": title,
                    "quotes": paragraphs_with_quotes,
                    "url": url
                })

        except Exception as e:
            logging.error(f"Error processing article '{title}': {e}")

    return articles

@app.get("/api/articles")
def get_articles():
    articles = fetch_articles()
    json_compatible_data = jsonable_encoder(articles)
    return JSONResponse(content=json_compatible_data, ensure_ascii=False)