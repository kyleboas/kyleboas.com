---
layout: news
permalink: /football/news/
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
    #first-paragraph {
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
        "https://www.wearebrighton.com/newsopinion/feed/".
        "http://newsrss.bbc.co.uk/rss/sportonline_uk_edition/football/rss.xml" 
    ];

    const blacklist = ["pundit", "match report", "player ratings"];

    const articlesContainer = document.getElementById("articles-container");
    const parser = new DOMParser();
    let allArticles = [];

    let rssFetches = rssUrls.map(async (rssUrl) => {
        try {
            const rssResponse = await fetch(rssUrl);
            const rssText = await rssResponse.text();
            const xml = parser.parseFromString(rssText, "text/xml");

            const items = Array.from(xml.querySelectorAll("item")).slice(0, 10);

            let articleFetches = items.map(async (item) => {
                let title = item.querySelector("title").textContent;
                let url = item.querySelector("link").textContent;
                let pubDate = item.querySelector("pubDate") ? new Date(item.querySelector("pubDate").textContent) : new Date();

                // **Blacklist filtering for titles**
                if (blacklist.some(word => title.toLowerCase().includes(word.toLowerCase()))) {
                    return; // Skip this article
                }

                try {
                    const articleResponse = await fetch(url);
                    const articleText = await articleResponse.text();
                    const articleDoc = parser.parseFromString(articleText, "text/html");

                    let paragraphs = Array.from(articleDoc.querySelectorAll("p"))
                        .map(p => p.textContent.trim())
                        .filter(p => p.length > 20 && !p.includes("document.getElementById") && !p.includes("new Date()") && !p.includes("Δ"));

                    let firstParagraph = paragraphs.length > 0 ? paragraphs[0] : ""; // Extract the first paragraph

                    // **Updated quote detection logic**
                    let quoteParagraphs = paragraphs.filter(p => p.match(/["“”']/));

                    // **Skip articles that do not contain quotes**
                    if (quoteParagraphs.length === 0) {
                        return;
                    }

                    // **Blacklist filtering for quote paragraphs**
                    if (quoteParagraphs.some(p => blacklist.some(word => p.toLowerCase().includes(word.toLowerCase())))) {
                        return; // Skip this article
                    }

                    if (firstParagraph) {
                        allArticles.push({ title, url, pubDate, firstParagraph, quoteParagraphs });
                    }
                } catch (error) {
                    console.error("Error fetching article:", url, error);
                }
            });

            await Promise.all(articleFetches);

        } catch (error) {
            console.error("Error fetching RSS feed:", rssUrl, error);
        }
    });

    await Promise.all(rssFetches);

    allArticles.sort((a, b) => b.pubDate - a.pubDate);

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

        let firstParagraphDiv = document.createElement("div");
        firstParagraphDiv.id = "first-paragraph";
        firstParagraphDiv.innerHTML = `<p>${article.firstParagraph}</p>`;

        let quotesDiv = document.createElement("div");
        quotesDiv.id = "post-quotes";
        quotesDiv.innerHTML = article.quoteParagraphs.map(p => `<p>${p}</p>`).join("");

        // Create "Copy" button
        let copyButton = document.createElement("button");
        copyButton.textContent = "Copy";
        copyButton.addEventListener("click", () => copyToClipboard(article));

        postDiv.appendChild(titleDiv);
        postDiv.appendChild(firstParagraphDiv); // Include first paragraph
        postDiv.appendChild(quotesDiv);
        postDiv.appendChild(copyButton); // Add copy button
        fragment.appendChild(postDiv);
    });

    articlesContainer.appendChild(fragment);
}

// **Copy function with blank > lines between first paragraph and quotes**
function copyToClipboard(article) {
    let markdownText = `> ${article.firstParagraph}\n> \n`; // Blank line after first paragraph with a space
    
    article.quoteParagraphs.forEach(quote => {
        markdownText += `> ${quote}\n> \n`; // Each quote followed by a blank line with a space
    });

    markdownText += `\n${article.url}`; // Add article URL on a new line

    navigator.clipboard.writeText(markdownText).then(() => {
        alert("Copied to clipboard!");
    }).catch(err => {
        console.error("Error copying to clipboard: ", err);
    });
}

// Run the function on page load
fetchArticles();
</script>
