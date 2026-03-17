---
layout: post
date: 2025-01-22 08:39 UTC-5
title: "Full content should be the default for RSS feeds"
---

Every RSS feed that is associated with a blog or news site should have the full content within the `<content:encoded>`.

Go to a free feed validator. Here is a link to [this blog's RSS feed validator](https://validator.w3.org/feed/check.cgi?url=https%3A%2F%2Fkyleboas.com%2Ffeed). Type in your blog, and then add `/feed` or `/rss` to the end of the url. If you have a blog on Wordpress, Ghost, et cetera it will have already automatically made the RSS feed for you. If you don't have a feed, configure it. 

If the entire post is not within `<content:encoded>`, configure it to include the full post content. It takes very little technical know how to fix it, especially when we have tools like ChatGPT.

I use [NetNewsWire](https://apps.apple.com/us/app/netnewswire-rss-reader/id1480640210) as my feed reader. It drives me nuts when a blog includes something like a summary of the post in the `<content:encoded>`, because then I have to use the Reader View. When you use the Reader View, it takes a few seconds to load. When it takes a few seconds to load, I don't feel like reading what you wrote.

Normalize making feed readers accessible. Stop making it hard for people to read your work. If you need a feed that has summaries, make a separate feed.