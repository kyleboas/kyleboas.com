---
layout: news
permalink: /news/
---

<style>
    .Post {
        border: 1px solid #ddd;
        padding: 10px;
        margin-bottom: 15px;
        font-family: Helvetica, sans-serif;
    }
    #post-title {
        font-weight: bold;
        font-size: 18px;
    }
    #post-title a {
        text-decoration: none;
        color: #000;
    }
    #post-quotes {
        margin-top: 10px;
        color: #000;
        font-size: 18px;
    }
</style>

<div id="articles-container"></div>

<script>
async function fetchArticles() {
    const rssUrls = [
        "https://www.molineux.news/news/feed/",
        "https://www.wearepalace.uk/feed/",
        "https://www.westhamzone.com/feed/",
        "https://arseblog.news/feed/",
        "https://www.astonvilla.news/feed/",
        "https://cityxtra.co.uk/feed/",
        "https://www.geordiebootboys.com/feed/",
        "https://www.getfootballnewsgermany.com/feed/atom/",
        "https://www.goodisonnews.com/feed/",
        "https://hammyend.com/index.php/feed/",
        "https://www.managingmadrid.com/rss/current.xml",
        "https://www.nottinghamforest.news/feed/",
        "https://www.spurs-web.com/wp-json/feed/v1/posts",
        "https://www.thechelseachronicle.com/news/feed/",
        "https://www.wearebrighton.com/newsopinion/feed/"
    ];

    const articlesContainer = document.getElementById("articles-container");
    const parser = new DOMParser();
    let allArticles = [];

    // Fetch all RSS feeds in parallel
    let rssFetches = rssUrls.map(async (rssUrl) => {
        try {
            const rssResponse = await fetch(rssUrl);
            const rssText = await rssResponse.text();
            const xml = parser.parseFromString(rssText, "text/xml");

            const items = Array.from(xml.querySelectorAll("item")).slice(0, 3); // Reduce to 3 per feed for speed

            // Process each article in parallel
            let articleFetches = items.map(async (item) => {
                let title = item.querySelector("title").textContent;
                let url = item.querySelector("link").textContent;
                let pubDate = item.querySelector("pubDate") ? new Date(item.querySelector("pubDate").textContent) : new Date();

                try {
                    // Fetch the article page
                    const articleResponse = await fetch(url);
                    const articleText = await articleResponse.text();
                    const articleDoc = parser.parseFromString(articleText, "text/html");

                    // Extract paragraphs while filtering out JavaScript artifacts
                    let paragraphs = Array.from(articleDoc.querySelectorAll("p"))
                        .map(p => p.textContent.trim())
                        .filter(p => p.length > 20 && !p.includes("document.getElementById") && !p.includes("new Date()") && !p.includes("Δ"));

                    // Find paragraphs containing quotes
                    let quoteParagraphs = paragraphs.filter(p => p.match(/["“”'](.*?)["“”']/));

                    // Store only articles that contain quotes
                    if (quoteParagraphs.length > 0) {
                        allArticles.push({ title, url, pubDate, quoteParagraphs });
                    }
                } catch (error) {
                    console.error("Error fetching article:", url, error);
                }
            });

            // Wait for all articles from this RSS feed to be processed
            await Promise.all(articleFetches);

        } catch (error) {
            console.error("Error fetching RSS feed:", rssUrl, error);
        }
    });

    // Wait for all RSS feeds to be processed
    await Promise.all(rssFetches);

    // Sort articles by publication date (newest first)
    allArticles.sort((a, b) => b.pubDate - a.pubDate);

    // Render all articles at once (batch update for better performance)
    let fragment = document.createDocumentFragment();

    allArticles.forEach(article => {
        let postDiv = document.createElement("div");
        postDiv.classList.add("Post");

        let titleDiv = document.createElement("div");
        titleDiv.id = "post-title";
        let titleLink = document.createElement("a");
        titleLink.href = article.url;
        titleLink.id = "post-url";
        titleLink.textContent = article.title;
        titleDiv.appendChild(titleLink);

        let quotesDiv = document.createElement("div");
        quotesDiv.id = "post-quotes";
        quotesDiv.innerHTML = article.quoteParagraphs.map(p => `<p>${p}</p>`).join("");

        // Append elements to the fragment
        postDiv.appendChild(titleDiv);
        postDiv.appendChild(quotesDiv);
        fragment.appendChild(postDiv);
    });

    // Append all articles to the DOM in one operation (faster)
    articlesContainer.appendChild(fragment);
}

// Run the function on page load
fetchArticles();
</script>