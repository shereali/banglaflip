export function easeOutQuad(t) {
  return t * (2 - t);
}

export function animateCounter(element, targetValue) {
  let currentValue = 0;
  const duration = 2000; // ms
  const startTime = performance.now();
  const update = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easeOutQuad(progress);
    currentValue = Math.floor(easedProgress * targetValue);
    element.textContent = currentValue;
    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      element.textContent = targetValue;
    }
  };
  requestAnimationFrame(update);
}

export function phoneticSubstitute(graphemes, phoneticMap) {
  const result = [];
  for (let i = 0; i < graphemes.length; i++) {
    if (i + 1 < graphemes.length) {
      const pair = graphemes[i] + graphemes[i + 1];
      if (phoneticMap[pair]) {
        result.push(phoneticMap[pair]);
        i++;
        continue;
      }
    }
    result.push(phoneticMap[graphemes[i]] || graphemes[i]);
  }
  return result;
}

export function reverseWordPreservePunctuation(
  word,
  splitter,
  punctuationRegex
) {
  let prefix = "",
    suffix = "",
    coreWord = word;
  while (
    coreWord.length &&
    punctuationRegex.test(coreWord[coreWord.length - 1])
  ) {
    suffix = coreWord[coreWord.length - 1] + suffix;
    coreWord = coreWord.slice(0, -1);
  }
  while (coreWord.length && punctuationRegex.test(coreWord[0])) {
    prefix += coreWord[0];
    coreWord = coreWord.slice(1);
  }
  const graphemes = splitter.splitGraphemes(coreWord);
  const reversedCore = graphemes.reverse().join("");
  return prefix + reversedCore + suffix;
}

export function attachUIListeners({
  inputText,
  outputText,
  reverseBtn,
  phoneticBtn,
  copyIcon,
  shareBtn,
  copiedTooltip,
  sharedTooltip,
  pasteBtn,
  emojiToggleBtn,
  emojiPicker,
  phoneticMap,
  splitter,
  punctuationRegex,
  emojiRegex,
  logVisitorCallback,
  handleShareCallback,
}) {
  emojiToggleBtn.addEventListener("click", () => {
    emojiPicker.classList.toggle("hidden");
  });

  document.querySelectorAll(".emoji-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      try {
        const emoji = btn.getAttribute("data-emoji");
        const startPos = inputText.selectionStart;
        const endPos = inputText.selectionEnd;
        const text = inputText.value;
        inputText.value =
          text.substring(0, startPos) + emoji + text.substring(endPos);
        inputText.selectionStart = inputText.selectionEnd =
          startPos + emoji.length;
        inputText.focus();
        emojiPicker.classList.add("hidden");
      } catch (err) {
        console.error("Emoji insertion failed:", {
          code: err.code || "N/A",
          message: err.message || "No error message provided",
          error: JSON.stringify(err, null, 2),
        });
        alert("ইমোজি যুক্ত করতে ব্যর্থ! 😢");
      }
    });
  });

  reverseBtn.addEventListener("click", async () => {
    try {
      const input = inputText.value.trim();
      if (!input) {
        outputText.textContent = "কোনো টেক্সট নেই! 😕";
        return;
      }
      const words = input.split(/\s+/);
      const reversedWords = words.map((word) =>
        reverseWordPreservePunctuation(word, splitter, punctuationRegex)
      );
      outputText.textContent = reversedWords.join(" ");
      if (logVisitorCallback) {
        try {
          await logVisitorCallback("reverse");
        } catch (err) {
          console.error("Failed to log visitor in reverse action:", {
            code: err.code || "N/A",
            message: err.message || "No error message provided",
            error: JSON.stringify(err, null, 2),
          });
        }
      }
    } catch (err) {
      console.error("Reverse failed:", {
        code: err.code || "N/A",
        message: err.message || "No error message provided",
        error: JSON.stringify(err, null, 2),
      });
      outputText.textContent = "প্রক্রিয়াকরণে ত্রুটি! 😢";
    }
  });

  phoneticBtn.addEventListener("click", async () => {
    try {
      const input = inputText.value.trim();
      if (!input) {
        outputText.textContent = "কোনো টেক্সট নেই! 😕";
        return;
      }
      const graphemes = splitter.splitGraphemes(input);
      const substituted = phoneticSubstitute(graphemes, phoneticMap);
      outputText.textContent = substituted.join("");
      if (logVisitorCallback) {
        try {
          await logVisitorCallback("phonetic");
        } catch (err) {
          console.error("Failed to log visitor in phonetic action:", {
            code: err.code || "N/A",
            message: err.message || "No error message provided",
            error: JSON.stringify(err, null, 2),
          });
        }
      }
    } catch (err) {
      console.error("Phonetic conversion failed:", {
        code: err.code || "N/A",
        message: err.message || "No error message provided",
        error: JSON.stringify(err, null, 2),
      });
      outputText.textContent = "প্রক্রিয়াকরণে ত্রুটি! 😢";
    }
  });

  copyIcon.addEventListener("click", () => {
    try {
      let textToCopy = outputText.textContent;
      if (!textToCopy) {
        alert("কপি করার জন্য কোনো টেক্সট নেই! 😕");
        return;
      }
      textToCopy = textToCopy.replace(emojiRegex, "").trim();
      if (!textToCopy) {
        alert("কপি করার জন্য কোনো টেক্সট নেই! 😕");
        return;
      }
      navigator.clipboard
        .writeText(textToCopy)
        .then(() => {
          copiedTooltip.classList.add("opacity-100");
          setTimeout(() => copiedTooltip.classList.remove("opacity-100"), 1500);
        })
        .catch((err) => {
          console.error("Failed to copy:", {
            code: err.code || "N/A",
            message: err.message || "No error message provided",
            error: JSON.stringify(err, null, 2),
          });
          alert("কপি করতে ব্যর্থ! 😢");
        });
    } catch (err) {
      console.error("Copy failed:", {
        code: err.code || "N/A",
        message: err.message || "No error message provided",
        error: JSON.stringify(err, null, 2),
      });
      alert("কপি করতে ব্যর্ছ! 😢");
    }
  });

  shareBtn.addEventListener("click", async () => {
    try {
      await handleShareCallback();
    } catch (err) {
      console.error("Share button action failed:", {
        code: err.code || "N/A",
        message: err.message || "No error message provided",
        error: JSON.stringify(err, null, 2),
      });
    }
  });

  pasteBtn.addEventListener("click", async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        const text = await navigator.clipboard.readText();
        inputText.value = text;
        inputText.focus();
      } else {
        const tempInput = document.createElement("textarea");
        document.body.appendChild(tempInput);
        tempInput.focus();
        alert("দয়া করে এখন Ctrl+V চাপুন অথবা Paste করুন 📋");
        setTimeout(() => {
          inputText.value = tempInput.value;
          document.body.removeChild(tempInput);
          inputText.focus();
        }, 1000);
      }
    } catch (err) {
      console.error("Paste failed:", {
        code: err.code || "N/A",
        message: err.message || "No error message provided",
        error: JSON.stringify(err, null, 2),
      });
      alert(
        "পেস্ট করতে ব্যর্থ। অনুগ্রহ করে ব্রাউজার অনুমতি দিন বা HTTPS ব্যবহার করুন। 😢"
      );
    }
  });
}
