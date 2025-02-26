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

    # Fix encoding issues
    response.encoding = response.apparent_encoding  

    feed = feedparser.parse(response.text)
    
    articles = []

    for entry in feed.entries[:5]:
        title = entry.title
        url = entry.link

        content = entry.content[0].value
        soup = BeautifulSoup(content, 'html.parser')

        # Fix encoding in title
        title = BeautifulSoup(title, 'html.parser').text  

        # Extract paragraphs that contain at least one quote
        paragraphs_with_quotes = []
        for p in soup.find_all('p'):
            text = p.get_text().strip()

            # Fix encoding issues in paragraph text
            text = text.encode("latin1").decode("utf-8")  

            # Regex to check if paragraph contains a full quote
            if re.search(r'[""\'‘](.*?)[""\']', text):  
                paragraphs_with_quotes.append(text)

        # Only include articles if at least one paragraph with a quote is found
        if paragraphs_with_quotes:
            articles.append({
                "headline": title,
                "quotes": paragraphs_with_quotes,
                "url": url
            })
    
    return articles

@app.get("/api/articles")  # API endpoint
def get_articles():
    return fetch_articles()