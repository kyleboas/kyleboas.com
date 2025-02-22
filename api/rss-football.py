from fastapi import FastAPI
import feedparser
from newspaper import Article
from sumy.parsers.plaintext import PlaintextParser
from sumy.nlp.tokenizers import Tokenizer
from sumy.summarizers.lsa import LsaSummarizer

app = FastAPI()

RSS_FEED_URL = "https://www.newsblur.com/reader/folder_rss/717228/7eb32e304e39/unread/4-news"

def fetch_rss_articles():
    feed = feedparser.parse(RSS_FEED_URL)
    articles = []
    
    for entry in feed.entries[:5]:  # Get latest 5 articles
        article_url = entry.link
        article_data = extract_article_data(article_url)
        if article_data:
            articles.append(article_data)
    
    return articles

def extract_article_data(url):
    try:
        article = Article(url)
        article.download()
        article.parse()
        
        headline = article.title
        full_text = article.text
        summary = summarize_text(full_text)

        return {"headline": headline, "summary": summary, "url": url}
    except:
        return None

def summarize_text(text):
    parser = PlaintextParser.from_string(text, Tokenizer("english"))
    summarizer = LsaSummarizer()
    summary = summarizer(parser.document, 3)
    return " ".join(str(sentence) for sentence in summary)

@app.get("/api/articles")
async def get_articles():
    return fetch_rss_articles()