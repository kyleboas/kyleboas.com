---
layout: post
date: 2024-12-02 11:56  UTC-5
title: "How to post your latest blog post to Bluesky using Github Actions and an RSS feed"
---

After several hours of trial and error, I have figured out how to automate posting directly to Bluesky from a Github repository. A process that only requires one file of code in a workflow that automates the process of posting from an RSS to Bluesky through Github Actions. A process that would normally require other great third-party services like Zapier, Buffer, dlvr.it, and so on. No more.

[kyleboas.com](https://kyleboas.com) and [tacticsjournal.com](https://tacticsjournal.com) both run on Github Pages powered by [jekyll-now](https://github.com/barryclark/jekyll-now), and if you clicked on this post from social media, that post was created using a modified version of this workflow.

Thank you to [myConsciousness on Github](https://github.com/myConsciousness/bluesky-post) for creating the Bluesky posting portion.

## Instructions

In your Github repository, create a new file called `rss-to-bluesky.yml` in the `.github/workflows` folder.  You can call the file whatever you like; it just has to end with `.yml`. If that folder does not exist, make the folder.

Copy and paste the following code into that `rss-to-bluesky.yml` file you created:

```
name: Post Latest Blog from RSS to Bluesky

on: 
  schedule:
    - cron: ‘00 12 * * *’

jobs:
 fetch-and-post:
 runs-on: ubuntu-latest
 
 steps:
  # Install xmllint and dateutils
   - name: Install xmllint and dateutils
   
   run: |
       sudo apt-get update && sudo apt-get install -y libxml2-utils dateutils
       
       # Fetch the latest blog post from RSS feed
       
        - name: Fetch Latest Blog Post
        
        id: fetch_post
        run: |
        RSS_FEED_URL=“https://WEBSITE.com/feed”
        
        response=$(curl -s “$RSS_FEED_URL”)
        
        description=$(echo “$response” | xmllint —xpath “string(//item[1]/description)” -)
        url=$(echo “$response” | xmllint —xpath “string(//item[1]/link)” -)
        
        description=$(echo “$description” | xargs)
        preview=“$description $url”
        
        echo “preview=$preview” >> $GITHUB_ENV
        echo “rss_url=$url” >> $GITHUB_ENV
        
     # Post to Bluesky
     - name: Post to Bluesky
     uses: myConsciousness/bluesky-post@v5
     with:
      text: “${% raw %}{{ env.preview }}{% endraw %}”
      link-preview-url: “${% raw %}{{ env.rss_url }{% endraw %}”
      identifier: yourusername.bsky.social
      password: “${% raw %}{{ secrets.BLUESKY_APP_PASSWORD }}{% endraw %}”
```

* You can change the name at the top to whatever you like. 
* Replace `https://WEBSITE.com/feed` with your blog's RSS feed URL. It should end in `/feed`, `/rss`, `/feed.xml`. Every blogging platform like WordPress, Blogspot, etc. creates an RSS feed for you by default.
* Replace `BLUESKY_USERNAME` with your Bluesky username, but don't include the `@`, for example, it should be `tacticsjournal.com`, `kyleboas.com`, or `yourusername.bsky.social`.
* You can choose whether or not to use your post's title or description. Just simply change the word `description` to `title` wherever it is mentioned.

Here is how to add your Bluesky app password:

1. Go to your Github repository settings, and then under "Secrets and Variables" create a new "Action" secret.
2. Go to Bluesky and create an app password. For security reasons, I would not recommend using your regular Bluesky password; always create an app password.
3. Paste the password into the "Action" secret field, and then save it.

## Finished 

Now you are set up to post via an RSS feed to Bluesky. There are a few other ways you can make the action run.

1) In the example code above, I choose to have it run on a schedule, at 12:00 UTC every day.

```
on: 
  schedule:
    - cron: ‘00 12 * * *’
```

2) Another way is to manually run it, if you want to test to see if the action is working. To do that you must include `workflow_dispatch:` below `on:`.

```
on:
 workflow_dispatch:
``` 

3) Another way is that you can have it run when another action runs.

```
on:
 workflow_run:
   workflows:
     - "Schedule Posts"
     - "Pages Build and Deployment"
          
     types:
     - completed
```

This will run once both my `Schedule Posts` and the `Pages Build and Deployment` actions have run to ensure that my blog post has been created before it tries to share the latest blog post to Bluesky.

You can combine any one of these three methods to make the action run, and there are probably many other ways to get it to run that I am unaware of. Have long conversations with ChatGPT, like I did, if you are struggling, or feel free to [contact me](https://kyleboas.com/contact/).

You can view [my current workflow here](https://github.com/kyleboas/tacticsjournal.com/blob/master/.github/workflows/rss-to-bluesky.yml).