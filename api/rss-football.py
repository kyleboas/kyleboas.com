from fastapi import FastAPI
import feedparser
import requests
from bs4 import BeautifulSoup
import re

app = FastAPI()

@app.get("/api/articles")
def get_articles():
    feed_url = "https://www.molineux.news/news/feed/"
    headers = {"User-Agent": "Mozilla/5.0"}

    result = []
    
    try:
        feed = feedparser.parse(feed_url)
        
        for entry in feed.entries:
            if len(result) >= 5:
                break
            
            title = entry.title
            url = entry.link
            
            response = requests.get(url, headers=headers)
            soup = BeautifulSoup(response.content, 'html.parser')

            quotes = []
            for p in soup.find_all('p'):
                text = p.get_text().strip()
                if '"' in text or "'" in text:
                    quotes.append(text)
            
            if quotes:
                result.append({
                    "headline": title,
                    "quotes": quotes,
                    "url": url
                })
    
    except Exception as e:
        print(f"Error: {e}")
    
    return result