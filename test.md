---
layout: default
---

<div id="comments-section">
  <div id="comments-gated" style="display:none;">
    <p>You must be a member to view and post comments.</p>
    <a href="https://tacticsjournal.com.memberful.com/account/login" class="memberful-login">Log in</a>
  </div>
  <div id="comments-content" style="display:none;">
    <h3>Comments</h3>
    <!-- Include your comment widget or static comments -->
    <div id="comment-box">
      <!-- Example comment widget -->
      <textarea id="comment" placeholder="Write a comment..."></textarea>
      <button onclick="postComment()">Post Comment</button>
    </div>
  </div>
</div>

<script>
  document.addEventListener("DOMContentLoaded", function() {
    // Check Memberful authentication status
    const memberful = window.Memberful || {};

    memberful.onReady = function() {
      if (memberful.isSignedIn()) {
        // Show comments for logged-in users
        document.getElementById('comments-content').style.display = 'block';
      } else {
        // Show login prompt for non-members
        document.getElementById('comments-gated').style.display = 'block';
      }
    };
  });

  function postComment() {
    // Logic for posting comments
    const comment = document.getElementById('comment').value;
    if (comment) {
      alert(`Your comment: "${comment}" was posted.`);
      document.getElementById('comment').value = ''; // Clear the text area
    } else {
      alert('Comment cannot be empty.');
    }
  }
</script>