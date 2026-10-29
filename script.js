const $ = (id) => document.getElementById(id);
const screens = ["homeScreen","howScreen","loadingScreen","gameScreen","resultScreen"];
const MAX_ROUNDS = 10;
const ROUND_SECONDS = 20;
let round = 0, score = 0, correctCount = 0, timerId = null, deadline = 0;
let currentSong = null, currentChoices = [], history = [], questions = [];
let soundOn = true, playerName = "南瓜小可愛", roundAnswered = false;
let bestScore = Number(localStorage.getItem("booBestScore") || 0);
let sessionToken = 0;

function showScreen(id) {
  screens.forEach(s => $(s).classList.toggle("hidden", s !== id));
  window.scrollTo({top:0, behavior:"smooth"});
}
function dialog(title, message) {
  $("dialogTitle").textContent = title;
  $("dialogText").textContent = message;
  const d = $("messageDialog");
  if (typeof d.showModal === "function") d.showModal();
  else alert(title + "\n" + message);
}
$("dialogOk").addEventListener("click", () => $("messageDialog").close());
$("homeBtn").addEventListener("click", goHome);
$("homeAgainBtn").addEventListener("click", goHome);
$("howBtn").addEventListener("click", () => showScreen("howScreen"));
document.querySelectorAll("[data-home]").forEach(b => b.addEventListener("click", goHome));
$("soundToggle").addEventListener("click", () => {
  soundOn = !soundOn;
  $("soundToggle").textContent = soundOn ? "🔊" : "🔇";
  if (!soundOn) $("songAudio").pause();
  else if (currentSong && !roundAnswered) $("songAudio").play().catch(()=>{});
});
$("startBtn").addEventListener("click", startGame);
$("nextBtn").addEventListener("click", nextQuestion);
$("skipBtn").addEventListener("click", () => {
  if (roundAnswered) return;
  stopTimer(); $("songAudio").pause();
  recordAnswer(false, true, "已跳過這題。");
});
$("againBtn").addEventListener("click", startGame);

function goHome() {
  stopTimer(); $("songAudio").pause(); $("songAudio").removeAttribute("src"); $("songAudio").load();
  showScreen("homeScreen");
}

async function startGame() {
  playerName = ($("playerName").value || "").trim().slice(0,18) || "南瓜小可愛";
  $("playerName").value = playerName;
  sessionToken++;
  const token = sessionToken;
  showScreen("loadingScreen");
  $("loadingText").textContent = "正在搜尋歌曲試聽，請稍等一下…";
  try {
    const songs = await fetchSongs();
    if (token !== sessionToken) return;
    if (songs.length < 4) throw new Error("目前可用歌曲不足 4 首，請稍後重試。");
    questions = shuffle(songs).slice(0, Math.min(MAX_ROUNDS, songs.length));
    round = 0; score = 0; correctCount = 0; history = [];
    $("scoreLabel").textContent = "0";
    nextQuestion();
  } catch (err) {
    if (token !== sessionToken) return;
    showScreen("homeScreen");
    dialog("音樂小精靈迷路了", (err && err.message) || "歌曲載入失敗，請檢查網路後重試。");
  }
}

async function fetchSongs() {
  // Public iTunes Search API: song previews may be unavailable by territory or licensing.
  const terms = [
    "Taylor Swift", "The Weeknd", "Bruno Mars", "Ariana Grande",
    "YOASOBI", "周杰倫", "告五人", "五月天", "BLACKPINK",
    "NewJeans", "Ed Sheeran", "Dua Lipa", "Disney soundtrack"
  ];
  let pool = [];
  const chosenTerms = shuffle(terms).slice(0, 7);
  for (const term of chosenTerms) {
    try {
      const url = "https://itunes.apple.com/search?term=" + encodeURIComponent(term) + "&entity=song&limit=20";
      const response = await fetch(url);
      if (!response.ok) continue;
      const data = await response.json();
      pool.push(...(data.results || []).filter(x => x.previewUrl && x.trackName && x.artistName));
    } catch (e) { /* continue with other search terms */ }
    if (uniqueSongs(pool).length >= 25) break;
  }
  const unique = uniqueSongs(pool);
  if (unique.length < 4) throw new Error("無法取得足夠的歌曲試聽。請重新整理頁面，或稍後再試。");
  return unique;
}

