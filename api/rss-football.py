from fastapi import FastAPI
import feedparser
import requests
from bs4 import BeautifulSoup
import re

app = FastAPI()

@app.get("/api/articles")
def get_articles():
    # Fetch RSS feed
    feed_url = "https://www.molineux.news/news/feed/"
    headers = {"User-Agent": "Mozilla/5.0"}
    
    result = []
    
    try:
        # Parse the feed
        feed = feedparser.parse(feed_url)
        
        # Process each article
        for entry in feed.entries[:5]:  # Limit to first 5 articles
            title = entry.title
            url = entry.link
            
            # Get article content
            response = requests.get(url, headers=headers)
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Extract paragraphs with quotes
            quotes = []
            for p in soup.find_all('p'):
                text = p.get_text().strip()
                # Simple quote detection
                if '"' in text or '"' in text or '"' in text or "'" in text:
                    quotes.append(text)
            
            # Only include articles with quotes
            if quotes:
                result.append({
                    "headline": title,
                    "quotes": quotes,
                    "url": url
                })
    
    except Exception as e:
        print(f"Error: {e}")
    
    return result