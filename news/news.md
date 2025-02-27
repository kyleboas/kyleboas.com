---
layout: news
permalink: /news/
---

<style>
    .Post {
        border: 1px solid #ddd;
        padding: 10px;
        margin-bottom: 15px;
    }
    #post-title {
        font-weight: bold;
        font-size: 18px;
    }
    #post-quotes {
        margin-top: 10px;
        font-style: italic;
        color: #555;
    }
</style>

<h1>Latest Articles</h1>
<div id="articles-container"></div>

<script>
    async function fetchArticles() {
    const rssUrl = "https://www.molineux.news/news/feed/";

    try {
        // Fetch RSS feed
        const rssResponse = await fetch(rssUrl);
        const rssText = await rssResponse.text();
        const parser = new DOMParser();
        const xml = parser.parseFromString(rssText, "text/xml");

        const items = Array.from(xml.querySelectorAll("item")).slice(0, 5); // Get 5 articles
        const articlesContainer = document.getElementById("articles-container");

        for (let item of items) {
            let title = item.querySelector("title").textContent;
            let url = item.querySelector("link").textContent;

            try {
                // Fetch the full article page
                const articleResponse = await fetch(url);
                const articleText = await articleResponse.text();
                const articleDoc = parser.parseFromString(articleText, "text/html");

                // Extract paragraphs
                let paragraphs = Array.from(articleDoc.querySelectorAll("p")).map(p => p.textContent);

                // Find paragraphs containing quotes
                let quoteParagraphs = paragraphs.filter(p => p.match(/["“”'](.*?)["“”']/));

                // Create HTML elements dynamically
                let postDiv = document.createElement("div");
                postDiv.classList.add("Post");

                let titleDiv = document.createElement("div");
                titleDiv.id = "post-title";
                let titleLink = document.createElement("a");
                titleLink.href = url;
                titleLink.id = "post-url";
                titleLink.textContent = title;
                titleDiv.appendChild(titleLink);

                let quotesDiv = document.createElement("div");
                quotesDiv.id = "post-quotes";
                quotesDiv.innerHTML = quoteParagraphs.length > 0 
                    ? quoteParagraphs.map(p => `<p>${p}</p>`).join("") 
                    : "<p>No quotes found.</p>";

                // Append elements to the post container
                postDiv.appendChild(titleDiv);
                postDiv.appendChild(quotesDiv);
                articlesContainer.appendChild(postDiv);

            } catch (error) {
                console.error("Error fetching article:", url, error);
            }
        }

    } catch (error) {
        console.error("Error fetching RSS feed:", error);
    }
}

// Run the function on page load
fetchArticles();
</script>