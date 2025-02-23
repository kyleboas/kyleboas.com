from fastapi import FastAPI, HTTPException
import feedparser
from newspaper import Article
from sumy.parsers.plaintext import PlaintextParser
from sumy.nlp.tokenizers import Tokenizer
from sumy.summarizers.lsa import LsaSummarizer
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)

app = FastAPI()

RSS_FEED_URL = "https://cityxtra.co.uk/feed/"

def fetch_rss_articles():
    """Fetch articles from the RSS feed and summarize them."""
    feed = feedparser.parse(RSS_FEED_URL)
    articles = []

    if "entries" not in feed or not feed.entries:
        logging.error("Failed to fetch RSS feed or no articles found.")
        return []

    for entry in feed.entries[:5]:  # Limit to 5 articles
        article_url = entry.link
        article_data = extract_article_data(article_url)
        if article_data:
            articles.append(article_data)

    return articles

def extract_article_data(url):
    """Extracts the headline and summary from an article URL."""
    try:
        article = Article(url)
        article.download()

        if not article.is_downloaded:
            logging.warning(f"Failed to download article: {url}")
            return None

        article.parse()

        headline = article.title
        full_text = article.text
        summary = summarize_text(full_text)

        return {"headline": headline, "summary": summary, "url": url}

    except Exception as e:
        logging.error(f"Error processing article {url}: {e}")
        return None

def summarize_text(text):
    """Summarizes the article into 3 sentences."""
    parser = PlaintextParser.from_string(text, Tokenizer("english"))
    summarizer = LsaSummarizer()
    summary = summarizer(parser.document, 3)
    return " ".join(str(sentence) for sentence in summary)

@app.get("/api/articles")
async def get_articles():
    """API endpoint to fetch summarized RSS articles."""
    articles = fetch_rss_articles()

    if not articles:
        raise HTTPException(status_code=404, detail="No articles found or failed to fetch RSS feed")

    return articles