function uniqueSongs(list) {
  const seen = new Set();
  return list.filter(s => {
    const key = (s.trackName + "|" + s.artistName).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).map(s => ({
    id: String(s.trackId || s.previewUrl),
    title: s.trackName,
    artist: s.artistName,
    preview: s.previewUrl,
    artwork: s.artworkUrl100 || ""
  }));
}
function shuffle(a) {
  const arr = [...a];
  for (let i=arr.length-1;i>0;i--) {
    const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]];
  }
  return arr;
}
function nextQuestion() {
  stopTimer();
  $("songAudio").pause();
  if (round >= questions.length) { finishGame(); return; }
  currentSong = questions[round];
  const distractors = shuffle(questions.filter(s => s.id !== currentSong.id)).slice(0,3);
  currentChoices = shuffle([currentSong, ...distractors]);
  roundAnswered = false;
  $("roundLabel").textContent = `第 ${round+1} / ${questions.length} 題`;
  $("scoreLabel").textContent = score.toLocaleString();
  $("progressFill").style.width = `${round/questions.length*100}%`;
  $("feedback").className = "feedback hidden";
  $("feedback").textContent = "";
  $("nextBtn").classList.add("hidden");
  $("skipBtn").classList.remove("hidden");
  $("artistHint").textContent = "仔細聽旋律，選出正確歌名！";
  $("recordArt").style.backgroundImage = "";
  if (currentSong.artwork) {
    $("recordArt").style.backgroundImage = `radial-gradient(circle,#ff8b2b 0 21%,transparent 22%), url("${currentSong.artwork}")`;
    $("recordArt").style.backgroundSize = "cover";
    $("recordArt").style.backgroundPosition = "center";
  }
  const audio = $("songAudio");
  audio.src = currentSong.preview;
  audio.load();
  audio.onended = () => {};
  renderChoices();
  showScreen("gameScreen");
  round++;
  startTimer();
  if (soundOn) audio.play().then(() => $("audioHelp").textContent="歌曲試聽播放中！加油！").catch(() => {
    $("audioHelp").textContent="瀏覽器沒有自動播放，請按上方播放鍵。";
  });
  else $("audioHelp").textContent="音效已關閉；想聽歌請開啟音效或按播放鍵。";
}
function renderChoices() {
  const grid = $("answerGrid"); grid.replaceChildren();
  currentChoices.forEach((song, i) => {
    const btn = document.createElement("button");
    btn.className = "answer";
    const letter = document.createElement("span"); letter.className = "letter"; letter.textContent = "ABCD"[i];
    const text = document.createElement("span"); text.textContent = song.title;
    btn.append(letter,text);
    btn.addEventListener("click", () => chooseAnswer(song.id, btn));
    grid.appendChild(btn);
  });
}
function startTimer() {
  deadline = Date.now() + ROUND_SECONDS*1000;
  updateTimer();
  timerId = setInterval(updateTimer, 200);
}
function stopTimer() {
  if (timerId) clearInterval(timerId);
  timerId = null;
}
function updateTimer() {
  const left = Math.max(0, (deadline-Date.now())/1000);
  $("timerText").textContent = String(Math.ceil(left));
  $("timerFill").style.width = `${left/ROUND_SECONDS*100}%`;
  $("timerFill").style.background = left <= 5 ? "var(--pink)" : "var(--orange)";
  if (left <= 0 && !roundAnswered) {
    stopTimer(); $("songAudio").pause();
    recordAnswer(false, false, "時間到！下次要快一點喔 ⏰");
  }
}
function chooseAnswer(id, btn) {
  if (roundAnswered) return;
  const elapsed = ROUND_SECONDS - Math.max(0, (deadline-Date.now())/1000);
  const isCorrect = id === currentSong.id;
  const points = isCorrect ? Math.max(500, Math.round(500 + 500*(1-elapsed/ROUND_SECONDS))) : 0;
  if (isCorrect) score += points;
  if (isCorrect) correctCount++;
  document.querySelectorAll(".answer").forEach(b => b.disabled = true);
  const correctIndex = currentChoices.findIndex(s => s.id === currentSong.id);
  document.querySelectorAll(".answer")[correctIndex]?.classList.add("correct");
  if (!isCorrect) btn.classList.add("wrong");
  recordAnswer(isCorrect, false, isCorrect ? `答對了！ +${points} 分 🎉` : `差一點！正確答案是「${currentSong.title}」。`);
}
function recordAnswer(isCorrect, skipped, message) {
  if (roundAnswered) return;
  roundAnswered = true; stopTimer(); $("songAudio").pause();
  document.querySelectorAll(".answer").forEach(b => b.disabled = true);
  const fb = $("feedback");
  fb.textContent = message;
  fb.className = "feedback " + (isCorrect ? "good" : "bad");
  $("nextBtn").textContent = round >= questions.length ? "查看最終成績 🏆" : "下一題 →";
  $("nextBtn").classList.remove("hidden");
  $("skipBtn").classList.add("hidden");
  $("artistHint").textContent = `歌手：${currentSong.artist}`;
  history.push({song:currentSong, correct:isCorrect, skipped});
  $("scoreLabel").textContent = score.toLocaleString();
}
function finishGame() {
  stopTimer(); $("songAudio").pause();
  const oldBest = Number(localStorage.getItem("booBestScore") || 0);
  bestScore = Math.max(oldBest, score);
  localStorage.setItem("booBestScore", String(bestScore));
  $("finalScore").textContent = score.toLocaleString();
  $("correctCount").textContent = `${correctCount}/${history.length}`;
  $("accuracy").textContent = `${history.length ? Math.round(correctCount/history.length*100) : 0}%`;
  $("bestScore").textContent = bestScore.toLocaleString();
  const pct = history.length ? correctCount/history.length : 0;
  let badge, msg;
  if (pct >= .9) { badge="👑 萬聖節猜歌王"; msg="太神啦！你根本住在音樂資料庫裡！"; }
  else if (pct >= .7) { badge="🧙 音樂魔法師"; msg="耳朵超靈！派對最強音樂魔法師就是你。"; }
  else if (pct >= .4) { badge="🦇 猜歌小高手"; msg="很不錯喔！再玩一場就能突破自己。"; }
  else { badge="🎃 南瓜練習生"; msg="別氣餒，音樂小精靈再陪你練一場！"; }
  $("badge").textContent = badge;
  $("resultMessage").textContent = `${playerName}，${msg}`;
  const list = $("reviewList"); list.replaceChildren();
  history.forEach((h,i) => {
    const row = document.createElement("div"); row.className="review";
    const info=document.createElement("div");
    const title=document.createElement("b"); title.textContent=`${i+1}. ${h.song.title}`;
    const sub=document.createElement("small"); sub.textContent=h.song.artist;
    info.append(title,sub);
    const mark=document.createElement("span"); mark.className="mark "+(h.correct?"ok":"no"); mark.textContent=h.correct?"✓ 答對":h.skipped?"↷ 跳過":"✕ 答錯";
    row.append(info,mark); list.append(row);
  });
  $("progressFill").style.width="100%";
  showScreen("resultScreen");
}
