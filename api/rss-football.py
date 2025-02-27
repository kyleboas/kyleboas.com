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
                break  # Stop once we have 5 valid articles
            
            title = entry.title
            url = entry.link
            
            response = requests.get(url, headers=headers)
            soup = BeautifulSoup(response.content, 'html.parser')

            quotes = []
            quote_pattern = re.compile(r'["\'](.*?)["\']')  # Matches text inside quotes

            for p in soup.find_all('p'):
                text = p.get_text().strip()
                found_quotes = quote_pattern.findall(text)  # Extract all quoted texts
                
                if found_quotes:
                    quotes.extend(found_quotes)  # Add all found quotes
                
            if quotes:
                result.append({
                    "headline": title,
                    "quotes": quotes,  # Includes all quotes found in the article
                    "url": url
                })
    
    except Exception as e:
        print(f"Error: {e}")
    
    return result