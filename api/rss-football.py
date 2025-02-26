import feedparser
import requests
from bs4 import BeautifulSoup
import re
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

def fetch_articles():
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
    response = requests.get("https://www.molineux.news/news/feed/", headers=headers)
    
    feed = feedparser.parse(response.text)
    
    articles = []
    
    for entry in feed.entries[:5]:
        title = entry.title
        url = entry.link
        
        content = entry.content[0].value
        soup = BeautifulSoup(content, 'html.parser')

        # Extract properly formatted quotes using regex
        quotes = []
        for p in soup.find_all('p'):
            text = p.get_text().strip()

            # Use regex to extract actual quotes
            found_quotes = re.findall(r'"([^"]+)"|‘([^’]+)’|"([^"]+)"', text)
            
            # Flatten tuples returned by regex
            extracted_quotes = [quote for tup in found_quotes for quote in tup if quote]
            
            # Append actual quotes found
            quotes.extend(extracted_quotes)

        # Only include articles that contain at least one valid quote
        if quotes:
            articles.append({
                "headline": title,
                "quotes": quotes,
                "url": url
            })
    
    return articles