import feedparser
import requests
from bs4 import BeautifulSoup
import html

def fetch_articles():
    # 1. Fetch the RSS feed
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
    response = requests.get("https://www.molineux.news/news/feed/", headers=headers)
    
    # 2. Parse the feed
    feed = feedparser.parse(response.text)
    
    articles = []
    # Get latest 5 articles
    for entry in feed.entries[:5]:
        # Get the title and URL
        title = entry.title
        url = entry.link
        
        # Get the full content from content:encoded
        content = entry.content[0].value
        
        # Parse the HTML content
        soup = BeautifulSoup(content, 'html.parser')
        
        # Find all paragraphs containing at least 3 double quotes
        quotes = [p.get_text().strip() for p in soup.find_all('p') if p.get_text().count('"') >= 3]
        
        # Only add articles that contain at least one qualifying quote
        if quotes:
            articles.append({
                "headline": title,
                "quotes": quotes,
                "url": url
            })
    
    return articles