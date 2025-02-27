from fastapi import FastAPI
from fastapi.responses import JSONResponse
import feedparser
import requests
from bs4 import BeautifulSoup
import re
import logging

# Setup basic logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

app = FastAPI()

def fetch_articles_with_quotes():
    # User agent to avoid blocks
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
    
    articles = []
    
    try:
        # Fetch and parse the RSS feed
        rss_url = "https://www.molineux.news/news/feed/"
        logging.info(f"Fetching RSS feed from: {rss_url}")
        
        response = requests.get(rss_url, headers=headers, timeout=10)
        response.raise_for_status()  # Raise exception for HTTP errors
        
        feed = feedparser.parse(response.text)
        
        # Process each article
        for entry in feed.entries[:5]:  # Limit to first 5 articles
            title = entry.get("title", "No Title")
            url = entry.get("link", "")
            
            if not url:
                logging.warning(f"No URL found for article: {title}")
                continue
                
            logging.info(f"Processing article: {title}")
            
            try:
                # Fetch the full article content
                article_response = requests.get(url, headers=headers, timeout=10)
                article_response.raise_for_status()
                
                # Parse the HTML content
                soup = BeautifulSoup(article_response.text, 'html.parser')
                
                # Find all paragraphs
                quoted_paragraphs = []
                
                for p in soup.find_all("p"):
                    text = p.get_text().strip()
                    
                    # Skip empty paragraphs
                    if not text:
                        continue
                    
                    # Check if the paragraph contains any quotes (using multiple quote styles)
                    if re.search(r'[""\'\'](.*?)[""\'\'"]', text):
                        quoted_paragraphs.append(text)
                
                # Only include articles that have quotes
                if quoted_paragraphs:
                    articles.append({
                        "headline": title,
                        "quotes": quoted_paragraphs,
                        "url": url
                    })
                    logging.info(f"Found {len(quoted_paragraphs)} paragraphs with quotes in: {title}")
                else:
                    logging.info(f"No quotes found in: {title}")
                    
            except Exception as e:
                logging.error(f"Error processing article '{title}': {str(e)}")
    
    except Exception as e:
        logging.error(f"Failed to fetch or parse RSS feed: {str(e)}")
    
    return articles

@app.get("/api/articles")
def get_articles():
    articles = fetch_articles_with_quotes()
    return articles