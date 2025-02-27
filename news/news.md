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
    #post-title q {
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

    for (let rssUrl of rssUrls) {
        try {
            // Fetch RSS feed
            const rssResponse = await fetch(rssUrl);
            const rssText = await rssResponse.text();
            const xml = parser.parseFromString(rssText, "text/xml");

            const items = Array.from(xml.querySelectorAll("item")).slice(0, 5); // Get up to 5 articles per feed

            for (let item of items) {
                let title = item.querySelector("title").textContent;
                let url = item.querySelector("link").textContent;
                let pubDate = item.querySelector("pubDate") ? new Date(item.querySelector("pubDate").textContent) : new Date();

                try {
                    // Fetch the full article page
                    const articleResponse = await fetch(url);
                    const articleText = await articleResponse.text();
                    const articleDoc = parser.parseFromString(articleText, "text/html");

                    // Extract paragraphs while filtering out unwanted content
                    let paragraphs = Array.from(articleDoc.querySelectorAll("p"))
                        .map(p => p.textContent.trim())
                        .filter(p => p.length > 20 && !p.includes("document.getElementById") && !p.includes("new Date()") && !p.includes("Δ")); // Remove JS-related lines

                    // Find paragraphs containing quotes
                    let quoteParagraphs = paragraphs.filter(p => p.match(/["“”'](.*?)["“”']/));

                    // Only store articles that contain quotes
                    if (quoteParagraphs.length > 0) {
                        allArticles.push({
                            title,
                            url,
                            pubDate,
                            quoteParagraphs
                        });
                    }

                } catch (error) {
                    console.error("Error fetching article:", url, error);
                }
            }
        } catch (error) {
            console.error("Error fetching RSS feed:", rssUrl, error);
        }
    }

    // Sort articles by publication date (most recent first)
    allArticles.sort((a, b) => b.pubDate - a.pubDate);

    // Render only articles that contain quotes
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

        // Append elements to the post container
        postDiv.appendChild(titleDiv);
        postDiv.appendChild(quotesDiv);
        articlesContainer.appendChild(postDiv);
    });
}

// Run the function on page load
fetchArticles();
</script>