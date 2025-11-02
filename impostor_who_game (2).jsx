<!--
Impostor (Who) — Pure HTML/JS Version

Features:
- Pass-and-play for up to 6 players (on one phone)
- Game creator chooses category, mode, and whether impostor sees a hint or word "IMPOSTOR"
- Modes: Normal, EveryoneIsImpostor, ImpostorDoesNotKnow, Random mode
- Added more categories

How to use:
1) Save as `index.html` and open in a browser.
2) Play locally with friends by passing the phone.
3) No server or dependencies required.
-->

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Impostor (Who)</title>
  <style>
    body { font-family: sans-serif; background: #f9fafb; padding: 1em; }
    .card { background: white; border-radius: 1em; box-shadow: 0 0 8px rgba(0,0,0,0.1); padding: 1em; max-width: 500px; margin: auto; }
    button { background: #2563eb; color: white; border: none; padding: 0.6em 1em; border-radius: 0.5em; cursor: pointer; }
    button.secondary { background: #e5e7eb; color: black; }
    button:disabled { opacity: 0.6; }
    select, input[type="text"], input[type="number"] { padding: 0.4em; border: 1px solid #ccc; border-radius: 0.3em; }
    h1, h2 { text-align: center; }
    .hidden { display: none; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Impostor (Who)</h1>

    <div id="homeView">
      <p>Play the fun guessing game with friends on one device!</p>
      <button onclick="showSettings()">Settings</button>
      <button onclick="showLobby()">Start Lobby</button>
    </div>

    <div id="settingsView" class="hidden">
      <h2>Settings</h2>
      <label>Category:
        <select id="categorySelect"></select>
      </label><br><br>
      <label><input type="checkbox" id="hintCheck"> Impostor gets a hint</label><br>
      <label><input type="checkbox" id="wordImpostorCheck" checked> Impostor word says "IMPOSTOR"</label><br><br>
      <label>Mode:
        <select id="modeSelect">
          <option value="Normal">Normal</option>
          <option value="EveryoneIsImpostor">Everyone Is Impostor</option>
          <option value="ImpostorDoesNotKnow">Impostor Does Not Know</option>
        </select>
      </label><br><br>
      <label><input type="checkbox" id="randomModeCheck"> Random Mode</label><br><br>
      <label>Max players: <input type="number" id="maxPlayers" min="2" max="12" value="6"></label><br><br>
      <button onclick="saveSettings()">Save & Back</button>
    </div>

    <div id="lobbyView" class="hidden">
      <h2>Lobby</h2>
      <label>Add Player: <input type="text" id="playerNameInput" placeholder="Player name"> <button onclick="addPlayer()">Add</button></label>
      <ul id="playerList"></ul>
      <button onclick="startGame()">Start Game</button>
      <button class="secondary" onclick="showHome()">Back</button>
    </div>

    <div id="gameView" class="hidden">
      <h2>Game — Pass & Play</h2>
      <div id="playerRoleBox"></div>
      <button onclick="nextPlayer()">OK / Next</button>
      <button class="secondary" onclick="showLobby()">Back to Lobby</button>
      <div id="gameModeInfo" style="margin-top:1em;font-size:small;color:#666"></div>
    </div>
  </div>

  <script>
    const DEFAULT_CATEGORIES = {
      Animals: ['cat','dog','lion','tiger','elephant','giraffe','zebra','panda','monkey','rabbit'],
      Food: ['pizza','burger','sushi','pasta','taco','salad','sandwich','steak','fries','chocolate'],
      Sports: ['football','basketball','tennis','baseball','golf','boxing','cricket','swimming'],
      Countries: ['USA','Japan','France','Brazil','India','Egypt','Canada','Germany'],
      Movies: ['Titanic','Avatar','Inception','Frozen','Toy Story','The Matrix'],
      Colors: ['red','blue','green','yellow','purple','black','white','orange','pink'],
      RandomMix: ['moon','phone','car','book','shoe','tree','river','clock','camera']
    };

    const MODES = {
      NORMAL: 'Normal',
      EVERYONE_IMPOSTOR: 'EveryoneIsImpostor',
      IMPOSTOR_UNAWARE: 'ImpostorDoesNotKnow'
    };

    let settings = {
      category: 'Animals',
      hint: false,
      impostorWord: true,
      mode: 'Normal',
      randomMode: false,
      maxPlayers: 6
    };

    let players = [];
    let assignments = {};
    let secretWord = '';
    let passIndex = 0;

    // Initialize categories dropdown
    const categorySelect = document.getElementById('categorySelect');
    for (const c in DEFAULT_CATEGORIES) {
      const opt = document.createElement('option');
      opt.value = c; opt.textContent = c; categorySelect.appendChild(opt);
    }

    function show(view) {
      ['homeView','settingsView','lobbyView','gameView'].forEach(v => document.getElementById(v).classList.add('hidden'));
      document.getElementById(view).classList.remove('hidden');
    }

    function showHome() { show('homeView'); }
    function showSettings() { show('settingsView'); }
    function showLobby() { show('lobbyView'); refreshPlayerList(); }

    function saveSettings() {
      settings.category = categorySelect.value;
      settings.hint = document.getElementById('hintCheck').checked;
      settings.impostorWord = document.getElementById('wordImpostorCheck').checked;
      settings.mode = document.getElementById('modeSelect').value;
      settings.randomMode = document.getElementById('randomModeCheck').checked;
      settings.maxPlayers = parseInt(document.getElementById('maxPlayers').value);
      showHome();
    }

    function addPlayer() {
      const nameInput = document.getElementById('playerNameInput');
      const name = nameInput.value.trim() || `Player ${players.length+1}`;
      if (players.length < settings.maxPlayers) {
        players.push(name);
        nameInput.value = '';
        refreshPlayerList();
      } else alert('Maximum players reached');
    }

    function removePlayer(name) {
      players = players.filter(p => p !== name);
      refreshPlayerList();
    }

    function refreshPlayerList() {
      const list = document.getElementById('playerList');
      list.innerHTML = '';
      players.forEach(p => {
        const li = document.createElement('li');
        li.textContent = p + ' ';
        const btn = document.createElement('button');
        btn.textContent = 'Remove';
        btn.classList.add('secondary');
        btn.onclick = () => removePlayer(p);
        li.appendChild(btn);
        list.appendChild(li);
      });
    }

    function startGame() {
      if (players.length < 2) return alert('Need at least 2 players!');

      let chosenMode = settings.mode;
      if (settings.randomMode) {
        const modes = Object.values(MODES);
        chosenMode = modes[Math.floor(Math.random()*modes.length)];
      }

      const pool = DEFAULT_CATEGORIES[settings.category] || Object.values(DEFAULT_CATEGORIES).flat();
      secretWord = pool[Math.floor(Math.random()*pool.length)];

      assignments = {};
      const impostorIndex = Math.floor(Math.random()*players.length);

      players.forEach((p,i) => {
        if (chosenMode === MODES.NORMAL) {
          assignments[p] = {
            role: i===impostorIndex? 'Impostor' : 'Crew',
            word: i===impostorIndex? (settings.impostorWord? 'IMPOSTOR' : secretWord) : secretWord,
            hint: settings.hint && i===impostorIndex ? deriveHint(secretWord) : null
          };
        } else if (chosenMode === MODES.EVERYONE_IMPOSTOR) {
          assignments[p] = {
            role: 'Impostor',
            word: settings.impostorWord? 'IMPOSTOR' : secretWord,
            hint: settings.hint ? deriveHint(secretWord) : null
          };
        } else if (chosenMode === MODES.IMPOSTOR_UNAWARE) {
          assignments[p] = {
            role: i===impostorIndex? 'Impostor' : 'Crew',
            word: secretWord,
            hint: null
          };
        }
      });

      passIndex = 0;
      show('gameView');
      showPlayerRole();
      document.getElementById('gameModeInfo').textContent = 'Mode: '+chosenMode;
    }

    function deriveHint(word) {
      return word[0].toUpperCase() + '_'.repeat(word.length-1) + ' (length '+word.length+')';
    }

    function showPlayerRole() {
      const player = players[passIndex];
      const roleData = assignments[player];
      const box = document.getElementById('playerRoleBox');
      box.innerHTML = `<p><strong>${player}</strong>, your role:</p>
        <p>Role: <b style="color:${roleData.role==='Impostor'?'red':'green'}">${roleData.role}</b></p>
        <p>Word: <code>${roleData.word}</code></p>
        ${roleData.hint? `<p>Hint: ${roleData.hint}</p>`:''}`;
    }

    function nextPlayer() {
      passIndex++;
      if (passIndex >= players.length) {
        alert('All players have seen their word! Start the discussion.');
        show('lobbyView');
        return;
      }
      showPlayerRole();
    }
  </script>
</body>
</html>
