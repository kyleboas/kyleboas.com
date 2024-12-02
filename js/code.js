---
---

document.addEventListener('DOMContentLoaded', () => {
  const copyButtons = document.querySelectorAll('.copy-btn');

  copyButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Get the previous sibling code block
      const codeBlock = button.previousElementSibling;
      
      if (codeBlock && codeBlock.tagName === 'CODE') {
        const codeText = codeBlock.textContent;
        
        navigator.clipboard.writeText(codeText).then(() => {
          button.textContent = 'Copied!';
          setTimeout(() => (button.textContent = 'Copy'), 2000);
        }).catch(err => {
          console.error('Failed to copy text: ', err);
        });
      }
    });
  });
});