const HEADER_HTML = `
    <header class="site-header">
        <div class="navbar">
            <div class="nav-left">
                <button class="burger" onclick="toggleM()" aria-label="Ouvrir le menu">
                    <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
                </button>
                <a class="nav-brand" href="index.html">
                    <img src="${CDN_BASE}/img/bannieres_icones/logo.jpg" class="nav-logo-small" alt="Logo Le Malicieux">
                    <span class="nav-title">LE MALICIEUX</span>
                </a>
            </div>
            <div class="mobile-overlay" id="overlay" onclick="toggleM()"></div>
            <nav class="nav-links" id="menu">
                <div class="close-menu" onclick="toggleM()">Fermer</div>
                <div class="menu-account js-hidden" id="menu-account-wrap">
                    <a href="profil.html" id="nav-profil-link-mobile" class="auth-account" style="text-decoration:none;">
                        <img id="nav-avatar-mobile" src="${CDN_BASE}/img/bannieres_icones/logo.jpg" class="auth-avatar" style="display:none;">
                        <span id="nav-pseudo-mobile" class="auth-name" style="display:none;"></span>
                    </a>
                </div>
                <a href="index.html" class="nav-tab" data-page="index.html">Accueil</a>
                <a href="tags.html" class="nav-tab" data-page="tags.html">Tags</a>
                <a href="alphabetique.html" class="nav-tab" data-page="alphabetique.html">A-Z</a>
                <a href="playlist.html" class="nav-tab" data-page="playlist.html">Playlist</a>
                <a href="pls.html" class="nav-tab" data-page="pls.html">Industrie</a>
                <a href="discord.html" class="nav-tab" data-page="discord.html">Updates</a>
                <a href="profil.html" class="nav-tab" data-page="profil.html">Profil</a>
                <a href="index_old.html" class="nav-tab" data-page="index_old.html">Ancien Index</a>
                <button class="nav-action" onclick="randomAnime()">Au hasard</button>
                <a href="https://discord.gg/4DY3Zq4vW4" target="_blank" class="discord-btn" title="Rejoindre le Discord">
                    <img src="${CDN_BASE}/img/bannieres_icones/logo-discord.jpg" alt="Discord">
                </a>
            </nav>
            <div class="nav-right">
                <div class="search-wrapper" id="search-wrapper">
                    <input type="text" id="search" placeholder="Rechercher un anime..." autocomplete="off">
                    <span class="search-icon"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
                    <div class="search-suggestions" id="search-suggestions"></div>
                </div>
                <a href="recherche.html" class="nav-action">Recherche appr.</a>
                <button class="nav-action" onclick="randomAnime()">Au hasard</button>
                <a href="https://discord.gg/4DY3Zq4vW4" target="_blank" class="discord-btn" title="Rejoindre le Discord">
                    <img src="${CDN_BASE}/img/bannieres_icones/logo-discord.jpg" alt="Discord">
                </a>
                <a href="profil.html" id="nav-profil-link" class="auth-account" style="text-decoration:none;">
                    <img id="nav-avatar" src="${CDN_BASE}/img/bannieres_icones/logo.jpg" class="auth-avatar" style="display:none;">
                    <span id="nav-pseudo" class="auth-name" style="display:none;"></span>
                </a>
                <div id="auth-ui" class="auth-ui-slot"><button class="js-login-btn auth-login-btn">Connexion</button></div>
            </div>
        </div>
    </header>
`;