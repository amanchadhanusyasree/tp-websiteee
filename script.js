/* Screen flow, interactive controls, and lightweight audio/particle effects */
(() => {
    const scenes = [...document.querySelectorAll('.scene')];
    const status = document.getElementById('live-status');
    const ambientLayer = document.getElementById('ambient-particles');
    const sparkleLayer = document.getElementById('sparkle-layer');
    const soundToggle = document.getElementById('sound-toggle');
    const noButton = document.getElementById('no-button');
    const answerArea = document.querySelector('.answer-buttons');
    const noMessage = document.getElementById('no-message');
    const letterBody = document.getElementById('letter-body');
    const letterScrollCue = document.getElementById('letter-scroll-cue');
    const letterSignoff = document.getElementById('letter-signoff');
    const continueButton = document.getElementById('continue-button');
    const envelope = document.getElementById('open-envelope');

    const apologyLetter = `EMO,

IDK WHY I DID THIS WEBSITE FOR YOU.

TBH, WHEN U GET ANGRY OVER YOU, I WANT TO CONVICE ME BRO. BUT WHEN I SHOUT AT YOU, I FEEL GULITY. EMO, YOU WILL GET ANNOYED BY ME EMO ANI EMO. I WANT YOU TO CONVICE ME BUT... IDK I DON'T FEEL NICE WHEN I SHOUT AT YOU.

EMO, I WANT TO SAY SORRY ;D. I HOPE YOU CAN FORGIVE ME.

I WANT YOU TO BE HAPPY. GET STRONG SOON AND KEEP SMILING :D.

IK THINGS ARE HARD, BUT I AM ALWAYS WITH YOU. GET STRONG LIL KID.
IDK WHT TO TEXT, BUT REMEMBER I AM ALWAYS TO SHARE YOUR THINGS.
LOVE YOU BROOO ❤️`;

    /* Tiny synthesized sounds keep the whole experience self-contained and offline. */
    let audioContext;
    let musicOn = false;
    let musicTimer;
    let musicStep = 0;
    const melody = [261.63, 329.63, 392, 329.63, 293.66, 349.23, 440, 349.23];

    function getAudioContext() {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return null;
        audioContext ??= new AudioContextClass();
        if (audioContext.state === 'suspended') audioContext.resume();
        return audioContext;
    }

    function playTone(frequency, duration = 0.12, volume = 0.035, type = 'sine') {
        const context = getAudioContext();
        if (!context) return;
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const now = context.currentTime;
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, now);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(volume, now + 0.018);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(now);
        oscillator.stop(now + duration + 0.03);
    }

    function startMusic() {
        if (!getAudioContext()) {
            soundToggle.setAttribute('aria-label', 'Background music unavailable');
            soundToggle.querySelector('.sound-label').textContent = 'Music unavailable';
            return;
        }
        musicOn = true;
        soundToggle.setAttribute('aria-pressed', 'true');
        soundToggle.setAttribute('aria-label', 'Turn opening music off');
        soundToggle.querySelector('.sound-label').textContent = 'Music on';
        playTone(melody[musicStep++ % melody.length], 1.1, 0.012);
        musicTimer = window.setInterval(() => {
            if (musicOn) playTone(melody[musicStep++ % melody.length], 1.1, 0.012);
        }, 1050);
    }

    function stopMusic() {
        musicOn = false;
        window.clearInterval(musicTimer);
        musicStep = 0;
        soundToggle.setAttribute('aria-pressed', 'false');
        soundToggle.setAttribute('aria-label', 'Turn opening music on');
        soundToggle.querySelector('.sound-label').textContent = 'Music off';
    }

    soundToggle.addEventListener('click', () => {
        if (musicOn) stopMusic();
        else startMusic();
        playTone(587.33, 0.08, 0.025);
    });

    /* Fade between scenes while preserving keyboard and screen-reader state. */
    function showScene(sceneId) {
        const nextScene = document.getElementById(sceneId);
        if (!nextScene) return;
        if (sceneId === 'welcome') {
            soundToggle.disabled = false;
            soundToggle.setAttribute('aria-label', musicOn ? 'Turn opening music off' : 'Turn opening music on');
            soundToggle.querySelector('.sound-label').textContent = musicOn ? 'Music on' : 'Music off';
        } else {
            if (musicOn) stopMusic();
            soundToggle.disabled = true;
            soundToggle.setAttribute('aria-label', 'Music is only available on the opening screen');
            soundToggle.querySelector('.sound-label').textContent = 'Start only';
        }
        const currentScene = scenes.find((scene) => scene.classList.contains('scene-active'));
        if (currentScene === nextScene) return;

        if (currentScene) {
            currentScene.classList.remove('scene-active');
            currentScene.classList.add('scene-leaving');
            currentScene.setAttribute('aria-hidden', 'true');
            currentScene.inert = true;
            window.setTimeout(() => currentScene.classList.remove('scene-leaving'), 360);
        }

        nextScene.inert = false;
        nextScene.setAttribute('aria-hidden', 'false');
        nextScene.classList.add('scene-active');
        status.textContent = `${nextScene.querySelector('h1, h2')?.textContent || 'New page'}`;
    }

    function clickSound() { playTone(659.25, 0.085, 0.025); }
    document.getElementById('open-gift').addEventListener('click', () => {
        clickSound();
        showScene('apology');
    });

    /* The NO response progresses from gentle pleading to playful evasion. */
    const noMessages = [
        'Please think again 🥺',
        'I worked really hard on this website 😭',
        "You're breaking my heart 🥹"
    ];
    let noClicks = 0;
    let noRunsAway = false;

    function moveNoButton(awayFromX = null, awayFromY = null) {
        const areaRect = answerArea.getBoundingClientRect();
        const buttonWidth = noButton.offsetWidth;
        const buttonHeight = noButton.offsetHeight;
        const maxLeft = Math.max(0, areaRect.width - buttonWidth);
        const maxTop = Math.max(-18, answerArea.clientHeight - buttonHeight + 20);
        const yesButton = document.getElementById('yes-button');
        if (!noButton.classList.contains('is-displaced')) {
            const originalYesLeft = yesButton.getBoundingClientRect().left;
            noButton.classList.add('is-displaced');
            yesButton.style.left = `${originalYesLeft - yesButton.getBoundingClientRect().left}px`;
        }

        const yesRect = yesButton.getBoundingClientRect();
        const yesLeft = yesRect.left - areaRect.left;
        const yesRight = yesRect.right - areaRect.left;
        const leftSpots = [];
        if (yesLeft - buttonWidth - 12 >= 0) leftSpots.push(0, yesLeft - buttonWidth - 12);
        if (yesRight + 12 <= maxLeft) leftSpots.push(yesRight + 12, maxLeft);
        if (leftSpots.length === 0) leftSpots.push(maxLeft);
        const candidates = leftSpots.flatMap((left) => [
            { left, top: -16 },
            { left, top: maxTop }
        ]);
        let destination;
        if (awayFromX !== null && awayFromY !== null) {
            destination = candidates.reduce((farthest, candidate) => {
                const x = areaRect.left + candidate.left + buttonWidth / 2;
                const y = areaRect.top + candidate.top + buttonHeight / 2;
                const distance = (x - awayFromX) ** 2 + (y - awayFromY) ** 2;
                return !farthest || distance > farthest.distance ? { ...candidate, distance } : farthest;
            }, null);
        } else {
            destination = candidates[Math.floor(Math.random() * candidates.length)];
        }
        noButton.style.left = `${destination.left}px`;
        noButton.style.top = `${destination.top}px`;
    }

    function startNoEscape() {
        noRunsAway = true;
        noMessage.textContent = 'Okay, but you have to catch me! 🙈';
        moveNoButton();
    }

    noButton.addEventListener('click', () => {
        clickSound();
        noClicks += 1;
        if (noClicks <= 3) {
            noMessage.textContent = noMessages[noClicks - 1];
        } else if (noClicks === 4) {
            noMessage.textContent = 'Wait... come back here! 🙈';
            moveNoButton();
        } else {
            startNoEscape();
        }
    });

    noButton.addEventListener('pointerenter', (event) => {
        if (noRunsAway) moveNoButton(event.clientX, event.clientY);
    });
    document.addEventListener('pointermove', (event) => {
        if (!noRunsAway || !noButton.classList.contains('is-displaced')) return;
        const rect = noButton.getBoundingClientRect();
        const distance = Math.hypot(event.clientX - (rect.left + rect.width / 2), event.clientY - (rect.top + rect.height / 2));
        if (distance < 90) moveNoButton(event.clientX, event.clientY);
    });

    /* YES creates a brief heart burst, then reveals the letter envelope. */
    function heartBurst() {
        const buttonRect = document.getElementById('yes-button').getBoundingClientRect();
        const centerX = buttonRect.left + buttonRect.width / 2;
        const centerY = buttonRect.top + buttonRect.height / 2;
        for (let index = 0; index < 20; index += 1) {
            const heart = document.createElement('span');
            const angle = (Math.PI * 2 * index) / 20;
            const distance = 70 + Math.random() * 110;
            heart.className = 'burst-heart';
            heart.textContent = Math.random() > 0.25 ? '♥' : '♡';
            heart.style.left = `${centerX}px`;
            heart.style.top = `${centerY}px`;
            heart.style.setProperty('--burst-x', `${Math.cos(angle) * distance}px`);
            heart.style.setProperty('--burst-y', `${Math.sin(angle) * distance}px`);
            document.body.appendChild(heart);
            window.setTimeout(() => heart.remove(), 1000);
        }
    }

    document.getElementById('yes-button').addEventListener('click', () => {
        clickSound();
        heartBurst();
        window.setTimeout(() => showScene('envelope-scene'), 450);
    });

    /* Envelope flap and paper animation lead directly into the typewriter. */
    let envelopeOpened = false;
    envelope.addEventListener('click', () => {
        if (envelopeOpened) return;
        envelopeOpened = true;
        clickSound();
        playTone(392, 0.42, 0.04, 'triangle');
        envelope.classList.add('is-open');
        envelope.setAttribute('aria-label', 'Letter opened');
        document.getElementById('envelope-hint').textContent = 'A little something from my heart...';
        window.setTimeout(() => {
            showScene('letter-scene');
            typeLetter();
        }, 1450);
    });

    let typeTimer;
    function updateLetterScrollCue() {
        const hasMoreText = letterBody.scrollHeight > letterBody.clientHeight + 1;
        const atBottom = letterBody.scrollTop + letterBody.clientHeight >= letterBody.scrollHeight - 1;
        letterScrollCue.hidden = !hasMoreText || atBottom;
    }

    letterBody.addEventListener('scroll', updateLetterScrollCue);

    function typeLetter() {
        letterBody.textContent = '';
        letterBody.scrollTop = 0;
        letterScrollCue.hidden = true;
        letterBody.classList.add('typing');
        letterSignoff.hidden = true;
        continueButton.hidden = true;
        let characterIndex = 0;
        const typeNext = () => {
            const chunkSize = 2;
            letterBody.textContent += apologyLetter.slice(characterIndex, characterIndex + chunkSize);
            letterBody.scrollTop = letterBody.scrollHeight;
            characterIndex += chunkSize;
            if (characterIndex < apologyLetter.length) {
                typeTimer = window.setTimeout(typeNext, 21);
            } else {
                letterBody.classList.remove('typing');
                letterBody.scrollTop = 0;
                updateLetterScrollCue();
                letterSignoff.hidden = false;
                continueButton.hidden = false;
                status.textContent = 'The letter is ready. Continue when you are ready.';
            }
        };
        typeTimer = window.setTimeout(typeNext, 300);
    }

    continueButton.addEventListener('click', () => {
        clickSound();
        showScene('thanks');
        launchConfetti();
    });

    /* Restart resets every interactive state without reloading the page. */
    document.getElementById('start-again').addEventListener('click', () => {
        clickSound();
        window.clearTimeout(typeTimer);
        envelopeOpened = false;
        noClicks = 0;
        noRunsAway = false;
        noMessage.textContent = '';
        noButton.classList.remove('is-displaced');
        noButton.style.left = '';
        noButton.style.top = '';
        document.getElementById('yes-button').style.left = '';
        envelope.classList.remove('is-open');
        envelope.setAttribute('aria-label', 'Open the letter');
        document.getElementById('envelope-hint').textContent = 'Click to Open';
        letterBody.textContent = '';
        letterBody.classList.remove('typing');
        letterScrollCue.hidden = true;
        letterSignoff.hidden = true;
        continueButton.hidden = true;
        showScene('welcome');
    });

    /* Gentle floating hearts and pointer sparkles add movement without assets. */
    function addAmbientHeart() {
        const heart = document.createElement('span');
        heart.className = 'ambient-heart';
        heart.textContent = Math.random() > 0.3 ? '♥' : '♡';
        heart.style.left = `${Math.random() * 100}%`;
        heart.style.fontSize = `${10 + Math.random() * 18}px`;
        heart.style.setProperty('--duration', `${8 + Math.random() * 7}s`);
        ambientLayer.appendChild(heart);
        window.setTimeout(() => heart.remove(), 16000);
    }
    for (let index = 0; index < 8; index += 1) window.setTimeout(addAmbientHeart, index * 520);
    window.setInterval(addAmbientHeart, 1250);

    let lastSparkleAt = 0;
    document.addEventListener('pointermove', (event) => {
        if (event.pointerType === 'touch' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const now = performance.now();
        if (now - lastSparkleAt < 85) return;
        lastSparkleAt = now;
        const sparkle = document.createElement('span');
        sparkle.className = 'sparkle';
        sparkle.textContent = Math.random() > 0.5 ? '✦' : '✧';
        sparkle.style.left = `${event.clientX}px`;
        sparkle.style.top = `${event.clientY}px`;
        sparkle.style.fontSize = `${9 + Math.random() * 7}px`;
        sparkleLayer.appendChild(sparkle);
        window.setTimeout(() => sparkle.remove(), 800);
    });

    function launchConfetti() {
        const layer = document.getElementById('confetti-layer');
        layer.replaceChildren();
        for (let index = 0; index < 70; index += 1) {
            const piece = document.createElement('span');
            piece.className = 'confetti-piece';
            piece.style.left = `${Math.random() * 100}%`;
            piece.style.setProperty('--fall', `${2.6 + Math.random() * 2.2}s`);
            piece.style.setProperty('--sway', `${-80 + Math.random() * 160}px`);
            piece.style.animationDelay = `${Math.random() * 1.3}s`;
            layer.appendChild(piece);
            window.setTimeout(() => piece.remove(), 6500);
        }
    }
})();
