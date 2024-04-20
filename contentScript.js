(() => {
  let youtubeLeftControls, youtubePlayer;
  let currentVideo = "";
  let currentVideoBookmarks = [];

  const fetchBookmarks = () => {
    return new Promise((resolve) => {
      chrome.storage.sync.get([currentVideo], (obj) => {
        resolve(obj[currentVideo] ? JSON.parse(obj[currentVideo]) : []);
      });
    });
  };

  const addNewBookmarkEventHandler = async () => {
    const currentTime = youtubePlayer.currentTime;
    const newBookmark = {
      time: currentTime,
      desc: "Bookmark at " + getTime(currentTime),
    };

    currentVideoBookmarks = await fetchBookmarks();

    chrome.storage.sync.set({
      [currentVideo]: JSON.stringify([...currentVideoBookmarks, newBookmark].sort((a, b) => a.time - b.time))
      
      
    });

    renderBookmarks();
  };

  const renderBookmarks = () => {
    // Seleciona todos os elementos com a classe bookmark-title
    const bookmarkTitles = document.getElementsByClassName('bookmark-title');
  
    // Itera sobre cada elemento com a classe bookmark-title
    for (let i = 0; i < bookmarkTitles.length; i++) {
      // Adiciona um evento de clique para cada elemento de descrição do marcador
      bookmarkTitles[i].addEventListener('click', function() {
        const bookmarkDesc = this.textContent.trim();
        const newDescription = prompt("Enter the new description:", bookmarkDesc);
        if (newDescription !== null) {
          // Atualiza a descrição do marcador na interface do usuário
          this.textContent = newDescription;
          // Atualiza a descrição do marcador no armazenamento, se necessário
          const bookmarkIndex = currentVideoBookmarks.findIndex(bookmark => bookmark.desc === bookmarkDesc);
          if (bookmarkIndex !== -1) {
            currentVideoBookmarks[bookmarkIndex].desc = newDescription;
            chrome.storage.sync.set({ [currentVideo]: JSON.stringify(currentVideoBookmarks) });
          }
        }
      });
    }
  };
  

  const newVideoLoaded = async () => {
    const bookmarkBtnExists = document.getElementsByClassName("bookmark-btn")[0];

    currentVideoBookmarks = await fetchBookmarks();

    if (!bookmarkBtnExists) {
      const bookmarkBtn = document.createElement("img");

      bookmarkBtn.src = chrome.runtime.getURL("assets/bookmark.png");
      bookmarkBtn.className = "ytp-button " + "bookmark-btn";
      bookmarkBtn.title = "Click to bookmark current timestamp";

      youtubeLeftControls = document.getElementsByClassName("ytp-left-controls")[0];
      youtubePlayer = document.getElementsByClassName('video-stream')[0];

      youtubeLeftControls.appendChild(bookmarkBtn);
      bookmarkBtn.addEventListener("click", addNewBookmarkEventHandler);
    }
  };

  chrome.runtime.onMessage.addListener((obj, sender, response) => {
    const { type, value, videoId } = obj;

    if (type === "NEW") {
      currentVideo = videoId;
      newVideoLoaded();
    } else if (type === "PLAY") {
      youtubePlayer.currentTime = value;
    } else if ( type === "DELETE") {
      currentVideoBookmarks = currentVideoBookmarks.filter((b) => b.time != value);
      chrome.storage.sync.set({ [currentVideo]: JSON.stringify(currentVideoBookmarks) });

      response(currentVideoBookmarks);
    }
  });

  newVideoLoaded();
})();

const getTime = t => {
  var date = new Date(0);
  date.setSeconds(t);

  return date.toISOString().substr(11, 8);
};
